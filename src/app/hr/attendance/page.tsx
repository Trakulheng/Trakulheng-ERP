"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { useBranch } from "@/context/BranchContext";
import { cn } from "@/lib/utils";
import {
  Download,
  MapPin,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  LogIn,
  LogOut,
  X,
  RefreshCw,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type AttendanceStatus = "clocked-in" | "completed" | "late" | "not-yet";

interface Employee {
  id: string;
  name: string;
  department: string;
  position: string;
}

interface ShiftTemplate {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  color: string;
}

interface ShiftAssignment {
  employeeId: string;
  shiftId: string | null;
  date: string;
}

interface AttendanceRecord {
  id: string;
  employeeId: string;
  branchId: string;
  date: string;
  shiftId: string | null;
  clockInTime: string | null;
  clockOutTime: string | null;
  clockInLat: number | null;
  clockInLng: number | null;
  clockInDistance: number | null;
  clockOutLat: number | null;
  clockOutLng: number | null;
  clockOutDistance: number | null;
  gpsValid: boolean;
  status: AttendanceStatus;
  totalMinutes: number | null;
  overtimeMinutes: number | null;
  lateMinutes: number | null;
}

type GpsStatus = "fetching" | "success" | "error";

interface GpsState {
  lat: number;
  lng: number;
  accuracy: number;
  isDemo?: boolean;
}

interface ModalState {
  employeeId: string;
  action: "in" | "out";
  gpsStatus: GpsStatus;
  gps: GpsState | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1)}km` : `${m}m`;
}

function formatHHMM(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function formatWorkHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: AttendanceStatus }) {
  const map: Record<AttendanceStatus, { label: string; cls: string }> = {
    "clocked-in": { label: "Clocked In",  cls: "bg-blue-100 text-blue-700" },
    completed:    { label: "Completed",   cls: "bg-emerald-100 text-emerald-700" },
    late:         { label: "Late",        cls: "bg-red-100 text-red-700" },
    "not-yet":    { label: "Not Yet",     cls: "bg-slate-100 text-slate-500" },
  };
  const { label, cls } = map[status];
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", cls)}>
      {label}
    </span>
  );
}

// ─── ShiftBadge ───────────────────────────────────────────────────────────────

const shiftColorMap: Record<string, string> = {
  blue:    "bg-blue-100 text-blue-700",
  amber:   "bg-amber-100 text-amber-700",
  violet:  "bg-violet-100 text-violet-700",
  emerald: "bg-emerald-100 text-emerald-700",
  red:     "bg-red-100 text-red-700",
  teal:    "bg-teal-100 text-teal-700",
};

function ShiftBadge({ shift }: { shift: ShiftTemplate }) {
  return (
    <span className={cn("inline-flex flex-col items-start px-2 py-0.5 rounded text-xs font-medium leading-tight", shiftColorMap[shift.color] ?? "bg-slate-100 text-slate-600")}>
      <span>{shift.name}</span>
      <span className="font-normal opacity-75">{shift.startTime}–{shift.endTime}</span>
    </span>
  );
}

// ─── DistanceBadge ────────────────────────────────────────────────────────────

function DistanceBadge({ meters, radius }: { meters: number; radius: number }) {
  const ok = meters <= radius;
  return (
    <span className={cn("ml-1 inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full", ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600")}>
      <MapPin size={10} />
      {formatDistance(meters)}
    </span>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AttendancePage() {
  const { activeBranch } = useBranch();

  const [employees, setEmployees]     = useState<Employee[]>([]);
  const [shifts, setShifts]           = useState<ShiftTemplate[]>([]);
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  const [records, setRecords]         = useState<AttendanceRecord[]>([]);
  const [pageLoading, setPageLoading] = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [now, setNow]                 = useState(new Date());
  const [modal, setModal]             = useState<ModalState | null>(null);

  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const isToday = selectedDate === today;

  // Live clock
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const shiftDate = (days: number) => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + days);
    const next = d.toISOString().split("T")[0];
    if (next <= today) setSelectedDate(next);
  };

  // Fetch all data when branch or selected date changes
  const fetchAll = useCallback(async () => {
    if (!activeBranch) return;
    setPageLoading(true);
    try {
      const [empRes, shiftRes, assignRes, recRes] = await Promise.all([
        fetch(`/api/employees?branchId=${activeBranch.id}&status=active`),
        fetch(`/api/hr/shifts?branchId=${activeBranch.id}`),
        fetch(`/api/hr/shifts/assignments?branchId=${activeBranch.id}&from=${selectedDate}&to=${selectedDate}`),
        fetch(`/api/hr/attendance?branchId=${activeBranch.id}&date=${selectedDate}`),
      ]);
      const [empData, shiftData, assignData, recData] = await Promise.all([
        empRes.json(), shiftRes.json(), assignRes.json(), recRes.json(),
      ]);
      if (Array.isArray(empData))    setEmployees(empData);
      if (Array.isArray(shiftData))  setShifts(shiftData);
      if (Array.isArray(assignData)) setAssignments(assignData);
      if (Array.isArray(recData))    setRecords(recData);
    } finally {
      setPageLoading(false);
    }
  }, [activeBranch, selectedDate]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Pull-to-refresh event from global PullToRefresh component
  useEffect(() => {
    window.addEventListener("pull-refresh", fetchAll);
    return () => window.removeEventListener("pull-refresh", fetchAll);
  }, [fetchAll]);

  if (!activeBranch) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50">
        <Header title="Attendance" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-slate-400">No branches configured. Go to Settings → Branches to add one.</p>
        </div>
      </div>
    );
  }

  // Build display rows
  const assignedIds = new Set(assignments.map((a) => a.employeeId));
  const recordIds   = new Set(records.map((r) => r.employeeId));
  const allIds      = new Set([...assignedIds, ...recordIds]);

  const rows = employees
    .filter((e) => allIds.has(e.id))
    .map((emp) => {
      const assignment = assignments.find((a) => a.employeeId === emp.id) ?? null;
      const shift      = assignment?.shiftId ? shifts.find((s) => s.id === assignment.shiftId) ?? null : null;
      const record     = records.find((r) => r.employeeId === emp.id) ?? null;

      let displayStatus: AttendanceStatus = "not-yet";
      if (record) {
        displayStatus = record.status as AttendanceStatus;
      } else if (shift && isToday) {
        const nowMin   = now.getHours() * 60 + now.getMinutes();
        const [sh, sm] = shift.startTime.split(":").map(Number);
        if (nowMin > sh * 60 + sm + 15) displayStatus = "late";
      }

      return { emp, shift, assignment, record, displayStatus };
    });

  const clockedIn = rows.filter((r) => r.displayStatus === "clocked-in").length;
  const lateCount = rows.filter((r) => r.displayStatus === "late").length;
  const notYet    = rows.filter((r) => r.displayStatus === "not-yet").length;

  // ── Open GPS modal ──────────────────────────────────────────────────────────

  const openModal = (employeeId: string, action: "in" | "out") => {
    const m: ModalState = { employeeId, action, gpsStatus: "fetching", gps: null };
    setModal(m);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setModal((prev) => prev ? {
          ...prev,
          gpsStatus: "success",
          gps: { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy },
        } : null);
      },
      () => {
        setModal((prev) => prev ? {
          ...prev,
          gpsStatus: "error",
          gps: {
            lat: activeBranch.lat + (Math.random() - 0.5) * 0.001,
            lng: activeBranch.lng + (Math.random() - 0.5) * 0.001,
            accuracy: 999,
            isDemo: true,
          },
        } : null);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // ── Confirm clock in/out ────────────────────────────────────────────────────

  const confirmClock = async () => {
    if (!modal || !modal.gps || submitting) return;
    setSubmitting(true);

    const timeStr  = formatHHMM(now);
    const row      = rows.find((r) => r.emp.id === modal.employeeId);
    const endpoint = modal.action === "in" ? "/api/hr/attendance/clock-in" : "/api/hr/attendance/clock-out";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId:   activeBranch.id,
          employeeId: modal.employeeId,
          date:       selectedDate,
          shiftId:    row?.assignment?.shiftId ?? null,
          ...(modal.action === "in" ? { clockInTime: timeStr } : { clockOutTime: timeStr }),
          lat: modal.gps.lat,
          lng: modal.gps.lng,
        }),
      });

      if (res.ok) {
        const saved = await res.json();
        setRecords((prev) => {
          const idx = prev.findIndex((r) => r.employeeId === modal.employeeId && r.date === today);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], ...saved };
            return updated;
          }
          return [...prev, saved as AttendanceRecord];
        });
      }
    } finally {
      setSubmitting(false);
      setModal(null);
    }
  };

  // ── Modal computed values ───────────────────────────────────────────────────
  const modalRow    = modal ? rows.find((r) => r.emp.id === modal.employeeId) : null;
  const gpsDistance = modal?.gps
    ? Math.round(haversineMeters(modal.gps.lat, modal.gps.lng, activeBranch.lat, activeBranch.lng))
    : null;
  const withinRange = gpsDistance !== null && gpsDistance <= activeBranch.radiusMeters;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header
        title="Attendance"
        subtitle={activeBranch.name}
        actions={
          <div className="flex items-center gap-2">
            {/* Date picker */}
            <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              <button
                onClick={() => shiftDate(-1)}
                className="p-2 hover:bg-slate-50 text-slate-500 transition-colors border-r border-slate-200"
                title="Previous day"
              >
                <ChevronLeft size={15} />
              </button>
              <div className="relative flex items-center">
                <CalendarDays size={13} className="absolute left-2.5 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  value={selectedDate}
                  max={today}
                  onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                  className="pl-8 pr-3 py-2 text-sm text-slate-700 bg-transparent focus:outline-none cursor-pointer"
                />
              </div>
              <button
                onClick={() => shiftDate(1)}
                disabled={isToday}
                className="p-2 hover:bg-slate-50 text-slate-500 transition-colors border-l border-slate-200 disabled:opacity-30"
                title="Next day"
              >
                <ChevronRight size={15} />
              </button>
            </div>
            {!isToday && (
              <button
                onClick={() => setSelectedDate(today)}
                className="px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Today
              </button>
            )}
            <button
              onClick={fetchAll}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <RefreshCw size={14} className={pageLoading ? "animate-spin" : ""} />
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              <Download size={15} />
              Export
            </button>
          </div>
        }
      />

      <main className="flex-1 p-6 space-y-6">
        {/* Live clock bar */}
        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-5 py-3 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-800">
              {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
            </span>
            {!isToday && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Historical</span>
            )}
          </div>
          <span className="text-2xl font-mono font-bold text-slate-900 tabular-nums">
            {String(now.getHours()).padStart(2, "0")}:
            {String(now.getMinutes()).padStart(2, "0")}:
            {String(now.getSeconds()).padStart(2, "0")}
          </span>
          <span className="flex items-center gap-1 text-slate-500">
            <MapPin size={13} className="text-blue-500" />
            Branch GPS: {activeBranch.lat.toFixed(4)}°N {activeBranch.lng.toFixed(4)}°E · radius {activeBranch.radiusMeters}m
          </span>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Assigned", value: rows.length,  valueCls: "text-slate-900" },
            { label: "Clocked In",     value: clockedIn,    valueCls: "text-blue-600"  },
            { label: "Late",           value: lateCount,    valueCls: "text-red-600"   },
            { label: "Not Yet",        value: notYet,       valueCls: "text-slate-500" },
          ].map(({ label, value, valueCls }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 px-5 py-4">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
              <p className={cn("text-3xl font-bold mt-1", valueCls)}>{value}</p>
            </div>
          ))}
        </div>

        {/* Attendance table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800">
              {isToday ? "Today's" : new Date(selectedDate + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} Attendance — {activeBranch.name}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["Employee", "Dept", "Shift", "Scheduled Start", "Clock In", "Clock Out", "Hours", "Late", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageLoading && rows.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center">
                      <Loader2 size={20} className="animate-spin mx-auto text-slate-400" />
                    </td>
                  </tr>
                )}
                {!pageLoading && rows.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                      No shift assignments found for {activeBranch.name} on {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}.
                    </td>
                  </tr>
                )}
                {rows.map(({ emp, shift, record, displayStatus }) => (
                  <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">{emp.name}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{emp.department}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {shift ? <ShiftBadge shift={shift} /> : <span className="text-slate-300 text-xs">Day Off</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap font-mono">
                      {shift?.startTime ?? "—"}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      {record?.clockInTime ? (
                        <span className="flex items-center font-mono text-slate-800">
                          {record.clockInTime}
                          {record.clockInDistance !== null && (
                            <DistanceBadge meters={record.clockInDistance} radius={activeBranch.radiusMeters} />
                          )}
                        </span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      {record?.clockOutTime ? (
                        <span className="flex items-center font-mono text-slate-800">
                          {record.clockOutTime}
                          {record.clockOutDistance !== null && (
                            <DistanceBadge meters={record.clockOutDistance} radius={activeBranch.radiusMeters} />
                          )}
                        </span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>

                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap font-mono">
                      {record?.totalMinutes != null ? (
                        <span>
                          {formatWorkHours(record.totalMinutes)}
                          {record.overtimeMinutes ? (
                            <span className="ml-1 text-xs text-violet-600">+{formatWorkHours(record.overtimeMinutes)} OT</span>
                          ) : null}
                        </span>
                      ) : "—"}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-xs">
                      {record?.lateMinutes ? (
                        <span className="text-red-600 font-medium">{record.lateMinutes}m</span>
                      ) : record && record.status !== "not-yet" ? (
                        <span className="text-emerald-600">On time</span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={displayStatus} />
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      {!isToday ? (
                        <span className="text-xs text-slate-300">—</span>
                      ) : displayStatus === "completed" ? (
                        <CheckCircle2 size={16} className="text-emerald-500" />
                      ) : displayStatus === "clocked-in" ? (
                        <button
                          onClick={() => openModal(emp.id, "out")}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                        >
                          <LogOut size={12} /> Clock Out
                        </button>
                      ) : shift ? (
                        <button
                          onClick={() => openModal(emp.id, "in")}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <LogIn size={12} /> Clock In
                        </button>
                      ) : (
                        <span className="text-xs text-slate-300">Day Off</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payroll linkage note */}
        {rows.some((r) => r.record?.status === "completed") && (
          <div className="bg-violet-50 border border-violet-200 rounded-xl px-5 py-3 text-xs text-violet-700 flex items-center gap-2">
            <Clock size={13} />
            Completed attendance records are linked to payroll. Hours and overtime will be included in the next payroll run.
          </div>
        )}
      </main>

      {/* GPS Clock Modal */}
      {modal && modalRow && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  {modal.action === "in" ? "Clock In" : "Clock Out"} — {modalRow.emp.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{modalRow.emp.department}</p>
              </div>
              <button
                onClick={() => setModal(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={16} className="text-slate-500" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {modalRow.shift && (
                <div className="bg-slate-50 rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500">Shift</p>
                    <p className="text-sm font-medium text-slate-800">{modalRow.shift.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Scheduled</p>
                    <p className="text-sm font-mono font-medium text-slate-800">
                      {modalRow.shift.startTime} – {modalRow.shift.endTime}
                    </p>
                  </div>
                </div>
              )}

              <div className="border border-slate-200 rounded-xl px-4 py-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <MapPin size={14} className="text-blue-500" />
                  GPS Location
                </div>

                {modal.gpsStatus === "fetching" && (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 size={16} className="animate-spin text-blue-500" />
                    Getting your location...
                  </div>
                )}

                {(modal.gpsStatus === "success" || modal.gpsStatus === "error") && modal.gps && (
                  <div className="space-y-2">
                    {modal.gps.isDemo && (
                      <p className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                        <AlertTriangle size={12} />
                        Location unavailable — using demo coordinates
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-50 rounded-lg px-3 py-2">
                        <p className="text-slate-400">Latitude</p>
                        <p className="font-mono font-medium text-slate-700">{modal.gps.lat.toFixed(6)}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg px-3 py-2">
                        <p className="text-slate-400">Longitude</p>
                        <p className="font-mono font-medium text-slate-700">{modal.gps.lng.toFixed(6)}</p>
                      </div>
                    </div>
                    <div className={cn(
                      "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm",
                      withinRange ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                    )}>
                      <span className="flex items-center gap-1.5">
                        {withinRange ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                        {withinRange ? "Within branch radius" : "Outside branch radius"}
                      </span>
                      <span className="font-mono font-semibold">
                        {gpsDistance !== null ? formatDistance(gpsDistance) : "—"}
                        <span className="font-normal text-xs ml-1">/ {activeBranch.radiusMeters}m</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Clock size={14} />
                <span>
                  Clock {modal.action === "in" ? "in" : "out"} time:{" "}
                  <span className="font-mono font-semibold text-slate-900">
                    {String(now.getHours()).padStart(2, "0")}:{String(now.getMinutes()).padStart(2, "0")}
                  </span>
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
              <button
                onClick={() => setModal(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmClock}
                disabled={modal.gpsStatus === "fetching" || submitting}
                className={cn(
                  "px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors",
                  modal.action === "in"
                    ? "bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300"
                    : "bg-red-500 hover:bg-red-600 disabled:bg-red-300"
                )}
              >
                {(modal.gpsStatus === "fetching" || submitting) ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    {submitting ? "Saving…" : "Waiting for GPS…"}
                  </span>
                ) : (
                  `Confirm Clock ${modal.action === "in" ? "In" : "Out"}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
