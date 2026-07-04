"use client";

import { useState, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { useBranch } from "@/context/BranchContext";
import {
  employees as allEmployees,
  employeeShifts as initialAssignments,
  shifts as initialShifts,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import {
  Plus,
  Pencil,
  X,
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CalendarDays,
  LayoutGrid,
  Rows3,
  ArrowLeftRight,
  Bell,
  Shield,
  UserCheck,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ShiftColor = "blue" | "amber" | "violet" | "emerald";
type ViewMode = "week" | "month";
type MainTab = "templates" | "calendar" | "requests";
type ConfirmStatus = "pending" | "confirmed" | "rejected";

interface Shift {
  id: string;
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  color: ShiftColor;
}

interface EmployeeShift {
  id: string;
  employeeId: string;
  shiftId: string;
  branchId: string;
  daysOfWeek: number[];
  effectiveFrom: string;
}

// Manual date-specific assignment — overrides recurring pattern for that date
interface CalendarEntry {
  id: string;
  employeeId: string;
  shiftId: string | null; // null = day off
  date: string; // YYYY-MM-DD
  branchId: string;
  confirmStatus: ConfirmStatus;
  note?: string;
}

// Employee-submitted shift change request
interface ChangeRequest {
  id: string;
  employeeId: string;
  date: string;
  currentShiftId: string;
  requestedShiftId: string | null; // null = requesting day off
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  resolvedBy?: string;
  resolvedAt?: string;
  managerNote?: string;
}

// ─── Initial Mock Data ────────────────────────────────────────────────────────

const initialOverrides: CalendarEntry[] = [
  {
    id: "CE-001",
    employeeId: "EMP-001",
    shiftId: "SH-004",
    date: "2026-07-15",
    branchId: "BR-001",
    confirmStatus: "confirmed",
    note: "Half-day — approved change request",
  },
  {
    id: "CE-002",
    employeeId: "EMP-010",
    shiftId: null,
    date: "2026-07-10",
    branchId: "BR-001",
    confirmStatus: "pending",
    note: "Approved leave",
  },
  {
    id: "CE-003",
    employeeId: "EMP-007",
    shiftId: "SH-002",
    date: "2026-07-08",
    branchId: "BR-001",
    confirmStatus: "pending",
    note: "Reassigned — pending employee confirmation",
  },
  {
    id: "CE-004",
    employeeId: "EMP-002",
    shiftId: "SH-001",
    date: "2026-07-28",
    branchId: "BR-001",
    confirmStatus: "pending",
    note: "Extended coverage shift",
  },
  {
    id: "CE-005",
    employeeId: "EMP-003",
    shiftId: "SH-002",
    date: "2026-08-05",
    branchId: "BR-001",
    confirmStatus: "pending",
    note: "Temporary schedule change",
  },
];

const initialRequests: ChangeRequest[] = [
  {
    id: "CR-001",
    employeeId: "EMP-007",
    date: "2026-07-08",
    currentShiftId: "SH-001",
    requestedShiftId: "SH-002",
    reason: "Doctor appointment — need afternoon shift instead",
    status: "pending",
    createdAt: "2026-07-04T09:00:00",
  },
  {
    id: "CR-002",
    employeeId: "EMP-010",
    date: "2026-07-10",
    currentShiftId: "SH-001",
    requestedShiftId: null,
    reason: "Family emergency — requesting day off",
    status: "pending",
    createdAt: "2026-07-04T10:30:00",
  },
  {
    id: "CR-003",
    employeeId: "EMP-001",
    date: "2026-07-15",
    currentShiftId: "SH-001",
    requestedShiftId: "SH-004",
    reason: "Team meeting requires half-day only",
    status: "approved",
    createdAt: "2026-06-30T14:00:00",
    resolvedBy: "EMP-004",
    resolvedAt: "2026-07-01T09:00:00",
    managerNote: "Approved — coordinate with team lead",
  },
  {
    id: "CR-004",
    employeeId: "EMP-006",
    date: "2026-07-12",
    currentShiftId: "SH-001",
    requestedShiftId: "SH-002",
    reason: "Shift swap request with colleague",
    status: "rejected",
    createdAt: "2026-07-02T11:00:00",
    resolvedBy: "EMP-005",
    resolvedAt: "2026-07-03T08:30:00",
    managerNote: "Cannot accommodate — understaffed that week",
  },
];

// ─── Constants ────────────────────────────────────────────────────────────────

const TODAY = "2026-07-04";
const MAX_FUTURE = "2027-07-04"; // 1 year ahead
const COLOR_OPTIONS: ShiftColor[] = ["blue", "amber", "violet", "emerald"];
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEK_DAYS_MON_SUN = [1, 2, 3, 4, 5, 6, 0]; // Mon→Sun (display order)
const MON_SUN_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const shiftColorMap: Record<
  ShiftColor,
  { badge: string; dot: string; bg: string; border: string }
> = {
  blue: {
    badge: "bg-blue-100 text-blue-700",
    dot: "bg-blue-500",
    bg: "bg-blue-50",
    border: "border-blue-300",
  },
  amber: {
    badge: "bg-amber-100 text-amber-700",
    dot: "bg-amber-500",
    bg: "bg-amber-50",
    border: "border-amber-300",
  },
  violet: {
    badge: "bg-violet-100 text-violet-700",
    dot: "bg-violet-500",
    bg: "bg-violet-50",
    border: "border-violet-300",
  },
  emerald: {
    badge: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-500",
    bg: "bg-emerald-50",
    border: "border-emerald-300",
  },
};

// ─── Date Helpers ─────────────────────────────────────────────────────────────

function toStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

// Returns the Monday of the week containing d
function getMondayOf(d: Date): Date {
  const day = d.getDay(); // 0=Sun
  return addDays(d, day === 0 ? -6 : 1 - day);
}

function fmtWeekRange(monday: Date): string {
  const sunday = addDays(monday, 6);
  const start = monday.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const end = sunday.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${start} – ${end}`;
}

function fmtMonthYear(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function fmtLong(dateStr: string): string {
  return parseDate(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─── Shift Helpers ────────────────────────────────────────────────────────────

function calcWorkHours(start: string, end: string, breakMin: number): string {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const s = sh * 60 + sm;
  const e = eh * 60 + em;
  const total = (e >= s ? e - s : 24 * 60 - s + e) - breakMin;
  return total % 60 === 0
    ? `${Math.floor(total / 60)}h`
    : `${Math.floor(total / 60)}h ${total % 60}m`;
}

function getEffectiveShift(
  date: string,
  employeeId: string,
  patterns: EmployeeShift[],
  overrides: CalendarEntry[]
): { shiftId: string | null; override?: CalendarEntry } {
  const override = overrides.find(
    (o) => o.date === date && o.employeeId === employeeId
  );
  if (override) return { shiftId: override.shiftId, override };

  const dayOfWeek = parseDate(date).getDay();
  const applicable = patterns
    .filter((p) => p.employeeId === employeeId && p.effectiveFrom <= date)
    .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));

  if (
    applicable.length > 0 &&
    applicable[0].daysOfWeek.includes(dayOfWeek)
  ) {
    return { shiftId: applicable[0].shiftId };
  }
  return { shiftId: null };
}

// ─── ShiftCard ────────────────────────────────────────────────────────────────

function ShiftCard({
  shift,
  onEdit,
}: {
  shift: Shift;
  onEdit: (s: Shift) => void;
}) {
  const c = shiftColorMap[shift.color];
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("w-3 h-3 rounded-full shrink-0", c.dot)} />
          <div>
            <p className="font-semibold text-slate-900">{shift.name}</p>
            <p className="text-xs text-slate-400 font-mono">{shift.code}</p>
          </div>
        </div>
        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", c.badge)}>
          {shift.color}
        </span>
      </div>
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Clock size={14} className="text-slate-400" />
        <span className="font-mono font-medium text-slate-800">
          {shift.startTime} – {shift.endTime}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
        <div className="bg-slate-50 rounded-lg px-3 py-2">
          <p className="text-slate-400">Break</p>
          <p className="font-medium text-slate-700">{shift.breakMinutes} min</p>
        </div>
        <div className="bg-slate-50 rounded-lg px-3 py-2">
          <p className="text-slate-400">Working</p>
          <p className="font-medium text-slate-700">
            {calcWorkHours(shift.startTime, shift.endTime, shift.breakMinutes)}
          </p>
        </div>
      </div>
      <button
        onClick={() => onEdit(shift)}
        className="flex items-center justify-center gap-1.5 w-full py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
      >
        <Pencil size={12} /> Edit
      </button>
    </div>
  );
}

// ─── ShiftModal ───────────────────────────────────────────────────────────────

function ShiftModal({
  state,
  onClose,
  onSave,
}: {
  state: { mode: "add" | "edit"; data?: Shift };
  onClose: () => void;
  onSave: (shift: Shift) => void;
}) {
  const blank: Shift = {
    id: "",
    name: "",
    code: "",
    startTime: "08:00",
    endTime: "17:00",
    breakMinutes: 60,
    color: "blue",
  };
  const [form, setForm] = useState<Shift>(state.data ?? blank);
  const set = <K extends keyof Shift>(k: K, v: Shift[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-900">
            {state.mode === "add" ? "Add Shift" : "Edit Shift"}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X size={16} className="text-slate-500" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
              <input
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Morning Shift"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Code
              </label>
              <input
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.code}
                maxLength={3}
                onChange={(e) => set("code", e.target.value.toUpperCase())}
                placeholder="MOR"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Start Time
              </label>
              <input
                type="time"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.startTime}
                onChange={(e) => set("startTime", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                End Time
              </label>
              <input
                type="time"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.endTime}
                onChange={(e) => set("endTime", e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Break (minutes)
            </label>
            <input
              type="number"
              min={0}
              max={240}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.breakMinutes}
              onChange={(e) => set("breakMinutes", Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Color</label>
            <div className="flex gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => set("color", c)}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                    shiftColorMap[c].badge,
                    form.color === c
                      ? "ring-2 ring-offset-1 ring-blue-500 border-transparent"
                      : "border-slate-200"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (!form.name.trim() || !form.code.trim()) return;
              onSave({
                ...form,
                id: form.id || `SH-${Date.now()}`,
                code: form.code.toUpperCase().slice(0, 3),
              });
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            {state.mode === "add" ? "Add Shift" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CellAssignModal ──────────────────────────────────────────────────────────

function CellAssignModal({
  employeeId,
  date,
  currentShiftId,
  isOverride,
  confirmStatus,
  shiftList,
  onClose,
  onSave,
  onRemoveOverride,
}: {
  employeeId: string;
  date: string;
  currentShiftId: string | null;
  isOverride: boolean;
  confirmStatus?: ConfirmStatus;
  shiftList: Shift[];
  onClose: () => void;
  onSave: (shiftId: string | null, note: string) => void;
  onRemoveOverride?: () => void;
}) {
  const emp = allEmployees.find((e) => e.id === employeeId);
  const [selectedId, setSelectedId] = useState<string | null>(currentShiftId);
  const [dayOff, setDayOff] = useState(isOverride && currentShiftId === null);
  const [note, setNote] = useState("");

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Assign Shift</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {emp?.name} · {fmtLong(date)}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X size={16} className="text-slate-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Confirmation status banner */}
          {isOverride && confirmStatus && (
            <div
              className={cn(
                "flex items-center gap-2 p-3 rounded-xl text-sm",
                confirmStatus === "confirmed"
                  ? "bg-emerald-50 text-emerald-700"
                  : confirmStatus === "pending"
                  ? "bg-amber-50 text-amber-700"
                  : "bg-red-50 text-red-700"
              )}
            >
              {confirmStatus === "confirmed" ? (
                <CheckCircle2 size={14} />
              ) : (
                <AlertCircle size={14} />
              )}
              Employee {confirmStatus} this assignment
            </div>
          )}

          {date > MAX_FUTURE && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 text-amber-700 text-sm">
              <AlertCircle size={14} />
              This date exceeds the 1-year planning horizon
            </div>
          )}

          {/* Day off toggle */}
          <label
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors",
              dayOff
                ? "border-red-300 bg-red-50"
                : "border-slate-200 hover:bg-slate-50"
            )}
          >
            <input
              type="checkbox"
              checked={dayOff}
              onChange={(e) => {
                setDayOff(e.target.checked);
                if (e.target.checked) setSelectedId(null);
              }}
              className="w-4 h-4 rounded accent-red-500"
            />
            <span className="text-sm font-medium text-slate-700">Mark as Day Off</span>
          </label>

          {/* Shift picker */}
          {!dayOff && (
            <div className="space-y-2">
              {shiftList.map((s) => {
                const c = shiftColorMap[s.color];
                return (
                  <label
                    key={s.id}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors",
                      selectedId === s.id
                        ? `${c.bg} ${c.border} border`
                        : "border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    <input
                      type="radio"
                      name="shiftPick"
                      value={s.id}
                      checked={selectedId === s.id}
                      onChange={() => {
                        setSelectedId(s.id);
                        setDayOff(false);
                      }}
                      className="sr-only"
                    />
                    <span className={cn("w-3 h-3 rounded-full shrink-0", c.dot)} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">{s.name}</p>
                      <p className="text-xs text-slate-400 font-mono">
                        {s.startTime}–{s.endTime} ·{" "}
                        {calcWorkHours(s.startTime, s.endTime, s.breakMinutes)}
                      </p>
                    </div>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", c.badge)}>
                      {s.code}
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Note (optional)
            </label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Reason for this assignment..."
            />
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
          <div>
            {isOverride && onRemoveOverride && (
              <button
                onClick={onRemoveOverride}
                className="text-xs text-red-500 hover:underline"
              >
                Revert to recurring pattern
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(dayOff ? null : selectedId, note)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Save Assignment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── RequestChangeModal ───────────────────────────────────────────────────────

function RequestChangeModal({
  employeeId,
  date,
  currentShiftId,
  shiftList,
  onClose,
  onSubmit,
}: {
  employeeId: string;
  date: string;
  currentShiftId: string;
  shiftList: Shift[];
  onClose: () => void;
  onSubmit: (req: ChangeRequest) => void;
}) {
  const emp = allEmployees.find((e) => e.id === employeeId);
  const [requestedShiftId, setRequestedShiftId] = useState<string | null>(null);
  const [dayOff, setDayOff] = useState(false);
  const [reason, setReason] = useState("");
  const curShift = shiftList.find((s) => s.id === currentShiftId);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Request Shift Change
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {emp?.name} · {fmtLong(date)}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X size={16} className="text-slate-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {curShift && (
            <div
              className={cn(
                "flex items-center gap-2 p-3 rounded-xl text-sm",
                shiftColorMap[curShift.color].bg
              )}
            >
              <ArrowLeftRight size={14} className="shrink-0" />
              <span className="text-slate-600">
                Requesting change from{" "}
                <span className="font-semibold text-slate-800">{curShift.name}</span>
              </span>
            </div>
          )}

          <label
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors",
              dayOff
                ? "border-red-300 bg-red-50"
                : "border-slate-200 hover:bg-slate-50"
            )}
          >
            <input
              type="checkbox"
              checked={dayOff}
              onChange={(e) => {
                setDayOff(e.target.checked);
                if (e.target.checked) setRequestedShiftId(null);
              }}
              className="w-4 h-4 rounded accent-red-500"
            />
            <span className="text-sm font-medium text-slate-700">Request Day Off</span>
          </label>

          {!dayOff && (
            <div>
              <p className="text-xs font-medium text-slate-600 mb-2">
                Preferred shift (optional)
              </p>
              <div className="space-y-2">
                {shiftList
                  .filter((s) => s.id !== currentShiftId)
                  .map((s) => {
                    const c = shiftColorMap[s.color];
                    return (
                      <label
                        key={s.id}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors",
                          requestedShiftId === s.id
                            ? `${c.bg} ${c.border} border`
                            : "border-slate-200 hover:bg-slate-50"
                        )}
                      >
                        <input
                          type="radio"
                          name="reqShift"
                          value={s.id}
                          checked={requestedShiftId === s.id}
                          onChange={() => setRequestedShiftId(s.id)}
                          className="sr-only"
                        />
                        <span className={cn("w-3 h-3 rounded-full", c.dot)} />
                        <span className="text-sm font-medium text-slate-800 flex-1">
                          {s.name}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {s.startTime}–{s.endTime}
                        </span>
                      </label>
                    );
                  })}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Reason <span className="text-red-400">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Explain why you need this change..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            disabled={!reason.trim()}
            onClick={() =>
              onSubmit({
                id: `CR-${Date.now()}`,
                employeeId,
                date,
                currentShiftId,
                requestedShiftId: dayOff ? null : requestedShiftId,
                reason,
                status: "pending",
                createdAt: new Date().toISOString(),
              })
            }
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Submit Request
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── WeekCalendar ─────────────────────────────────────────────────────────────

function WeekCalendar({
  monday,
  branchEmployees,
  patterns,
  overrides,
  shiftList,
  empViewId,
  onCellClick,
  onConfirm,
  onRequestChange,
}: {
  monday: Date;
  branchEmployees: typeof allEmployees;
  patterns: EmployeeShift[];
  overrides: CalendarEntry[];
  shiftList: Shift[];
  empViewId: string | null;
  onCellClick: (
    empId: string,
    date: string,
    currentShiftId: string | null,
    isOverride: boolean,
    entry?: CalendarEntry
  ) => void;
  onConfirm: (entryId: string) => void;
  onRequestChange: (empId: string, date: string, shiftId: string) => void;
}) {
  // Mon→Sun (7 dates)
  const dates = WEEK_DAYS_MON_SUN.map((offset) => {
    const base = getMondayOf(monday);
    return addDays(base, [1, 2, 3, 4, 5, 6, 0].indexOf(offset));
  });

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            {/* Employee column header */}
            <th className="sticky left-0 bg-slate-50 px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-44 border-r border-slate-100 z-10">
              Employee
            </th>
            {dates.map((d, i) => {
              const str = toStr(d);
              const isToday = str === TODAY;
              const isPast = str < TODAY;
              return (
                <th
                  key={str}
                  className={cn(
                    "px-2 py-3 text-center text-xs font-semibold min-w-[88px]",
                    isToday
                      ? "bg-blue-50 text-blue-700"
                      : isPast
                      ? "text-slate-400"
                      : "text-slate-600"
                  )}
                >
                  <p>{MON_SUN_LABELS[i]}</p>
                  <p
                    className={cn(
                      "text-base font-bold mt-0.5",
                      isToday
                        ? "text-blue-700"
                        : isPast
                        ? "text-slate-300"
                        : "text-slate-800"
                    )}
                  >
                    {d.getDate()}
                  </p>
                  <p className="text-xs font-normal text-slate-400">
                    {d.toLocaleDateString("en-US", { month: "short" })}
                  </p>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {branchEmployees.map((emp) => {
            const isEmpView = empViewId === emp.id;
            const isOtherEmp = !!empViewId && empViewId !== emp.id;

            return (
              <tr
                key={emp.id}
                className={cn(
                  "border-b border-slate-100 last:border-b-0",
                  isEmpView ? "bg-blue-50/40" : isOtherEmp ? "opacity-30" : "hover:bg-slate-50/40"
                )}
              >
                {/* Name cell */}
                <td
                  className={cn(
                    "sticky left-0 px-4 py-2 border-r border-slate-100 z-10",
                    isEmpView ? "bg-blue-50" : "bg-white"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white",
                        isEmpView ? "bg-blue-600" : "bg-slate-300"
                      )}
                    >
                      {emp.firstName?.charAt(0) ?? emp.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 text-xs leading-tight">
                        {emp.name}
                      </p>
                      <p className="text-slate-400 text-[10px]">{emp.department}</p>
                    </div>
                  </div>
                </td>

                {/* Day cells */}
                {dates.map((d) => {
                  const dateStr = toStr(d);
                  const isPast = dateStr < TODAY;
                  const isFutureLocked = dateStr > MAX_FUTURE;
                  const { shiftId, override } = getEffectiveShift(
                    dateStr,
                    emp.id,
                    patterns,
                    overrides
                  );
                  const shift = shiftId ? shiftList.find((s) => s.id === shiftId) : null;
                  const c = shift ? shiftColorMap[shift.color] : null;
                  const isOv = !!override;
                  const canAct = !isOtherEmp && !isPast && !isFutureLocked;

                  return (
                    <td
                      key={dateStr}
                      className={cn(
                        "px-1 py-1.5 text-center align-top",
                        isPast && "bg-slate-50/50"
                      )}
                    >
                      {shift && c ? (
                        <div className="flex flex-col gap-1 items-center">
                          <button
                            onClick={() =>
                              canAct &&
                              !empViewId &&
                              onCellClick(emp.id, dateStr, shiftId, isOv, override)
                            }
                            className={cn(
                              "w-full px-1.5 py-1.5 rounded-lg text-xs font-semibold transition-colors relative",
                              c.badge,
                              !empViewId && canAct
                                ? "hover:opacity-75 cursor-pointer"
                                : "cursor-default",
                              isOv && "ring-2 ring-offset-1",
                              isOv && override?.confirmStatus === "confirmed"
                                ? "ring-emerald-400"
                                : isOv && override?.confirmStatus === "pending"
                                ? "ring-amber-400"
                                : isOv
                                ? "ring-slate-300"
                                : ""
                            )}
                          >
                            {shift.code}
                            {isOv && (
                              <span className="absolute -top-1.5 -right-1.5">
                                {override?.confirmStatus === "confirmed" ? (
                                  <span className="w-3.5 h-3.5 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[8px]">
                                    ✓
                                  </span>
                                ) : override?.confirmStatus === "pending" ? (
                                  <span className="w-3.5 h-3.5 bg-amber-400 rounded-full" />
                                ) : null}
                              </span>
                            )}
                          </button>

                          {/* Employee view: confirm / request-change buttons */}
                          {isEmpView && isOv && override?.confirmStatus === "pending" && !isPast && (
                            <div className="flex gap-0.5 w-full">
                              <button
                                onClick={() => onConfirm(override!.id)}
                                title="Confirm"
                                className="flex-1 py-0.5 text-xs bg-emerald-500 text-white rounded font-bold hover:bg-emerald-600"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() =>
                                  onRequestChange(emp.id, dateStr, shiftId!)
                                }
                                title="Request change"
                                className="flex-1 py-0.5 text-xs bg-amber-100 text-amber-700 rounded font-bold hover:bg-amber-200"
                              >
                                ↕
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Empty cell */
                        <button
                          onClick={() =>
                            canAct &&
                            !empViewId &&
                            onCellClick(emp.id, dateStr, null, false)
                          }
                          className={cn(
                            "w-full h-10 rounded-lg border-2 border-dashed transition-colors",
                            canAct && !empViewId
                              ? "border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-300 hover:text-blue-400 cursor-pointer"
                              : "border-transparent cursor-default"
                          )}
                        >
                          {canAct && !empViewId && (
                            <Plus size={12} className="mx-auto" />
                          )}
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── MonthCalendar ────────────────────────────────────────────────────────────

function MonthCalendar({
  year,
  month,
  branchEmployees,
  patterns,
  overrides,
  shiftList,
  selectedDate,
  onDayClick,
}: {
  year: number;
  month: number; // 0-indexed
  branchEmployees: typeof allEmployees;
  patterns: EmployeeShift[];
  overrides: CalendarEntry[];
  shiftList: Shift[];
  selectedDate: string | null;
  onDayClick: (date: string) => void;
}) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const gridStart = getMondayOf(firstDay);
  // End on Sunday of last week
  const lastDayDow = lastDay.getDay();
  const gridEnd = addDays(lastDay, lastDayDow === 0 ? 0 : 7 - lastDayDow);

  const allDates: Date[] = [];
  let cur = new Date(gridStart);
  while (cur <= gridEnd) {
    allDates.push(new Date(cur));
    cur = addDays(cur, 1);
  }

  const weeks: Date[][] = [];
  for (let i = 0; i < allDates.length; i += 7)
    weeks.push(allDates.slice(i, i + 7));

  function getDayStats(dateStr: string) {
    const counts: Record<string, { count: number; color: ShiftColor; code: string }> = {};
    for (const emp of branchEmployees) {
      const { shiftId } = getEffectiveShift(dateStr, emp.id, patterns, overrides);
      if (shiftId) {
        const s = shiftList.find((x) => x.id === shiftId);
        if (s) {
          if (!counts[s.id])
            counts[s.id] = { count: 0, color: s.color, code: s.code };
          counts[s.id].count++;
        }
      }
    }
    return Object.values(counts);
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
        {MON_SUN_LABELS.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-xs font-semibold text-slate-500"
          >
            {d}
          </div>
        ))}
      </div>

      {weeks.map((week, wi) => (
        <div
          key={wi}
          className="grid grid-cols-7 border-b border-slate-100 last:border-b-0"
        >
          {week.map((d) => {
            const str = toStr(d);
            const inMonth = d.getMonth() === month;
            const isToday = str === TODAY;
            const isPast = str < TODAY;
            const isSelected = str === selectedDate;
            const stats = getDayStats(str);

            return (
              <button
                key={str}
                onClick={() => onDayClick(str)}
                className={cn(
                  "min-h-[80px] p-2 text-left transition-colors border-r border-slate-50 last:border-r-0",
                  !inMonth && "bg-slate-50/60",
                  isSelected &&
                    "bg-blue-50 ring-2 ring-inset ring-blue-400",
                  !isSelected && !isPast && inMonth && "hover:bg-slate-50",
                  isPast && "cursor-default"
                )}
              >
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold mb-1",
                    isToday
                      ? "bg-blue-600 text-white"
                      : !inMonth
                      ? "text-slate-300"
                      : isPast
                      ? "text-slate-400"
                      : "text-slate-800"
                  )}
                >
                  {d.getDate()}
                </div>
                <div className="space-y-0.5">
                  {stats.slice(0, 3).map((s, i) => (
                    <div
                      key={i}
                      className={cn(
                        "text-xs px-1.5 py-0.5 rounded font-medium leading-tight",
                        shiftColorMap[s.color].badge
                      )}
                    >
                      {s.count} · {s.code}
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── RequestsTab ──────────────────────────────────────────────────────────────

function RequestsTab({
  requests,
  branchEmployees,
  shiftList,
  empViewId,
  onApprove,
  onReject,
}: {
  requests: ChangeRequest[];
  branchEmployees: typeof allEmployees;
  shiftList: Shift[];
  empViewId: string | null;
  onApprove: (id: string) => void;
  onReject: (id: string, note: string) => void;
}) {
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">(
    "pending"
  );
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  const counts = {
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  const filtered = requests
    .filter((r) =>
      filter === "all" ? true : r.status === filter
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="space-y-4">
      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {(["pending", "approved", "rejected", "all"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors border",
              filter === s
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            )}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
            {s !== "all" && (
              <span className="ml-1.5 text-xs opacity-70">({counts[s]})</span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
          No {filter === "all" ? "" : filter} requests
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => {
            const emp = branchEmployees.find((e) => e.id === req.employeeId);
            const curShift = shiftList.find((s) => s.id === req.currentShiftId);
            const reqShift = req.requestedShiftId
              ? shiftList.find((s) => s.id === req.requestedShiftId)
              : null;
            const resolver = req.resolvedBy
              ? allEmployees.find((e) => e.id === req.resolvedBy)
              : null;
            const isMyReq = empViewId === req.employeeId;

            return (
              <div
                key={req.id}
                className={cn(
                  "bg-white rounded-xl border p-5",
                  req.status === "pending"
                    ? "border-amber-200"
                    : req.status === "approved"
                    ? "border-emerald-200"
                    : "border-slate-200"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm shrink-0">
                      {emp?.firstName?.charAt(0) ?? emp?.name.charAt(0) ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="font-semibold text-slate-900 text-sm">
                          {emp?.name}
                        </p>
                        <span className="text-xs bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                          {req.id}
                        </span>
                        {isMyReq && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            My request
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mb-2">{fmtLong(req.date)}</p>

                      <div className="flex items-center gap-2 text-sm flex-wrap mb-2">
                        {curShift && (
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-xs font-medium",
                              shiftColorMap[curShift.color].badge
                            )}
                          >
                            {curShift.name}
                          </span>
                        )}
                        <ArrowLeftRight size={12} className="text-slate-400 shrink-0" />
                        {req.requestedShiftId === null ? (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                            Day Off
                          </span>
                        ) : reqShift ? (
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-xs font-medium",
                              shiftColorMap[reqShift.color].badge
                            )}
                          >
                            {reqShift.name}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            No preference
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2 italic">
                        &ldquo;{req.reason}&rdquo;
                      </p>

                      {req.managerNote && (
                        <div
                          className={cn(
                            "mt-2 px-3 py-2 rounded-lg text-xs",
                            req.status === "approved"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-700"
                          )}
                        >
                          <span className="font-semibold">Manager note: </span>
                          {req.managerNote}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col items-end gap-2">
                    <span
                      className={cn(
                        "text-xs font-semibold px-2.5 py-1 rounded-full",
                        req.status === "pending"
                          ? "bg-amber-100 text-amber-700"
                          : req.status === "approved"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      )}
                    >
                      {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                    </span>

                    {/* Manager actions */}
                    {req.status === "pending" && !empViewId && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setRejectId(req.id);
                            setRejectNote("");
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                        >
                          <XCircle size={11} /> Reject
                        </button>
                        <button
                          onClick={() => onApprove(req.id)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                        >
                          <CheckCircle2 size={11} /> Approve
                        </button>
                      </div>
                    )}

                    {resolver && req.resolvedAt && (
                      <p className="text-xs text-slate-400">
                        {resolver.name} ·{" "}
                        {new Date(req.resolvedAt).toLocaleDateString("en-GB")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject reason modal */}
      {rejectId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-semibold text-slate-900">Reject Request</h3>
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              rows={3}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
              placeholder="Reason for rejection (optional)..."
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setRejectId(null)}
                className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onReject(rejectId, rejectNote);
                  setRejectId(null);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ShiftsPage() {
  const { activeBranch } = useBranch();

  // Core state
  const [tab, setTab] = useState<MainTab>("calendar");
  const [shiftList, setShiftList] = useState<Shift[]>([...initialShifts]);
  const [patterns, setPatterns] = useState<EmployeeShift[]>([...initialAssignments]);
  const [overrides, setOverrides] = useState<CalendarEntry[]>(initialOverrides);
  const [requests, setRequests] = useState<ChangeRequest[]>(initialRequests);

  // Calendar navigation
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [monday, setMonday] = useState<Date>(() => getMondayOf(parseDate(TODAY)));
  const [calMonth, setCalMonth] = useState(() => {
    const d = parseDate(TODAY);
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Modals
  const [shiftModal, setShiftModal] = useState<{
    mode: "add" | "edit";
    data?: Shift;
  } | null>(null);
  const [cellModal, setCellModal] = useState<{
    empId: string;
    date: string;
    currentShiftId: string | null;
    isOverride: boolean;
    entry?: CalendarEntry;
  } | null>(null);
  const [reqChangeModal, setReqChangeModal] = useState<{
    empId: string;
    date: string;
    currentShiftId: string;
  } | null>(null);

  // Demo: simulate employee perspective
  const [empViewId, setEmpViewId] = useState<string | null>(null);

  // Filtered data for active branch
  const branchEmps = useMemo(
    () => allEmployees.filter((e) => e.branchId === activeBranch.id),
    [activeBranch.id]
  );
  const branchPatterns = useMemo(
    () => patterns.filter((p) => p.branchId === activeBranch.id),
    [patterns, activeBranch.id]
  );

  const pendingConfirmations = overrides.filter(
    (o) => o.branchId === activeBranch.id && o.confirmStatus === "pending"
  ).length;
  const pendingRequests = requests.filter((r) => r.status === "pending").length;

  // Navigation
  const prevWeek = () => setMonday((d) => addDays(d, -7));
  const nextWeek = () => setMonday((d) => addDays(d, 7));
  const prevMonth = () =>
    setCalMonth((m) => {
      const d = new Date(m.year, m.month - 1, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  const nextMonth = () =>
    setCalMonth((m) => {
      const d = new Date(m.year, m.month + 1, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  const goToday = () => {
    const d = parseDate(TODAY);
    setMonday(getMondayOf(d));
    setCalMonth({ year: d.getFullYear(), month: d.getMonth() });
  };

  // Handlers
  const handleSaveShift = (shift: Shift) => {
    setShiftList((prev) => {
      const idx = prev.findIndex((s) => s.id === shift.id);
      if (idx >= 0) {
        const n = [...prev];
        n[idx] = shift;
        return n;
      }
      return [...prev, shift];
    });
    setShiftModal(null);
  };

  const handleCellSave = (shiftId: string | null, note: string) => {
    if (!cellModal) return;
    const entry: CalendarEntry = {
      id: cellModal.entry?.id ?? `CE-${Date.now()}`,
      employeeId: cellModal.empId,
      shiftId,
      date: cellModal.date,
      branchId: activeBranch.id,
      confirmStatus: "pending",
      note: note || undefined,
    };
    setOverrides((prev) => {
      const idx = prev.findIndex(
        (o) =>
          o.id === entry.id ||
          (o.date === entry.date && o.employeeId === entry.employeeId)
      );
      if (idx >= 0) {
        const n = [...prev];
        n[idx] = entry;
        return n;
      }
      return [...prev, entry];
    });
    setCellModal(null);
  };

  const handleRemoveOverride = () => {
    if (!cellModal?.entry) return;
    setOverrides((prev) => prev.filter((o) => o.id !== cellModal.entry!.id));
    setCellModal(null);
  };

  const handleConfirm = (entryId: string) => {
    setOverrides((prev) =>
      prev.map((o) =>
        o.id === entryId ? { ...o, confirmStatus: "confirmed" } : o
      )
    );
  };

  const handleApproveRequest = (id: string) => {
    const req = requests.find((r) => r.id === id);
    if (!req) return;
    const entry: CalendarEntry = {
      id: `CE-${Date.now()}`,
      employeeId: req.employeeId,
      shiftId: req.requestedShiftId,
      date: req.date,
      branchId: activeBranch.id,
      confirmStatus: "confirmed",
      note: `Approved — request ${req.id}`,
    };
    setOverrides((prev) => {
      const idx = prev.findIndex(
        (o) => o.date === req.date && o.employeeId === req.employeeId
      );
      if (idx >= 0) {
        const n = [...prev];
        n[idx] = entry;
        return n;
      }
      return [...prev, entry];
    });
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "approved" as const,
              resolvedBy: "EMP-004",
              resolvedAt: new Date().toISOString(),
            }
          : r
      )
    );
  };

  const handleRejectRequest = (id: string, note: string) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "rejected" as const,
              resolvedBy: "EMP-004",
              resolvedAt: new Date().toISOString(),
              managerNote: note || "Request rejected",
            }
          : r
      )
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header
        title="Shift Management"
        subtitle="Configure shifts, plan schedules up to 1 year ahead, and manage change requests"
        actions={
          <div className="flex items-center gap-2">
            {pendingRequests > 0 && (
              <button
                onClick={() => setTab("requests")}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100"
              >
                <Bell size={14} />
                {pendingRequests} Request{pendingRequests !== 1 ? "s" : ""}
              </button>
            )}
            <button
              onClick={() => setShiftModal({ mode: "add" })}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              <Plus size={15} /> Add Shift
            </button>
          </div>
        }
      />

      <main className="flex-1 p-6">
        {/* Main tabs */}
        <div className="flex items-center gap-1 mb-6 bg-white border border-slate-200 rounded-xl p-1 w-fit">
          {(
            [
              { id: "templates" as MainTab, label: "Shift Templates", icon: <Clock size={14} /> },
              {
                id: "calendar" as MainTab,
                label: "Schedule Calendar",
                icon: <CalendarDays size={14} />,
                badge: pendingConfirmations,
              },
              {
                id: "requests" as MainTab,
                label: "Change Requests",
                icon: <ArrowLeftRight size={14} />,
                badge: pendingRequests,
              },
            ] as {
              id: MainTab;
              label: string;
              icon: React.ReactNode;
              badge?: number;
            }[]
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors relative",
                tab === t.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              {t.icon}
              {t.label}
              {t.badge && t.badge > 0 ? (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                  {t.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* ── TEMPLATES TAB ── */}
        {tab === "templates" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {shiftList.map((s) => (
              <ShiftCard
                key={s.id}
                shift={s}
                onEdit={(sh) => setShiftModal({ mode: "edit", data: sh })}
              />
            ))}
            <button
              onClick={() => setShiftModal({ mode: "add" })}
              className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-xl p-5 text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors min-h-[160px]"
            >
              <Plus size={20} />
              <span className="text-sm font-medium">Add Shift</span>
            </button>
          </div>
        )}

        {/* ── CALENDAR TAB ── */}
        {tab === "calendar" && (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* View toggle */}
              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode("week")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                    viewMode === "week"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <Rows3 size={14} /> Week
                </button>
                <button
                  onClick={() => setViewMode("month")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                    viewMode === "month"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <LayoutGrid size={14} /> Month
                </button>
              </div>

              {/* Prev / label / next */}
              <div className="flex items-center bg-white border border-slate-200 rounded-lg">
                <button
                  onClick={viewMode === "week" ? prevWeek : prevMonth}
                  className="p-2 hover:bg-slate-100 rounded-l-lg transition-colors"
                >
                  <ChevronLeft size={16} className="text-slate-600" />
                </button>
                <span className="px-4 py-2 text-sm font-semibold text-slate-800 min-w-[200px] text-center">
                  {viewMode === "week"
                    ? fmtWeekRange(monday)
                    : fmtMonthYear(new Date(calMonth.year, calMonth.month, 1))}
                </span>
                <button
                  onClick={viewMode === "week" ? nextWeek : nextMonth}
                  className="p-2 hover:bg-slate-100 rounded-r-lg transition-colors"
                >
                  <ChevronRight size={16} className="text-slate-600" />
                </button>
              </div>

              <button
                onClick={goToday}
                className="px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Today
              </button>

              {/* Employee / Manager role toggle */}
              <div className="ml-auto flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
                <Shield
                  size={14}
                  className={empViewId ? "text-slate-300" : "text-blue-600"}
                />
                <span className="text-xs text-slate-500">View as:</span>
                <select
                  value={empViewId ?? ""}
                  onChange={(e) => setEmpViewId(e.target.value || null)}
                  className="text-xs font-medium text-slate-700 bg-transparent focus:outline-none cursor-pointer"
                >
                  <option value="">Manager</option>
                  {branchEmps.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
                {empViewId && <UserCheck size={14} className="text-emerald-600" />}
              </div>
            </div>

            {/* Pending confirmation banner */}
            {pendingConfirmations > 0 && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                <AlertCircle size={14} className="shrink-0" />
                <span>
                  <span className="font-semibold">{pendingConfirmations}</span>{" "}
                  assignment
                  {pendingConfirmations !== 1 ? "s" : ""} pending employee
                  confirmation
                  {empViewId && (
                    <span className="ml-2 text-xs bg-amber-200 px-2 py-0.5 rounded-full">
                      Use ✓ / ↕ buttons on amber-ringed shifts to confirm or
                      request a change
                    </span>
                  )}
                </span>
              </div>
            )}

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-emerald-400 ring-offset-1" />
                Confirmed override
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-300 ring-2 ring-amber-400 ring-offset-1" />
                Pending confirmation
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-400" />
                Recurring pattern
              </span>
              <span className="text-slate-400 italic">
                Click any empty cell to assign · Click a shift badge to change ·
                Plan up to{" "}
                {new Date(MAX_FUTURE).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>

            {/* Week view */}
            {viewMode === "week" && (
              <WeekCalendar
                monday={monday}
                branchEmployees={branchEmps}
                patterns={branchPatterns}
                overrides={overrides}
                shiftList={shiftList}
                empViewId={empViewId}
                onCellClick={(empId, date, currentShiftId, isOv, entry) => {
                  if (empViewId) return; // employee can't directly assign
                  setCellModal({ empId, date, currentShiftId, isOverride: isOv, entry });
                }}
                onConfirm={handleConfirm}
                onRequestChange={(empId, date, shiftId) =>
                  setReqChangeModal({ empId, date, currentShiftId: shiftId })
                }
              />
            )}

            {/* Month view */}
            {viewMode === "month" && (
              <div className="space-y-4">
                <MonthCalendar
                  year={calMonth.year}
                  month={calMonth.month}
                  branchEmployees={branchEmps}
                  patterns={branchPatterns}
                  overrides={overrides}
                  shiftList={shiftList}
                  selectedDate={selectedDate}
                  onDayClick={(d) =>
                    setSelectedDate((prev) => (prev === d ? null : d))
                  }
                />

                {/* Day detail panel */}
                {selectedDate && (() => {
                  const dayEmps = branchEmps
                    .map((emp) => {
                      const { shiftId, override } = getEffectiveShift(
                        selectedDate,
                        emp.id,
                        branchPatterns,
                        overrides
                      );
                      const shift = shiftId
                        ? shiftList.find((s) => s.id === shiftId)
                        : null;
                      return { emp, shift, shiftId, override };
                    })
                    .filter((x) => x.shift || x.override);

                  return (
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-slate-900">
                            {fmtLong(selectedDate)}
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {dayEmps.length} employee
                            {dayEmps.length !== 1 ? "s" : ""} scheduled
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {!empViewId && selectedDate >= TODAY && (
                            <button
                              onClick={() => {
                                const unscheduled = branchEmps.find(
                                  (e) =>
                                    !dayEmps.some((de) => de.emp.id === e.id)
                                );
                                if (unscheduled)
                                  setCellModal({
                                    empId: unscheduled.id,
                                    date: selectedDate,
                                    currentShiftId: null,
                                    isOverride: false,
                                  });
                              }}
                              className="flex items-center gap-1 text-xs text-blue-600 border border-blue-200 rounded-lg px-2.5 py-1.5 hover:bg-blue-50"
                            >
                              <Plus size={11} /> Assign Employee
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedDate(null)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg"
                          >
                            <X size={14} className="text-slate-400" />
                          </button>
                        </div>
                      </div>

                      {dayEmps.length === 0 ? (
                        <p className="text-slate-400 text-sm text-center py-6">
                          No employees scheduled for this day
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {dayEmps.map(({ emp, shift, shiftId, override }) => {
                            const c = shift ? shiftColorMap[shift.color] : null;
                            return (
                              <div
                                key={emp.id}
                                className={cn(
                                  "flex items-center gap-3 p-3 rounded-xl border",
                                  override?.confirmStatus === "pending"
                                    ? "border-amber-200 bg-amber-50/40"
                                    : override?.confirmStatus === "confirmed"
                                    ? "border-emerald-200 bg-emerald-50/30"
                                    : "border-slate-100"
                                )}
                              >
                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0">
                                  {emp.firstName?.charAt(0) ?? emp.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-slate-800 text-sm truncate">
                                    {emp.name}
                                  </p>
                                  <p className="text-xs text-slate-400">
                                    {emp.department}
                                  </p>
                                </div>
                                {shift && c && (
                                  <span
                                    className={cn(
                                      "text-xs font-semibold px-2.5 py-1 rounded-full shrink-0",
                                      c.badge
                                    )}
                                  >
                                    {shift.code} · {shift.startTime}–{shift.endTime}
                                  </span>
                                )}
                                {override?.confirmStatus && (
                                  <span
                                    className={cn(
                                      "text-xs px-2 py-0.5 rounded-full font-medium shrink-0",
                                      override.confirmStatus === "confirmed"
                                        ? "bg-emerald-100 text-emerald-700"
                                        : override.confirmStatus === "pending"
                                        ? "bg-amber-100 text-amber-700"
                                        : "bg-red-100 text-red-700"
                                    )}
                                  >
                                    {override.confirmStatus}
                                  </span>
                                )}
                                {!empViewId && selectedDate >= TODAY && (
                                  <button
                                    onClick={() =>
                                      setCellModal({
                                        empId: emp.id,
                                        date: selectedDate,
                                        currentShiftId: shiftId ?? null,
                                        isOverride: !!override,
                                        entry: override,
                                      })
                                    }
                                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 shrink-0"
                                  >
                                    <Pencil size={12} />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* ── REQUESTS TAB ── */}
        {tab === "requests" && (
          <RequestsTab
            requests={requests}
            branchEmployees={branchEmps}
            shiftList={shiftList}
            empViewId={empViewId}
            onApprove={handleApproveRequest}
            onReject={handleRejectRequest}
          />
        )}
      </main>

      {/* Modals */}
      {shiftModal && (
        <ShiftModal
          state={shiftModal}
          onClose={() => setShiftModal(null)}
          onSave={handleSaveShift}
        />
      )}

      {cellModal && (
        <CellAssignModal
          employeeId={cellModal.empId}
          date={cellModal.date}
          currentShiftId={cellModal.currentShiftId}
          isOverride={cellModal.isOverride}
          confirmStatus={cellModal.entry?.confirmStatus}
          shiftList={shiftList}
          onClose={() => setCellModal(null)}
          onSave={handleCellSave}
          onRemoveOverride={
            cellModal.isOverride ? handleRemoveOverride : undefined
          }
        />
      )}

      {reqChangeModal && (
        <RequestChangeModal
          employeeId={reqChangeModal.empId}
          date={reqChangeModal.date}
          currentShiftId={reqChangeModal.currentShiftId}
          shiftList={shiftList}
          onClose={() => setReqChangeModal(null)}
          onSubmit={(req) => {
            setRequests((prev) => [req, ...prev]);
            setReqChangeModal(null);
          }}
        />
      )}
    </div>
  );
}
