"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { cn, formatCurrency } from "@/lib/utils";
import {
  Search, Plus, Pencil, Trash2, X, Save, ShieldAlert, User,
  DollarSign, Calendar, CalendarDays,
} from "lucide-react";

interface EmpOption { id: string; employeeId: string; name: string; position: string; department: string; }
interface LimitRow {
  id: string; employeeId: string; employeeCode: string; employeeName: string;
  position: string; department: string;
  amountLimit: number | null; dailyLimit: number | null; monthlyLimit: number | null;
}

// ── Edit Modal ─────────────────────────────────────────────────────────

function LimitModal({
  initial, employees, onClose, onSave,
}: {
  initial?: LimitRow;
  employees: EmpOption[];
  onClose: () => void;
  onSave: (data: { employeeId: string; amountLimit: number | null; dailyLimit: number | null; monthlyLimit: number | null }) => Promise<void>;
}) {
  const [empId,   setEmpId]   = useState(initial?.employeeId ?? "");
  const [empQ,    setEmpQ]    = useState(initial ? `${initial.employeeCode} — ${initial.employeeName}` : "");
  const [showDrop,setShowDrop]= useState(false);
  const [amount,  setAmount]  = useState<string>(initial?.amountLimit != null ? String(initial.amountLimit) : "");
  const [daily,   setDaily]   = useState<string>(initial?.dailyLimit  != null ? String(initial.dailyLimit)  : "");
  const [monthly, setMonthly] = useState<string>(initial?.monthlyLimit != null ? String(initial.monthlyLimit) : "");
  const [saving,  setSaving]  = useState(false);

  const filteredEmps = useMemo(() => {
    if (!empQ.trim()) return employees.slice(0, 12);
    const q = empQ.toLowerCase();
    return employees.filter((e) => e.name.toLowerCase().includes(q) || e.employeeId.toLowerCase().includes(q) || e.department.toLowerCase().includes(q)).slice(0, 12);
  }, [employees, empQ]);

  const canSave = !!empId && (amount !== "" || daily !== "" || monthly !== "");

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        employeeId:  empId,
        amountLimit:  amount  !== "" ? parseFloat(amount)  : null,
        dailyLimit:   daily   !== "" ? parseFloat(daily)   : null,
        monthlyLimit: monthly !== "" ? parseFloat(monthly) : null,
      });
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 h-screen z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{initial ? "Edit" : "Set"} Expense Limit</h2>
            <p className="text-xs text-slate-400 mt-0.5">Leave a field blank to apply no limit for that period.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Employee picker */}
          <div className="relative">
            <label className="block text-xs font-medium text-slate-600 mb-1">Employee *</label>
            {initial ? (
              <div className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-700">
                {initial.employeeCode} — {initial.employeeName}
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={empQ}
                    onChange={(e) => { setEmpQ(e.target.value); setShowDrop(true); setEmpId(""); }}
                    onFocus={() => setShowDrop(true)}
                    placeholder="Search name or employee ID..."
                    className="w-full pl-8 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {showDrop && filteredEmps.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
                    {filteredEmps.map((e) => (
                      <button key={e.id} type="button"
                        onClick={() => { setEmpId(e.id); setEmpQ(`${e.employeeId} — ${e.name}`); setShowDrop(false); }}
                        className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-slate-50 text-left border-b border-slate-50 last:border-0">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                          {e.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{e.name}</p>
                          <p className="text-xs text-slate-400">{e.employeeId} · {e.position} · {e.department}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Limits */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Per Request (฿)", value: amount, set: setAmount, icon: <DollarSign size={13} />, hint: "Max per single request" },
              { label: "Daily Limit (฿)",  value: daily,  set: setDaily,  icon: <Calendar size={13} />,    hint: "Max total per day" },
              { label: "Monthly Limit (฿)",value: monthly,set: setMonthly,icon: <CalendarDays size={13} />, hint: "Max total per month" },
            ].map(({ label, value, set, icon, hint }) => (
              <div key={label}>
                <label className="flex items-center gap-1 text-xs font-medium text-slate-600 mb-1">{icon} {label}</label>
                <input
                  type="number" min="0" value={value}
                  onChange={(e) => set(e.target.value)}
                  placeholder="No limit"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-400 mt-1">{hint}</p>
              </div>
            ))}
          </div>

          {/* Info box */}
          <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl p-3">
            <ShieldAlert size={14} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Limits are enforced when the employee submits an expense request. Requests exceeding limits will be flagged for manager review.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
          <button onClick={handleSave} disabled={!canSave || saving}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40">
            <Save size={14} />{saving ? "Saving…" : "Save Limit"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────

export default function ExpenseLimitsPage() {
  const [limits,    setLimits]    = useState<LimitRow[]>([]);
  const [employees, setEmployees] = useState<EmpOption[]>([]);
  const [search,    setSearch]    = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editRow,   setEditRow]   = useState<LimitRow | undefined>();
  const [deleteId,  setDeleteId]  = useState<string | null>(null);
  const [loading,   setLoading]   = useState(true);

  const loadLimits = useCallback(() => {
    fetch("/api/settings/expense-limits")
      .then((r) => r.ok ? r.json() : [])
      .then(setLimits)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadLimits();
    fetch("/api/employees")
      .then((r) => r.ok ? r.json() : [])
      .then((emps: any[]) => setEmployees(emps.map((e) => ({
        id: e._cuid ?? e.prismaId ?? e.id,
        employeeId: e.id,
        name: e.name,
        position: e.position,
        department: e.department,
      }))));
  }, [loadLimits]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return limits.filter((l) =>
      !q || l.employeeName.toLowerCase().includes(q) || l.employeeCode.toLowerCase().includes(q) || l.department.toLowerCase().includes(q)
    );
  }, [limits, search]);

  const handleSave = async (data: { employeeId: string; amountLimit: number | null; dailyLimit: number | null; monthlyLimit: number | null }) => {
    if (editRow) {
      await fetch(`/api/settings/expense-limits/${editRow.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      });
    } else {
      await fetch("/api/settings/expense-limits", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      });
    }
    loadLimits();
    setShowModal(false);
    setEditRow(undefined);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/settings/expense-limits/${id}`, { method: "DELETE" });
    setLimits((p) => p.filter((l) => l.id !== id));
    setDeleteId(null);
  };

  return (
    <div>
      <Header
        title="Expense Limits"
        subtitle={`${limits.length} employee limit${limits.length !== 1 ? "s" : ""} configured`}
        actions={
          <button onClick={() => { setEditRow(undefined); setShowModal(true); }}
            className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 font-medium">
            <Plus size={16} /> Set Limit
          </button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Info banner */}
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <ShieldAlert size={16} className="text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-semibold">Per-employee expense limits</p>
            <p className="mt-0.5 text-blue-600">Set the maximum amount an employee can claim per request, per day, and per month. Limits are checked when submitting expense requests.</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or employee ID..."
            className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-sm text-slate-400">Loading…</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Employee</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Department</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Per Request</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Daily Limit</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Monthly Limit</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                          {l.employeeName[0] ?? "?"}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{l.employeeName}</p>
                          <p className="text-xs text-slate-400">{l.employeeCode} · {l.position}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600 text-xs">{l.department}</td>
                    <td className="px-5 py-3 text-right">
                      {l.amountLimit != null
                        ? <span className="font-semibold text-slate-900">{formatCurrency(l.amountLimit)}</span>
                        : <span className="text-slate-300 text-xs">—</span>}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {l.dailyLimit != null
                        ? <span className="font-semibold text-slate-900">{formatCurrency(l.dailyLimit)}</span>
                        : <span className="text-slate-300 text-xs">—</span>}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {l.monthlyLimit != null
                        ? <span className="font-semibold text-slate-900">{formatCurrency(l.monthlyLimit)}</span>
                        : <span className="text-slate-300 text-xs">—</span>}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditRow(l); setShowModal(true); }}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"><Pencil size={14} /></button>
                        <button onClick={() => setDeleteId(l.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && filtered.length === 0 && (
            <div className="py-16 text-center">
              <User size={32} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm text-slate-400">No expense limits configured yet.</p>
              <p className="text-xs text-slate-400 mt-1">Click "Set Limit" to add limits for an employee.</p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <LimitModal
          initial={editRow}
          employees={employees}
          onClose={() => { setShowModal(false); setEditRow(undefined); }}
          onSave={handleSave}
        />
      )}

      {deleteId && (
        <div className="fixed inset-0 h-screen z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><Trash2 size={22} className="text-red-600" /></div>
            <h2 className="text-base font-semibold text-slate-900 mb-1">Remove Expense Limit</h2>
            <p className="text-sm text-slate-500 mb-6">Remove the expense limit for <strong>{limits.find((l) => l.id === deleteId)?.employeeName}</strong>? They will have no spending restrictions.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
              <button onClick={() => handleDelete(deleteId!)} className="flex-1 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700">Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
