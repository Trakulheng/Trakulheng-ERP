"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { CalendarDays, ListTodo, Loader2 } from "lucide-react";
import Link from "next/link";

interface Task {
  id: string;
  title: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "in_progress" | "done" | "cancelled";
  dueDate?: string | null;
  assigneeName?: string | null;
}

const STATUS_OPTIONS = [
  { value: "pending",     label: "Pending"     },
  { value: "in_progress", label: "In Progress" },
  { value: "done",        label: "Done"        },
  { value: "cancelled",   label: "Cancelled"   },
];

const STATUS_SELECT_CLS: Record<string, string> = {
  pending:     "bg-amber-50 text-amber-700 border-amber-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  done:        "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled:   "bg-slate-50 text-slate-500 border-slate-200",
};

const PRIORITY_DOT: Record<string, string> = {
  low:    "bg-slate-400",
  medium: "bg-amber-400",
  high:   "bg-red-500",
};

export function MyTasksWidget({ userName }: { userName?: string | null }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const updateStatus = async (taskId: string, status: Task["status"]) => {
    const prev = tasks;
    setUpdating(taskId);
    setTasks((ts) => ts.map((t) => (t.id === taskId ? { ...t, status } : t)));
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) setTasks(prev);
    } catch {
      setTasks(prev);
    } finally {
      setUpdating(null);
    }
  };

  useEffect(() => {
    fetch("/api/tasks")
      .then((r) => r.ok ? r.json() : [])
      .then((data: Task[]) => {
        if (!Array.isArray(data)) { setTasks([]); return; }
        const relevant = userName
          ? data.filter((t) => !t.assigneeName || t.assigneeName === userName)
          : data;
        setTasks(relevant.slice(0, 6));
      })
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, [userName]);

  const pending = tasks.filter((t) => t.status === "pending" || t.status === "in_progress").length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <ListTodo size={16} className="text-indigo-500" />
          <h3 className="text-base font-semibold text-slate-900">My Tasks</h3>
        </div>
        <div className="flex items-center gap-3">
          {pending > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
              {pending} open
            </span>
          )}
          <Link href="/tasks" className="text-sm text-blue-600 hover:underline">View all</Link>
        </div>
      </div>

      {loading ? (
        <div className="px-5 py-8 text-center text-sm text-slate-400">Loading…</div>
      ) : tasks.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <ListTodo size={28} className="mx-auto text-slate-200 mb-2" />
          <p className="text-sm text-slate-400">No tasks assigned to you.</p>
          <Link href="/tasks" className="mt-1.5 inline-block text-sm text-blue-600 hover:underline">Browse tasks</Link>
        </div>
      ) : (
        <div className="divide-y divide-slate-50">
          {tasks.map((task) => {
            const isDone = task.status === "done" || task.status === "cancelled";
            return (
              <div key={task.id} className={cn("flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors", isDone && "opacity-60")}>
                <span className={cn("w-2 h-2 rounded-full flex-shrink-0", PRIORITY_DOT[task.priority])} />
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium text-slate-800 truncate", isDone && "line-through text-slate-400")}>{task.title}</p>
                  {task.dueDate && (
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <CalendarDays size={10} />
                      {new Date(task.dueDate + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </p>
                  )}
                </div>
                {updating === task.id ? (
                  <Loader2 size={14} className="animate-spin text-slate-400 flex-shrink-0" />
                ) : (
                  <select
                    value={task.status}
                    onChange={(e) => updateStatus(task.id, e.target.value as Task["status"])}
                    className={cn(
                      "text-xs font-medium rounded-lg px-2 py-1 border focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer appearance-none pr-5 flex-shrink-0",
                      STATUS_SELECT_CLS[task.status]
                    )}
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
