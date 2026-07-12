"use client";

import { useState, useMemo, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { useBranch } from "@/context/BranchContext";
import { Employee as MockEmployee } from "@/lib/mock-data";
type Employee = MockEmployee;
import { cn } from "@/lib/utils";
import { usePermissions } from "@/lib/use-permissions";
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
  ClipboardList,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Send,
  Loader2,
  MapPin,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ShiftTodo {
  id: string;
  shiftId: string;
  name: string;
  sequence: number;
  expectedMinutes: number;
  photoRequired: boolean;
}

type ShiftColor = "blue" | "amber" | "violet" | "emerald";
type ViewMode = "week" | "month";
type MainTab = "templates" | "calendar" | "requests";
type ConfirmStatus = "draft" | "pending" | "confirmed" | "rejected";

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

// ─── Constants ────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().slice(0, 10);
const MAX_FUTURE = (() => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return d.toISOString().slice(0, 10); })();
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

// ─── TodoModal ────────────────────────────────────────────────────────────────

function TodoModal({
  shiftId,
  initial,
  onClose,
  onSave,
}: {
  shiftId: string;
  initial?: ShiftTodo;
  onClose: () => void;
  onSave: (todo: ShiftTodo) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [hours, setHours] = useState(Math.floor((initial?.expectedMinutes ?? 30) / 60));
  const [mins, setMins] = useState((initial?.expectedMinutes ?? 30) % 60);
  const [photoRequired, setPhotoRequired] = useState(initial?.photoRequired !== false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const totalMinutes = hours * 60 + mins;

  async function handleSave() {
    if (!name.trim()) { setError("Name is required."); return; }
    setSaving(true); setError("");
    try {
      const url = initial
        ? `/api/hr/shifts/todos/${initial.id}`
        : `/api/hr/shifts/${shiftId}/todos`;
      const res = await fetch(url, {
        method: initial ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), expectedMinutes: totalMinutes, photoRequired }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to save."); return; }
      onSave(data);
    } catch {
      setError("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">
            {initial ? "Edit To-do" : "Add To-do"}
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg">
            <X size={15} className="text-slate-500" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Task Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Clean workstation"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Expected Time (HH : MM)</label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <input
                  type="number" min={0} max={23} value={hours}
                  onChange={(e) => setHours(Math.max(0, Math.min(23, Number(e.target.value))))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                />
                <p className="text-center text-[10px] text-slate-400 mt-0.5">hours</p>
              </div>
              <span className="text-slate-400 font-bold text-lg">:</span>
              <div className="flex-1">
                <input
                  type="number" min={0} max={59} step={5} value={mins}
                  onChange={(e) => setMins(Math.max(0, Math.min(59, Number(e.target.value))))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                />
                <p className="text-center text-[10px] text-slate-400 mt-0.5">minutes</p>
              </div>
            </div>
            {totalMinutes > 0 && (
              <p className="text-xs text-slate-400 mt-1">
                ≈ {hours > 0 ? `${hours}h ` : ""}{mins > 0 ? `${mins}m` : ""}
              </p>
            )}
          </div>

          {/* Photo required toggle */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Completion Proof</label>
            <button
              type="button"
              onClick={() => setPhotoRequired((v) => !v)}
              className={cn(
                "flex items-center gap-3 w-full px-4 py-3 rounded-xl border text-sm font-medium transition-all",
                photoRequired
                  ? "border-blue-300 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-500"
              )}
            >
              <div className={cn(
                "w-4 h-4 rounded border-2 flex items-center justify-center shrink-0",
                photoRequired ? "bg-blue-600 border-blue-600" : "border-slate-300"
              )}>
                {photoRequired && <CheckCircle2 size={10} className="text-white" />}
              </div>
              Photo required to mark as complete
            </button>
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
        </div>
        <div className="flex gap-3 px-5 py-4 border-t border-slate-100">
          <button onClick={onClose} disabled={saving} className="flex-1 px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="flex-1 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40"
          >
            {saving ? "Saving…" : initial ? "Save Changes" : "Add To-do"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ShiftCard (Templates) ────────────────────────────────────────────────────

function ShiftCard({
  shift, assignedEmps, patterns, todos, onEdit, onDelete, onTodoChange,
}: {
  shift: Shift;
  assignedEmps: Employee[];
  patterns: EmployeeShift[];
  todos: ShiftTodo[];
  onEdit: (s: Shift) => void;
  onDelete: (id: string) => void;
  onTodoChange: (shiftId: string, todos: ShiftTodo[]) => void;
}) {
  const [showRoster, setShowRoster] = useState(false);
  const [showTodos, setShowTodos] = useState(false);
  const [todoModal, setTodoModal] = useState<{ open: true; editing?: ShiftTodo } | null>(null);
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

        {/* To-do list section */}
        <div className="border-t border-slate-100 pt-3 mt-1">
          <button
            onClick={() => setShowTodos((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 font-medium w-full"
          >
            <ClipboardList size={11} />
            <span className="flex-1 text-left">
              To-do List{todos.length > 0 ? ` (${todos.length})` : ""}
            </span>
            {showTodos ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          </button>

          {showTodos && (
            <div className="mt-2 space-y-1">
              {todos.length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-1">No to-dos yet.</p>
              )}
              {todos.map((todo, idx) => (
                <div key={todo.id} className="flex items-center gap-1.5 group">
                  <span className="text-[10px] text-slate-300 font-mono w-4 text-right shrink-0">{todo.sequence}</span>
                  <span className="flex-1 text-xs text-slate-700 truncate">{todo.name}</span>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {todo.expectedMinutes < 60
                      ? `${todo.expectedMinutes}m`
                      : `${Math.floor(todo.expectedMinutes / 60)}h${todo.expectedMinutes % 60 ? ` ${todo.expectedMinutes % 60}m` : ""}`}
                  </span>
                  {todo.photoRequired && (
                    <span title="Photo required" className="text-[9px] bg-blue-100 text-blue-600 px-1 py-0.5 rounded shrink-0">📷</span>
                  )}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={async () => {
                        if (idx === 0) return;
                        const prev = todos[idx - 1];
                        await Promise.all([
                          fetch(`/api/hr/shifts/todos/${todo.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sequence: prev.sequence }) }),
                          fetch(`/api/hr/shifts/todos/${prev.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sequence: todo.sequence }) }),
                        ]);
                        const next = [...todos];
                        next[idx] = { ...todo, sequence: prev.sequence };
                        next[idx - 1] = { ...prev, sequence: todo.sequence };
                        onTodoChange(shift.id, next.sort((a, b) => a.sequence - b.sequence));
                      }}
                      disabled={idx === 0}
                      className="p-0.5 rounded hover:bg-slate-100 text-slate-400 disabled:opacity-20"
                      title="Move up"
                    >
                      <ChevronUp size={9} />
                    </button>
                    <button
                      onClick={async () => {
                        if (idx === todos.length - 1) return;
                        const next_ = todos[idx + 1];
                        await Promise.all([
                          fetch(`/api/hr/shifts/todos/${todo.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sequence: next_.sequence }) }),
                          fetch(`/api/hr/shifts/todos/${next_.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sequence: todo.sequence }) }),
                        ]);
                        const nextArr = [...todos];
                        nextArr[idx] = { ...todo, sequence: next_.sequence };
                        nextArr[idx + 1] = { ...next_, sequence: todo.sequence };
                        onTodoChange(shift.id, nextArr.sort((a, b) => a.sequence - b.sequence));
                      }}
                      disabled={idx === todos.length - 1}
                      className="p-0.5 rounded hover:bg-slate-100 text-slate-400 disabled:opacity-20"
                      title="Move down"
                    >
                      <ChevronDown size={9} />
                    </button>
                    <button
                      onClick={() => setTodoModal({ open: true, editing: todo })}
                      className="p-0.5 rounded hover:bg-slate-100 text-slate-400"
                      title="Edit"
                    >
                      <Pencil size={9} />
                    </button>
                    <button
                      onClick={async () => {
                        await fetch(`/api/hr/shifts/todos/${todo.id}`, { method: "DELETE" });
                        onTodoChange(shift.id, todos.filter((t) => t.id !== todo.id));
                      }}
                      className="p-0.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500"
                      title="Delete"
                    >
                      <Trash2 size={9} />
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={() => setTodoModal({ open: true })}
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium mt-1 w-full"
              >
                <Plus size={11} /> Add to-do
              </button>
            </div>
          )}
        </div>
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

      {todoModal && (
        <TodoModal
          shiftId={shift.id}
          initial={todoModal.editing}
          onClose={() => setTodoModal(null)}
          onSave={(saved) => {
            const updated = todoModal.editing
              ? todos.map((t) => (t.id === saved.id ? saved : t))
              : [...todos, saved].sort((a, b) => a.sequence - b.sequence);
            onTodoChange(shift.id, updated);
            setTodoModal(null);
          }}
        />
      )}
    </div>
  );
}

// ─── ShiftModal ───────────────────────────────────────────────────────────────

function ShiftModal({ state, onClose, onSave }: {
  state: { mode: "add" | "edit"; data?: Shift };
  onClose: () => void;
  onSave: (shift: Shift) => Promise<string | null>;
}) {
  const blank: Shift = { id: "", name: "", code: "", startTime: "08:00", endTime: "17:00", breakMinutes: 60, color: "blue" };
  const [form, setForm] = useState<Shift>(state.data ?? blank);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = <K extends keyof Shift>(k: K, v: Shift[K]) => setForm((p) => ({ ...p, [k]: v }));
  const preview = calcWorkHours(form.startTime, form.endTime, form.breakMinutes);

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.code.trim()) { setError("Name and code are required."); return; }
    setSaving(true); setError("");
    const err = await onSave({ ...form, id: form.id || "", code: form.code.toUpperCase().slice(0, 3) });
    setSaving(false);
    if (err) setError(err);
  };

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
        {error && (
          <div className="mx-6 mb-2 px-3 py-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} disabled={saving} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2"
          >
            {saving && <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>}
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
  shiftList, employees, onClose, onSave, onRemoveOverride,
}: {
  employeeId: string; date: string; currentShiftId: string | null;
  isOverride: boolean; confirmStatus?: ConfirmStatus;
  shiftList: Shift[]; employees: Employee[]; onClose: () => void;
  onSave: (shiftId: string | null, note: string) => void;
  onRemoveOverride?: () => void;
}) {
  const emp = employees.find((e) => e.id === employeeId);
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
            <div className={cn("flex items-start gap-2 p-3 rounded-xl text-sm",
              confirmStatus === "confirmed" ? "bg-emerald-50 text-emerald-700" : confirmStatus === "pending" ? "bg-amber-50 text-amber-700" : "bg-slate-50 text-slate-600")}>
              {confirmStatus === "confirmed" ? <CheckCircle2 size={14} className="mt-0.5 shrink-0" /> : <AlertCircle size={14} className="mt-0.5 shrink-0" />}
              <span>
                {confirmStatus === "confirmed"
                  ? "Employee confirmed this shift. Saving changes will reset their confirmation to pending."
                  : confirmStatus === "pending"
                  ? "Awaiting employee confirmation."
                  : "Draft — not yet sent to employee."}
              </span>
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
          <div>{isOverride && onRemoveOverride && (<button onClick={onRemoveOverride} className="text-xs text-red-500 hover:underline">Remove assignment</button>)}</div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
              Cancel
            </button>
            <button onClick={() => onSave(dayOff ? null : selectedId, note)} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Save Assignment</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── RequestChangeModal ───────────────────────────────────────────────────────

function RequestChangeModal({
  employeeId, date, currentShiftId, shiftList, employees, onClose, onSubmit,
}: {
  employeeId: string; date: string; currentShiftId: string;
  shiftList: Shift[]; employees: Employee[]; onClose: () => void; onSubmit: (req: ChangeRequest) => void;
}) {
  const emp = employees.find((e) => e.id === employeeId);
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

// ─── EmployeeSelfRequestModal ─────────────────────────────────────────────────

function EmployeeSelfRequestModal({
  myEmployeeId, branchId, shiftList, monthlyUsed, monthlyLimit, onClose, onSubmit,
}: {
  myEmployeeId: string;
  branchId: string;
  shiftList: Shift[];
  monthlyUsed: number;
  monthlyLimit: number;
  onClose: () => void;
  onSubmit: (req: ChangeRequest) => void;
}) {
  const [assignments, setAssignments] = useState<CalendarEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [requestedShiftId, setRequestedShiftId] = useState<string | null>(null);
  const [dayOff, setDayOff] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const future = new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10);
    fetch(`/api/hr/shifts/assignments?branchId=${branchId}&from=${today}&to=${future}&employeeId=${myEmployeeId}`)
      .then((r) => r.ok ? r.json() : [])
      .then((data: CalendarEntry[]) => {
        setAssignments(data.filter((a) => a.confirmStatus === "confirmed" && !!a.shiftId));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [branchId, myEmployeeId]);

  const selectedAssignment = assignments.find((a) => a.date === selectedDate);
  const currentShift = selectedAssignment?.shiftId ? shiftList.find((s) => s.id === selectedAssignment.shiftId) : null;
  const remaining = monthlyLimit - monthlyUsed;
  const canSubmit = !!(selectedDate && selectedAssignment?.shiftId && reason.trim() && !submitting);

  async function handleSubmit() {
    if (!canSubmit || !selectedAssignment?.shiftId) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/hr/shifts/change-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: myEmployeeId,
          date: selectedDate,
          currentShiftId: selectedAssignment.shiftId,
          requestedShiftId: dayOff ? null : requestedShiftId,
          reason: reason.trim(),
          branchId,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to submit."); return; }
      onSubmit(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Request Shift Change</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {remaining > 0
                ? `${remaining} request${remaining !== 1 ? "s" : ""} remaining this month`
                : "Monthly limit reached"}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={16} className="text-slate-500" /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Monthly quota */}
          <div className={cn("flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium",
            remaining <= 0 ? "bg-red-50 text-red-700" : remaining === 1 ? "bg-amber-50 text-amber-700" : "bg-slate-50 text-slate-600")}>
            <CalendarCheck size={12} />
            {monthlyUsed} of {monthlyLimit} requests used this month
          </div>

          {/* Date selection */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">
              Select shift date <span className="text-red-400">*</span>
            </label>
            {loading ? (
              <div className="flex items-center gap-2 py-3 text-sm text-slate-400">
                <Loader2 size={14} className="animate-spin" /> Loading your shifts…
              </div>
            ) : assignments.length === 0 ? (
              <div className="flex items-center gap-2 px-3 py-3 bg-slate-50 rounded-xl text-sm text-slate-400">
                <MapPin size={14} />
                No confirmed shifts found in the next 60 days.
              </div>
            ) : (
              <select
                value={selectedDate ?? ""}
                onChange={(e) => { setSelectedDate(e.target.value || null); setRequestedShiftId(null); setDayOff(false); }}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700"
              >
                <option value="">— Choose a date —</option>
                {assignments.map((a) => {
                  const s = shiftList.find((sh) => sh.id === a.shiftId);
                  return (
                    <option key={a.date} value={a.date}>
                      {fmtLong(a.date)}{s ? ` · ${s.name} (${s.startTime}–${s.endTime})` : ""}
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          {/* Current shift display */}
          {currentShift && (
            <div className={cn("flex items-center gap-2 p-3 rounded-xl text-sm", shiftColorMap[currentShift.color].bg)}>
              <ArrowLeftRight size={14} className="shrink-0" />
              <span className="text-slate-600">
                Current: <span className="font-semibold text-slate-800">{currentShift.name}</span>{" "}
                {currentShift.startTime}–{currentShift.endTime}
              </span>
            </div>
          )}

          {/* Day off checkbox */}
          {selectedDate && (
            <label className={cn("flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors",
              dayOff ? "border-red-300 bg-red-50" : "border-slate-200 hover:bg-slate-50")}>
              <input type="checkbox" checked={dayOff} onChange={(e) => { setDayOff(e.target.checked); if (e.target.checked) setRequestedShiftId(null); }} className="w-4 h-4 rounded accent-red-500" />
              <span className="text-sm font-medium text-slate-700">Request Day Off</span>
            </label>
          )}

          {/* Shift selection */}
          {selectedDate && !dayOff && (
            <div>
              <p className="text-xs font-medium text-slate-600 mb-2">Preferred shift (optional)</p>
              <div className="space-y-2">
                {shiftList.filter((s) => s.id !== selectedAssignment?.shiftId).map((s) => {
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

          {/* Reason */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Reason <span className="text-red-400">*</span></label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Explain why you need this change…" />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">{error}</div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
          <button
            disabled={!canSubmit || remaining <= 0}
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit Request"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── WeekCalendar ─────────────────────────────────────────────────────────────

function WeekCalendar({
  monday, branchEmployees, patterns, overrides, shiftList,
  empViewId, deptFilter, onCellClick, onConfirm, onRequestChange, onAddToDay,
}: {
  monday: Date;
  branchEmployees: Employee[];
  patterns: EmployeeShift[];
  overrides: CalendarEntry[];
  shiftList: Shift[];
  empViewId: string | null;
  deptFilter: string;
  onCellClick: (empId: string, date: string, currentShiftId: string | null, isOverride: boolean, entry?: CalendarEntry) => void;
  onConfirm: (entryId: string) => void;
  onRequestChange: (empId: string, date: string, shiftId: string) => void;
  onAddToDay?: (date: string) => void;
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
                  {onAddToDay && !isPast && !empViewId && (
                    <button
                      onClick={() => onAddToDay(str)}
                      title="Add staff to this day"
                      className="mt-1 mx-auto flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                    >
                      <Plus size={10} />
                    </button>
                  )}
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
                  // Managers can always click cells that already have an override, even past dates
                  const canActOnOv = !isOtherEmp && !isFutureLocked;
                  const isWeeklyDayOff = !isOv && !shift && ((emp as any).weeklyDaysOff as number[] | undefined)?.includes(d.getDay());

                  return (
                    <td key={dateStr} className={cn("px-1 py-1.5 text-center align-top", isPast && "bg-slate-50/60")}>
                      {shift && c ? (
                        <div className="flex flex-col gap-1 items-center">
                          <button
                            title={`${shift.name} ${shift.startTime}–${shift.endTime}`}
                            onClick={() => (isOv ? canActOnOv : canAct) && !empViewId && onCellClick(emp.id, dateStr, shiftId, isOv, override)}
                            className={cn("w-full px-1 py-1.5 rounded-lg text-xs font-semibold transition-colors relative group",
                              isOv && override?.confirmStatus === "confirmed"
                                ? "bg-emerald-100 text-emerald-700 border-2 border-emerald-400"
                                : isOv && override?.confirmStatus === "draft"
                                  ? cn(c.badge, "ring-2 ring-offset-1 ring-dashed ring-slate-400 opacity-70")
                                  : cn(c.badge, isOv && "ring-2 ring-offset-1", isOv && override?.confirmStatus === "pending" ? "ring-amber-400" : isOv ? "ring-slate-300" : ""),
                              !empViewId && (isOv ? canActOnOv : canAct) ? "hover:opacity-75 cursor-pointer" : "cursor-default")}>
                            {shift.code}
                            {isOv && (
                              <span className="absolute -top-1.5 -right-1.5">
                                {override?.confirmStatus === "confirmed" ? (
                                  <span className="w-3.5 h-3.5 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[8px]">✓</span>
                                ) : override?.confirmStatus === "pending" ? (
                                  <span className="w-3.5 h-3.5 bg-amber-400 rounded-full flex items-center justify-center">
                                    <span className="w-1.5 h-1.5 bg-white rounded-full" />
                                  </span>
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
                          {isOv && override?.confirmStatus && (
                            <span className={cn("text-[9px] font-medium leading-none",
                              override.confirmStatus === "confirmed" ? "text-emerald-600" :
                              override.confirmStatus === "pending" ? "text-amber-500" : "text-slate-400")}>
                              {override.confirmStatus === "confirmed" ? "✓ confirmed" :
                               override.confirmStatus === "pending" ? "awaiting" : "draft"}
                            </span>
                          )}
                        </div>
                      ) : isOv && override?.shiftId === null ? (
                        /* Day-off override — show OFF badge */
                        <div className="flex flex-col gap-0.5 items-center">
                          <button
                            title="Day off (click to edit)"
                            onClick={() => canActOnOv && !empViewId && onCellClick(emp.id, dateStr, null, true, override)}
                            className={cn("w-full h-10 rounded-lg border-2 flex items-center justify-center gap-1 text-xs font-semibold transition-colors relative",
                              canActOnOv && !empViewId ? "cursor-pointer hover:opacity-80" : "cursor-default",
                              "border-red-200 bg-red-50 text-red-400",
                              override?.confirmStatus === "confirmed" && "border-emerald-300 ring-2 ring-offset-1 ring-emerald-400",
                              override?.confirmStatus === "pending" && "ring-2 ring-offset-1 ring-amber-400")}>
                            OFF
                            {override?.confirmStatus === "pending" && (
                              <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-amber-400 rounded-full flex items-center justify-center">
                                <span className="w-1.5 h-1.5 bg-white rounded-full" />
                              </span>
                            )}
                            {override?.confirmStatus === "confirmed" && (
                              <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[8px]">✓</span>
                            )}
                          </button>
                          {override?.confirmStatus && (
                            <span className={cn("text-[9px] font-medium leading-none",
                              override.confirmStatus === "confirmed" ? "text-emerald-600" :
                              override.confirmStatus === "pending" ? "text-amber-500" : "text-slate-400")}>
                              {override.confirmStatus === "confirmed" ? "✓ confirmed" :
                               override.confirmStatus === "pending" ? "awaiting" : "draft"}
                            </span>
                          )}
                        </div>
                      ) : isWeeklyDayOff ? (
                        /* Weekly recurring day off — grey, admin can still override */
                        <button
                          title="Weekly day off (click to override)"
                          onClick={() => canAct && !empViewId && onCellClick(emp.id, dateStr, null, false)}
                          className={cn("w-full h-10 rounded-lg border-2 flex items-center justify-center text-xs font-semibold transition-colors",
                            canAct && !empViewId ? "cursor-pointer hover:opacity-80 border-slate-300 bg-slate-100 text-slate-400 hover:bg-slate-200" : "cursor-default border-slate-200 bg-slate-50 text-slate-300")}>
                          OFF
                        </button>
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
  branchEmployees: Employee[];
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
  requests, branchEmployees, shiftList, empViewId, onApprove, onReject, canEdit,
  onNewRequest, monthlyUsed, monthlyLimit,
}: {
  requests: ChangeRequest[];
  branchEmployees: Employee[];
  shiftList: Shift[];
  empViewId: string | null;
  canEdit?: boolean;
  onApprove: (id: string, onHoursWarning: (empName: string, hours: number) => void) => void;
  onReject: (id: string, note: string) => void;
  onNewRequest?: () => void;
  monthlyUsed?: number;
  monthlyLimit?: number;
}) {
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest" | "shift_date">("newest");
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [hoursAlert, setHoursAlert] = useState<{ empName: string; hours: number } | null>(null);

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
      {/* 40h hours alert banner */}
      {hoursAlert && (
        <div className="flex items-start justify-between gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <div className="flex items-start gap-2">
            <AlertCircle size={15} className="text-amber-600 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-800">
              <span className="font-semibold">{hoursAlert.empName}</span> will work{" "}
              <span className="font-semibold">{hoursAlert.hours}h</span> this week — over the 40h limit.
              The shift change was approved.
            </p>
          </div>
          <button onClick={() => setHoursAlert(null)} className="text-amber-500 hover:text-amber-700 shrink-0">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Pending Review" value={counts.pending} icon={AlertCircle} color="amber" sub="Awaiting decision" />
        <KpiCard label="Approved This Month" value={approvedThisMonth} icon={CheckCircle2} color="emerald" sub="July 2026" />
        <KpiCard label="Rejected" value={counts.rejected} icon={XCircle} color="violet" sub="All time" />
        <KpiCard label="Avg Response Time" value={avgResponseDays !== null ? `${avgResponseDays}d` : "—"} icon={Timer} color="blue" sub="Days to resolve" />
      </div>

      {/* Search + sort + new request */}
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
        {onNewRequest && (
          <div className="flex items-center gap-2">
            {monthlyLimit !== undefined && monthlyUsed !== undefined && (
              <span className={cn("text-xs px-2.5 py-1.5 rounded-lg border font-medium",
                monthlyUsed >= monthlyLimit
                  ? "bg-red-50 text-red-600 border-red-200"
                  : "bg-slate-50 text-slate-500 border-slate-200")}>
                {monthlyUsed}/{monthlyLimit} this month
              </span>
            )}
            <button
              onClick={onNewRequest}
              disabled={monthlyLimit !== undefined && monthlyUsed !== undefined && monthlyUsed >= monthlyLimit}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={14} /> New Request
            </button>
          </div>
        )}
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
            const resolver = req.resolvedBy ? branchEmployees.find((e) => e.id === req.resolvedBy) : null;
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
                    {req.status === "pending" && !empViewId && canEdit !== false && (
                      <div className="flex gap-2">
                        <button onClick={() => { setRejectId(req.id); setRejectNote(""); }}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50">
                          <XCircle size={11} /> Reject
                        </button>
                        <button onClick={() => onApprove(req.id, (empName, hours) => setHoursAlert({ empName, hours }))}
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

// ─── Date Range Picker ────────────────────────────────────────────────────────

function DateRangePickerPopup({
  initialFrom,
  initialTo,
  onApply,
  onClose,
}: {
  initialFrom: string;
  initialTo: string;
  onApply: (from: string, to: string) => void;
  onClose: () => void;
}) {
  const [fromVal, setFromVal] = useState(initialFrom);
  const [toVal, setToVal] = useState(initialTo);
  const [hovered, setHovered] = useState<string | null>(null);
  const [selecting, setSelecting] = useState<"from" | "to">("from");
  const initDate = parseDate(initialFrom);
  const [pickerYear, setPickerYear] = useState(initDate.getFullYear());
  const [pickerMonth, setPickerMonth] = useState(initDate.getMonth());

  const rightYear = pickerMonth === 11 ? pickerYear + 1 : pickerYear;
  const rightMonth = pickerMonth === 11 ? 0 : pickerMonth + 1;

  const prevPicker = () => {
    if (pickerMonth === 0) { setPickerYear((y) => y - 1); setPickerMonth(11); }
    else setPickerMonth((m) => m - 1);
  };
  const nextPicker = () => {
    if (pickerMonth === 11) { setPickerYear((y) => y + 1); setPickerMonth(0); }
    else setPickerMonth((m) => m + 1);
  };

  function handleDayClick(ds: string) {
    if (selecting === "from") {
      setFromVal(ds); setToVal(""); setSelecting("to");
    } else if (ds < fromVal) {
      setFromVal(ds); setToVal("");
    } else {
      setToVal(ds); setSelecting("from");
    }
  }

  function renderCalGrid(year: number, month: number, side: "left" | "right") {
    const label = new Date(year, month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const firstDow = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (string | null)[] = [];
    for (let i = 0; i < firstDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++)
      cells.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
    while (cells.length % 7 !== 0) cells.push(null);

    return (
      <div className="flex-1">
        <div className="flex items-center justify-between mb-3">
          {side === "left"
            ? <button onClick={prevPicker} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"><ChevronLeft size={14} /></button>
            : <div className="w-7" />}
          <p className="text-sm font-semibold text-slate-800">{label}</p>
          {side === "right"
            ? <button onClick={nextPicker} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"><ChevronRight size={14} /></button>
            : <div className="w-7" />}
        </div>
        <div className="grid grid-cols-7 gap-y-0.5">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <div key={d} className="text-center text-[11px] text-slate-400 py-1 font-medium">{d}</div>
          ))}
          {cells.map((ds, i) => {
            if (!ds) return <div key={`e-${i}`} />;
            const isFrom = ds === fromVal;
            const isTo = ds === toVal;
            const inRange = fromVal && toVal && ds > fromVal && ds < toVal;
            const isHov = fromVal && !toVal && hovered && ds > fromVal && ds <= hovered;
            const isToday = ds === TODAY;
            return (
              <button
                key={ds}
                onClick={() => handleDayClick(ds)}
                onMouseEnter={() => setHovered(ds)}
                onMouseLeave={() => setHovered(null)}
                className={cn(
                  "text-xs py-1.5 font-medium transition-colors cursor-pointer",
                  isFrom ? "bg-blue-600 text-white rounded-l-full" :
                  isTo   ? "bg-blue-600 text-white rounded-r-full" :
                  (inRange || isHov) ? "bg-blue-100 text-blue-700" :
                  isToday ? "text-blue-600 font-bold rounded-full ring-1 ring-blue-400" :
                  "text-slate-700 hover:bg-slate-100 rounded-full"
                )}
              >
                {parseInt(ds.split("-")[2], 10)}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const setPreset = (f: string, t: string) => { setFromVal(f); setToVal(t); setSelecting("from"); };

  return (
    <>
      {/* Click-away overlay */}
      <div className="fixed inset-0 z-50" onClick={onClose} />
      {/* Picker panel */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[60] p-5 w-[620px]">
        {/* Date inputs */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1">
            <p className="text-xs text-slate-500 mb-1 font-medium">From</p>
            <input type="date" value={fromVal}
              onChange={(e) => { setFromVal(e.target.value); setSelecting("to"); }}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <ArrowLeftRight size={14} className="text-slate-400 mt-5 shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-slate-500 mb-1 font-medium">To</p>
            <input type="date" value={toVal}
              onChange={(e) => { setToVal(e.target.value); setSelecting("from"); }}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        {/* Dual calendar */}
        <div className="flex gap-6 border-t border-slate-100 pt-4">
          {renderCalGrid(pickerYear, pickerMonth, "left")}
          <div className="w-px bg-slate-100" />
          {renderCalGrid(rightYear, rightMonth, "right")}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 mt-4 pt-3">
          <div className="flex gap-1">
            {([
              ["Today",      () => setPreset(TODAY, TODAY)],
              ["This week",  () => { const m = getMondayOf(parseDate(TODAY)); setPreset(toStr(m), toStr(addDays(m, 6))); }],
              ["This month", () => { const d = parseDate(TODAY); setPreset(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-01`, toStr(new Date(d.getFullYear(), d.getMonth()+1, 0))); }],
              ["Next week",  () => { const m = getMondayOf(addDays(parseDate(TODAY), 7)); setPreset(toStr(m), toStr(addDays(m, 6))); }],
            ] as [string, () => void][]).map(([label, fn]) => (
              <button key={label} onClick={fn}
                className="text-xs text-slate-600 hover:text-blue-600 px-2 py-1 rounded hover:bg-blue-50 transition-colors">
                {label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-1.5 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
            <button onClick={() => { onApply(fromVal, toVal || fromVal); onClose(); }} disabled={!fromVal}
              className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
              Apply
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── DayAssignModal ───────────────────────────────────────────────────────────

function DayAssignModal({
  date, branchEmps, alreadyAssigned, shiftList, onClose, onSave,
}: {
  date: string;
  branchEmps: Employee[];
  alreadyAssigned: string[];
  shiftList: Shift[];
  onClose: () => void;
  onSave: (employeeId: string, shiftId: string | null, note: string) => void;
}) {
  const available = branchEmps.filter((e) => !alreadyAssigned.includes(e.id));
  const [search, setSearch] = useState("");
  const [selectedEmpId, setSelectedEmpId] = useState(available[0]?.id ?? "");
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(shiftList[0]?.id ?? null);
  const [dayOff, setDayOff] = useState(false);
  const [note, setNote] = useState("");

  const filteredEmps = search.trim()
    ? available.filter((e) =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.department.toLowerCase().includes(search.toLowerCase())
      )
    : available;

  const selectedEmp = available.find((e) => e.id === selectedEmpId);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Add Staff to Day</h3>
            <p className="text-xs text-slate-500 mt-0.5">{fmtLong(date)}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X size={16} className="text-slate-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {available.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">All employees are already assigned for this day.</p>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Employee</label>
                {/* Search input */}
                <div className="relative mb-1">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name or department…"
                    className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {/* Selected employee chip */}
                {selectedEmp && (
                  <div className="flex items-center gap-2 px-3 py-1.5 mb-1 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                    <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                      {selectedEmp.name.charAt(0)}
                    </div>
                    <span className="font-medium flex-1 truncate">{selectedEmp.name}</span>
                    <span className="text-xs text-blue-500">{selectedEmp.department}</span>
                  </div>
                )}
                {/* Filtered list */}
                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
                  {filteredEmps.length === 0 ? (
                    <p className="px-3 py-3 text-sm text-slate-400 text-center">No employees match &ldquo;{search}&rdquo;</p>
                  ) : (
                    filteredEmps.map((e) => (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => setSelectedEmpId(e.id)}
                        className={cn(
                          "w-full text-left flex items-center gap-2 px-3 py-2 text-sm transition-colors",
                          selectedEmpId === e.id ? "bg-blue-50 text-blue-800" : "text-slate-700 hover:bg-slate-50"
                        )}
                      >
                        <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 text-white",
                          selectedEmpId === e.id ? "bg-blue-600" : "bg-slate-300")}>
                          {e.name.charAt(0)}
                        </div>
                        <span className="flex-1 font-medium truncate">{e.name}</span>
                        <span className="text-xs text-slate-400 shrink-0">{e.department}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <label className={cn("flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors",
                dayOff ? "border-red-300 bg-red-50" : "border-slate-200 hover:bg-slate-50")}>
                <input type="checkbox" checked={dayOff}
                  onChange={(e) => { setDayOff(e.target.checked); if (e.target.checked) setSelectedShiftId(null); }}
                  className="w-4 h-4 rounded accent-red-500" />
                <span className="text-sm font-medium text-slate-700">Mark as Day Off</span>
              </label>

              {!dayOff && (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {shiftList.map((s) => {
                    const c = shiftColorMap[s.color];
                    return (
                      <label key={s.id} className={cn("flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors",
                        selectedShiftId === s.id ? `${c.bg} ${c.border} border` : "border-slate-200 hover:bg-slate-50")}>
                        <input type="radio" name="dayShiftPick" value={s.id} checked={selectedShiftId === s.id}
                          onChange={() => { setSelectedShiftId(s.id); setDayOff(false); }} className="sr-only" />
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
                <input value={note} onChange={(e) => setNote(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Reason for this assignment..." />
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
            Cancel
          </button>
          {available.length > 0 && (
            <button
              onClick={() => { if (selectedEmpId) onSave(selectedEmpId, dayOff ? null : selectedShiftId, note); }}
              disabled={!selectedEmpId || (!dayOff && !selectedShiftId)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Add to Schedule
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ShiftsPage() {
  const { activeBranch } = useBranch();
  const { can } = usePermissions();

  const [tab, setTab] = useState<MainTab>("calendar");
  const [shiftList, setShiftList] = useState<Shift[]>([]);
  const [shiftsLoading, setShiftsLoading] = useState(true);
  const [todosByShift, setTodosByShift] = useState<Record<string, ShiftTodo[]>>({});
  const [patterns] = useState<EmployeeShift[]>([]);
  const [overrides, setOverrides] = useState<CalendarEntry[]>([]);
  const [branchEmps, setBranchEmps] = useState<Employee[]>([]);
  const [dayAssignModal, setDayAssignModal] = useState<{ date: string } | null>(null);
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [monday, setMonday] = useState<Date>(() => getMondayOf(parseDate(TODAY)));
  const [calMonth, setCalMonth] = useState(() => { const d = parseDate(TODAY); return { year: d.getFullYear(), month: d.getMonth() }; });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [deptFilter, setDeptFilter] = useState("");
  const [shiftModal, setShiftModal] = useState<{ mode: "add" | "edit"; data?: Shift } | null>(null);
  const [cellModal, setCellModal] = useState<{ empId: string; date: string; currentShiftId: string | null; isOverride: boolean; entry?: CalendarEntry } | null>(null);
  const [reqChangeModal, setReqChangeModal] = useState<{ empId: string; date: string; currentShiftId: string } | null>(null);
  const [empViewId] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCopyMenu, setShowCopyMenu] = useState(false);
  const [copying, setCopying] = useState(false);
  const [sending, setSending] = useState(false);
  const [resending, setResending] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [me, setMe] = useState<{ id: string; role: string; employeePrismaId?: string | null } | null>(null);
  const [monthlyLimit, setMonthlyLimit] = useState(2);
  const [selfReqModal, setSelfReqModal] = useState(false);

  const branchPatterns: EmployeeShift[] = [];
  const departments = useMemo(() => Array.from(new Set(branchEmps.map((e) => e.department))).sort(), [branchEmps]);

  const pendingConfirmations = overrides.filter((o) => o.branchId === activeBranch?.id && o.confirmStatus === "pending").length;
  const draftCount = overrides.filter((o) => o.branchId === activeBranch?.id && o.confirmStatus === "draft").length;
  const pendingRequests = requests.filter((r) => r.status === "pending").length;

  const isStaff = me && !["admin", "manager"].includes(me.role);
  const myEmpId = me?.employeePrismaId ?? null;
  const thisMonthStr = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const monthlyUsed = myEmpId
    ? requests.filter((r) => r.employeeId === myEmpId && ["pending", "approved"].includes(r.status) && r.createdAt.startsWith(thisMonthStr)).length
    : 0;

  // Shift → employees mapping for template tab
  const shiftEmpMap = useMemo(() => {
    const map: Record<string, Employee[]> = {};
    shiftList.forEach((s) => {
      map[s.id] = branchEmps.filter((emp) =>
        branchPatterns.some((p) => p.employeeId === emp.id && p.shiftId === s.id)
      );
    });
    return map;
  }, [shiftList, branchEmps, branchPatterns]);

  // Load shifts from DB when branch changes
  useEffect(() => {
    if (!activeBranch?.id) { setShiftList([]); setShiftsLoading(false); return; }
    setShiftsLoading(true);
    fetch(`/api/hr/shifts?branchId=${activeBranch.id}`)
      .then((r) => r.ok ? r.json() : [])
      .then((data: Shift[]) => { setShiftList(data); setShiftsLoading(false); })
      .catch(() => setShiftsLoading(false));
  }, [activeBranch?.id]);

  // Load change requests from DB when branch changes
  useEffect(() => {
    if (!activeBranch?.id) { setRequests([]); return; }
    fetch(`/api/hr/shifts/change-requests?branchId=${activeBranch.id}`)
      .then((r) => r.ok ? r.json() : [])
      .then((data: ChangeRequest[]) => setRequests(data))
      .catch(() => {});
  }, [activeBranch?.id]);

  // Load employees from DB when branch changes
  useEffect(() => {
    if (!activeBranch?.id) { setBranchEmps([]); return; }
    fetch(`/api/employees?branchId=${activeBranch.id}&status=active`)
      .then((r) => r.ok ? r.json() : [])
      .then((data: Employee[]) => setBranchEmps(data))
      .catch(() => {});
  }, [activeBranch?.id]);

  // Load shift assignments from DB when branch or week changes; also re-fetch on window focus
  useEffect(() => {
    if (!activeBranch?.id) { setOverrides([]); return; }
    const from = toStr(monday);
    const to   = toStr(addDays(monday, 6));
    const load = () =>
      fetch(`/api/hr/shifts/assignments?branchId=${activeBranch.id}&from=${from}&to=${to}`)
        .then((r) => r.ok ? r.json() : [])
        .then((data: CalendarEntry[]) => setOverrides(data))
        .catch(() => {});
    load();
    window.addEventListener("focus", load);
    return () => window.removeEventListener("focus", load);
  }, [activeBranch?.id, monday]);

  // Fetch todos for all loaded shifts
  useEffect(() => {
    shiftList.forEach((s) => {
      fetch(`/api/hr/shifts/${s.id}/todos`)
        .then((r) => r.ok ? r.json() : [])
        .then((data: ShiftTodo[]) =>
          setTodosByShift((prev) => ({ ...prev, [s.id]: data }))
        )
        .catch(() => {});
    });
  }, [shiftList.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load current user identity
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setMe({ id: d.id, role: d.role, employeePrismaId: d.employeePrismaId }); })
      .catch(() => {});
  }, []);

  // Load monthly limit from settings
  useEffect(() => {
    fetch("/api/settings/general")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.shifts?.maxChangeRequestsPerMonth != null) {
          setMonthlyLimit(d.shifts.maxChangeRequestsPerMonth);
        }
      })
      .catch(() => {});
  }, []);

  const prevWeek = () => setMonday((d) => addDays(d, -7));
  const nextWeek = () => setMonday((d) => addDays(d, 7));
  const prevMonth = () => setCalMonth((m) => { const d = new Date(m.year, m.month - 1, 1); return { year: d.getFullYear(), month: d.getMonth() }; });
  const nextMonth = () => setCalMonth((m) => { const d = new Date(m.year, m.month + 1, 1); return { year: d.getFullYear(), month: d.getMonth() }; });
  const goToday = () => { const d = parseDate(TODAY); setMonday(getMondayOf(d)); setCalMonth({ year: d.getFullYear(), month: d.getMonth() }); };

  const handleResendToEmployees = async () => {
    if (!activeBranch?.id || resending) return;
    setResending(true);
    try {
      const from = viewMode === "week"
        ? toStr(monday)
        : `${calMonth.year}-${String(calMonth.month + 1).padStart(2, "0")}-01`;
      const to = viewMode === "week"
        ? toStr(new Date(monday.getTime() + 6 * 86400000))
        : (() => { const d = new Date(calMonth.year, calMonth.month + 1, 0); return toStr(d); })();
      const res = await fetch("/api/hr/shifts/assignments/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branchId: activeBranch.id, from, to }),
      });
      if (res.ok) {
        const { assignments } = await res.json();
        const mapped: CalendarEntry[] = assignments.map((a: any) => ({
          id: a.id, employeeId: a.employeeId, shiftId: a.shiftId ?? null,
          date: a.date, branchId: a.branchId, confirmStatus: a.confirmStatus, note: a.note ?? undefined,
        }));
        setOverrides((prev) => {
          const kept = prev.filter((o) => !mapped.some((m) => m.id === o.id));
          return [...kept, ...mapped];
        });
      }
    } finally {
      setResending(false);
    }
  };

  const handleSendToEmployees = async () => {
    if (!activeBranch?.id || sending) return;
    setSending(true);
    try {
      const from = viewMode === "week"
        ? toStr(monday)
        : `${calMonth.year}-${String(calMonth.month + 1).padStart(2, "0")}-01`;
      const to = viewMode === "week"
        ? toStr(new Date(monday.getTime() + 6 * 86400000))
        : (() => { const d = new Date(calMonth.year, calMonth.month + 1, 0); return toStr(d); })();
      const res = await fetch("/api/hr/shifts/assignments/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branchId: activeBranch.id, from, to }),
      });
      if (res.ok) {
        const { assignments } = await res.json();
        const mapped: CalendarEntry[] = assignments.map((a: any) => ({
          id: a.id, employeeId: a.employeeId, shiftId: a.shiftId ?? null,
          date: a.date, branchId: a.branchId, confirmStatus: a.confirmStatus, note: a.note ?? undefined,
        }));
        setOverrides((prev) => {
          const kept = prev.filter((o) => !mapped.some((m) => m.id === o.id));
          return [...kept, ...mapped];
        });
      }
    } finally {
      setSending(false);
    }
  };

  const handleCopyToNextWeek = async () => {
    setShowCopyMenu(false);
    setCopying(true);
    setCopyError(null);
    const from = toStr(monday);
    const to = toStr(addDays(monday, 6));
    const weekEntries = overrides.filter((o) => o.date >= from && o.date <= to);
    let failed = 0;
    for (const entry of weekEntries) {
      const newDate = toStr(addDays(parseDate(entry.date), 7));
      if (newDate > MAX_FUTURE) continue;
      try {
        const res = await fetch("/api/hr/shifts/assignments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ employeeId: entry.employeeId, shiftId: entry.shiftId ?? null, date: newDate, branchId: entry.branchId, note: entry.note ?? null }),
        });
        if (!res.ok && res.status !== 409) failed++;
      } catch { failed++; }
    }
    setCopying(false);
    if (failed > 0) setCopyError(`${failed} assignment(s) could not be copied.`);
    setMonday((d) => addDays(d, 7));
  };

  const handleCopyToNextMonth = async () => {
    setShowCopyMenu(false);
    setCopying(true);
    setCopyError(null);
    const monthStart = `${calMonth.year}-${String(calMonth.month + 1).padStart(2, "0")}-01`;
    const monthEnd = toStr(new Date(calMonth.year, calMonth.month + 1, 0));
    try {
      const res = await fetch(`/api/hr/shifts/assignments?branchId=${activeBranch?.id}&from=${monthStart}&to=${monthEnd}`);
      const monthEntries: CalendarEntry[] = res.ok ? await res.json() : [];
      let failed = 0;
      for (const entry of monthEntries) {
        const d = parseDate(entry.date);
        const next = new Date(d.getFullYear(), d.getMonth() + 1, d.getDate());
        if (next.getMonth() !== (d.getMonth() + 1) % 12) continue; // skip days that overflow (e.g. Jan 31 has no Feb 31)
        const newDate = toStr(next);
        if (newDate > MAX_FUTURE) continue;
        try {
          const r = await fetch("/api/hr/shifts/assignments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ employeeId: entry.employeeId, shiftId: entry.shiftId ?? null, date: newDate, branchId: entry.branchId, note: entry.note ?? null }),
          });
          if (!r.ok && r.status !== 409) failed++;
        } catch { failed++; }
      }
      setCopying(false);
      if (failed > 0) setCopyError(`${failed} assignment(s) could not be copied.`);
      nextMonth();
    } catch {
      setCopying(false);
      setCopyError("Could not load current month assignments.");
    }
  };

  const handleTodoChange = (shiftId: string, todos: ShiftTodo[]) => {
    setTodosByShift((prev) => ({ ...prev, [shiftId]: todos }));
  };

  const handleSaveShift = async (shift: Shift): Promise<string | null> => {
    const isEdit = !!shift.id && shiftList.some((s) => s.id === shift.id);
    const url = isEdit ? `/api/hr/shifts/${shift.id}` : "/api/hr/shifts";
    const body = { ...shift, branchId: activeBranch?.id };
    try {
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) return data.error ?? "Failed to save shift.";
      const saved: Shift = data;
      setShiftList((prev) => {
        const idx = prev.findIndex((s) => s.id === saved.id);
        if (idx >= 0) { const n = [...prev]; n[idx] = saved; return n; }
        return [...prev, saved];
      });
      setShiftModal(null);
      return null;
    } catch {
      return "Network error. Please try again.";
    }
  };

  const handleDeleteShift = async (id: string) => {
    await fetch(`/api/hr/shifts/${id}`, { method: "DELETE" });
    setShiftList((prev) => prev.filter((s) => s.id !== id));
    setTodosByShift((prev) => { const n = { ...prev }; delete n[id]; return n; });
  };

  const handleCellSave = async (shiftId: string | null, note: string) => {
    if (!cellModal) return;
    const tempEntry: CalendarEntry = {
      id: cellModal.entry?.id ?? `CE-tmp-${Date.now()}`,
      employeeId: cellModal.empId,
      shiftId,
      date: cellModal.date,
      branchId: activeBranch?.id ?? "",
      confirmStatus: cellModal.entry?.confirmStatus === "confirmed" ? "pending" : "draft",
      note: note || undefined,
    };
    setOverrides((prev) => {
      const idx = prev.findIndex((o) => o.date === tempEntry.date && o.employeeId === tempEntry.employeeId);
      if (idx >= 0) { const n = [...prev]; n[idx] = tempEntry; return n; }
      return [...prev, tempEntry];
    });
    setCellModal(null);
    try {
      const isEdit = !!cellModal.entry?.id && !cellModal.entry.id.startsWith("CE-tmp");
      const url = isEdit ? `/api/hr/shifts/assignments/${cellModal.entry!.id}` : "/api/hr/shifts/assignments";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: cellModal.empId, shiftId: shiftId ?? null, date: cellModal.date, branchId: activeBranch?.id, note: note || null, ...(cellModal.entry?.confirmStatus === "confirmed" ? { confirmStatus: "pending" } : {}) }),
      });
      if (res.ok) {
        const saved = await res.json();
        setOverrides((prev) => prev.map((o) => o.date === saved.date && o.employeeId === saved.employeeId ? { ...o, id: saved.id, confirmStatus: saved.confirmStatus } : o));
      } else if (res.status === 409) {
        const err = await res.json();
        setOverrides((prev) => prev.filter((o) => o.id !== tempEntry.id));
        setAssignError(err.error ?? "Assignment conflict.");
      }
    } catch {
      // keep optimistic
    }
  };

  const handleRemoveOverride = async () => {
    if (!cellModal?.entry) return;
    const entryId = cellModal.entry.id;
    setOverrides((prev) => prev.filter((o) => o.id !== entryId));
    setCellModal(null);
    if (entryId && !entryId.startsWith("CE-tmp")) {
      try { await fetch(`/api/hr/shifts/assignments/${entryId}`, { method: "DELETE" }); } catch { /* ignore */ }
    }
  };

  const handleConfirm = async (entryId: string) => {
    setOverrides((prev) => prev.map((o) => o.id === entryId ? { ...o, confirmStatus: "confirmed" } : o));
    try {
      await fetch(`/api/hr/shifts/assignments/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmStatus: "confirmed" }),
      });
    } catch { /* keep optimistic */ }
  };

  const handleApproveRequest = async (id: string, onHoursWarning: (empName: string, hours: number) => void) => {
    const req = requests.find((r) => r.id === id);
    if (!req) return;
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: "approved" as const, resolvedAt: new Date().toISOString() } : r));
    const tempEntry: CalendarEntry = {
      id: `CE-tmp-${Date.now()}`,
      employeeId: req.employeeId,
      shiftId: req.requestedShiftId,
      date: req.date,
      branchId: activeBranch?.id ?? "",
      confirmStatus: "confirmed",
      note: `Approved — request ${req.id}`,
    };
    setOverrides((prev) => {
      const idx = prev.findIndex((o) => o.date === req.date && o.employeeId === req.employeeId);
      if (idx >= 0) { const n = [...prev]; n[idx] = tempEntry; return n; }
      return [...prev, tempEntry];
    });
    const res = await fetch(`/api/hr/shifts/change-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "approved" }),
    });
    if (res.ok) {
      const saved = await res.json();
      setRequests((prev) => prev.map((r) => r.id === id ? saved : r));
      if (saved.weeklyHoursWarning && saved.weeklyHoursTotal != null) {
        const emp = branchEmps.find((e) => e.id === req.employeeId);
        onHoursWarning(emp?.name ?? "Employee", saved.weeklyHoursTotal);
      }
    }
    // Save the assignment to DB so it persists across reloads
    const ar = await fetch("/api/hr/shifts/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId: req.employeeId, shiftId: req.requestedShiftId ?? null, date: req.date, branchId: activeBranch?.id, note: `Approved request ${req.id}` }),
    });
    if (ar.ok) {
      const sa = await ar.json();
      setOverrides((prev) => prev.map((o) => o.date === sa.date && o.employeeId === sa.employeeId ? { ...o, id: sa.id } : o));
    }
  };

  const handleRejectRequest = async (id: string, note: string) => {
    // Optimistic update
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: "rejected" as const, resolvedAt: new Date().toISOString(), managerNote: note || undefined } : r));
    // Persist
    const res = await fetch(`/api/hr/shifts/change-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "rejected", managerNote: note }),
    });
    if (res.ok) {
      const saved: ChangeRequest = await res.json();
      setRequests((prev) => prev.map((r) => r.id === id ? saved : r));
    }
  };

  const handleDayAssign = async (employeeId: string, shiftId: string | null, note: string) => {
    if (!dayAssignModal) return;
    const date = dayAssignModal.date;
    const tempEntry: CalendarEntry = {
      id: `CE-tmp-${Date.now()}`,
      employeeId,
      shiftId,
      date,
      branchId: activeBranch?.id ?? "",
      confirmStatus: "draft",
      note: note || undefined,
    };
    setOverrides((prev) => {
      const idx = prev.findIndex((o) => o.date === date && o.employeeId === employeeId);
      if (idx >= 0) { const n = [...prev]; n[idx] = tempEntry; return n; }
      return [...prev, tempEntry];
    });
    setDayAssignModal(null);
    try {
      const res = await fetch("/api/hr/shifts/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, shiftId: shiftId ?? null, date, branchId: activeBranch?.id, note: note || null }),
      });
      if (res.ok) {
        const saved = await res.json();
        setOverrides((prev) => prev.map((o) => o.date === saved.date && o.employeeId === saved.employeeId ? { ...o, id: saved.id, confirmStatus: saved.confirmStatus } : o));
      } else if (res.status === 409) {
        const err = await res.json();
        setOverrides((prev) => prev.filter((o) => o.id !== tempEntry.id));
        setAssignError(err.error ?? "Assignment conflict.");
      }
    } catch { /* keep optimistic */ }
  };

  // Summary stats for templates tab
  const totalScheduledEmps = new Set(branchPatterns.map((p) => p.employeeId)).size;
  const avgShiftHours = shiftList.length ? Math.round(shiftList.reduce((acc, s) => acc + calcWorkMinutes(s.startTime, s.endTime, s.breakMinutes), 0) / shiftList.length / 60 * 10) / 10 : 0;

  if (!activeBranch) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50">
        <Header title="Shift Management" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-slate-400">No branches configured. Go to Settings → Branches to add one.</p>
        </div>
      </div>
    );
  }

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
            {can("hr_shifts_templates", "create") && (
              <button onClick={() => setShiftModal({ mode: "add" })}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                <Plus size={15} /> New Shift
              </button>
            )}
          </div>
        }
      />

      <main className="flex-1 p-6">
        {/* Main tabs */}
        <div className="flex items-center gap-1 mb-6 bg-white border border-slate-200 rounded-xl p-1 w-fit">
          {([
            { id: "templates" as MainTab, label: "Shift Templates",   icon: <Clock size={14} />,          permKey: "hr_shifts_templates" },
            { id: "calendar"  as MainTab, label: "Schedule Calendar", icon: <CalendarDays size={14} />,   permKey: "hr_shifts_calendar",  badge: pendingConfirmations },
            { id: "requests"  as MainTab, label: "Change Requests",   icon: <ArrowLeftRight size={14} />, permKey: "hr_shifts_requests",  badge: pendingRequests },
          ] as { id: MainTab; label: string; icon: React.ReactNode; permKey: string; badge?: number }[])
          .filter((t) => can(t.permKey, "view"))
          .map((t) => (
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
            {shiftsLoading ? (
              <div className="flex items-center justify-center py-16 text-slate-400 text-sm">
                <svg className="animate-spin mr-2 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Loading shifts…
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {shiftList.map((s) => (
                  <ShiftCard key={s.id} shift={s}
                    assignedEmps={shiftEmpMap[s.id] ?? []}
                    patterns={branchPatterns}
                    todos={todosByShift[s.id] ?? []}
                    onEdit={can("hr_shifts_templates", "edit") ? (sh) => setShiftModal({ mode: "edit", data: sh }) : () => {}}
                    onDelete={can("hr_shifts_templates", "edit") ? handleDeleteShift : () => {}}
                    onTodoChange={handleTodoChange}
                  />
                ))}
                {can("hr_shifts_templates", "create") && (
                  <button onClick={() => setShiftModal({ mode: "add" })}
                    className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-xl p-5 text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors min-h-[200px]">
                    <Plus size={22} />
                    <span className="text-sm font-medium">New Shift Template</span>
                  </button>
                )}
              </div>
            )}

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
                <div className="relative">
                  <button
                    onClick={() => setShowDatePicker((v) => !v)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-800 min-w-[220px] justify-center hover:bg-slate-50 transition-colors"
                  >
                    <CalendarDays size={14} className="text-slate-400 shrink-0" />
                    {viewMode === "week"
                      ? fmtWeekRange(monday)
                      : fmtMonthYear(new Date(calMonth.year, calMonth.month, 1))}
                  </button>
                  {showDatePicker && (
                    <DateRangePickerPopup
                      initialFrom={viewMode === "week" ? toStr(monday) : `${calMonth.year}-${String(calMonth.month + 1).padStart(2, "0")}-01`}
                      initialTo={viewMode === "week" ? toStr(addDays(monday, 6)) : toStr(new Date(calMonth.year, calMonth.month + 1, 0))}
                      onApply={(from) => {
                        const d = parseDate(from);
                        setMonday(getMondayOf(d));
                        setCalMonth({ year: d.getFullYear(), month: d.getMonth() });
                      }}
                      onClose={() => setShowDatePicker(false)}
                    />
                  )}
                </div>
                <button onClick={viewMode === "week" ? nextWeek : nextMonth} className="p-2 hover:bg-slate-100 rounded-r-lg transition-colors">
                  <ChevronRight size={16} className="text-slate-600" />
                </button>
              </div>

              <button onClick={goToday} className="px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
                Today
              </button>

              {/* Copy schedule dropdown */}
              {can("hr_shifts_calendar", "edit") && <div className="relative">
                <button
                  onClick={() => setShowCopyMenu((v) => !v)}
                  disabled={copying}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                >
                  {copying ? <span className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> : <ArrowLeftRight size={14} />}
                  Copy Schedule
                  <ChevronDown size={12} className="text-slate-400" />
                </button>
                {showCopyMenu && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setShowCopyMenu(false)} />
                  <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-30 min-w-[180px] overflow-hidden">
                    <button
                      onClick={handleCopyToNextWeek}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <ChevronRight size={13} className="text-slate-400" />
                      Copy to next week
                    </button>
                    <button
                      onClick={handleCopyToNextMonth}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-t border-slate-100"
                    >
                      <ChevronRight size={13} className="text-slate-400" />
                      Copy to next month
                    </button>
                  </div>
                  </>
                )}
              </div>}

              {/* Dept filter (week view) */}
              {viewMode === "week" && (
                <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}
                  className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">All departments</option>
                  {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              )}

            </div>

            {/* Draft assignments banner */}
            {draftCount > 0 && !empViewId && (
              <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700">
                <span className="flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0 text-slate-400" />
                  <span className="font-semibold">{draftCount}</span> draft assignment{draftCount !== 1 ? "s" : ""} — not yet visible to employees
                </span>
                {can("hr_shifts_calendar", "create") && (
                  <button
                    onClick={handleSendToEmployees}
                    disabled={sending}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-60 transition-colors"
                  >
                    {sending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                    {sending ? "Sending…" : "Send to Employees"}
                  </button>
                )}
              </div>
            )}

            {/* Pending banner */}
            {pendingConfirmations > 0 && (
              <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                <span className="flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>
                    <span className="font-semibold">{pendingConfirmations}</span> assignment{pendingConfirmations !== 1 ? "s" : ""} pending employee confirmation
                    {empViewId && <span className="ml-2 text-xs bg-amber-200 px-2 py-0.5 rounded-full">Use ✓ / ↕ buttons on amber-ringed shifts to confirm or request a change</span>}
                  </span>
                </span>
                {!empViewId && can("hr_shifts_calendar", "create") && (
                  <button
                    onClick={handleResendToEmployees}
                    disabled={resending}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-60 transition-colors shrink-0"
                  >
                    {resending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                    {resending ? "Resending…" : "Resend"}
                  </button>
                )}
              </div>
            )}

            {/* Copy error banner */}
            {copyError && (
              <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <span className="flex items-center gap-2"><AlertCircle size={14} className="shrink-0" />{copyError}</span>
                <button onClick={() => setCopyError(null)} className="p-0.5 hover:bg-red-100 rounded"><X size={13} /></button>
              </div>
            )}

            {/* Cross-branch conflict error */}
            {assignError && (
              <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <span className="flex items-center gap-2"><AlertCircle size={14} className="shrink-0" />{assignError}</span>
                <button onClick={() => setAssignError(null)} className="p-0.5 hover:bg-red-100 rounded"><X size={13} /></button>
              </div>
            )}

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-emerald-400 ring-offset-1" />Confirmed override</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-300 ring-2 ring-amber-400 ring-offset-1" />Pending confirmation</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-slate-300 ring-2 ring-dashed ring-slate-400 ring-offset-1 opacity-70" />Draft (not sent)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-400" />Recurring pattern</span>
              <span className="flex items-center gap-1.5"><span className="w-6 h-3 rounded bg-red-100 border border-red-200 text-red-400 text-[8px] font-bold flex items-center justify-center">OFF</span>Day off</span>
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
                  if (empViewId || !can("hr_shifts_calendar", "edit")) return;
                  setCellModal({ empId, date, currentShiftId, isOverride: isOv, entry });
                }}
                onConfirm={handleConfirm}
                onRequestChange={(empId, date, shiftId) => setReqChangeModal({ empId, date, currentShiftId: shiftId })}
                onAddToDay={can("hr_shifts_calendar", "edit") ? (date) => setDayAssignModal({ date }) : undefined}
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
            canEdit={can("hr_shifts_requests", "edit")}
            onApprove={handleApproveRequest}
            onReject={handleRejectRequest}
            onNewRequest={myEmpId && activeBranch ? () => setSelfReqModal(true) : undefined}
            monthlyUsed={monthlyUsed}
            monthlyLimit={monthlyLimit}
          />
        )}
      </main>

      {shiftModal && <ShiftModal state={shiftModal} onClose={() => setShiftModal(null)} onSave={handleSaveShift} />}
      {cellModal && (
        <CellAssignModal
          employeeId={cellModal.empId} date={cellModal.date}
          currentShiftId={cellModal.currentShiftId} isOverride={cellModal.isOverride}
          confirmStatus={cellModal.entry?.confirmStatus} shiftList={shiftList}
          employees={branchEmps}
          onClose={() => setCellModal(null)} onSave={handleCellSave}
          onRemoveOverride={cellModal.isOverride ? handleRemoveOverride : undefined}
        />
      )}
      {reqChangeModal && (
        <RequestChangeModal
          employeeId={reqChangeModal.empId} date={reqChangeModal.date}
          currentShiftId={reqChangeModal.currentShiftId} shiftList={shiftList}
          employees={branchEmps}
          onClose={() => setReqChangeModal(null)}
          onSubmit={async (req) => {
            const res = await fetch("/api/hr/shifts/change-requests", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...req, branchId: activeBranch?.id }),
            });
            const saved = res.ok ? await res.json() : req;
            setRequests((prev) => [saved, ...prev]);
            setReqChangeModal(null);
          }}
        />
      )}
      {selfReqModal && myEmpId && activeBranch && (
        <EmployeeSelfRequestModal
          myEmployeeId={myEmpId}
          branchId={activeBranch.id}
          shiftList={shiftList}
          monthlyUsed={monthlyUsed}
          monthlyLimit={monthlyLimit}
          onClose={() => setSelfReqModal(false)}
          onSubmit={(saved) => {
            setRequests((prev) => [saved, ...prev]);
            setSelfReqModal(false);
          }}
        />
      )}
      {dayAssignModal && (
        <DayAssignModal
          date={dayAssignModal.date}
          branchEmps={branchEmps}
          alreadyAssigned={overrides.filter((o) => o.date === dayAssignModal.date).map((o) => o.employeeId)}
          shiftList={shiftList}
          onClose={() => setDayAssignModal(null)}
          onSave={handleDayAssign}
        />
      )}
    </div>
  );
}
