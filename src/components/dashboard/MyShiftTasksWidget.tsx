"use client";

import { useState, useEffect, useCallback } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, CheckCircle2, Circle, Clock, SkipForward, Loader2, ListTodo, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const TODAY = new Date().toISOString().split("T")[0];

interface ShiftTask {
  id: string;
  title: string;
  description?: string | null;
  priority: string;
  requiresPhoto: boolean;
  listId: string;
  listName: string;
  listColor: string;
  status: string;
}

interface ShiftInfo {
  id: string;
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  color: string;
}

interface ShiftTasksData {
  tasks: ShiftTask[];
  shift: ShiftInfo | null;
  noShift?: boolean;
  noEmployee?: boolean;
}

const STATUS_OPTIONS = [
  { value: "pending",     label: "Pending",     icon: Circle,        color: "text-slate-400" },
  { value: "in_progress", label: "In Progress", icon: Clock,         color: "text-blue-500"  },
  { value: "done",        label: "Done",         icon: CheckCircle2,  color: "text-emerald-500" },
  { value: "skipped",     label: "Skipped",      icon: SkipForward,   color: "text-slate-400" },
];

const PRIORITY_DOT: Record<string, string> = {
  high:   "bg-red-400",
  medium: "bg-amber-400",
  low:    "bg-slate-300",
};

const COLOR_BADGE: Record<string, string> = {
  blue:   "bg-blue-100 text-blue-700",
  green:  "bg-emerald-100 text-emerald-700",
  red:    "bg-red-100 text-red-700",
  yellow: "bg-amber-100 text-amber-700",
  purple: "bg-violet-100 text-violet-700",
  orange: "bg-orange-100 text-orange-700",
  pink:   "bg-pink-100 text-pink-700",
  teal:   "bg-teal-100 text-teal-700",
};

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function shiftDate(current: string, days: number): string {
  const d = new Date(current + "T00:00:00");
  d.setDate(d.getDate() + days);
  const s = d.toISOString().split("T")[0];
  return s > TODAY ? TODAY : s;
}

