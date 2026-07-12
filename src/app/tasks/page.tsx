"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import {
  Plus, Loader2, Trash2, Pencil, X, CheckCircle2, Clock, CircleDot,
  XCircle, CalendarDays, Timer, User, Link2, ChevronDown, AlertTriangle,
  ListTodo, ChevronRight, ChevronLeft, FolderOpen, Search, Camera, GripVertical,
  LayoutGrid, List, History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBranch } from "@/context/BranchContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type Priority = "low" | "medium" | "high";
type Status = "pending" | "in_progress" | "done" | "cancelled";

interface Task {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  dueTime?: string | null;
  priority: Priority;
  status: Status;
  assigneeName?: string | null;
  shiftLabel?: string | null;
  taskListId?: string | null;
  requiresPhoto: boolean;
  order: number;
  createdAt: string;
}

interface TaskList {
  id: string;
  name: string;
  color: string;
  order: number;
  shiftId?: string | null;
  shift?: { id: string; name: string; code: string; startTime: string; endTime: string; color: string } | null;
  createdAt: string;
}

interface TaskForm {
  title: string;
  description: string;
  dueDate: string;
  dueTime: string;
  priority: Priority;
  assigneeName: string;
  shiftLabel: string;
  taskListId: string;
  requiresPhoto: boolean;
}

interface ListForm {
  name: string;
  color: string;
  shiftId: string;
}

const EMPTY_TASK_FORM: TaskForm = {
  title: "", description: "", dueDate: "", dueTime: "",
  priority: "medium", assigneeName: "", shiftLabel: "", taskListId: "", requiresPhoto: false,
};

const EMPTY_LIST_FORM: ListForm = { name: "", color: "blue", shiftId: "" };

const TODAY_STR = new Date().toISOString().split("T")[0];

interface HistoryTaskRow {
  id: string; title: string; priority: string; listName: string; listColor: string; status: string;
}
interface HistoryRow {
  employeeId: string; employeeName: string; employeeNo: string;
  shiftName: string; shiftCode: string; shiftColor: string;
  tasks: HistoryTaskRow[]; doneCount: number; totalCount: number;
}

