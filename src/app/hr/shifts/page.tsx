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
  Trash2,
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
  Users,
  Search,
  TrendingUp,
  Timer,
  CalendarCheck,
  Hash,
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

interface CalendarEntry {
  id: string;
  employeeId: string;
  shiftId: string | null;
  date: string;
  branchId: string;
  confirmStatus: ConfirmStatus;
  note?: string;
}

interface ChangeRequest {
  id: string;
  employeeId: string;
  date: string;
  currentShiftId: string;
  requestedShiftId: string | null;
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  resolvedBy?: string;
  resolvedAt?: string;
  managerNote?: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const initialOverrides: CalendarEntry[] = [
  { id: "CE-001", employeeId: "EMP-001", shiftId: "SH-004", date: "2026-07-15", branchId: "BR-001", confirmStatus: "confirmed", note: "Half-day — approved change request" },
  { id: "CE-002", employeeId: "EMP-010", shiftId: null,     date: "2026-07-10", branchId: "BR-001", confirmStatus: "pending",   note: "Approved leave" },
  { id: "CE-003", employeeId: "EMP-007", shiftId: "SH-002", date: "2026-07-08", branchId: "BR-001", confirmStatus: "pending",   note: "Reassigned — pending employee confirmation" },
  { id: "CE-004", employeeId: "EMP-002", shiftId: "SH-001", date: "2026-07-28", branchId: "BR-001", confirmStatus: "pending",   note: "Extended coverage shift" },
  { id: "CE-005", employeeId: "EMP-003", shiftId: "SH-002", date: "2026-08-05", branchId: "BR-001", confirmStatus: "pending",   note: "Temporary schedule change" },
];

const initialRequests: ChangeRequest[] = [
  { id: "CR-001", employeeId: "EMP-007", date: "2026-07-08", currentShiftId: "SH-001", requestedShiftId: "SH-002", reason: "Doctor appointment — need afternoon shift instead", status: "pending",  createdAt: "2026-07-04T09:00:00" },
  { id: "CR-002", employeeId: "EMP-010", date: "2026-07-10", currentShiftId: "SH-001", requestedShiftId: null,     reason: "Family emergency — requesting day off",                status: "pending",  createdAt: "2026-07-04T10:30:00" },
  { id: "CR-003", employeeId: "EMP-001", date: "2026-07-15", currentShiftId: "SH-001", requestedShiftId: "SH-004", reason: "Team meeting requires half-day only",                    status: "approved", createdAt: "2026-06-30T14:00:00", resolvedBy: "EMP-004", resolvedAt: "2026-07-01T09:00:00", managerNote: "Approved — coordinate with team lead" },
  { id: "CR-004", employeeId: "EMP-006", date: "2026-07-12", currentShiftId: "SH-001", requestedShiftId: "SH-002", reason: "Shift swap request with colleague",                        status: "rejected", createdAt: "2026-07-02T11:00:00", resolvedBy: "EMP-005", resolvedAt: "2026-07-03T08:30:00", managerNote: "Cannot accommodate — understaffed that week" },
  { id: "CR-005", employeeId: "EMP-003", date: "2026-07-20", currentShiftId: "SH-002", requestedShiftId: "SH-001", reason: "Personal commitment in the morning",                       status: "pending",  createdAt: "2026-07-03T15:00:00" },
  { id: "CR-006", employeeId: "EMP-005", date: "2026-07-22", currentShiftId: "SH-001", requestedShiftId: null,     reason: "Medical leave — attached certificate",                    status: "approved", createdAt: "2026-07-01T08:00:00", resolvedBy: "EMP-004", resolvedAt: "2026-07-02T09:00:00", managerNote: "Approved with documentation" },
];

// ─── Constants ────────────────────────────────────────────────────────────────

const TODAY = "2026-07-04";
const MAX_FUTURE = "2027-07-04";
const COLOR_OPTIONS: ShiftColor[] = ["blue", "amber", "violet", "emerald"];
const WEEK_DAYS_MON_SUN = [1, 2, 3, 4, 5, 6, 0];
const MON_SUN_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SHORT_DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MIN_STAFF = 3; // threshold for staffing alerts

const shiftColorMap: Record<ShiftColor, { badge: string; dot: string; bg: string; border: string; ring: string }> = {
  blue:    { badge: "bg-blue-100 text-blue-700",    dot: "bg-blue-500",    bg: "bg-blue-50",    border: "border-blue-300",    ring: "ring-blue-400" },
  amber:   { badge: "bg-amber-100 text-amber-700",  dot: "bg-amber-500",   bg: "bg-amber-50",   border: "border-amber-300",   ring: "ring-amber-400" },
  violet:  { badge: "bg-violet-100 text-violet-700",dot: "bg-violet-500",  bg: "bg-violet-50",  border: "border-violet-300",  ring: "ring-violet-400" },
  emerald: { badge: "bg-emerald-100 text-emerald-700",dot:"bg-emerald-500",bg: "bg-emerald-50", border: "border-emerald-300", ring: "ring-emerald-400" },
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
function getMondayOf(d: Date): Date {
  const day = d.getDay();
  return addDays(d, day === 0 ? -6 : 1 - day);
}
function fmtWeekRange(monday: Date): string {
  const sunday = addDays(monday, 6);
  return `${monday.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${sunday.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}
function fmtMonthYear(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
function fmtLong(dateStr: string): string {
  return parseDate(dateStr).toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
function fmtShort(dateStr: string): string {
  return parseDate(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function daysBetween(a: string, b: string): number {
  return Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / 86400000);
}
function getISOWeek(d: Date): number {
  const tmp = new Date(d.getTime());
  tmp.setHours(0, 0, 0, 0);
  tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7));
  const week1 = new Date(tmp.getFullYear(), 0, 4);
  return 1 + Math.round(((tmp.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

// ─── Shift Helpers ────────────────────────────────────────────────────────────

function calcWorkMinutes(start: string, end: string, breakMin: number): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const s = sh * 60 + sm, e = eh * 60 + em;
  return (e >= s ? e - s : 24 * 60 - s + e) - breakMin;
}
function calcWorkHours(start: string, end: string, breakMin: number): string {
  const total = calcWorkMinutes(start, end, breakMin);
  return total % 60 === 0 ? `${Math.floor(total / 60)}h` : `${Math.floor(total / 60)}h ${total % 60}m`;
}
function getEffectiveShift(
  date: string,
  employeeId: string,
  patterns: EmployeeShift[],
  overrides: CalendarEntry[]
): { shiftId: string | null; override?: CalendarEntry } {
  const override = overrides.find((o) => o.date === date && o.employeeId === employeeId);
  if (override) return { shiftId: override.shiftId, override };
  const dayOfWeek = parseDate(date).getDay();
  const applicable = patterns
    .filter((p) => p.employeeId === employeeId && p.effectiveFrom <= date)
    .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
  if (applicable.length > 0 && applicable[0].daysOfWeek.includes(dayOfWeek))
    return { shiftId: applicable[0].shiftId };
  return { shiftId: null };
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon: Icon, color = "blue" }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color?: "blue" | "amber" | "emerald" | "violet";
}) {
  const colors = {
    blue:    "bg-blue-50 text-blue-600",
    amber:   "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
    violet:  "bg-violet-50 text-violet-600",
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", colors[color])}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-xl font-bold text-slate-900 leading-tight">{value}</p>
        {sub && <p className="text-xs text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}

// ─── ShiftCard (Templates) ────────────────────────────────────────────────────

function ShiftCard({
  shift, assignedEmps, patterns, onEdit, onDelete,
}: {
  shift: Shift;
  assignedEmps: typeof allEmployees;
  patterns: EmployeeShift[];
  onEdit: (s: Shift) => void;
  onDelete: (id: string) => void;
}) {
  const [showRoster, setShowRoster] = useState(false);
  const c = shiftColorMap[shift.color];

  // Recurring days this shift is used
  const usedDays = useMemo(() => {
    const days = new Set<number>();
    patterns.filter((p) => p.shiftId === shift.id).forEach((p) =>
      p.daysOfWeek.forEach((d) => days.add(d))
    );
    return days;
  }, [patterns, shift.id]);

  const hours = calcWorkHours(shift.startTime, shift.endTime, shift.breakMinutes);
  const mins = calcWorkMinutes(shift.startTime, shift.endTime, shift.breakMinutes);

  return (
    <div className="bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden">
      {/* Color stripe */}
      <div className={cn("h-1.5 w-full", c.dot)} />
      <div className="p-5 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className={cn("w-3 h-3 rounded-full shrink-0", c.dot)} />
            <div>
              <p className="font-bold text-slate-900">{shift.name}</p>
              <p className="text-xs text-slate-400 font-mono">{shift.code}</p>
            </div>
          </div>
          <span className={cn("text-xs px-2 py-0.5 rounded-full font-semibold", c.badge)}>
            {assignedEmps.length} staff
          </span>
        </div>

        {/* Time row */}
        <div className={cn("flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium", c.bg)}>
          <Clock size={13} className="shrink-0 text-slate-500" />
          <span className="font-mono text-slate-800">
            {shift.startTime} – {shift.endTime}
          </span>
          <span className={cn("ml-auto text-xs font-semibold px-2 py-0.5 rounded-full", c.badge)}>
            {hours}
          </span>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-slate-50 rounded-lg px-2 py-2 text-center">
            <p className="text-slate-400">Break</p>
            <p className="font-bold text-slate-700">{shift.breakMinutes}m</p>
          </div>
          <div className="bg-slate-50 rounded-lg px-2 py-2 text-center">
            <p className="text-slate-400">Total</p>
            <p className="font-bold text-slate-700">{hours}</p>
          </div>
          <div className="bg-slate-50 rounded-lg px-2 py-2 text-center">
            <p className="text-slate-400">Week</p>
            <p className="font-bold text-slate-700">{Math.round(mins * 5 / 60)}h</p>
          </div>
        </div>

        {/* Days of week pills */}
        <div className="flex gap-1 flex-wrap">
          {[1, 2, 3, 4, 5, 6, 0].map((dow) => (
            <span
              key={dow}
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors",
                usedDays.has(dow)
                  ? `${c.dot} text-white`
                  : "bg-slate-100 text-slate-400"
              )}
            >
              {SHORT_DOW[dow]}
            </span>
          ))}
        </div>

        {/* Roster preview */}
        {assignedEmps.length > 0 && (
          <div>
            <button
              onClick={() => setShowRoster((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 font-medium"
            >
              <Users size={11} />
              {showRoster ? "Hide roster" : `View ${assignedEmps.length} assigned`}
              <ChevronRight size={10} className={cn("transition-transform", showRoster && "rotate-90")} />
            </button>
            {showRoster && (
              <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {assignedEmps.map((emp) => (
                  <div key={emp.id} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
                      {(emp.firstName ?? emp.name).charAt(0)}
                    </div>
                    <span className="text-xs text-slate-700 truncate">{emp.name}</span>
                    <span className="text-[10px] text-slate-400 ml-auto truncate">{emp.department}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions footer */}
      <div className="flex border-t border-slate-100">
        <button
          onClick={() => onEdit(shift)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <Pencil size={12} /> Edit
        </button>
        <div className="w-px bg-slate-100" />
        <button
          onClick={() => onDelete(shift.id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 size={12} /> Delete
        </button>
      </div>
    </div>
  );
}

// ─── ShiftModal ───────────────────────────────────────────────────────────────

function ShiftModal({ state, onClose, onSave }: {
  state: { mode: "add" | "edit"; data?: Shift };
  onClose: () => void;
  onSave: (shift: Shift) => void;
}) {
  const blank: Shift = { id: "", name: "", code: "", startTime: "08:00", endTime: "17:00", breakMinutes: 60, color: "blue" };
  const [form, setForm] = useState<Shift>(state.data ?? blank);
  const set = <K extends keyof Shift>(k: K, v: Shift[K]) => setForm((p) => ({ ...p, [k]: v }));
  const preview = calcWorkHours(form.startTime, form.endTime, form.breakMinutes);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              {state.mode === "add" ? "New Shift Template" : "Edit Shift Template"}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Define a reusable shift type</p>
          </div>
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
                value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Morning Shift"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Code</label>
              <input
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.code} maxLength={3}
                onChange={(e) => set("code", e.target.value.toUpperCase())} placeholder="MOR"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Start Time</label>
              <input type="time" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.startTime} onChange={(e) => set("startTime", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">End Time</label>
              <input type="time" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.endTime} onChange={(e) => set("endTime", e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Break (minutes)</label>
            <input type="number" min={0} max={240} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.breakMinutes} onChange={(e) => set("breakMinutes", Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Color</label>
            <div className="flex gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button key={c} onClick={() => set("color", c)}
                  className={cn("flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors", shiftColorMap[c].badge, form.color === c ? "ring-2 ring-offset-1 ring-blue-500 border-transparent" : "border-slate-200")}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          {/* Live preview */}
          <div className={cn("flex items-center gap-3 px-4 py-3 rounded-xl", shiftColorMap[form.color].bg)}>
            <span className={cn("w-3 h-3 rounded-full shrink-0", shiftColorMap[form.color].dot)} />
            <div>
              <p className="text-sm font-bold text-slate-900">{form.name || "Shift name"}</p>
              <p className="text-xs text-slate-500 font-mono">{form.startTime} – {form.endTime} · {preview} working</p>
            </div>
            <span className={cn("ml-auto text-xs font-bold px-2 py-0.5 rounded-full", shiftColorMap[form.color].badge)}>
              {form.code || "---"}
            </span>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
          <button
            onClick={() => {
              if (!form.name.trim() || !form.code.trim()) return;
              onSave({ ...form, id: form.id || `SH-${Date.now()}`, code: form.code.toUpperCase().slice(0, 3) });
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            {state.mode === "add" ? "Create Shift" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CellAssignModal ──────────────────────────────────────────────────────────

function CellAssignModal({
  employeeId, date, currentShiftId, isOverride, confirmStatus,
  shiftList, onClose, onSave, onRemoveOverride,
}: {
  employeeId: string; date: string; currentShiftId: string | null;
  isOverride: boolean; confirmStatus?: ConfirmStatus;
  shiftList: Shift[]; onClose: () => void;
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
            <p className="text-xs text-slate-500 mt-0.5">{emp?.name} · {fmtLong(date)}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={16} className="text-slate-500" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {isOverride && confirmStatus && (
            <div className={cn("flex items-center gap-2 p-3 rounded-xl text-sm",
              confirmStatus === "confirmed" ? "bg-emerald-50 text-emerald-700" : confirmStatus === "pending" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700")}>
              {confirmStatus === "confirmed" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
              Employee {confirmStatus} this assignment
            </div>
          )}
          {date > MAX_FUTURE && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 text-amber-700 text-sm">
              <AlertCircle size={14} />Exceeds 1-year planning horizon
            </div>
          )}
          <label className={cn("flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors", dayOff ? "border-red-300 bg-red-50" : "border-slate-200 hover:bg-slate-50")}>
            <input type="checkbox" checked={dayOff} onChange={(e) => { setDayOff(e.target.checked); if (e.target.checked) setSelectedId(null); }} className="w-4 h-4 rounded accent-red-500" />
            <span className="text-sm font-medium text-slate-700">Mark as Day Off</span>
          </label>
          {!dayOff && (
            <div className="space-y-2">
              {shiftList.map((s) => {
                const c = shiftColorMap[s.color];
                return (
                  <label key={s.id} className={cn("flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors",
                    selectedId === s.id ? `${c.bg} ${c.border} border` : "border-slate-200 hover:bg-slate-50")}>
                    <input type="radio" name="shiftPick" value={s.id} checked={selectedId === s.id}
                      onChange={() => { setSelectedId(s.id); setDayOff(false); }} className="sr-only" />
                    <span className={cn("w-3 h-3 rounded-full shrink-0", c.dot)} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">{s.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{s.startTime}–{s.endTime} · {calcWorkHours(s.startTime, s.endTime, s.breakMinutes)}</p>
                    </div>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", c.badge)}>{s.code}</span>
                  </label>
                );
              })}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Note (optional)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Reason for this assignment..." />
          </div>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
          <div>{isOverride && onRemoveOverride && (<button onClick={onRemoveOverride} className="text-xs text-red-500 hover:underline">Revert to recurring pattern</button>)}</div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
            <button onClick={() => onSave(dayOff ? null : selectedId, note)} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Save Assignment</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── RequestChangeModal ───────────────────────────────────────────────────────

function RequestChangeModal({
  employeeId, date, currentShiftId, shiftList, onClose, onSubmit,
}: {
  employeeId: string; date: string; currentShiftId: string;
  shiftList: Shift[]; onClose: () => void; onSubmit: (req: ChangeRequest) => void;
}) {
  const emp = allEmployees.find((e) => e.id === employeeId);
  const [requestedShiftId, setRequestedShiftId] = useState<string | null>(null);
  const [dayOff, setDayOff] = useState(false);
  const [reason, setReason] = useState("");
  const curShift = shiftList.find((s) => s.id === currentShiftId);
  const daysUntil = daysBetween(TODAY, date);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Request Shift Change</h3>
            <p className="text-xs text-slate-500 mt-0.5">{emp?.name} · {fmtLong(date)}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={16} className="text-slate-500" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {/* Urgency */}
          <div className={cn("flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium",
            daysUntil <= 2 ? "bg-red-50 text-red-700" : daysUntil <= 7 ? "bg-amber-50 text-amber-700" : "bg-slate-50 text-slate-600")}>
            <Timer size={12} />
            Shift is in {daysUntil} day{daysUntil !== 1 ? "s" : ""} — {daysUntil <= 2 ? "urgent" : daysUntil <= 7 ? "this week" : "advance notice"}
          </div>

          {curShift && (
            <div className={cn("flex items-center gap-2 p-3 rounded-xl text-sm", shiftColorMap[curShift.color].bg)}>
              <ArrowLeftRight size={14} className="shrink-0" />
              <span className="text-slate-600">Current: <span className="font-semibold text-slate-800">{curShift.name}</span> {curShift.startTime}–{curShift.endTime}</span>
            </div>
          )}

          <label className={cn("flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors", dayOff ? "border-red-300 bg-red-50" : "border-slate-200 hover:bg-slate-50")}>
            <input type="checkbox" checked={dayOff} onChange={(e) => { setDayOff(e.target.checked); if (e.target.checked) setRequestedShiftId(null); }} className="w-4 h-4 rounded accent-red-500" />
            <span className="text-sm font-medium text-slate-700">Request Day Off</span>
          </label>

          {!dayOff && (
            <div>
              <p className="text-xs font-medium text-slate-600 mb-2">Preferred shift (optional)</p>
              <div className="space-y-2">
                {shiftList.filter((s) => s.id !== currentShiftId).map((s) => {
                  const c = shiftColorMap[s.color];
                  return (
                    <label key={s.id} className={cn("flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors",
                      requestedShiftId === s.id ? `${c.bg} ${c.border} border` : "border-slate-200 hover:bg-slate-50")}>
                      <input type="radio" name="reqShift" value={s.id} checked={requestedShiftId === s.id} onChange={() => setRequestedShiftId(s.id)} className="sr-only" />
                      <span className={cn("w-3 h-3 rounded-full", c.dot)} />
                      <span className="text-sm font-medium text-slate-800 flex-1">{s.name}</span>
                      <span className="text-xs text-slate-400 font-mono">{s.startTime}–{s.endTime}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Reason <span className="text-red-400">*</span></label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Explain why you need this change..." />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
          <button disabled={!reason.trim()} onClick={() => onSubmit({ id: `CR-${Date.now()}`, employeeId, date, currentShiftId, requestedShiftId: dayOff ? null : requestedShiftId, reason, status: "pending", createdAt: new Date().toISOString() })}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            Submit Request
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── WeekCalendar ─────────────────────────────────────────────────────────────

function WeekCalendar({
  monday, branchEmployees, patterns, overrides, shiftList,
  empViewId, deptFilter, onCellClick, onConfirm, onRequestChange,
}: {
  monday: Date;
  branchEmployees: typeof allEmployees;
  patterns: EmployeeShift[];
  overrides: CalendarEntry[];
  shiftList: Shift[];
  empViewId: string | null;
  deptFilter: string;
  onCellClick: (empId: string, date: string, currentShiftId: string | null, isOverride: boolean, entry?: CalendarEntry) => void;
  onConfirm: (entryId: string) => void;
  onRequestChange: (empId: string, date: string, shiftId: string) => void;
}) {
  const dates = WEEK_DAYS_MON_SUN.map((_, i) => addDays(getMondayOf(monday), i));

  const visibleEmps = useMemo(() =>
    branchEmployees.filter((e) => !deptFilter || e.department === deptFilter),
    [branchEmployees, deptFilter]
  );

  // Per-day staffing count
  const dailyStaff = useMemo(() =>
    dates.map((d) => {
      const str = toStr(d);
      return visibleEmps.filter((emp) => {
        const { shiftId } = getEffectiveShift(str, emp.id, patterns, overrides);
        return !!shiftId;
      }).length;
    }),
    [dates, visibleEmps, patterns, overrides]
  );

  // Per-employee weekly hours
  const weeklyHours = useMemo(() =>
    visibleEmps.map((emp) => {
      let mins = 0;
      dates.forEach((d) => {
        const str = toStr(d);
        const { shiftId } = getEffectiveShift(str, emp.id, patterns, overrides);
        if (shiftId) {
          const s = shiftList.find((x) => x.id === shiftId);
          if (s) mins += calcWorkMinutes(s.startTime, s.endTime, s.breakMinutes);
        }
      });
      return Math.round(mins / 60);
    }),
    [visibleEmps, dates, patterns, overrides, shiftList]
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="sticky left-0 bg-slate-50 px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-44 border-r border-slate-100 z-10">
              Employee
            </th>
            {dates.map((d, i) => {
              const str = toStr(d);
              const isToday = str === TODAY;
              const isPast = str < TODAY;
              return (
                <th key={str} className={cn("px-2 py-3 text-center text-xs font-semibold min-w-[90px]",
                  isToday ? "bg-blue-50 text-blue-700" : isPast ? "text-slate-400" : "text-slate-600")}>
                  <p>{MON_SUN_LABELS[i]}</p>
                  <p className={cn("text-base font-bold mt-0.5", isToday ? "text-blue-700" : isPast ? "text-slate-300" : "text-slate-800")}>
                    {d.getDate()}
                  </p>
                  <p className="text-xs font-normal text-slate-400">
                    {d.toLocaleDateString("en-US", { month: "short" })}
                  </p>
                </th>
              );
            })}
            <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide min-w-[60px] border-l border-slate-100">
              hrs/wk
            </th>
          </tr>
        </thead>
        <tbody>
          {visibleEmps.map((emp, empIdx) => {
            const isEmpView = empViewId === emp.id;
            const isOtherEmp = !!empViewId && empViewId !== emp.id;
            return (
              <tr key={emp.id} className={cn("border-b border-slate-100 last:border-b-0",
                isEmpView ? "bg-blue-50/40" : isOtherEmp ? "opacity-30" : "hover:bg-slate-50/30")}>
                <td className={cn("sticky left-0 px-4 py-2 border-r border-slate-100 z-10", isEmpView ? "bg-blue-50" : "bg-white")}>
                  <div className="flex items-center gap-2">
                    <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white", isEmpView ? "bg-blue-600" : "bg-slate-300")}>
                      {(emp.firstName ?? emp.name).charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 text-xs leading-tight">{emp.name}</p>
                      <p className="text-slate-400 text-[10px]">{emp.department}</p>
                    </div>
                  </div>
                </td>

                {dates.map((d) => {
                  const dateStr = toStr(d);
                  const isPast = dateStr < TODAY;
                  const isFutureLocked = dateStr > MAX_FUTURE;
                  const { shiftId, override } = getEffectiveShift(dateStr, emp.id, patterns, overrides);
                  const shift = shiftId ? shiftList.find((s) => s.id === shiftId) : null;
                  const c = shift ? shiftColorMap[shift.color] : null;
                  const isOv = !!override;
                  const canAct = !isOtherEmp && !isPast && !isFutureLocked;

                  return (
                    <td key={dateStr} className={cn("px-1 py-1.5 text-center align-top", isPast && "bg-slate-50/60")}>
                      {shift && c ? (
                        <div className="flex flex-col gap-1 items-center">
                          <button
                            title={`${shift.name} ${shift.startTime}–${shift.endTime}`}
                            onClick={() => canAct && !empViewId && onCellClick(emp.id, dateStr, shiftId, isOv, override)}
                            className={cn("w-full px-1 py-1.5 rounded-lg text-xs font-semibold transition-colors relative group",
                              c.badge, !empViewId && canAct ? "hover:opacity-75 cursor-pointer" : "cursor-default",
                              isOv && "ring-2 ring-offset-1",
                              isOv && override?.confirmStatus === "confirmed" ? "ring-emerald-400" : isOv && override?.confirmStatus === "pending" ? "ring-amber-400" : isOv ? "ring-slate-300" : "")}>
                            {shift.code}
                            {isOv && (
                              <span className="absolute -top-1.5 -right-1.5">
                                {override?.confirmStatus === "confirmed" ? (
                                  <span className="w-3.5 h-3.5 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[8px]">✓</span>
                                ) : override?.confirmStatus === "pending" ? (
                                  <span className="w-3.5 h-3.5 bg-amber-400 rounded-full" />
                                ) : null}
                              </span>
                            )}
                            {/* Tooltip */}
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-20 pointer-events-none">
                              {shift.startTime}–{shift.endTime}
                            </span>
                          </button>
                          {isEmpView && isOv && override?.confirmStatus === "pending" && !isPast && (
                            <div className="flex gap-0.5 w-full">
                              <button onClick={() => onConfirm(override!.id)} title="Confirm"
                                className="flex-1 py-0.5 text-xs bg-emerald-500 text-white rounded font-bold hover:bg-emerald-600">✓</button>
                              <button onClick={() => onRequestChange(emp.id, dateStr, shiftId!)} title="Request change"
                                className="flex-1 py-0.5 text-xs bg-amber-100 text-amber-700 rounded font-bold hover:bg-amber-200">↕</button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => canAct && !empViewId && onCellClick(emp.id, dateStr, null, false)}
                          className={cn("w-full h-10 rounded-lg border-2 border-dashed transition-colors",
                            canAct && !empViewId ? "border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-300 hover:text-blue-400 cursor-pointer" : "border-transparent cursor-default")}>
                          {canAct && !empViewId && <Plus size={12} className="mx-auto" />}
                        </button>
                      )}
                    </td>
                  );
                })}

                {/* Hours/week column */}
                <td className="px-3 py-2 text-center border-l border-slate-100">
                  <span className={cn("text-xs font-bold px-2 py-1 rounded-full",
                    weeklyHours[empIdx] >= 40 ? "bg-emerald-100 text-emerald-700" :
                    weeklyHours[empIdx] >= 20 ? "bg-blue-100 text-blue-700" :
                    weeklyHours[empIdx] > 0 ? "bg-amber-100 text-amber-700" :
                    "text-slate-300")}>
                    {weeklyHours[empIdx] > 0 ? `${weeklyHours[empIdx]}h` : "—"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
        {/* Staffing count footer */}
        <tfoot>
          <tr className="bg-slate-50 border-t-2 border-slate-200">
            <td className="sticky left-0 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-500 border-r border-slate-100 z-10">
              Staff on shift
            </td>
            {dailyStaff.map((count, i) => {
              const date = toStr(dates[i]);
              const isPast = date < TODAY;
              return (
                <td key={i} className={cn("text-center py-2", isPast && "opacity-50")}>
                  <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full",
                    count >= MIN_STAFF ? "bg-emerald-100 text-emerald-700" :
                    count > 0 ? "bg-amber-100 text-amber-700" :
                    "bg-red-100 text-red-600")}>
                    {count}
                  </span>
                </td>
              );
            })}
            <td className="border-l border-slate-100" />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ─── MonthCalendar ────────────────────────────────────────────────────────────

function MonthCalendar({
  year, month, branchEmployees, patterns, overrides, shiftList, selectedDate, onDayClick,
}: {
  year: number; month: number;
  branchEmployees: typeof allEmployees;
  patterns: EmployeeShift[]; overrides: CalendarEntry[]; shiftList: Shift[];
  selectedDate: string | null; onDayClick: (date: string) => void;
}) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const gridStart = getMondayOf(firstDay);
  const lastDow = lastDay.getDay();
  const gridEnd = addDays(lastDay, lastDow === 0 ? 0 : 7 - lastDow);

  const allDates: Date[] = [];
  let cur = new Date(gridStart);
  while (cur <= gridEnd) { allDates.push(new Date(cur)); cur = addDays(cur, 1); }
  const weeks: Date[][] = [];
  for (let i = 0; i < allDates.length; i += 7) weeks.push(allDates.slice(i, i + 7));

  function getDayStats(dateStr: string) {
    const counts: Record<string, { count: number; color: ShiftColor; code: string }> = {};
    let scheduled = 0;
    for (const emp of branchEmployees) {
      const { shiftId } = getEffectiveShift(dateStr, emp.id, patterns, overrides);
      if (shiftId) {
        scheduled++;
        const s = shiftList.find((x) => x.id === shiftId);
        if (s) {
          if (!counts[s.id]) counts[s.id] = { count: 0, color: s.color, code: s.code };
          counts[s.id].count++;
        }
      }
    }
    return { stats: Object.values(counts), scheduled };
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Headers */}
      <div className="grid grid-cols-[40px_repeat(7,1fr)] border-b border-slate-100 bg-slate-50">
        <div className="py-2 text-center text-xs font-semibold text-slate-400">Wk</div>
        {MON_SUN_LABELS.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-slate-500">{d}</div>
        ))}
      </div>

      {weeks.map((week, wi) => {
        const weekNum = getISOWeek(week[0]);
        return (
          <div key={wi} className="grid grid-cols-[40px_repeat(7,1fr)] border-b border-slate-100 last:border-b-0">
            {/* Week number */}
            <div className="flex items-center justify-center text-xs font-bold text-slate-300 border-r border-slate-100 bg-slate-50">
              {weekNum}
            </div>
            {week.map((d) => {
              const str = toStr(d);
              const inMonth = d.getMonth() === month;
              const isToday = str === TODAY;
              const isPast = str < TODAY;
              const isSelected = str === selectedDate;
              const { stats, scheduled } = getDayStats(str);
              const staffingOk = scheduled >= MIN_STAFF;
              const hasAny = scheduled > 0;

              return (
                <button
                  key={str}
                  onClick={() => onDayClick(str)}
                  className={cn("min-h-[90px] p-2 text-left transition-colors border-r border-slate-50 last:border-r-0",
                    !inMonth && "bg-slate-50/60", isSelected && "bg-blue-50 ring-2 ring-inset ring-blue-400",
                    !isSelected && !isPast && inMonth && "hover:bg-slate-50", isPast && "cursor-default")}>
                  <div className="flex items-center justify-between mb-1">
                    <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold",
                      isToday ? "bg-blue-600 text-white" : !inMonth ? "text-slate-300" : isPast ? "text-slate-400" : "text-slate-800")}>
                      {d.getDate()}
                    </div>
                    {/* Staffing indicator dot */}
                    {inMonth && !isPast && (
                      <span className={cn("w-2 h-2 rounded-full shrink-0",
                        staffingOk ? "bg-emerald-400" : hasAny ? "bg-amber-400" : "bg-slate-200")} />
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {stats.slice(0, 2).map((s, i) => (
                      <div key={i} className={cn("text-xs px-1.5 py-0.5 rounded font-medium leading-tight", shiftColorMap[s.color].badge)}>
                        {s.count} · {s.code}
                      </div>
                    ))}
                    {stats.length > 2 && <div className="text-[10px] text-slate-400">+{stats.length - 2} more</div>}
                  </div>
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ─── RequestsTab ──────────────────────────────────────────────────────────────

function RequestsTab({
  requests, branchEmployees, shiftList, empViewId, onApprove, onReject,
}: {
  requests: ChangeRequest[];
  branchEmployees: typeof allEmployees;
  shiftList: Shift[];
  empViewId: string | null;
  onApprove: (id: string) => void;
  onReject: (id: string, note: string) => void;
}) {
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest" | "shift_date">("newest");
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  const counts = {
    pending:  requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  const approvedThisMonth = requests.filter((r) =>
    r.status === "approved" && r.resolvedAt && r.resolvedAt.startsWith("2026-07")
  ).length;

  const avgResponseDays = useMemo(() => {
    const resolved = requests.filter((r) => r.resolvedAt);
    if (!resolved.length) return null;
    const avg = resolved.reduce((acc, r) => acc + daysBetween(r.createdAt.slice(0, 10), r.resolvedAt!.slice(0, 10)), 0) / resolved.length;
    return Math.round(avg * 10) / 10;
  }, [requests]);

  const filtered = useMemo(() => {
    let list = requests.filter((r) => filter === "all" || r.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) => {
        const emp = branchEmployees.find((e) => e.id === r.employeeId);
        return emp?.name.toLowerCase().includes(q) || r.id.toLowerCase().includes(q);
      });
    }
    list = [...list].sort((a, b) => {
      if (sort === "newest") return b.createdAt.localeCompare(a.createdAt);
      if (sort === "oldest") return a.createdAt.localeCompare(b.createdAt);
      return a.date.localeCompare(b.date);
    });
    return list;
  }, [requests, filter, search, sort, branchEmployees]);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Pending Review" value={counts.pending} icon={AlertCircle} color="amber" sub="Awaiting decision" />
        <KpiCard label="Approved This Month" value={approvedThisMonth} icon={CheckCircle2} color="emerald" sub="July 2026" />
        <KpiCard label="Rejected" value={counts.rejected} icon={XCircle} color="violet" sub="All time" />
        <KpiCard label="Avg Response Time" value={avgResponseDays !== null ? `${avgResponseDays}d` : "—"} icon={Timer} color="blue" sub="Days to resolve" />
      </div>

      {/* Search + sort */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by employee name or ID…"
            className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="shift_date">By shift date</option>
        </select>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {(["pending", "approved", "rejected", "all"] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors border",
              filter === s ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50")}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
            {s !== "all" && <span className="ml-1.5 text-xs opacity-70">({counts[s as keyof typeof counts]})</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
          {search ? `No results for "${search}"` : `No ${filter === "all" ? "" : filter} requests`}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => {
            const emp = branchEmployees.find((e) => e.id === req.employeeId);
            const curShift = shiftList.find((s) => s.id === req.currentShiftId);
            const reqShift = req.requestedShiftId ? shiftList.find((s) => s.id === req.requestedShiftId) : null;
            const resolver = req.resolvedBy ? allEmployees.find((e) => e.id === req.resolvedBy) : null;
            const isMyReq = empViewId === req.employeeId;
            const daysUntilShift = daysBetween(TODAY, req.date);
            const isUrgent = req.status === "pending" && daysUntilShift <= 3;

            return (
              <div key={req.id} className={cn("bg-white rounded-xl border p-5",
                req.status === "pending" ? "border-amber-200" : req.status === "approved" ? "border-emerald-200" : "border-slate-200",
                isUrgent && "ring-2 ring-red-300")}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold shrink-0">
                      {(emp?.firstName ?? emp?.name ?? "?").charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      {/* Header row */}
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-semibold text-slate-900">{emp?.name}</p>
                        <span className="text-xs bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full font-mono">{req.id}</span>
                        <span className="text-xs bg-slate-50 text-slate-500 px-2 py-0.5 rounded-full">{emp?.department}</span>
                        {isMyReq && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">My request</span>}
                        {isUrgent && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">Urgent</span>}
                      </div>

                      {/* Date + urgency */}
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-xs text-slate-500">{fmtLong(req.date)}</p>
                        <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                          daysUntilShift <= 2 ? "bg-red-100 text-red-600" : daysUntilShift <= 7 ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500")}>
                          {daysUntilShift > 0 ? `in ${daysUntilShift}d` : daysUntilShift === 0 ? "today" : `${Math.abs(daysUntilShift)}d ago`}
                        </span>
                      </div>

                      {/* Shift arrow */}
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        {curShift && <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", shiftColorMap[curShift.color].badge)}>{curShift.name}</span>}
                        <ArrowLeftRight size={12} className="text-slate-400 shrink-0" />
                        {req.requestedShiftId === null ? (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Day Off</span>
                        ) : reqShift ? (
                          <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", shiftColorMap[reqShift.color].badge)}>{reqShift.name}</span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No preference</span>
                        )}
                      </div>

                      {/* Reason */}
                      <p className="text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2 italic">&ldquo;{req.reason}&rdquo;</p>

                      {/* Manager note */}
                      {req.managerNote && (
                        <div className={cn("mt-2 px-3 py-2 rounded-lg text-xs", req.status === "approved" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>
                          <span className="font-semibold">Manager note: </span>{req.managerNote}
                        </div>
                      )}

                      {/* Timeline */}
                      <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
                        <CalendarCheck size={10} />
                        Submitted {fmtShort(req.createdAt.slice(0, 10))}
                        {req.resolvedAt && (
                          <>
                            <span className="text-slate-200">›</span>
                            {req.status === "approved" ? <CheckCircle2 size={10} className="text-emerald-500" /> : <XCircle size={10} className="text-red-400" />}
                            Resolved {fmtShort(req.resolvedAt.slice(0, 10))}
                            {resolver && <span>by {resolver.name}</span>}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col items-end gap-2">
                    <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full",
                      req.status === "pending" ? "bg-amber-100 text-amber-700" : req.status === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700")}>
                      {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                    </span>
                    {req.status === "pending" && !empViewId && (
                      <div className="flex gap-2">
                        <button onClick={() => { setRejectId(req.id); setRejectNote(""); }}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50">
                          <XCircle size={11} /> Reject
                        </button>
                        <button onClick={() => onApprove(req.id)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                          <CheckCircle2 size={11} /> Approve
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject modal */}
      {rejectId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-semibold text-slate-900">Reject Request</h3>
            <textarea value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} rows={3}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
              placeholder="Reason for rejection (optional)..." />
            <div className="flex justify-end gap-3">
              <button onClick={() => setRejectId(null)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
              <button onClick={() => { onReject(rejectId, rejectNote); setRejectId(null); }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">Confirm Reject</button>
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

  const [tab, setTab] = useState<MainTab>("calendar");
  const [shiftList, setShiftList] = useState<Shift[]>([...initialShifts]);
  const [patterns, setPatterns] = useState<EmployeeShift[]>([...initialAssignments]);
  const [overrides, setOverrides] = useState<CalendarEntry[]>(initialOverrides);
  const [requests, setRequests] = useState<ChangeRequest[]>(initialRequests);
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [monday, setMonday] = useState<Date>(() => getMondayOf(parseDate(TODAY)));
  const [calMonth, setCalMonth] = useState(() => { const d = parseDate(TODAY); return { year: d.getFullYear(), month: d.getMonth() }; });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [deptFilter, setDeptFilter] = useState("");
  const [shiftModal, setShiftModal] = useState<{ mode: "add" | "edit"; data?: Shift } | null>(null);
  const [cellModal, setCellModal] = useState<{ empId: string; date: string; currentShiftId: string | null; isOverride: boolean; entry?: CalendarEntry } | null>(null);
  const [reqChangeModal, setReqChangeModal] = useState<{ empId: string; date: string; currentShiftId: string } | null>(null);
  const [empViewId, setEmpViewId] = useState<string | null>(null);

  const branchEmps = useMemo(() => allEmployees.filter((e) => e.branchId === activeBranch.id), [activeBranch.id]);
  const branchPatterns = useMemo(() => patterns.filter((p) => p.branchId === activeBranch.id), [patterns, activeBranch.id]);
  const departments = useMemo(() => Array.from(new Set(branchEmps.map((e) => e.department))).sort(), [branchEmps]);

  const pendingConfirmations = overrides.filter((o) => o.branchId === activeBranch.id && o.confirmStatus === "pending").length;
  const pendingRequests = requests.filter((r) => r.status === "pending").length;

  // Shift → employees mapping for template tab
  const shiftEmpMap = useMemo(() => {
    const map: Record<string, typeof allEmployees> = {};
    shiftList.forEach((s) => {
      map[s.id] = branchEmps.filter((emp) =>
        branchPatterns.some((p) => p.employeeId === emp.id && p.shiftId === s.id)
      );
    });
    return map;
  }, [shiftList, branchEmps, branchPatterns]);

  const prevWeek = () => setMonday((d) => addDays(d, -7));
  const nextWeek = () => setMonday((d) => addDays(d, 7));
  const prevMonth = () => setCalMonth((m) => { const d = new Date(m.year, m.month - 1, 1); return { year: d.getFullYear(), month: d.getMonth() }; });
  const nextMonth = () => setCalMonth((m) => { const d = new Date(m.year, m.month + 1, 1); return { year: d.getFullYear(), month: d.getMonth() }; });
  const goToday = () => { const d = parseDate(TODAY); setMonday(getMondayOf(d)); setCalMonth({ year: d.getFullYear(), month: d.getMonth() }); };

  const handleSaveShift = (shift: Shift) => {
    setShiftList((prev) => {
      const idx = prev.findIndex((s) => s.id === shift.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = shift; return n; }
      return [...prev, shift];
    });
    setShiftModal(null);
  };

  const handleDeleteShift = (id: string) => {
    setShiftList((prev) => prev.filter((s) => s.id !== id));
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
      const idx = prev.findIndex((o) => o.id === entry.id || (o.date === entry.date && o.employeeId === entry.employeeId));
      if (idx >= 0) { const n = [...prev]; n[idx] = entry; return n; }
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
    setOverrides((prev) => prev.map((o) => o.id === entryId ? { ...o, confirmStatus: "confirmed" } : o));
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
      const idx = prev.findIndex((o) => o.date === req.date && o.employeeId === req.employeeId);
      if (idx >= 0) { const n = [...prev]; n[idx] = entry; return n; }
      return [...prev, entry];
    });
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: "approved" as const, resolvedBy: "EMP-004", resolvedAt: new Date().toISOString() } : r));
  };

  const handleRejectRequest = (id: string, note: string) => {
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: "rejected" as const, resolvedBy: "EMP-004", resolvedAt: new Date().toISOString(), managerNote: note || "Request rejected" } : r));
  };

  // Summary stats for templates tab
  const totalScheduledEmps = new Set(branchPatterns.map((p) => p.employeeId)).size;
  const avgShiftHours = shiftList.length ? Math.round(shiftList.reduce((acc, s) => acc + calcWorkMinutes(s.startTime, s.endTime, s.breakMinutes), 0) / shiftList.length / 60 * 10) / 10 : 0;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header
        title="Shift Management"
        subtitle="Configure shifts, plan schedules up to 1 year ahead, and manage change requests"
        actions={
          <div className="flex items-center gap-2">
            {pendingRequests > 0 && (
              <button onClick={() => setTab("requests")}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100">
                <Bell size={14} />{pendingRequests} Request{pendingRequests !== 1 ? "s" : ""}
              </button>
            )}
            <button onClick={() => setShiftModal({ mode: "add" })}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
              <Plus size={15} /> New Shift
            </button>
          </div>
        }
      />

      <main className="flex-1 p-6">
        {/* Main tabs */}
        <div className="flex items-center gap-1 mb-6 bg-white border border-slate-200 rounded-xl p-1 w-fit">
          {([
            { id: "templates" as MainTab, label: "Shift Templates", icon: <Clock size={14} /> },
            { id: "calendar" as MainTab, label: "Schedule Calendar", icon: <CalendarDays size={14} />, badge: pendingConfirmations },
            { id: "requests" as MainTab, label: "Change Requests", icon: <ArrowLeftRight size={14} />, badge: pendingRequests },
          ] as { id: MainTab; label: string; icon: React.ReactNode; badge?: number }[]).map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn("flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors relative",
                tab === t.id ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100")}>
              {t.icon}{t.label}
              {t.badge && t.badge > 0 ? (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">{t.badge}</span>
              ) : null}
            </button>
          ))}
        </div>

        {/* ── TEMPLATES TAB ── */}
        {tab === "templates" && (
          <div className="space-y-5">
            {/* Summary KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard label="Shift Templates" value={shiftList.length} icon={Clock} color="blue" sub="Active shift types" />
              <KpiCard label="Employees Scheduled" value={totalScheduledEmps} icon={Users} color="emerald" sub="On recurring patterns" />
              <KpiCard label="Avg Working Hours" value={`${avgShiftHours}h`} icon={Timer} color="violet" sub="Per shift per day" />
              <KpiCard label="Pending Overrides" value={pendingConfirmations} icon={AlertCircle} color="amber" sub="Awaiting employee confirm" />
            </div>

            {/* Cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {shiftList.map((s) => (
                <ShiftCard key={s.id} shift={s}
                  assignedEmps={shiftEmpMap[s.id] ?? []}
                  patterns={branchPatterns}
                  onEdit={(sh) => setShiftModal({ mode: "edit", data: sh })}
                  onDelete={handleDeleteShift}
                />
              ))}
              <button onClick={() => setShiftModal({ mode: "add" })}
                className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-xl p-5 text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors min-h-[200px]">
                <Plus size={22} />
                <span className="text-sm font-medium">New Shift Template</span>
              </button>
            </div>

            {/* Shift coverage table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Recurring Schedule Overview</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Which employees are on which shifts, by day of week</p>
                </div>
                <Hash size={14} className="text-slate-300" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-4 py-2.5 font-semibold text-slate-500 w-40">Employee</th>
                      {shiftList.map((s) => (
                        <th key={s.id} className="text-center px-2 py-2.5 font-semibold text-slate-500 min-w-[80px]">
                          <span className={cn("px-2 py-0.5 rounded-full", shiftColorMap[s.color].badge)}>{s.code}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {branchEmps.map((emp) => {
                      const empPattern = branchPatterns.filter((p) => p.employeeId === emp.id);
                      return (
                        <tr key={emp.id} className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/50">
                          <td className="px-4 py-2.5 font-medium text-slate-800">{emp.name}</td>
                          {shiftList.map((s) => {
                            const p = empPattern.find((x) => x.shiftId === s.id);
                            const c = shiftColorMap[s.color];
                            return (
                              <td key={s.id} className="text-center px-2 py-2.5">
                                {p ? (
                                  <div className="flex gap-0.5 justify-center">
                                    {[1,2,3,4,5,6,0].map((dow) => (
                                      <span key={dow} className={cn("w-4 h-4 rounded-sm text-[8px] font-bold flex items-center justify-center",
                                        p.daysOfWeek.includes(dow) ? `${c.dot} text-white` : "bg-slate-100 text-transparent")}>
                                        {SHORT_DOW[dow][0]}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-slate-200">—</span>
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
            </div>
          </div>
        )}

        {/* ── CALENDAR TAB ── */}
        {tab === "calendar" && (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* View toggle */}
              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
                <button onClick={() => setViewMode("week")} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  viewMode === "week" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100")}>
                  <Rows3 size={14} /> Week
                </button>
                <button onClick={() => setViewMode("month")} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  viewMode === "month" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100")}>
                  <LayoutGrid size={14} /> Month
                </button>
              </div>

              {/* Nav */}
              <div className="flex items-center bg-white border border-slate-200 rounded-lg">
                <button onClick={viewMode === "week" ? prevWeek : prevMonth} className="p-2 hover:bg-slate-100 rounded-l-lg transition-colors">
                  <ChevronLeft size={16} className="text-slate-600" />
                </button>
                <span className="px-4 py-2 text-sm font-semibold text-slate-800 min-w-[200px] text-center">
                  {viewMode === "week" ? fmtWeekRange(monday) : fmtMonthYear(new Date(calMonth.year, calMonth.month, 1))}
                </span>
                <button onClick={viewMode === "week" ? nextWeek : nextMonth} className="p-2 hover:bg-slate-100 rounded-r-lg transition-colors">
                  <ChevronRight size={16} className="text-slate-600" />
                </button>
              </div>

              <button onClick={goToday} className="px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
                Today
              </button>

              {/* Dept filter (week view) */}
              {viewMode === "week" && (
                <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}
                  className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">All departments</option>
                  {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              )}

              {/* Role toggle */}
              <div className="ml-auto flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
                <Shield size={14} className={empViewId ? "text-slate-300" : "text-blue-600"} />
                <span className="text-xs text-slate-500">View as:</span>
                <select value={empViewId ?? ""} onChange={(e) => setEmpViewId(e.target.value || null)}
                  className="text-xs font-medium text-slate-700 bg-transparent focus:outline-none cursor-pointer">
                  <option value="">Manager</option>
                  {branchEmps.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
                {empViewId && <UserCheck size={14} className="text-emerald-600" />}
              </div>
            </div>

            {/* Pending banner */}
            {pendingConfirmations > 0 && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                <AlertCircle size={14} className="shrink-0" />
                <span>
                  <span className="font-semibold">{pendingConfirmations}</span> assignment{pendingConfirmations !== 1 ? "s" : ""} pending employee confirmation
                  {empViewId && <span className="ml-2 text-xs bg-amber-200 px-2 py-0.5 rounded-full">Use ✓ / ↕ buttons on amber-ringed shifts to confirm or request a change</span>}
                </span>
              </div>
            )}

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-emerald-400 ring-offset-1" />Confirmed override</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-300 ring-2 ring-amber-400 ring-offset-1" />Pending confirmation</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-400" />Recurring pattern</span>
              {viewMode === "month" && <>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" />Staffed ≥{MIN_STAFF}</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" />Understaffed</span>
              </>}
              <span className="text-slate-400 italic">Click any empty cell to assign · Plan up to {new Date(MAX_FUTURE).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
            </div>

            {viewMode === "week" && (
              <WeekCalendar
                monday={monday}
                branchEmployees={branchEmps}
                patterns={branchPatterns}
                overrides={overrides}
                shiftList={shiftList}
                empViewId={empViewId}
                deptFilter={deptFilter}
                onCellClick={(empId, date, currentShiftId, isOv, entry) => {
                  if (empViewId) return;
                  setCellModal({ empId, date, currentShiftId, isOverride: isOv, entry });
                }}
                onConfirm={handleConfirm}
                onRequestChange={(empId, date, shiftId) => setReqChangeModal({ empId, date, currentShiftId: shiftId })}
              />
            )}

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
                  onDayClick={(d) => setSelectedDate((prev) => (prev === d ? null : d))}
                />

                {selectedDate && (() => {
                  const dayEmps = branchEmps.map((emp) => {
                    const { shiftId, override } = getEffectiveShift(selectedDate, emp.id, branchPatterns, overrides);
                    const shift = shiftId ? shiftList.find((s) => s.id === shiftId) : null;
                    return { emp, shift, shiftId, override };
                  }).filter((x) => x.shift || x.override);

                  // Hours breakdown per shift for this day
                  const shiftBreakdown: Record<string, { shift: Shift; count: number; emps: string[] }> = {};
                  dayEmps.forEach(({ shift, emp }) => {
                    if (!shift) return;
                    if (!shiftBreakdown[shift.id]) shiftBreakdown[shift.id] = { shift, count: 0, emps: [] };
                    shiftBreakdown[shift.id].count++;
                    shiftBreakdown[shift.id].emps.push(emp.name);
                  });

                  const isUnderstaffed = dayEmps.length < MIN_STAFF && selectedDate >= TODAY;

                  return (
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-slate-900">{fmtLong(selectedDate)}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-slate-500">{dayEmps.length} employee{dayEmps.length !== 1 ? "s" : ""} scheduled</p>
                            {isUnderstaffed && (
                              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                <AlertCircle size={10} />Understaffed
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!empViewId && selectedDate >= TODAY && (
                            <button
                              onClick={() => {
                                const unscheduled = branchEmps.find((e) => !dayEmps.some((de) => de.emp.id === e.id));
                                if (unscheduled) setCellModal({ empId: unscheduled.id, date: selectedDate, currentShiftId: null, isOverride: false });
                              }}
                              className="flex items-center gap-1 text-xs text-blue-600 border border-blue-200 rounded-lg px-2.5 py-1.5 hover:bg-blue-50">
                              <Plus size={11} /> Assign Employee
                            </button>
                          )}
                          <button onClick={() => setSelectedDate(null)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                            <X size={14} className="text-slate-400" />
                          </button>
                        </div>
                      </div>

                      {/* Shift breakdown chart */}
                      {Object.keys(shiftBreakdown).length > 0 && (
                        <div className="mb-4 space-y-1.5">
                          {Object.values(shiftBreakdown).map(({ shift, count, emps }) => {
                            const c = shiftColorMap[shift.color];
                            const pct = Math.round((count / (branchEmps.length || 1)) * 100);
                            return (
                              <div key={shift.id}>
                                <div className="flex items-center justify-between text-xs mb-0.5">
                                  <span className={cn("font-medium px-2 py-0.5 rounded-full", c.badge)}>{shift.name} · {shift.startTime}–{shift.endTime}</span>
                                  <span className="text-slate-500">{count} staff</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div className={cn("h-full rounded-full transition-all", c.dot)} style={{ width: `${pct}%` }} />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-0.5 truncate">{emps.join(", ")}</p>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {dayEmps.length === 0 ? (
                        <p className="text-slate-400 text-sm text-center py-6">No employees scheduled for this day</p>
                      ) : (
                        <div className="space-y-2">
                          {dayEmps.map(({ emp, shift, shiftId, override }) => {
                            const c = shift ? shiftColorMap[shift.color] : null;
                            return (
                              <div key={emp.id} className={cn("flex items-center gap-3 p-3 rounded-xl border",
                                override?.confirmStatus === "pending" ? "border-amber-200 bg-amber-50/40" :
                                override?.confirmStatus === "confirmed" ? "border-emerald-200 bg-emerald-50/30" : "border-slate-100")}>
                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0">
                                  {(emp.firstName ?? emp.name).charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-slate-800 text-sm truncate">{emp.name}</p>
                                  <p className="text-xs text-slate-400">{emp.department}</p>
                                </div>
                                {shift && c && (
                                  <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full shrink-0", c.badge)}>
                                    {shift.code} · {shift.startTime}–{shift.endTime}
                                  </span>
                                )}
                                {override?.confirmStatus && (
                                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium shrink-0",
                                    override.confirmStatus === "confirmed" ? "bg-emerald-100 text-emerald-700" :
                                    override.confirmStatus === "pending" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700")}>
                                    {override.confirmStatus}
                                  </span>
                                )}
                                {!empViewId && selectedDate >= TODAY && (
                                  <button onClick={() => setCellModal({ empId: emp.id, date: selectedDate, currentShiftId: shiftId ?? null, isOverride: !!override, entry: override })}
                                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 shrink-0">
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

      {shiftModal && <ShiftModal state={shiftModal} onClose={() => setShiftModal(null)} onSave={handleSaveShift} />}
      {cellModal && (
        <CellAssignModal
          employeeId={cellModal.empId} date={cellModal.date}
          currentShiftId={cellModal.currentShiftId} isOverride={cellModal.isOverride}
          confirmStatus={cellModal.entry?.confirmStatus} shiftList={shiftList}
          onClose={() => setCellModal(null)} onSave={handleCellSave}
          onRemoveOverride={cellModal.isOverride ? handleRemoveOverride : undefined}
        />
      )}
      {reqChangeModal && (
        <RequestChangeModal
          employeeId={reqChangeModal.empId} date={reqChangeModal.date}
          currentShiftId={reqChangeModal.currentShiftId} shiftList={shiftList}
          onClose={() => setReqChangeModal(null)}
          onSubmit={(req) => { setRequests((prev) => [req, ...prev]); setReqChangeModal(null); }}
        />
      )}
    </div>
  );
}
