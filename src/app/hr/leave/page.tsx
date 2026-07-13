"use client";

import { Header } from "@/components/layout/Header";
import { usePermissions } from "@/lib/use-permissions";
import { Plus, X, Loader2, CheckCircle2, Clock, XCircle, CalendarDays, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useBranch } from "@/context/BranchContext";
import { cn } from "@/lib/utils";

// ── Constants ────────────────────────────────────────────────────────────────

const statusColors: Record<string, string> = {
  approved: "bg-emerald-100 text-emerald-700",
  pending:  "bg-amber-100 text-amber-700",
  rejected: "bg-red-100 text-red-700",
};
const StatusIcon: Record<string, React.ElementType> = {
  approved: CheckCircle2, pending: Clock, rejected: XCircle,
};
const colorBadge: Record<string, string> = {
  blue: "bg-blue-100 text-blue-700", red: "bg-red-100 text-red-700",
  emerald: "bg-emerald-100 text-emerald-700", amber: "bg-amber-100 text-amber-700",
  violet: "bg-violet-100 text-violet-700", pink: "bg-pink-100 text-pink-700",
  indigo: "bg-indigo-100 text-indigo-700", slate: "bg-slate-100 text-slate-600",
};
const colorRange: Record<string, string> = {
  blue: "bg-blue-100", red: "bg-red-100", emerald: "bg-emerald-100", amber: "bg-amber-100",
  violet: "bg-violet-100", pink: "bg-pink-100", indigo: "bg-indigo-100", slate: "bg-slate-100",
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface LeaveRow {
  id: string; employeeId: string; empCode: string; empName: string;
  type: string; fromDate: string; toDate: string; days: number; status: string;
  note?: string | null; reviewNote?: string | null; createdAt: string;
}
interface Employee { prismaId: string; id: string; name: string; }
interface LeaveTypeOption { id: string; name: string; color: string; daysPerYear: number; isPaid: boolean; requireDoc: boolean; }
interface BalanceItem { id: string; name: string; color: string; daysPerYear: number; used: number; pending: number; remaining: number | null; }
interface Me { id: string; name: string; email: string; role: string; employeePrismaId?: string | null; employeeName?: string | null; employmentType?: string | null; }

function calcDays(from: string, to: string) {
  if (!from || !to) return 0;
  return Math.max(1, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000) + 1);
}

// ── Mini Calendar ─────────────────────────────────────────────────────────────

