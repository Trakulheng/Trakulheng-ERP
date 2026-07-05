"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import {
  Plus, Loader2, Trash2, Pencil, X, CheckCircle2, Clock, CircleDot,
  XCircle, CalendarDays, Timer, User, Link2, ChevronDown, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
}

const EMPTY_FORM: TaskForm = {
  title: "", description: "", dueDate: "", dueTime: "",
  priority: "medium", assigneeName: "", shiftLabel: "",
};

// ─── Status config ─────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<Status, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  pending:     { label: "Pending",     icon: Clock,         color: "text-amber-700",  bg: "bg-amber-50",   border: "border-amber-200" },
  in_progress: { label: "In Progress", icon: CircleDot,     color: "text-blue-700",   bg: "bg-blue-50",    border: "border-blue-200" },
  done:        { label: "Done",        icon: CheckCircle2,  color: "text-emerald-700",bg: "bg-emerald-50", border: "border-emerald-200" },
  cancelled:   { label: "Cancelled",   icon: XCircle,       color: "text-slate-500",  bg: "bg-slate-100",  border: "border-slate-200" },
};

const PRIORITY_CONFIG: Record<Priority, { label: string; dot: string; badge: string }> = {
  low:    { label: "Low",    dot: "bg-slate-400",   badge: "bg-slate-100 text-slate-600" },
  medium: { label: "Medium", dot: "bg-amber-400",   badge: "bg-amber-100 text-amber-700" },
  high:   { label: "High",   dot: "bg-red-500",     badge: "bg-red-100 text-red-700" },
};

const STATUS_TABS: { value: "all" | Status; label: string }[] = [
  { value: "all",         label: "All" },
  { value: "pending",     label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "done",        label: "Done" },
  { value: "cancelled",   label: "Cancelled" },
];

// ─── Status badge ──────────────────────────────────────────────────────────

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

// ─── Inline status selector ────────────────────────────────────────────────

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
        onClick={() => setOpen((v) => !v)}
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
                onClick={() => handle(s)}
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

// ─── Task Card ─────────────────────────────────────────────────────────────

