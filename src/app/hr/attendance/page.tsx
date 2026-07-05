"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { useBranch } from "@/context/BranchContext";
import {
  employees,
  employeeShifts,
  attendanceRecords as initialAttendanceRecords,
  shifts,
} from "@/lib/mock-data";
import { haversineDistance, formatDistance } from "@/lib/geo";
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
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type AttendanceStatus = "clocked-in" | "completed" | "late" | "not-yet";

interface AttendanceRecord {
  id: string;
  employeeId: string;
  branchId: string;
  date: string;
  shiftId: string;
  clockIn: string | null;
  clockInLat: number | null;
  clockInLng: number | null;
  clockInDistance: number | null;
  clockOut: string | null;
  clockOutLat: number | null;
  clockOutLng: number | null;
  clockOutDistance: number | null;
  status: AttendanceStatus;
  workMinutes: number | null;
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function formatHHMM(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function calcWorkMinutes(clockIn: string, clockOut: string): number {
  const inMin = timeToMinutes(clockIn);
  const outMin = timeToMinutes(clockOut);
  return outMin >= inMin ? outMin - inMin : 24 * 60 - inMin + outMin;
}

function formatWorkHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

// ─── Status badge ─────────────────────────────────────────────────────────────

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

// ─── Shift badge ──────────────────────────────────────────────────────────────

const shiftColorMap: Record<string, string> = {
  blue:    "bg-blue-100 text-blue-700",
  amber:   "bg-amber-100 text-amber-700",
  violet:  "bg-violet-100 text-violet-700",
  emerald: "bg-emerald-100 text-emerald-700",
};

function ShiftBadge({ shift }: { shift: { name: string; startTime: string; endTime: string; color: string } }) {
  return (
    <span className={cn("inline-flex flex-col items-start px-2 py-0.5 rounded text-xs font-medium leading-tight", shiftColorMap[shift.color] ?? "bg-slate-100 text-slate-600")}>
      <span>{shift.name}</span>
      <span className="font-normal opacity-75">{shift.startTime}–{shift.endTime}</span>
    </span>
  );
}

// ─── GPS distance badge ───────────────────────────────────────────────────────

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

  const [records, setRecords] = useState<AttendanceRecord[]>(
    initialAttendanceRecords.map((r) => ({ ...r, status: r.status as AttendanceStatus }))
  );
  const [now, setNow] = useState(new Date());
  const [modal, setModal] = useState<ModalState | null>(null);

  // Live clock
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Build employee list for activeBranch × today's day of week
  const todayDow = now.getDay(); // 0=Sun
  const branchAssignments = employeeShifts.filter(
    (es) => es.branchId === activeBranch.id && es.daysOfWeek.includes(todayDow)
  );

  const rows = branchAssignments.map((es) => {
    const emp = employees.find((e) => e.id === es.employeeId)!;
    const shift = shifts.find((s) => s.id === es.shiftId)!;
    const record = records.find((r) => r.employeeId === es.employeeId && r.branchId === activeBranch.id) ?? null;

    let status: AttendanceStatus = "not-yet";
    if (record) {
      status = record.status;
    } else {
      const nowMin = now.getHours() * 60 + now.getMinutes();
      const startMin = timeToMinutes(shift.startTime) + 15;
      if (nowMin > startMin) status = "late";
    }

    return { es, emp, shift, record, status };
  });

  // Summary
  const totalCount = rows.length;
  const clockedIn  = rows.filter((r) => r.status === "clocked-in").length;
  const lateCount  = rows.filter((r) => r.status === "late" && !r.record).length
    + rows.filter((r) => r.record?.status === "late").length;
  const notYet     = rows.filter((r) => r.status === "not-yet").length;

  // ── Open modal ──────────────────────────────────────────────────────────────

  const openModal = useCallback((employeeId: string, action: "in" | "out") => {
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
  }, [activeBranch]);

  // ── Confirm clock in/out ────────────────────────────────────────────────────

  const confirmClock = useCallback(() => {
    if (!modal || !modal.gps) return;

    const timeStr = formatHHMM(now);
    const dist = Math.round(haversineDistance(modal.gps.lat, modal.gps.lng, activeBranch.lat, activeBranch.lng));
    const row = rows.find((r) => r.emp.id === modal.employeeId);
    if (!row) return;

    if (modal.action === "in") {
      const shiftStart = timeToMinutes(row.shift.startTime);
      const nowMin = now.getHours() * 60 + now.getMinutes();
      const isLate = nowMin > shiftStart + 15;

      const newRecord: AttendanceRecord = {
        id: `ATT-NEW-${Date.now()}`,
        employeeId: modal.employeeId,
        branchId: activeBranch.id,
        date: new Date().toISOString().split("T")[0],
        shiftId: row.es.shiftId,
        clockIn: timeStr,
        clockInLat: modal.gps.lat,
        clockInLng: modal.gps.lng,
        clockInDistance: dist,
        clockOut: null,
        clockOutLat: null,
        clockOutLng: null,
        clockOutDistance: null,
        status: isLate ? "late" : "clocked-in",
        workMinutes: null,
      };
      setRecords((prev) => [...prev, newRecord]);
    } else {
      setRecords((prev) =>
        prev.map((r) => {
          if (r.employeeId !== modal.employeeId) return r;
          const wm = r.clockIn ? calcWorkMinutes(r.clockIn, timeStr) : null;
          return {
            ...r,
            clockOut: timeStr,
            clockOutLat: modal.gps!.lat,
            clockOutLng: modal.gps!.lng,
            clockOutDistance: dist,
            status: "completed" as AttendanceStatus,
            workMinutes: wm,
          };
        })
      );
    }

    setModal(null);
  }, [modal, now, activeBranch, rows]);

  // ── GPS info in modal ───────────────────────────────────────────────────────

  const modalRow = modal ? rows.find((r) => r.emp.id === modal.employeeId) : null;
  const gpsDistance = modal?.gps
    ? Math.round(haversineDistance(modal.gps.lat, modal.gps.lng, activeBranch.lat, activeBranch.lng))
    : null;
  const withinRange = gpsDistance !== null && gpsDistance <= activeBranch.radiusMeters;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header
        title="Attendance"
        subtitle={activeBranch.name}
        actions={
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <Download size={15} />
            Export
          </button>
        }
      />

      <main className="flex-1 p-6 space-y-6">
        {/* Live clock bar */}
        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-5 py-3 text-sm text-slate-600">
          <span className="font-medium text-slate-800">
            {now.toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
          </span>
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
            { label: "Total Employees", value: totalCount, cls: "bg-white", valueCls: "text-slate-900" },
            { label: "Clocked In",      value: clockedIn,  cls: "bg-white", valueCls: "text-blue-600"  },
            { label: "Late",            value: lateCount,  cls: "bg-white", valueCls: "text-red-600"   },
            { label: "Not Yet",         value: notYet,     cls: "bg-white", valueCls: "text-slate-500" },
          ].map(({ label, value, cls, valueCls }) => (
            <div key={label} className={cn("rounded-xl border border-slate-200 px-5 py-4", cls)}>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
              <p className={cn("text-3xl font-bold mt-1", valueCls)}>{value}</p>
            </div>
          ))}
        </div>