export function MyShiftTasksWidget({ employeeId }: { employeeId?: string | null }) {
  const [selectedDate, setSelectedDate] = useState(TODAY);
  const [data, setData] = useState<ShiftTasksData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const isToday = selectedDate === TODAY;
  const isPast  = selectedDate < TODAY;

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ date: selectedDate });
    if (employeeId) params.set("employeeId", employeeId);
    fetch(`/api/tasks/shift-tasks?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [selectedDate, employeeId]);

  useEffect(() => { load(); }, [load]);

  // Listen for pull-to-refresh
  useEffect(() => {
    window.addEventListener("pull-refresh", load);
    return () => window.removeEventListener("pull-refresh", load);
  }, [load]);

  const updateStatus = async (taskId: string, status: string) => {
    if (isPast) return;
    setUpdating(taskId);
    setData((prev) =>
      prev ? { ...prev, tasks: prev.tasks.map((t) => t.id === taskId ? { ...t, status } : t) } : prev
    );
    await fetch("/api/tasks/shift-tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, date: selectedDate, status, employeeId }),
    });
    setUpdating(null);
  };

  const doneCount  = data?.tasks.filter((t) => t.status === "done").length ?? 0;
  const totalCount = data?.tasks.length ?? 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <ListTodo size={16} className="text-blue-500" />
          <h3 className="text-base font-semibold text-slate-900">My Shift Tasks</h3>
          {totalCount > 0 && (
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full font-medium",
              doneCount === totalCount ? "bg-emerald-100 text-emerald-700" : "bg-blue-50 text-blue-600"
            )}>
              {doneCount}/{totalCount} done
            </span>
          )}
        </div>
        {/* Date navigator */}
        <div className="flex items-center gap-0.5 bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setSelectedDate((d) => shiftDate(d, -1))}
            className="p-1.5 hover:bg-slate-100 text-slate-500 transition-colors">
            <ChevronLeft size={14} />
          </button>
          <div className="relative flex items-center">
            <CalendarDays size={12} className="absolute left-2 text-slate-400 pointer-events-none" />
            <input
              type="date"
              value={selectedDate}
              max={TODAY}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="pl-7 pr-2 py-1.5 text-xs text-slate-700 bg-transparent focus:outline-none cursor-pointer w-[120px]"
            />
          </div>
          <button
            onClick={() => setSelectedDate((d) => shiftDate(d, 1))}
            disabled={isToday}
            className="p-1.5 hover:bg-slate-100 text-slate-500 transition-colors disabled:opacity-30">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Date label + shift badge */}
      {(isPast || data?.shift) && (
        <div className="flex items-center gap-2 px-5 pt-3 pb-0">
          {isPast && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium border border-amber-200">
              {fmtDate(selectedDate)}
            </span>
          )}
          {data?.shift && (
            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", COLOR_BADGE[data.shift.color] ?? "bg-slate-100 text-slate-600")}>
              {data.shift.code} · {data.shift.startTime}–{data.shift.endTime}
            </span>
          )}
          {isPast && (
            <span className="text-xs text-slate-400 ml-auto">Read-only</span>
          )}
        </div>
      )}

      {/* Body */}
      <div className="flex-1 min-h-[120px]">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={20} className="animate-spin text-slate-300" />
          </div>
        ) : data?.noEmployee ? (
          <div className="px-5 py-8 text-center">
            <AlertCircle size={24} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-slate-400">No employee record linked to your account.</p>
          </div>
        ) : data?.noShift ? (
          <div className="px-5 py-8 text-center">
            <CalendarDays size={24} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-slate-400">No shift assigned {isToday ? "today" : "on this date"}.</p>
          </div>
        ) : data?.tasks.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <ListTodo size={24} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-slate-400">No tasks linked to your shift.</p>
            <p className="text-xs text-slate-400 mt-1">{data.shift?.name}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {data!.tasks.map((task) => {
              const statusOpt = STATUS_OPTIONS.find((s) => s.value === task.status) ?? STATUS_OPTIONS[0];
              const StatusIcon = statusOpt.icon;
              return (
                <div key={task.id} className={cn(
                  "flex items-start gap-3 px-5 py-3 transition-colors",
                  task.status === "done" ? "bg-emerald-50/40" :
                  task.status === "skipped" ? "opacity-50" : "hover:bg-slate-50/60"
                )}>
                  {/* Priority dot */}
                  <span className={cn("mt-1.5 w-2 h-2 rounded-full shrink-0", PRIORITY_DOT[task.priority] ?? "bg-slate-300")} />

                  {/* Title + list */}
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium text-slate-800 leading-tight truncate",
                      task.status === "done" && "line-through text-slate-400")}>
                      {task.title}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{task.listName}</p>
                  </div>

                  {/* Status — dropdown for today, badge for past */}
                  {!isPast ? (
                    <div className="relative shrink-0">
                      {updating === task.id ? (
                        <Loader2 size={14} className="animate-spin text-slate-400 mt-1" />
                      ) : (
                        <select
                          value={task.status}
                          onChange={(e) => updateStatus(task.id, e.target.value)}
                          className={cn(
                            "text-xs font-medium rounded-lg px-2 py-1 border focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer appearance-none pr-6",
                            task.status === "done"        ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            task.status === "in_progress" ? "bg-blue-50 text-blue-700 border-blue-200" :
                            task.status === "skipped"     ? "bg-slate-50 text-slate-500 border-slate-200" :
                                                            "bg-white text-slate-600 border-slate-200"
                          )}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  ) : (
                    <span className={cn(
                      "text-xs font-medium px-2 py-1 rounded-lg shrink-0",
                      task.status === "done"        ? "bg-emerald-50 text-emerald-700" :
                      task.status === "in_progress" ? "bg-blue-50 text-blue-700" :
                      task.status === "skipped"     ? "bg-slate-50 text-slate-500" :
                                                      "bg-slate-50 text-slate-400"
                    )}>
                      {statusOpt.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {!isPast && data?.tasks && data.tasks.length > 0 && (
        <div className="px-5 py-3 border-t border-slate-100">
          <div className="w-full bg-slate-100 rounded-full h-1.5">
            <div
              className={cn("h-1.5 rounded-full transition-all", doneCount === totalCount ? "bg-emerald-500" : "bg-blue-500")}
              style={{ width: totalCount > 0 ? `${(doneCount / totalCount) * 100}%` : "0%" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
