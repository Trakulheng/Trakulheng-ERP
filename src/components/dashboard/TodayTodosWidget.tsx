"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Circle,
  Clock,
  Camera,
  X,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Upload,
} from "lucide-react";
import Link from "next/link";

interface ShiftTodoLog {
  id: string;
  todoId: string;
  date: string;
  employeeId: string;
  completedAt: string | null;
  photoUrl: string | null;
  notes: string | null;
}

interface ShiftTodoWithLog {
  id: string;
  shiftId: string;
  name: string;
  sequence: number;
  expectedMinutes: number;
  logs: ShiftTodoLog[];
}

function fmtMinutes(m: number) {
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem ? `${h}h ${rem}m` : `${h}h`;
}

function toISODate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ─── Complete To-do Modal ─────────────────────────────────────────────────────

function CompleteModal({
  todo,
  employeeId,
  date,
  onClose,
  onDone,
}: {
  todo: ShiftTodoWithLog;
  employeeId: string;
  date: string;
  onClose: () => void;
  onDone: (log: ShiftTodoLog) => void;
}) {
  const [notes, setNotes] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError("Image must be under 2 MB"); return; }
    const reader = new FileReader();
    reader.onload = () => setPhotoDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit() {
    if (!photoDataUrl) { setError("Please attach a photo to complete this to-do."); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/hr/shifts/todos/${todo.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, employeeId, photoUrl: photoDataUrl, notes: notes || null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to save."); return; }
      onDone(data);
    } catch {
      setError("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Complete To-do</h3>
            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[220px]">{todo.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg">
            <X size={15} className="text-slate-500" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          {/* Photo upload */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Photo <span className="text-red-500">*</span>
            </label>
            {photoDataUrl ? (
              <div className="relative">
                <img src={photoDataUrl} alt="completion" className="w-full h-40 object-cover rounded-xl border border-slate-200" />
                <button
                  onClick={() => setPhotoDataUrl(null)}
                  className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full h-28 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
              >
                <Camera size={22} />
                <span className="text-xs font-medium">Tap to attach photo</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={handleFile} capture="environment" />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any remarks or observations…"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        <div className="flex gap-3 px-5 py-4 border-t border-slate-100">
          <button onClick={onClose} disabled={saving} className="flex-1 px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !photoDataUrl}
            className="flex-1 px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {saving ? (
              <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-3.5 h-3.5" />
            ) : (
              <CheckCircle2 size={14} />
            )}
            {saving ? "Saving…" : "Mark Complete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Widget ──────────────────────────────────────────────────────────────

export function TodayTodosWidget({
  shiftId,
  employeeId,
}: {
  shiftId?: string | null;
  employeeId?: string | null;
}) {
  const today = toISODate(new Date());
  const [todos, setTodos] = useState<ShiftTodoWithLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingTodo, setCompletingTodo] = useState<ShiftTodoWithLog | null>(null);
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);

  useEffect(() => {
    const url = new URL("/api/hr/shifts/todos/today", window.location.origin);
    url.searchParams.set("date", today);
    if (shiftId) url.searchParams.set("shiftId", shiftId);

    fetch(url.toString())
      .then((r) => r.ok ? r.json() : [])
      .then(setTodos)
      .catch(() => setTodos([]))
      .finally(() => setLoading(false));
  }, [today, shiftId]);

  const effectiveEmpId = employeeId ?? "unknown";

  function isCompleted(todo: ShiftTodoWithLog) {
    return todo.logs.some((l) => l.completedAt !== null);
  }

  function getLog(todo: ShiftTodoWithLog) {
    return todo.logs.find((l) => l.completedAt !== null) ?? null;
  }

  function handleCompleted(log: ShiftTodoLog) {
    setTodos((prev) =>
      prev.map((t) =>
        t.id === log.todoId ? { ...t, logs: [...t.logs.filter((l) => l.todoId !== log.todoId), log] } : t
      )
    );
    setCompletingTodo(null);
  }

  const doneCount = todos.filter(isCompleted).length;
  const total = todos.length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <ClipboardList size={16} className="text-blue-500" />
          <h3 className="text-base font-semibold text-slate-900">Today&#39;s To-do List</h3>
        </div>
        {total > 0 && (
          <span className={cn(
            "text-xs font-semibold px-2 py-0.5 rounded-full",
            doneCount === total ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
          )}>
            {doneCount}/{total} done
          </span>
        )}
      </div>

      {loading ? (
        <div className="px-5 py-8 text-center text-sm text-slate-400">Loading…</div>
      ) : todos.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <ClipboardList size={28} className="mx-auto text-slate-200 mb-2" />
          <p className="text-sm text-slate-400">No to-dos for today.</p>
          <p className="text-xs text-slate-300 mt-1">
            To-dos are added in{" "}
            <Link href="/hr/shifts" className="text-blue-500 hover:underline">Shift Management</Link>.
          </p>
        </div>
      ) : (
        <>
          {/* Progress bar */}
          <div className="px-5 pt-3 pb-2">
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full bg-emerald-500 transition-all"
                style={{ width: total > 0 ? `${(doneCount / total) * 100}%` : "0%" }}
              />
            </div>
          </div>

          <div className="divide-y divide-slate-50 pb-2">
            {todos.map((todo) => {
              const done = isCompleted(todo);
              const log = getLog(todo);

              return (
                <div
                  key={todo.id}
                  className={cn("flex items-start gap-3 px-5 py-3", done && "bg-emerald-50/40")}
                >
                  {/* Status icon / complete button */}
                  {done ? (
                    <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <button
                      onClick={() => setCompletingTodo(todo)}
                      className="shrink-0 mt-0.5 text-slate-300 hover:text-blue-500 transition-colors"
                      title="Mark complete"
                    >
                      <Circle size={18} />
                    </button>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium", done ? "line-through text-slate-400" : "text-slate-800")}>
                      <span className="text-xs text-slate-400 font-normal mr-1.5">#{todo.sequence}</span>
                      {todo.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Clock size={10} className="text-slate-300" />
                      <span className="text-xs text-slate-400">{fmtMinutes(todo.expectedMinutes)}</span>
                      {done && log?.completedAt && (
                        <span className="text-xs text-emerald-600 font-medium">
                          ✓ {new Date(log.completedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </div>
                    {log?.notes && (
                      <p className="text-xs text-slate-400 italic mt-0.5 truncate">{log.notes}</p>
                    )}
                  </div>

                  {/* Photo thumbnail */}
                  {log?.photoUrl && (
                    <button
                      onClick={() => setExpandedPhoto(log.photoUrl!)}
                      className="shrink-0"
                      title="View photo"
                    >
                      <img
                        src={log.photoUrl}
                        alt="completion"
                        className="w-10 h-10 object-cover rounded-lg border border-slate-200 hover:opacity-80 transition-opacity"
                      />
                    </button>
                  )}

                  {/* Complete button if not done */}
                  {!done && (
                    <button
                      onClick={() => setCompletingTodo(todo)}
                      className="shrink-0 flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                    >
                      <Upload size={10} />
                      Done
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Complete modal */}
      {completingTodo && (
        <CompleteModal
          todo={completingTodo}
          employeeId={effectiveEmpId}
          date={today}
          onClose={() => setCompletingTodo(null)}
          onDone={handleCompleted}
        />
      )}

      {/* Expanded photo */}
      {expandedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setExpandedPhoto(null)}
        >
          <img src={expandedPhoto} alt="completion photo" className="max-w-full max-h-full rounded-xl object-contain" />
        </div>
      )}
    </div>
  );
}
