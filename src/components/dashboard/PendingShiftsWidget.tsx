"use client";

import { useState } from "react";
import { CalendarDays, CheckCircle2, XCircle, Clock } from "lucide-react";

interface PendingShift {
  id: string;
  date: string;
  shiftCode: string | null;
  shiftName: string | null;
  shiftStart: string | null;
  shiftEnd: string | null;
  branchId: string;
  note: string | null;
}

export function PendingShiftsWidget({ initialShifts }: { initialShifts: PendingShift[] }) {
  const [shifts, setShifts] = useState(initialShifts);
  const [acting, setActing] = useState<string | null>(null);

  async function respond(id: string, status: "confirmed" | "rejected") {
    setActing(id);
    try {
      const res = await fetch(`/api/hr/shifts/assignments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmStatus: status }),
      });
      if (res.ok) {
        setShifts((prev) => prev.filter((s) => s.id !== id));
      }
    } finally {
      setActing(null);
    }
  }

  function fmtDate(dateStr: string) {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
        <CalendarDays size={16} className="text-amber-500" />
        <h3 className="text-base font-semibold text-slate-900">Pending Shift Confirmations</h3>
        {shifts.length > 0 && (
          <span className="ml-auto text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">
            {shifts.length}
          </span>
        )}
      </div>

      {shifts.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-slate-400">
          No pending shift confirmations — you&apos;re all caught up!
        </div>
      ) : (
        <div className="divide-y divide-slate-50">
          {shifts.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                  <Clock size={14} className="text-amber-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {s.shiftName ? `${s.shiftName} (${s.shiftCode})` : "Day Off"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {fmtDate(s.date)}
                    {s.shiftStart && s.shiftEnd && (
                      <span className="ml-1 text-slate-400">· {s.shiftStart}–{s.shiftEnd}</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => respond(s.id, "confirmed")}
                  disabled={acting === s.id}
                  title="Confirm shift"
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                >
                  <CheckCircle2 size={12} />
                  Confirm
                </button>
                <button
                  onClick={() => respond(s.id, "rejected")}
                  disabled={acting === s.id}
                  title="Reject shift"
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
                >
                  <XCircle size={12} />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
