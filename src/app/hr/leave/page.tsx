"use client";

import { Header } from "@/components/layout/Header";
import { Plus, X, Loader2, CheckCircle2, Clock, XCircle, CalendarDays, ChevronDown } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useBranch } from "@/context/BranchContext";

const LEAVE_TYPES = ["Annual Leave", "Sick Leave", "Personal Leave", "Maternity Leave", "Paternity Leave", "Unpaid Leave", "Other"];

const statusColors: Record<string, string> = {
  approved: "bg-emerald-100 text-emerald-700",
  pending:  "bg-amber-100 text-amber-700",
  rejected: "bg-red-100 text-red-700",
};

const StatusIcon: Record<string, React.ElementType> = {
  approved: CheckCircle2,
  pending:  Clock,
  rejected: XCircle,
};

interface LeaveRow {
  id: string; employeeId: string; empCode: string; empName: string;
  type: string; fromDate: string; toDate: string; days: number; status: string;
}

interface Employee { id: string; name: string; }

function calcDays(from: string, to: string) {
  if (!from || !to) return 0;
  const a = new Date(from), b = new Date(to);
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86400000) + 1);
}

export default function LeavePage() {
  const { activeBranch } = useBranch();
  const [rows, setRows]       = useState<LeaveRow[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter]   = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [acting, setActing]   = useState<string | null>(null);

  const [form, setForm] = useState({ employeeId: "", type: LEAVE_TYPES[0], fromDate: "", toDate: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState("");

  const loadLeave = useCallback(async () => {
    setLoading(true);
    try {
      const qs = activeBranch?.id ? `?branchId=${activeBranch.id}` : "";
      const res = await fetch(`/api/hr/leave${qs}`);
      if (res.ok) setRows(await res.json());
    } finally {
      setLoading(false);
    }
  }, [activeBranch?.id]);

  useEffect(() => { loadLeave(); }, [loadLeave]);

  useEffect(() => {
    fetch("/api/employees?status=active")
      .then((r) => r.ok ? r.json() : [])
      .then((list: any[]) => setEmployees(list.map((e) => ({ id: e.id, name: e.name }))))
      .catch(() => {});
  }, []);

  const filtered = filter === "all" ? rows : rows.filter((r) => r.status === filter);
  const pending  = rows.filter((r) => r.status === "pending").length;
  const approved = rows.filter((r) => r.status === "approved").length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!form.employeeId) { setFormError("Please select an employee."); return; }
    if (!form.fromDate || !form.toDate) { setFormError("Please select both dates."); return; }
    if (form.toDate < form.fromDate) { setFormError("End date must be after start date."); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/hr/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, days: calcDays(form.fromDate, form.toDate) }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error ?? "Failed to create request."); return; }
      setRows((prev) => [data, ...prev]);
      setShowModal(false);
      setForm({ employeeId: "", type: LEAVE_TYPES[0], fromDate: "", toDate: "" });
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatus(id: string, status: "approved" | "rejected") {
    setActing(id);
    try {
      const res = await fetch(`/api/hr/leave/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) setRows((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
    } finally {
      setActing(null);
    }
  }

  return (
    <div>
      <Header
        title="Leave Management"
        subtitle={`${rows.length} requests • ${pending} pending`}
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            New Request
          </button>
        }
      />

      <div className="p-6 space-y-6">
        {/* KPI cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="text-xs text-slate-500 mb-1">Total Requests</p>
            <p className="text-2xl font-bold text-slate-900">{rows.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="text-xs text-slate-500 mb-1">Pending Review</p>
            <p className="text-2xl font-bold text-amber-600">{pending}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="text-xs text-slate-500 mb-1">Approved</p>
            <p className="text-2xl font-bold text-emerald-600">{approved}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-900">Leave Requests</h3>
            <div className="flex gap-1 text-xs">
              {(["all", "pending", "approved", "rejected"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-3 py-1.5 rounded-lg font-medium capitalize transition-colors ${
                    filter === s ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <Loader2 size={20} className="animate-spin mr-2" /> Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <CalendarDays size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No {filter === "all" ? "" : filter} leave requests found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">ID</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Employee</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">From</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">To</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Days</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((lr, i) => {
                    const Icon = StatusIcon[lr.status] ?? Clock;
                    return (
                      <tr key={lr.id} className={i % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50/50 hover:bg-slate-50"}>
                        <td className="px-5 py-3 font-mono text-xs text-slate-500">{lr.empCode}</td>
                        <td className="px-5 py-3 font-medium text-slate-800">{lr.empName}</td>
                        <td className="px-5 py-3 text-slate-600">{lr.type}</td>
                        <td className="px-5 py-3 text-slate-600">{lr.fromDate}</td>
                        <td className="px-5 py-3 text-slate-600">{lr.toDate}</td>
                        <td className="px-5 py-3 text-right font-semibold text-slate-900">{lr.days}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium capitalize ${statusColors[lr.status] ?? "bg-slate-100 text-slate-600"}`}>
                            <Icon size={11} />
                            {lr.status}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          {lr.status === "pending" && (
                            <div className="flex gap-1.5 justify-end">
                              <button
                                disabled={acting === lr.id}
                                onClick={() => handleStatus(lr.id, "approved")}
                                className="px-2.5 py-1 text-xs font-medium bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                disabled={acting === lr.id}
                                onClick={() => handleStatus(lr.id, "rejected")}
                                className="px-2.5 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* New Leave Request modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">New Leave Request</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Employee</label>
                <select
                  required
                  value={form.employeeId}
                  onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Select employee…</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Leave Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {LEAVE_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">From</label>
                  <input
                    type="date"
                    required
                    value={form.fromDate}
                    onChange={(e) => setForm((f) => ({ ...f, fromDate: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">To</label>
                  <input
                    type="date"
                    required
                    value={form.toDate}
                    min={form.fromDate}
                    onChange={(e) => setForm((f) => ({ ...f, toDate: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              {form.fromDate && form.toDate && (
                <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                  {calcDays(form.fromDate, form.toDate)} day(s) off
                </p>
              )}
              {formError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{formError}</p>
              )}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition-colors"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