// ─── Config ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<Status, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  pending:     { label: "Pending",     icon: Clock,        color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200" },
  in_progress: { label: "In Progress", icon: CircleDot,    color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200" },
  done:        { label: "Done",        icon: CheckCircle2, color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  cancelled:   { label: "Cancelled",   icon: XCircle,      color: "text-slate-500",   bg: "bg-slate-100",  border: "border-slate-200" },
};

const PRIORITY_CONFIG: Record<Priority, { label: string; dot: string; badge: string }> = {
  low:    { label: "Low",    dot: "bg-slate-400", badge: "bg-slate-100 text-slate-600" },
  medium: { label: "Medium", dot: "bg-amber-400", badge: "bg-amber-100 text-amber-700" },
  high:   { label: "High",   dot: "bg-red-500",   badge: "bg-red-100 text-red-700" },
};

const STATUS_TABS: { value: "all" | Status; label: string }[] = [
  { value: "all",         label: "All" },
  { value: "pending",     label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "done",        label: "Done" },
  { value: "cancelled",   label: "Cancelled" },
];

const LIST_COLORS: Record<string, { dot: string; text: string }> = {
  blue:   { dot: "bg-blue-500",   text: "text-blue-700" },
  green:  { dot: "bg-green-500",  text: "text-green-700" },
  purple: { dot: "bg-violet-500", text: "text-violet-700" },
  amber:  { dot: "bg-amber-500",  text: "text-amber-700" },
  red:    { dot: "bg-red-500",    text: "text-red-700" },
  teal:   { dot: "bg-teal-500",   text: "text-teal-700" },
};

const COLOR_OPTIONS = [
  { id: "blue",   dot: "bg-blue-500" },
  { id: "green",  dot: "bg-green-500" },
  { id: "purple", dot: "bg-violet-500" },
  { id: "amber",  dot: "bg-amber-500" },
  { id: "red",    dot: "bg-red-500" },
  { id: "teal",   dot: "bg-teal-500" },
];

// ─── StatusBadge ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Status }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border", cfg.color, cfg.bg, cfg.border)}>
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

// ─── StatusSelect ──────────────────────────────────────────────────────────

function StatusSelect({ task, onUpdate }: { task: Task; onUpdate: (id: string, status: Status) => void }) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const cfg = STATUS_CONFIG[task.status];
  const Icon = cfg.icon;

  const handle = async (status: Status) => {
    setOpen(false);
    if (status === task.status) return;
    setLoading(true);
    await onUpdate(task.id, status);
    setLoading(false);
  };

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        disabled={loading}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors",
          cfg.color, cfg.bg, cfg.border, "hover:opacity-80"
        )}
      >
        {loading ? <Loader2 size={11} className="animate-spin" /> : <Icon size={11} />}
        {cfg.label}
        <ChevronDown size={10} className={cn("transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-xl shadow-lg py-1 w-40">
          {(Object.entries(STATUS_CONFIG) as [Status, typeof STATUS_CONFIG[Status]][]).map(([s, c]) => {
            const I = c.icon;
            return (
              <button
                key={s}
                onClick={(e) => { e.stopPropagation(); handle(s); }}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50 transition-colors",
                  c.color,
                  task.status === s && "font-semibold"
                )}
              >
                <I size={13} />
                {c.label}
                {task.status === s && <span className="ml-auto text-[10px] text-slate-400">current</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── TaskCard ──────────────────────────────────────────────────────────────

function TaskCard({
  task, onStatusUpdate, onEdit, onDelete,
  isDragging, isDragOver, onDragStart, onDragOver, onDrop, onDragEnd,
}: {
  task: Task;
  onStatusUpdate: (id: string, status: Status) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  isDragging?: boolean;
  isDragOver?: boolean;
  onDragStart?: () => void;
  onDragOver?: () => void;
  onDrop?: () => void;
  onDragEnd?: () => void;
}) {
  const p = PRIORITY_CONFIG[task.priority];
  const isDone = task.status === "done" || task.status === "cancelled";

  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", task.id); onDragStart?.(); }}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; onDragOver?.(); }}
      onDrop={(e) => { e.preventDefault(); onDrop?.(); }}
      onDragEnd={onDragEnd}
      className={cn(
        "bg-white rounded-xl border p-4 shadow-sm transition-all",
        isDone && "opacity-60",
        isDragging ? "opacity-30 border-slate-200" : isDragOver ? "border-blue-400 ring-2 ring-blue-200 shadow-md" : "border-slate-200",
      )}
    >
      <div className="flex items-start gap-3">
        <span className={cn("mt-1.5 w-2 h-2 rounded-full flex-shrink-0", p.dot)} />
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-semibold text-slate-900 leading-snug", isDone && "line-through text-slate-500")}>
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{task.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <GripVertical size={13} className="text-slate-300 hover:text-slate-400 cursor-grab active:cursor-grabbing" />
          <button onClick={(e) => { e.stopPropagation(); onEdit(task); }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <Pencil size={13} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2.5 ml-5">
        {task.dueDate && (
          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
            <CalendarDays size={11} className="text-slate-400" />
            {new Date(task.dueDate + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
          </span>
        )}
        {task.dueTime && (
          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
            <Timer size={11} className="text-slate-400" />
            {task.dueTime}
          </span>
        )}
        {task.assigneeName && (
          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
            <User size={11} className="text-slate-400" />
            {task.assigneeName}
          </span>
        )}
        {task.shiftLabel && (
          <span className="inline-flex items-center gap-1 text-xs text-blue-600">
            <Link2 size={11} />
            {task.shiftLabel}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mt-3 ml-5 gap-2">
        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", p.badge)}>{p.label}</span>
        <StatusSelect task={task} onUpdate={onStatusUpdate} />
      </div>
    </div>
  );
}

// ─── TaskModal ─────────────────────────────────────────────────────────────

interface ShiftTemplate {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
}

interface BranchEmployee {
  id: string;
  name: string;
  position: string;
  department: string;
}

// ─── StaffPicker ───────────────────────────────────────────────────────────

function StaffPicker({ value, onChange, employees }: {
  value: string;
  onChange: (name: string) => void;
  employees: BranchEmployee[];
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() =>
    employees.filter((e) =>
      e.name.toLowerCase().includes(q.toLowerCase()) ||
      e.position.toLowerCase().includes(q.toLowerCase())
    ).slice(0, 8),
  [q, employees]);

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-2 px-3.5 py-2.5 text-sm border rounded-lg cursor-pointer transition-colors",
          open ? "border-blue-500 ring-2 ring-blue-500" : "border-slate-200 hover:border-slate-300"
        )}
      >
        {value ? (
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center shrink-0">
              {value[0]?.toUpperCase()}
            </div>
            <span className="text-slate-800 truncate">{value}</span>
          </div>
        ) : (
          <span className="text-slate-400 flex-1">Search staff by name…</span>
        )}
        <div className="flex items-center gap-1 shrink-0">
          {value && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(""); }}
              className="text-slate-300 hover:text-slate-500"
            >
              <X size={12} />
            </button>
          )}
          <ChevronDown size={13} className={cn("text-slate-400 transition-transform", open && "rotate-180")} />
        </div>
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search staff…"
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto py-1">
            {filtered.map((emp) => (
              <button
                key={emp.id}
                type="button"
                onClick={() => { onChange(emp.name); setOpen(false); setQ(""); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 text-left",
                  value === emp.name && "bg-blue-50"
                )}
              >
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                  {emp.name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 truncate">{emp.name}</p>
                  <p className="text-xs text-slate-400">{emp.position} · {emp.department}</p>
                </div>
                {value === emp.name && <CheckCircle2 size={13} className="text-blue-600 shrink-0" />}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-xs text-slate-400 px-3 py-2">No staff found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TaskModal({
  form, setForm, onSubmit, onClose, loading, error, isEdit, lists, shifts, branchEmployees,
}: {
  form: TaskForm;
  setForm: React.Dispatch<React.SetStateAction<TaskForm>>;
  onSubmit: () => void;
  onClose: () => void;
  loading: boolean;
  error: string;
  isEdit: boolean;
  lists: TaskList[];
  shifts: ShiftTemplate[];
  branchEmployees: BranchEmployee[];
}) {
  const set = (k: keyof TaskForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-base font-semibold text-slate-900">{isEdit ? "Edit Task" : "New Task"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              <AlertTriangle size={13} className="flex-shrink-0" />{error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Title <span className="text-red-500">*</span></label>
            <input
              type="text" value={form.title} onChange={set("title")}
              placeholder="What needs to be done?" autoFocus
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              <span className="flex items-center gap-1"><Link2 size={13} />Link to Shift (optional)</span>
            </label>
            <select value={form.shiftLabel} onChange={set("shiftLabel")}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">— None —</option>
              {shifts.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name} ({s.startTime}–{s.endTime})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Task List</label>
            <select
              value={form.taskListId} onChange={set("taskListId")}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">— No List —</option>
              {lists.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <textarea
              rows={2} value={form.description} onChange={set("description")}
              placeholder="Optional details..."
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <span className="flex items-center gap-1"><CalendarDays size={13} />Due Date</span>
              </label>
              <input type="date" value={form.dueDate} onChange={set("dueDate")}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <span className="flex items-center gap-1"><Timer size={13} />Time (HH:MM)</span>
              </label>
              <input type="time" value={form.dueTime} onChange={set("dueTime")}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Priority</label>
            <select value={form.priority} onChange={set("priority")}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              <span className="flex items-center gap-1"><User size={13} />Assign to Staff</span>
            </label>
            <StaffPicker
              value={form.assigneeName}
              onChange={(name) => setForm((f) => ({ ...f, assigneeName: name }))}
              employees={branchEmployees}
            />
          </div>

          <label className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors select-none",
            form.requiresPhoto ? "border-violet-300 bg-violet-50" : "border-slate-200 hover:bg-slate-50"
          )}>
            <input
              type="checkbox"
              checked={form.requiresPhoto}
              onChange={(e) => setForm((f) => ({ ...f, requiresPhoto: e.target.checked }))}
              className="w-4 h-4 rounded accent-violet-600"
            />
            <Camera size={15} className={form.requiresPhoto ? "text-violet-600" : "text-slate-400"} />
            <div>
              <p className="text-sm font-medium text-slate-800">Require photo proof</p>
              <p className="text-xs text-slate-400">Staff must attach a photo when marking this task done</p>
            </div>
          </label>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
              Cancel
            </button>
            <button onClick={onSubmit} disabled={loading || !form.title.trim()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors">
              {loading && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ListModal ─────────────────────────────────────────────────────────────

function ListModal({
  form, setForm, onSubmit, onClose, loading, error, isEdit, shifts,
}: {
  form: ListForm;
  setForm: React.Dispatch<React.SetStateAction<ListForm>>;
  onSubmit: () => void;
  onClose: () => void;
  loading: boolean;
  error: string;
  isEdit: boolean;
  shifts: ShiftTemplate[];
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-full sm:max-w-sm bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">{isEdit ? "Edit List" : "New Task List"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              <AlertTriangle size={13} className="flex-shrink-0" />{error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              <span className="flex items-center gap-1"><Link2 size={13} />Link to Shift (optional)</span>
            </label>
            <select
              value={form.shiftId}
              onChange={(e) => {
                const selectedShift = shifts.find((s) => s.id === e.target.value);
                setForm((f) => ({
                  ...f,
                  shiftId: e.target.value,
                  name: selectedShift && !f.name ? selectedShift.name : f.name,
                }));
              }}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">— None —</option>
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.startTime}–{s.endTime})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">List Name <span className="text-red-500">*</span></label>
            <input
              type="text" value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Opening Tasks, Closing Checklist…" autoFocus
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Color</label>
            <div className="flex gap-2.5">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setForm((f) => ({ ...f, color: c.id }))}
                  className={cn(
                    "w-8 h-8 rounded-full transition-transform",
                    c.dot,
                    form.color === c.id ? "ring-2 ring-offset-2 ring-slate-400 scale-110" : "hover:scale-105"
                  )}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
              Cancel
            </button>
            <button onClick={onSubmit} disabled={loading || !form.name.trim()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors">
              {loading && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? "Save" : "Create List"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TaskRow (list view) ───────────────────────────────────────────────────

function TaskRow({
  task, onStatusUpdate, onEdit, onDelete,
  isDragging, isDragOver, onDragStart, onDragOver, onDrop, onDragEnd,
}: {
  task: Task;
  onStatusUpdate: (id: string, status: Status) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  isDragging?: boolean;
  isDragOver?: boolean;
  onDragStart?: () => void;
  onDragOver?: () => void;
  onDrop?: () => void;
  onDragEnd?: () => void;
}) {
  const p = PRIORITY_CONFIG[task.priority];
  const isDone = task.status === "done" || task.status === "cancelled";

  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", task.id); onDragStart?.(); }}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; onDragOver?.(); }}
      onDrop={(e) => { e.preventDefault(); onDrop?.(); }}
      onDragEnd={onDragEnd}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 border-b border-slate-50 last:border-b-0 transition-all",
        isDone && "opacity-60",
        isDragging ? "opacity-30 bg-slate-50" : isDragOver ? "bg-blue-50 border-b-blue-200" : "bg-white hover:bg-slate-50/60",
      )}
    >
      <GripVertical size={13} className="text-slate-300 hover:text-slate-400 cursor-grab active:cursor-grabbing flex-shrink-0" />
      <span className={cn("w-2 h-2 rounded-full flex-shrink-0", p.dot)} />

      {/* Title + description */}
      <div className="flex-1 min-w-0">
        <span className={cn("text-sm font-medium text-slate-800 truncate block", isDone && "line-through text-slate-400")}>
          {task.title}
        </span>
        {task.description && (
          <span className="text-xs text-slate-400 truncate block leading-snug">{task.description}</span>
        )}
      </div>

      {/* Meta — hidden on very small screens */}
      <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
        {task.shiftLabel && (
          <span className="inline-flex items-center gap-1 text-xs text-blue-600 whitespace-nowrap">
            <Link2 size={10} />{task.shiftLabel}
          </span>
        )}
        {task.assigneeName && (
          <span className="inline-flex items-center gap-1 text-xs text-slate-500 whitespace-nowrap">
            <User size={10} />{task.assigneeName}
          </span>
        )}
        {task.dueDate && (
          <span className="inline-flex items-center gap-1 text-xs text-slate-500 whitespace-nowrap">
            <CalendarDays size={10} />
            {new Date(task.dueDate + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
          </span>
        )}
      </div>

      <div className="flex-shrink-0">
        <StatusSelect task={task} onUpdate={onStatusUpdate} />
      </div>

      <div className="flex items-center gap-0.5 flex-shrink-0">
        <button onClick={(e) => { e.stopPropagation(); onEdit(task); }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
          <Pencil size={12} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

// ─── TaskListSection ───────────────────────────────────────────────────────

function TaskListSection({
  list, tasks, isExpanded, onToggle,
  onAddTask, onEditTask, onDeleteTask, onStatusUpdate, onReorder,
  onEditList, onDeleteList, viewMode,
}: {
  list: TaskList | null;
  tasks: Task[];
  isExpanded: boolean;
  onToggle: () => void;
  onAddTask: (listId: string | null) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onStatusUpdate: (id: string, status: Status) => void;
  onReorder?: (ids: string[]) => void;
  onEditList?: (list: TaskList) => void;
  onDeleteList?: (id: string) => void;
  viewMode?: "grid" | "list";
}) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const handleDrop = (targetId: string) => {
    if (!draggedId || draggedId === targetId || !onReorder) return;
    const ids = tasks.map((t) => t.id);
    const fromIdx = ids.indexOf(draggedId);
    const toIdx = ids.indexOf(targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    const reordered = [...ids];
    reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, draggedId);
    onReorder(reordered);
    setDraggedId(null);
    setDragOverId(null);
  };

  const colorCfg = list ? (LIST_COLORS[list.color] ?? LIST_COLORS.blue) : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors select-none"
        onClick={onToggle}
      >
        <ChevronRight
          size={15}
          className={cn("text-slate-400 transition-transform flex-shrink-0", isExpanded && "rotate-90")}
        />

        {list === null ? (
          <FolderOpen size={15} className="text-slate-400 flex-shrink-0" />
        ) : (
          <span className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", colorCfg!.dot)} />
        )}

        <div className="flex-1 flex items-center gap-2 min-w-0">
          <span className={cn("text-sm font-semibold truncate", list === null ? "text-slate-500" : colorCfg!.text)}>
            {list === null ? "Unassigned" : list.name}
          </span>
          {list?.shift && (
            <span className="text-xs text-slate-400 whitespace-nowrap">
              {list.shift.startTime}–{list.shift.endTime}
            </span>
          )}
        </div>

        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium flex-shrink-0">
          {tasks.length}
        </span>

        {list !== null && (
          <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onEditList!(list)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Pencil size={12} />
            </button>
            <button
              onClick={() => onDeleteList!(list.id)}
              className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); onAddTask(list?.id ?? null); }}
          className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
          title="Add task to this list"
        >
          <Plus size={15} />
        </button>
      </div>

      {/* Tasks */}
      {isExpanded && (
        <div className={cn("border-t border-slate-100", viewMode === "list" ? "" : "p-3 space-y-2.5")}>
          {tasks.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-xs text-slate-400">No tasks here.</p>
              <button
                onClick={() => onAddTask(list?.id ?? null)}
                className="mt-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                + Add a task
              </button>
            </div>
          ) : viewMode === "list" ? (
            <div>
              {tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onStatusUpdate={onStatusUpdate}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                  isDragging={draggedId === task.id}
                  isDragOver={dragOverId === task.id && draggedId !== task.id}
                  onDragStart={() => setDraggedId(task.id)}
                  onDragOver={() => { if (draggedId && draggedId !== task.id) setDragOverId(task.id); }}
                  onDrop={() => handleDrop(task.id)}
                  onDragEnd={() => { setDraggedId(null); setDragOverId(null); }}
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusUpdate={onStatusUpdate}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                  isDragging={draggedId === task.id}
                  isDragOver={dragOverId === task.id && draggedId !== task.id}
                  onDragStart={() => setDraggedId(task.id)}
                  onDragOver={() => { if (draggedId && draggedId !== task.id) setDragOverId(task.id); }}
                  onDrop={() => handleDrop(task.id)}
                  onDragEnd={() => { setDraggedId(null); setDragOverId(null); }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function TasksPage() {
  const { activeBranch } = useBranch();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lists, setLists] = useState<TaskList[]>([]);
  const [shifts, setShifts] = useState<ShiftTemplate[]>([]);
  const [branchEmployees, setBranchEmployees] = useState<BranchEmployee[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [listsLoading, setListsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"all" | Status>("all");

  // Task modal
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskForm, setTaskForm] = useState<TaskForm>(EMPTY_TASK_FORM);
  const [taskSaving, setTaskSaving] = useState(false);
  const [taskError, setTaskError] = useState("");

  // List modal
  const [showListModal, setShowListModal] = useState(false);
  const [editingList, setEditingList] = useState<TaskList | null>(null);
  const [listForm, setListForm] = useState<ListForm>(EMPTY_LIST_FORM);
  const [listSaving, setListSaving] = useState(false);
  const [listError, setListError] = useState("");

  // Expanded sections
  const [expandedLists, setExpandedLists] = useState<Set<string>>(new Set(["__unassigned__"]));

  // View mode
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // History
  const [showHistory, setShowHistory] = useState(false);
  const [historyDate, setHistoryDate] = useState(TODAY_STR);
  const [historyRows, setHistoryRows] = useState<HistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedHistoryRows, setExpandedHistoryRows] = useState<Set<string>>(new Set());
  const [userRole, setUserRole] = useState<string>("staff");

  // ── Fetch ──
  const fetchTasks = useCallback(async () => {
    setTasksLoading(true);
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } finally {
      setTasksLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async (date: string) => {
    setHistoryLoading(true);
    try {
      const params = new URLSearchParams({ date });
      if (activeBranch?.id) params.set("branchId", activeBranch.id);
      const res = await fetch(`/api/tasks/shift-tasks/history?${params}`);
      const data = await res.json();
      setHistoryRows(data?.rows ?? []);
    } finally {
      setHistoryLoading(false);
    }
  }, [activeBranch?.id]);

  const fetchLists = useCallback(async () => {
    setListsLoading(true);
    try {
      const res = await fetch("/api/tasks/lists");
      const data = await res.json();
      if (Array.isArray(data)) {
        setLists(data);
        setExpandedLists((prev) => {
          const next = new Set(prev);
          data.forEach((l: TaskList) => next.add(l.id));
          return next;
        });
      }
    } finally {
      setListsLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);
  useEffect(() => { fetchLists(); }, [fetchLists]);
  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.ok ? r.json() : null).then((d) => { if (d?.role) setUserRole(d.role); });
  }, []);
  useEffect(() => { if (showHistory) fetchHistory(historyDate); }, [showHistory, historyDate, fetchHistory]);
  useEffect(() => {
    fetch("/api/hr/shifts").then((r) => r.json()).then((d) => { if (Array.isArray(d)) setShifts(d); });
  }, []);

  useEffect(() => {
    const url = activeBranch?.id
      ? `/api/employees?branchId=${activeBranch.id}&status=active`
      : "/api/employees?status=active";
    fetch(url).then((r) => r.ok ? r.json() : []).then((d) => {
      if (Array.isArray(d)) setBranchEmployees(d.map((e: any) => ({ id: e.id, name: e.name, position: e.position, department: e.department })));
    }).catch(() => {});
  }, [activeBranch?.id]);

  // ── Computed ──
  const filteredTasks = filterStatus === "all" ? tasks : tasks.filter((t) => t.status === filterStatus);
  const tasksByList = (listId: string | null) =>
    filteredTasks
      .filter((t) => listId === null ? !t.taskListId : t.taskListId === listId)
      .sort((a, b) => (a.order || Infinity) - (b.order || Infinity) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalCounts = STATUS_TABS.reduce((acc, tab) => {
    acc[tab.value] = tab.value === "all" ? tasks.length : tasks.filter((t) => t.status === tab.value).length;
    return acc;
  }, {} as Record<string, number>);

  const today = new Date().toISOString().split("T")[0];
  const overdue = tasks.filter((t) => t.status === "pending" && t.dueDate && t.dueDate < today).length;

  // ── Toggle expand ──
  const toggleList = (id: string) =>
    setExpandedLists((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  // ── Task modal ops ──
  const openCreateTask = (listId?: string | null) => {
    setEditingTask(null);
    setTaskForm({ ...EMPTY_TASK_FORM, taskListId: listId ?? "" });
    setTaskError("");
    setShowTaskModal(true);
  };

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title, description: task.description ?? "",
      dueDate: task.dueDate ?? "", dueTime: task.dueTime ?? "",
      priority: task.priority, assigneeName: task.assigneeName ?? "",
      shiftLabel: task.shiftLabel ?? "", taskListId: task.taskListId ?? "", requiresPhoto: task.requiresPhoto ?? false,
    });
    setTaskError("");
    setShowTaskModal(true);
  };

  const handleTaskSubmit = async () => {
    if (!taskForm.title.trim()) { setTaskError("Title is required."); return; }
    setTaskSaving(true); setTaskError("");
    try {
      const payload = { ...taskForm, taskListId: taskForm.taskListId || null };
      if (editingTask) {
        const res = await fetch(`/api/tasks/${editingTask.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        const updated = await res.json();
        setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? updated : t)));
      } else {
        const res = await fetch("/api/tasks", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        const created = await res.json();
        setTasks((prev) => [created, ...prev]);
      }
      setShowTaskModal(false);
    } catch {
      setTaskError("Something went wrong. Please try again.");
    } finally {
      setTaskSaving(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: Status) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    try {
      await fetch(`/api/tasks/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
      });
    } catch { fetchTasks(); }
  };

  const handleReorder = async (newIds: string[]) => {
    setTasks((prev) => {
      const updated = [...prev];
      newIds.forEach((id, i) => {
        const idx = updated.findIndex((t) => t.id === id);
        if (idx >= 0) updated[idx] = { ...updated[idx], order: i + 1 };
      });
      return updated;
    });
    try {
      await fetch("/api/tasks/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: newIds }),
      });
    } catch { fetchTasks(); }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm("Delete this task?")) return;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try { await fetch(`/api/tasks/${id}`, { method: "DELETE" }); }
    catch { fetchTasks(); }
  };

  // ── List modal ops ──
  const openCreateList = () => {
    setEditingList(null); setListForm(EMPTY_LIST_FORM); setListError(""); setShowListModal(true);
  };

  const openEditList = (list: TaskList) => {
    setEditingList(list); setListForm({ name: list.name, color: list.color, shiftId: list.shiftId ?? "" }); setListError(""); setShowListModal(true);
  };

  const handleListSubmit = async () => {
    if (!listForm.name.trim()) { setListError("Name is required."); return; }
    setListSaving(true); setListError("");
    try {
      if (editingList) {
        const res = await fetch(`/api/tasks/lists/${editingList.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(listForm),
        });
        if (!res.ok) throw new Error();
        const updated = await res.json();
        setLists((prev) => prev.map((l) => (l.id === editingList.id ? updated : l)));
      } else {
        const res = await fetch("/api/tasks/lists", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(listForm),
        });
        if (!res.ok) throw new Error();
        const created = await res.json();
        setLists((prev) => [...prev, created]);
        setExpandedLists((prev) => new Set([...prev, created.id]));
      }
      setShowListModal(false);
    } catch {
      setListError("Something went wrong. Please try again.");
    } finally {
      setListSaving(false);
    }
  };

  const handleDeleteList = async (id: string) => {
    if (!confirm("Delete this list? Tasks inside will become unassigned.")) return;
    setLists((prev) => prev.filter((l) => l.id !== id));
    setTasks((prev) => prev.map((t) => (t.taskListId === id ? { ...t, taskListId: null } : t)));
    try { await fetch(`/api/tasks/lists/${id}`, { method: "DELETE" }); }
    catch { fetchLists(); fetchTasks(); }
  };

  const loading = tasksLoading || listsLoading;
  const showUnassigned = tasksByList(null).length > 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        title="Tasks"
        subtitle="Manage and track team tasks"
        actions={
          <div className="flex items-center gap-2">
            {/* History toggle */}
            <button
              onClick={() => setShowHistory((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors shadow-sm border",
                showHistory ? "bg-violet-600 text-white border-violet-600" : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
              )}
            >
              <History size={15} />
              <span>History</span>
            </button>
            {/* View toggle */}
            {!showHistory && <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                title="Grid view"
                className={cn(
                  "p-2 transition-colors",
                  viewMode === "grid" ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-50"
                )}
              >
                <LayoutGrid size={15} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                title="List view"
                className={cn(
                  "p-2 transition-colors",
                  viewMode === "list" ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-50"
                )}
              >
                <List size={15} />
              </button>
            </div>}
            {!showHistory && <>
              <button
                onClick={openCreateList}
                className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg transition-colors shadow-sm border border-slate-200"
              >
                <ListTodo size={15} />
                <span>New List</span>
              </button>
              <button
                onClick={() => openCreateTask()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
              >
                <Plus size={16} />
                <span>New Task</span>
              </button>
            </>}
          </div>
        }
      />

      <div className="p-4 sm:p-6 space-y-4">

        {/* Overdue alert */}
        {overdue > 0 && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertTriangle size={15} className="flex-shrink-0" />
            <span><strong>{overdue}</strong> overdue {overdue === 1 ? "task" : "tasks"} need attention.</span>
          </div>
        )}

        {/* History panel */}
        {showHistory && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <History size={16} className="text-violet-500" />
                Task Completion History
              </h3>
              <div className="flex items-center gap-0.5 bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => { const d = new Date(historyDate + "T00:00:00"); d.setDate(d.getDate() - 1); setHistoryDate(d.toISOString().split("T")[0]); }}
                  className="p-1.5 hover:bg-slate-100 text-slate-500">
                  <ChevronLeft size={14} />
                </button>
                <input type="date" value={historyDate} max={TODAY_STR}
                  onChange={(e) => e.target.value && setHistoryDate(e.target.value)}
                  className="px-2 py-1.5 text-xs bg-transparent focus:outline-none cursor-pointer w-[110px]" />
                <button
                  onClick={() => { if (historyDate < TODAY_STR) { const d = new Date(historyDate + "T00:00:00"); d.setDate(d.getDate() + 1); setHistoryDate(d.toISOString().split("T")[0]); } }}
                  disabled={historyDate >= TODAY_STR}
                  className="p-1.5 hover:bg-slate-100 text-slate-500 disabled:opacity-30">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
            {historyLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-slate-300" />
              </div>
            ) : historyRows.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <CalendarDays size={24} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm text-slate-400">No shift task records for {historyDate}.</p>
                {userRole === "staff" && <p className="text-xs text-slate-400 mt-1">Records only appear when a shift with linked task lists is assigned.</p>}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {historyRows.map((row) => (
                  <div key={row.employeeId}>
                    <button
                      className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors text-left"
                      onClick={() => setExpandedHistoryRows((prev) => {
                        const n = new Set(prev);
                        n.has(row.employeeId) ? n.delete(row.employeeId) : n.add(row.employeeId);
                        return n;
                      })}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800">{row.employeeName}</p>
                        <p className="text-xs text-slate-400">{row.shiftName} · {row.shiftCode}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {row.totalCount > 0 ? (
                          <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full",
                            row.doneCount === row.totalCount ? "bg-emerald-100 text-emerald-700" :
                            row.doneCount > 0 ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500")}>
                            {row.doneCount}/{row.totalCount} done
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">No tasks</span>
                        )}
                        {row.tasks.length > 0 && <ChevronDown size={14} className={cn("text-slate-400 transition-transform", expandedHistoryRows.has(row.employeeId) && "rotate-180")} />}
                      </div>
                    </button>
                    {expandedHistoryRows.has(row.employeeId) && row.tasks.length > 0 && (
                      <div className="bg-slate-50/60 border-t border-slate-100 px-8 py-2 space-y-1">
                        {row.tasks.map((t) => (
                          <div key={t.id} className="flex items-center gap-2 py-1">
                            <span className={cn("w-1.5 h-1.5 rounded-full shrink-0",
                              t.priority === "high" ? "bg-red-400" : t.priority === "medium" ? "bg-amber-400" : "bg-slate-300")} />
                            <span className={cn("text-xs flex-1 truncate", t.status === "done" ? "line-through text-slate-400" : "text-slate-600")}>{t.title}</span>
                            <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0",
                              t.status === "done"        ? "bg-emerald-100 text-emerald-600" :
                              t.status === "in_progress" ? "bg-blue-100 text-blue-600" :
                              t.status === "skipped"     ? "bg-slate-100 text-slate-500" : "bg-slate-50 text-slate-400")}>
                              {t.status.replace("_", " ")}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Filter tabs — hidden in history mode */}
        {!showHistory && <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilterStatus(tab.value)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0",
                filterStatus === tab.value
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              )}
            >
              {tab.label}
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded-full font-semibold",
                filterStatus === tab.value ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
              )}>
                {totalCounts[tab.value] ?? 0}
              </span>
            </button>
          ))}
        </div>}

        {/* Content */}
        {!showHistory && (loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-slate-300" />
          </div>
        ) : (
          <div className="space-y-3">
            {/* Named task lists */}
            {lists.map((list) => (
              <TaskListSection
                key={list.id}
                list={list}
                tasks={tasksByList(list.id)}
                isExpanded={expandedLists.has(list.id)}
                onToggle={() => toggleList(list.id)}
                onAddTask={openCreateTask}
                onEditTask={openEditTask}
                onDeleteTask={handleDeleteTask}
                onStatusUpdate={handleStatusUpdate}
                onReorder={handleReorder}
                onEditList={openEditList}
                onDeleteList={handleDeleteList}
                viewMode={viewMode}
              />
            ))}

            {/* Unassigned section */}
            {showUnassigned && (
              <TaskListSection
                list={null}
                tasks={tasksByList(null)}
                isExpanded={expandedLists.has("__unassigned__")}
                onToggle={() => toggleList("__unassigned__")}
                onAddTask={openCreateTask}
                onEditTask={openEditTask}
                onDeleteTask={handleDeleteTask}
                onStatusUpdate={handleStatusUpdate}
                onReorder={handleReorder}
                viewMode={viewMode}
              />
            )}

            {/* Empty state */}
            {lists.length === 0 && tasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
                  <ListTodo size={22} className="text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-700">No tasks yet</p>
                <p className="text-xs text-slate-400 mt-1">Create a list to group related tasks, or add a task directly.</p>
                <div className="flex gap-2 mt-4">
                  <button onClick={openCreateList}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
                    New List
                  </button>
                  <button onClick={() => openCreateTask()}
                    className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                    New Task
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <TaskModal
          form={taskForm} setForm={setTaskForm}
          onSubmit={handleTaskSubmit} onClose={() => setShowTaskModal(false)}
          loading={taskSaving} error={taskError} isEdit={!!editingTask} lists={lists} shifts={shifts} branchEmployees={branchEmployees}
        />
      )}

      {/* List Modal */}
      {showListModal && (
        <ListModal
          form={listForm} setForm={setListForm}
          onSubmit={handleListSubmit} onClose={() => setShowListModal(false)}
          loading={listSaving} error={listError} isEdit={!!editingList} shifts={shifts}
        />
      )}
    </div>
  );
}