function TaskCard({
  task, onStatusUpdate, onEdit, onDelete,
}: {
  task: Task;
  onStatusUpdate: (id: string, status: Status) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}) {
  const p = PRIORITY_CONFIG[task.priority];
  const isDone = task.status === "done" || task.status === "cancelled";

  return (
    <div className={cn(
      "bg-white rounded-xl border border-slate-200 p-4 shadow-sm transition-opacity",
      isDone && "opacity-60"
    )}>
      {/* Top row */}
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
          <button onClick={() => onEdit(task)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <Pencil size={13} />
          </button>
          <button onClick={() => onDelete(task.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Meta row */}
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

      {/* Bottom row: priority + status selector */}
      <div className="flex items-center justify-between mt-3 ml-5 gap-2">
        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", p.badge)}>{p.label}</span>
        <StatusSelect task={task} onUpdate={onStatusUpdate} />
      </div>
    </div>
  );
}

// ─── Task Form Modal ────────────────────────────────────────────────────────

function TaskModal({
  form, setForm, onSubmit, onClose, loading, isEdit,
}: {
  form: TaskForm;
  setForm: React.Dispatch<React.SetStateAction<TaskForm>>;
  onSubmit: () => void;
  onClose: () => void;
  loading: boolean;
  isEdit: boolean;
}) {
  const set = (k: keyof TaskForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-base font-semibold text-slate-900">{isEdit ? "Edit Task" : "New Task"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.title}
              onChange={set("title")}
              placeholder="What needs to be done?"
              autoFocus
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={set("description")}
              placeholder="Optional details..."
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <span className="flex items-center gap-1"><CalendarDays size={13} />Due Date</span>
              </label>
              <input
                type="date"
                value={form.dueDate}
                onChange={set("dueDate")}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <span className="flex items-center gap-1"><Timer size={13} />Time (HH:MM)</span>
              </label>
              <input
                type="time"
                value={form.dueTime}
                onChange={set("dueTime")}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Priority</label>
            <select
              value={form.priority}
              onChange={set("priority")}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              <span className="flex items-center gap-1"><User size={13} />Assign to Staff</span>
            </label>
            <input
              type="text"
              value={form.assigneeName}
              onChange={set("assigneeName")}
              placeholder="Employee name"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              <span className="flex items-center gap-1"><Link2 size={13} />Link to Shift (optional)</span>
            </label>
            <input
              type="text"
              value={form.shiftLabel}
              onChange={set("shiftLabel")}
              placeholder="e.g. Morning Shift – Jul 5"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={loading || !form.title.trim()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"all" | Status>("all");
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form, setForm] = useState<TaskForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ── Fetch ──
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks?status=${filterStatus}`);
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // Close status dropdowns when clicking outside
  useEffect(() => {
    const handler = () => document.dispatchEvent(new CustomEvent("close-dropdowns"));
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  // ── Open modal ──
  const openCreate = () => { setEditingTask(null); setForm(EMPTY_FORM); setError(""); setShowModal(true); };
  const openEdit = (task: Task) => {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description ?? "",
      dueDate: task.dueDate ?? "",
      dueTime: task.dueTime ?? "",
      priority: task.priority,
      assigneeName: task.assigneeName ?? "",
      shiftLabel: task.shiftLabel ?? "",
    });
    setError("");
    setShowModal(true);
  };

  // ── Submit ──
  const handleSubmit = async () => {
    if (!form.title.trim()) { setError("Title is required."); return; }
    setSaving(true);
    setError("");
    try {
      if (editingTask) {
        const res = await fetch(`/api/tasks/${editingTask.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error();
        const updated = await res.json();
        setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? updated : t)));
      } else {
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error();
        const created = await res.json();
        setTasks((prev) => [created, ...prev]);
      }
      setShowModal(false);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Status update ──
  const handleStatusUpdate = async (id: string, status: Status) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    try {
      await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch {
      fetchTasks(); // revert on error
    }
  };

  // ── Delete ──
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this task?")) return;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    } catch {
      fetchTasks();
    }
  };

  // ── Counts ──
  const counts = STATUS_TABS.reduce((acc, t) => {
    acc[t.value] = t.value === "all" ? tasks.length : tasks.filter((task) => task.status === t.value).length;
    return acc;
  }, {} as Record<string, number>);

  const displayed = filterStatus === "all" ? tasks : tasks.filter((t) => t.status === filterStatus);

  // ── Pending overdue detection ──
  const today = new Date().toISOString().split("T")[0];
  const overdue = displayed.filter(
    (t) => t.status === "pending" && t.dueDate && t.dueDate < today
  ).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        title="Tasks"
        subtitle="Manage and track team tasks"
        actions={
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
          >
            <Plus size={16} />
            <span>New Task</span>
          </button>
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

        {/* Filter tabs – horizontal scroll on mobile */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
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
                {counts[tab.value] ?? 0}
              </span>
            </button>
          ))}
        </div>

        {/* Task list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-slate-400" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <CheckCircle2 size={26} className="text-slate-400" />
            </div>
            <p className="text-slate-700 font-medium">No tasks here</p>
            <p className="text-slate-500 text-sm mt-1">
              {filterStatus === "all" ? "Create your first task to get started." : `No ${filterStatus.replace("_", " ")} tasks.`}
            </p>
            {filterStatus === "all" && (
              <button
                onClick={openCreate}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg"
              >
                <Plus size={15} /> New Task
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {displayed.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusUpdate={handleStatusUpdate}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <TaskModal
          form={form}
          setForm={setForm}
          onSubmit={handleSubmit}
          onClose={() => setShowModal(false)}
          loading={saving}
          isEdit={!!editingTask}
        />
      )}
      {error && showModal && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-red-600 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg z-[60]">
          {error}
        </div>
      )}
    </div>
  );
}