        {/* Attendance table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800">Today&apos;s Attendance — {activeBranch.name}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["Employee", "Dept", "Shift", "Scheduled Start", "Clock In", "Clock Out", "Hours", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map(({ emp, shift, record, status }) => (
                  <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">{emp.name}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{emp.department}</td>
                    <td className="px-4 py-3 whitespace-nowrap"><ShiftBadge shift={shift} /></td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap font-mono">{shift.startTime}</td>

                    {/* Clock In */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {record?.clockIn ? (
                        <span className="flex items-center font-mono text-slate-800">
                          {record.clockIn}
                          {record.clockInDistance !== null && (
                            <DistanceBadge meters={record.clockInDistance} radius={activeBranch.radiusMeters} />
                          )}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Clock Out */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {record?.clockOut ? (
                        <span className="flex items-center font-mono text-slate-800">
                          {record.clockOut}
                          {record.clockOutDistance !== null && (
                            <DistanceBadge meters={record.clockOutDistance} radius={activeBranch.radiusMeters} />
                          )}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Hours */}
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap font-mono">
                      {record?.workMinutes != null ? formatWorkHours(record.workMinutes) : "—"}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={status} />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {status === "completed" ? (
                        <CheckCircle2 size={16} className="text-emerald-500" />
                      ) : status === "clocked-in" ? (
                        <button
                          onClick={() => openModal(emp.id, "out")}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                        >
                          <LogOut size={12} /> Clock Out
                        </button>
                      ) : (
                        <button
                          onClick={() => openModal(emp.id, "in")}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <LogIn size={12} /> Clock In
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                      No employees assigned to {activeBranch.name} for today.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* GPS Clock Modal */}
      {modal && modalRow && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            {/* Header */}
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
              {/* Shift info */}
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

              {/* GPS section */}
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
                        Location unavailable (demo mode)
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
                        {withinRange
                          ? <CheckCircle2 size={14} />
                          : <AlertTriangle size={14} />
                        }
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

              {/* Current time */}
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

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
              <button
                onClick={() => setModal(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmClock}
                disabled={modal.gpsStatus === "fetching"}
                className={cn(
                  "px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors",
                  modal.action === "in"
                    ? "bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300"
                    : "bg-red-500 hover:bg-red-600 disabled:bg-red-300"
                )}
              >
                {modal.gpsStatus === "fetching" ? (
                  <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Waiting for GPS…</span>
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
