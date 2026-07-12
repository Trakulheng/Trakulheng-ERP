"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, CircleDot, XCircle, CalendarDays, ListTodo, User } from "lucide-react";
import Link from "next/link";

interface Task {
  id: string;
  title: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "in_progress" | "done" | "cancelled";
  dueDate?: string | null;
  assigneeName?: string | null;
}

const STATUS_CFG = {
  pending:     { icon: Clock,        color: "text-amber-600",   bg: "bg-amber-50"   },
  in_progress: { icon: CircleDot,    color: "text-blue-600",    bg: "bg-blue-50"    },
  done:        { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
  cancelled:   { icon: XCircle,      color: "text-slate-400",   bg: "bg-slate-50"   },
};

const PRIORITY_DOT: Record<string, string> = {
  low:    "bg-slate-400",
  medium: "bg-amber-400",
  high:   "bg-red-500",
};

export function MyTasksWidget({ userName }: { userName?: string | null }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

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
            const s = STATUS_CFG[task.status];
            const Icon = s.icon;
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
                <span className={cn("inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0", s.color, s.bg)}>
                  <Icon size={10} />
                  {task.status === "in_progress" ? "In progress" : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