function MonthCalendar({
  year, month, fromDate, toDate, approvedRanges,
  onSelect,
}: {
  year: number; month: number; fromDate: string; toDate: string;
  approvedRanges: { from: string; to: string; color: string }[];
  onSelect: (dateStr: string) => void;
}) {
  const today = new Date(); today.setHours(0,0,0,0);
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  const pad = (d: number) => `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;

  const isInRange = (ds: string) => fromDate && toDate && ds >= fromDate && ds <= toDate;
  const isFrom    = (ds: string) => ds === fromDate;
  const isTo      = (ds: string) => ds === toDate;
  const isToday   = (d: number) => { const ds = pad(d); return new Date(ds).toDateString() === today.toDateString(); };

  const rangeColor = (ds: string) => {
    const r = approvedRanges.find((r) => ds >= r.from && ds <= r.to);
    return r ? colorRange[r.color] ?? "bg-slate-100" : null;
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="flex-1">
      <p className="text-xs font-semibold text-slate-700 text-center mb-2">{MONTH_NAMES[month]} {year}</p>
      <div className="grid grid-cols-7 text-center">
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
          <span key={d} className="text-xs text-slate-400 font-medium py-1">{d}</span>
        ))}
        {cells.map((d, i) => {
          if (!d) return <span key={i} />;
          const ds = pad(d);
          const inSel = isInRange(ds);
          const isF = isFrom(ds);
          const isT = isTo(ds);
          const aColor = rangeColor(ds);
          return (
            <button
              key={i} type="button" onClick={() => onSelect(ds)}
              className={cn(
                "text-xs py-1 mx-0.5 my-0.5 rounded-lg font-medium transition-colors relative",
                isF || isT ? "bg-blue-600 text-white" :
                inSel ? "bg-blue-100 text-blue-800" :
                aColor ? `${aColor} text-slate-600` :
                isToday(d) ? "ring-1 ring-blue-400 text-blue-600 hover:bg-blue-50" :
                "text-slate-700 hover:bg-slate-100"
              )}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Leave Request Modal ───────────────────────────────────────────────────────

interface ModalProps {
  leaveTypes: LeaveTypeOption[];
  defaultEmployeeId: string;
  employeeName: string;
  myLeaveRows: LeaveRow[];
  onClose: () => void;
  onSubmitted: (row: LeaveRow) => void;
}

function LeaveModal({ leaveTypes, defaultEmployeeId, employeeName, myLeaveRows, onClose, onSubmitted }: ModalProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [employeeId, setEmployeeId]     = useState(defaultEmployeeId);
  const [type,       setType]           = useState(leaveTypes[0]?.name ?? "Annual Leave");
  const [fromDate,   setFromDate]       = useState("");
  const [toDate,     setToDate]         = useState("");
  const [note,       setNote]           = useState("");
  const [submitting, setSubmitting]     = useState(false);
  const [error,      setError]          = useState("");
  const [balance,    setBalance]        = useState<BalanceItem[]>([]);

  // Which month to show: current and next
  const now = new Date();
  const [calMonthOffset, setCalMonthOffset] = useState(0); // 0 = this month

  const calYear0  = new Date(now.getFullYear(), now.getMonth() + calMonthOffset,     1);
  const calYear1  = new Date(now.getFullYear(), now.getMonth() + calMonthOffset + 1, 1);

  useEffect(() => {
    if (!employeeId) return;
    fetch(`/api/hr/leave/balance?employeeId=${employeeId}&year=${now.getFullYear()}`)
      .then((r) => r.ok ? r.json() : [])
      .then(setBalance)
      .catch(() => {});
  }, [employeeId]);

  const selectedBalance = balance.find((b) => b.name === type);

  // Date range selection: first click = from, second click = to (or if before from, reset)
  const handleDateClick = (ds: string) => {
    if (!fromDate || (fromDate && toDate)) {
      setFromDate(ds); setToDate("");
    } else if (ds < fromDate) {
      setFromDate(ds); setToDate("");
    } else {
      setToDate(ds);
    }
  };

  const approvedRanges = myLeaveRows
    .filter((r) => r.status === "approved" && r.employeeId === employeeId)
    .map((r) => {
      const lt = leaveTypes.find((t) => t.name === r.type);
      return { from: r.fromDate, to: r.toDate, color: lt?.color ?? "slate" };
    });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!fromDate || !toDate) { setError("Please select a date range on the calendar."); return; }
    if (toDate < fromDate) { setError("End date must be after start date."); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/hr/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // employeeId may be empty — server will fall back to session user's employee record
        body: JSON.stringify({ employeeId: employeeId || undefined, type, fromDate, toDate, days: calcDays(fromDate, toDate), note }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to submit."); return; }
      onSubmitted(data);
      onClose();
    } catch { setError("Network error. Please try again."); }
    finally { setSubmitting(false); }
  }

  const days = calcDays(fromDate, toDate);

  return (
    <div className="fixed inset-0 h-screen z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-base font-bold text-slate-900">New Leave Request</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-5">
            {/* Employee (read-only — always the requester) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Employee</label>
                <div className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-700 font-medium">
                  {employeeName || "—"}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Leave Type</label>
                <select value={type} onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  {leaveTypes.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
                </select>
              </div>
            </div>

            {/* Leave balance for selected type */}
            {selectedBalance && (
              <div className={cn("rounded-xl px-4 py-3 flex items-center justify-between",
                colorBadge[leaveTypes.find((t) => t.name === type)?.color ?? "blue"] ?? "bg-blue-100 text-blue-700")}>
                <div>
                  <p className="text-xs font-semibold">{selectedBalance.name} Balance</p>
                  <p className="text-xs opacity-75">{selectedBalance.daysPerYear === 0 ? "Unlimited" : `${selectedBalance.daysPerYear} days/year`}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">{selectedBalance.remaining === null ? "∞" : selectedBalance.remaining}</p>
                  <p className="text-xs opacity-75">days remaining</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{selectedBalance.used}</p>
                  <p className="text-xs opacity-75">approved</p>
                </div>
                {(selectedBalance.pending ?? 0) > 0 && (
                  <div className="text-right">
                    <p className="text-sm font-semibold text-amber-600">{selectedBalance.pending}</p>
                    <p className="text-xs opacity-75">pending</p>
                  </div>
                )}
              </div>
            )}

            {/* Calendar */}
            <div className="border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-600">
                  {fromDate ? (toDate ? `${fromDate} → ${toDate} (${days} day${days !== 1 ? "s" : ""})` : `From: ${fromDate} — click another date for end`) : "Click a date to start"}
                </p>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => setCalMonthOffset((o) => o - 1)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"><ChevronLeft size={15} /></button>
                  <button type="button" onClick={() => setCalMonthOffset(0)}
                    className="px-2 py-0.5 text-xs text-slate-500 hover:bg-slate-100 rounded-lg">Today</button>
                  <button type="button" onClick={() => setCalMonthOffset((o) => o + 1)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"><ChevronRight size={15} /></button>
                </div>
              </div>
              <div className="flex gap-6">
                <MonthCalendar
                  year={calYear0.getFullYear()} month={calYear0.getMonth()}
                  fromDate={fromDate} toDate={toDate}
                  approvedRanges={approvedRanges}
                  onSelect={handleDateClick}
                />
                <MonthCalendar
                  year={calYear1.getFullYear()} month={calYear1.getMonth()}
                  fromDate={fromDate} toDate={toDate}
                  approvedRanges={approvedRanges}
                  onSelect={handleDateClick}
                />
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                <span className="flex items-center gap-1.5"><MessageSquare size={12} /> Note <span className="text-slate-400">(optional)</span></span>
              </label>
              <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="Reason or additional details…"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
          </div>

          <div className="flex gap-3 px-6 py-4 border-t border-slate-100 shrink-0">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting || !fromDate || !toDate}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 rounded-xl transition-colors">
              {submitting && <Loader2 size={14} className="animate-spin" />}
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Approve / Reject Modal ────────────────────────────────────────────────────

function ReviewModal({ row, onClose, onDone }: { row: LeaveRow; onClose: () => void; onDone: (updated: LeaveRow) => void }) {
  const [reviewNote, setReviewNote] = useState("");
  const [acting, setActing] = useState<"approved" | "rejected" | null>(null);

  const handle = async (status: "approved" | "rejected") => {
    setActing(status);
    try {
      const res = await fetch(`/api/hr/leave/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewNote }),
      });
      if (res.ok) onDone({ ...row, status, reviewNote });
    } finally { setActing(null); }
  };

  return (
    <div className="fixed inset-0 h-screen z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">Review Leave Request</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={15} /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1 text-slate-600">
            <p><span className="font-semibold">{row.empName}</span> · {row.type}</p>
            <p>{row.fromDate} → {row.toDate} ({row.days} day{row.days !== 1 ? "s" : ""})</p>
            {row.note && <p className="text-slate-400 italic">"{row.note}"</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Manager Note <span className="text-slate-400">(optional)</span></label>
            <textarea rows={2} value={reviewNote} onChange={(e) => setReviewNote(e.target.value)}
              placeholder="Reason for approval or rejection…"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
        </div>
        <div className="flex gap-3 px-5 py-4 border-t border-slate-100">
          <button onClick={() => handle("rejected")} disabled={!!acting}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium bg-red-100 text-red-700 rounded-xl hover:bg-red-200 disabled:opacity-50">
            {acting === "rejected" && <Loader2 size={13} className="animate-spin" />}
            <XCircle size={14} /> Reject
          </button>
          <button onClick={() => handle("approved")} disabled={!!acting}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50">
            {acting === "approved" && <Loader2 size={13} className="animate-spin" />}
            <CheckCircle2 size={14} /> Approve
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function LeavePage() {
  const { can } = usePermissions();
  const { activeBranch } = useBranch();
  const [me, setMe]                 = useState<Me | null>(null);
  const [rows, setRows]             = useState<LeaveRow[]>([]);
  const [employees, setEmployees]   = useState<Employee[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeOption[]>([]);
  const [myBalance, setMyBalance]   = useState<BalanceItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState<"mine" | "all">("mine");
  const [filter, setFilter]         = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [showModal, setShowModal]   = useState(false);
  const [reviewRow, setReviewRow]   = useState<LeaveRow | null>(null);
  const [calOffset, setCalOffset]   = useState(0); // months offset for calendar view

  // Load current user
  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.ok ? r.json() : null).then((d) => {
      if (d) setMe({ id: d.id, name: d.name ?? "", email: d.email ?? "", role: d.role, employeePrismaId: d.employeePrismaId, employeeName: d.employeeName, employmentType: d.employmentType });
    }).catch(() => {});
  }, []);

  // Load leave types from settings
  useEffect(() => {
    fetch("/api/settings/leave-types")
      .then((r) => r.ok ? r.json() : [])
      .then((data: LeaveTypeOption[]) => setLeaveTypes(data.filter((t) => t.isActive !== false)))
      .catch(() => {});
  }, []);

  // Load employees
  useEffect(() => {
    fetch("/api/employees?status=active")
      .then((r) => r.ok ? r.json() : [])
      .then((list: any[]) => setEmployees(list.map((e) => ({ prismaId: e.prismaId, id: e.id, name: e.name }))))
      .catch(() => {});
  }, []);

  const loadLeave = useCallback(async () => {
    setLoading(true);
    try {
      const qs = activeBranch?.id ? `?branchId=${activeBranch.id}` : "";
      const res = await fetch(`/api/hr/leave${qs}`);
      if (res.ok) setRows(await res.json());
    } finally { setLoading(false); }
  }, [activeBranch?.id]);

  useEffect(() => { loadLeave(); }, [loadLeave]);

  // Load my balance — extracted so it can be called after submit/review
  const loadMyBalance = useCallback((empId: string) => {
    fetch(`/api/hr/leave/balance?employeeId=${empId}&year=${new Date().getFullYear()}`)
      .then((r) => r.ok ? r.json() : [])
      .then(setMyBalance)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!me?.employeePrismaId) return;
    loadMyBalance(me.employeePrismaId);
  }, [me?.employeePrismaId, loadMyBalance]);

  const myRows    = rows.filter((r) => r.employeeId === me?.employeePrismaId);
  const allRows   = filter === "all" ? rows : rows.filter((r) => r.status === filter);
  const myFiltered = filter === "all" ? myRows : myRows.filter((r) => r.status === filter);

  const isManager = me?.role === "admin" || me?.role === "manager";
  const pending   = rows.filter((r) => r.status === "pending").length;

  const handleSubmitted = (row: LeaveRow) => {
    setRows((prev) => [row, ...prev]);
    // Re-fetch balance so the cards reflect the new pending request
    if (me?.employeePrismaId) loadMyBalance(me.employeePrismaId);
  };

  const handleReviewDone = (updated: LeaveRow) => {
    setRows((prev) => prev.map((r) => r.id === updated.id ? updated : r));
    setReviewRow(null);
    // Re-fetch balance in case the approved/rejected leave is for the current user
    if (me?.employeePrismaId) loadMyBalance(me.employeePrismaId);
  };

  // Approved leave dates for calendar highlight (my leave)
  const approvedRanges = myRows
    .filter((r) => r.status === "approved")
    .map((r) => {
      const lt = leaveTypes.find((t) => t.name === r.type);
      return { from: r.fromDate, to: r.toDate, color: lt?.color ?? "slate" };
    });

  // 2-month calendar view with navigation
  const now = new Date();
  const months = [0, 1].map((offset) => {
    const d = new Date(now.getFullYear(), now.getMonth() + calOffset + offset, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const renderTable = (list: LeaveRow[], showActions: boolean) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50">
            {showActions && <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Employee</th>}
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Type</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Period</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Days</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
            {showActions && <th className="px-4 py-3" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {list.map((lr) => {
            const Icon = StatusIcon[lr.status] ?? Clock;
            const lt = leaveTypes.find((t) => t.name === lr.type);
            return (
              <tr key={lr.id} className="hover:bg-slate-50 transition-colors">
                {showActions && (
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800 text-xs">{lr.empName}</p>
                    <p className="text-xs text-slate-400 font-mono">{lr.empCode}</p>
                  </td>
                )}
                <td className="px-4 py-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", colorBadge[lt?.color ?? "slate"] ?? "bg-slate-100 text-slate-600")}>
                    {lr.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  <p>{lr.fromDate} → {lr.toDate}</p>
                  {lr.note && <p className="text-slate-400 italic mt-0.5 truncate max-w-[200px]">"{lr.note}"</p>}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-slate-900">{lr.days}</td>
                <td className="px-4 py-3">
                  <div>
                    <span className={cn("inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium capitalize", statusColors[lr.status] ?? "bg-slate-100 text-slate-600")}>
                      <Icon size={11} /> {lr.status}
                    </span>
                    {lr.reviewNote && (
                      <p className="text-xs text-slate-400 italic mt-0.5 truncate max-w-[160px]">"{lr.reviewNote}"</p>
                    )}
                  </div>
                </td>
                {showActions && (
                  <td className="px-4 py-3">
                    {lr.status === "pending" && (
                      <button onClick={() => setReviewRow(lr)}
                        className="px-3 py-1 text-xs font-medium bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                        Review
                      </button>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      <Header
        title="Leave Management"
        subtitle={`${rows.length} requests · ${pending} pending`}
        actions={can("hr_leave", "create") ? (
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Plus size={16} /> New Request
          </button>
        ) : undefined}
      />

      <div className="p-6 space-y-5">
        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
          {[
            { key: "mine", label: "My Leave" },
            ...(isManager ? [{ key: "all", label: `All Requests ${pending > 0 ? `(${pending} pending)` : ""}` }] : []),
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key as "mine" | "all")}
              className={cn("px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                tab === key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
              {label}
            </button>
          ))}
        </div>

        {/* MY LEAVE TAB ─────────────────── */}
        {tab === "mine" && (
          <>
            {/* Balance cards — full-time employees only */}
            {myBalance.length > 0 && (isManager || me?.employmentType === "full-time") && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {myBalance.map((b) => {
                  const lt = leaveTypes.find((t) => t.name === b.name);
                  const totalUsed = b.used + (b.pending ?? 0);
                  const pct = b.daysPerYear > 0 ? Math.min(100, (totalUsed / b.daysPerYear) * 100) : 0;
                  const pendingPct = b.daysPerYear > 0 ? Math.min(100 - Math.min(100, (b.used / b.daysPerYear) * 100), ((b.pending ?? 0) / b.daysPerYear) * 100) : 0;
                  return (
                    <div key={b.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-slate-600 truncate">{b.name}</p>
                        <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-medium", colorBadge[lt?.color ?? "blue"] ?? "bg-blue-100 text-blue-700")}>
                          {lt?.isPaid ? "Paid" : "Unpaid"}
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-slate-900">
                        {b.remaining === null ? "∞" : b.remaining}
                        <span className="text-xs font-normal text-slate-400 ml-1">left</span>
                      </p>
                      {b.daysPerYear > 0 && (
                        <>
                          <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                            <div className={cn("h-full rounded-l-full transition-all", `bg-${lt?.color ?? "blue"}-400`)} style={{ width: `${Math.min(100, (b.used / b.daysPerYear) * 100)}%` }} />
                            {(b.pending ?? 0) > 0 && (
                              <div className="h-full bg-amber-300 transition-all" style={{ width: `${pendingPct}%` }} />
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            {b.used} used{(b.pending ?? 0) > 0 ? ` · ${b.pending} pending` : ""} / {b.daysPerYear} days
                          </p>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* 2-month calendar overview with navigation */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Leave Calendar</p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCalOffset((o) => o - 1)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                    title="Previous months">
                    <ChevronLeft size={15} />
                  </button>
                  {calOffset !== 0 && (
                    <button
                      onClick={() => setCalOffset(0)}
                      className="px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      Today
                    </button>
                  )}
                  <button
                    onClick={() => setCalOffset((o) => o + 1)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                    title="Next months">
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
              <div className="flex gap-8 overflow-x-auto pb-1">
                {months.map((m) => (
                  <MonthCalendar
                    key={`${m.year}-${m.month}`}
                    year={m.year} month={m.month}
                    fromDate="" toDate=""
                    approvedRanges={approvedRanges}
                    onSelect={() => {}}
                  />
                ))}
              </div>
              {approvedRanges.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
                  {leaveTypes.filter((lt) => approvedRanges.some((r) => r.color === lt.color)).map((lt) => (
                    <span key={lt.id} className={cn("text-xs px-2 py-0.5 rounded-full font-medium", colorBadge[lt.color] ?? "bg-slate-100 text-slate-600")}>
                      ■ {lt.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* My requests table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900">My Requests</h3>
                <div className="flex gap-1">
                  {(["all","pending","approved","rejected"] as const).map((s) => (
                    <button key={s} onClick={() => setFilter(s)}
                      className={cn("px-2.5 py-1 text-xs font-medium rounded-lg capitalize transition-colors",
                        filter === s ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100")}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-10 text-slate-400">
                  <Loader2 size={18} className="animate-spin mr-2" /> Loading…
                </div>
              ) : myFiltered.length === 0 ? (
                <div className="py-12 text-center">
                  <CalendarDays size={28} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-sm text-slate-400">No leave requests yet.</p>
                  <button onClick={() => setShowModal(true)}
                    className="mt-3 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    New Request
                  </button>
                </div>
              ) : renderTable(myFiltered, false)}
            </div>
          </>
        )}

        {/* ALL REQUESTS TAB (manager) ─── */}
        {tab === "all" && isManager && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">All Leave Requests</h3>
              <div className="flex gap-1">
                {(["all","pending","approved","rejected"] as const).map((s) => (
                  <button key={s} onClick={() => setFilter(s)}
                    className={cn("px-2.5 py-1 text-xs font-medium rounded-lg capitalize transition-colors",
                      filter === s ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100")}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-10 text-slate-400">
                <Loader2 size={18} className="animate-spin mr-2" /> Loading…
              </div>
            ) : allRows.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <CalendarDays size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No {filter !== "all" ? filter : ""} requests found.</p>
              </div>
            ) : renderTable(allRows, true)}
          </div>
        )}
      </div>

      {/* New Request Modal */}
      {showModal && (
        <LeaveModal
          leaveTypes={leaveTypes.length > 0 ? leaveTypes : [{ id: "al", name: "Annual Leave", color: "blue", daysPerYear: 6, isPaid: true, requireDoc: false }]}
          defaultEmployeeId={me?.employeePrismaId ?? ""}
          employeeName={me?.employeeName || me?.name || ""}
          myLeaveRows={rows}
          onClose={() => setShowModal(false)}
          onSubmitted={handleSubmitted}
        />
      )}

      {/* Review Modal */}
      {reviewRow && (
        <ReviewModal row={reviewRow} onClose={() => setReviewRow(null)} onDone={handleReviewDone} />
      )}
    </div>
  );
}
