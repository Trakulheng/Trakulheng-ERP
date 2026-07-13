"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  Play, Download, X, CreditCard,
  ShieldCheck, Banknote, BadgeCheck, ChevronRight,
  AlertCircle, CheckCircle2, Clock, Loader2,
} from "lucide-react";
import type { Employee } from "@/lib/mock-data";

const TAX_RATE = 0.10;
const SSO_EMP  = 0.05;
const SSO_MAX  = 750;

type PayrollRun = {
  id: string; period: string; employees: number;
  grossPay: number; deductions: number; netPay: number;
  status: string; date: string;
};

function effectiveSalary(emp: Employee) {
  if (emp.salary > 0) return emp.salary;
  if (emp.hourlyRate && emp.hourlyRate > 0) return emp.hourlyRate * 160;
  return 0;
}

function calcPayslip(salary: number) {
  const tax = Math.round(salary * TAX_RATE);
  const sso = Math.min(Math.round(salary * SSO_EMP), SSO_MAX);
  return { tax, sso, net: salary - tax - sso };
}

const statusColors: Record<string, string> = {
  paid:      "bg-emerald-100 text-emerald-700",
  processed: "bg-blue-100 text-blue-700",
  draft:     "bg-slate-100 text-slate-600",
};

// ── Run Payroll Confirmation Modal ────────────────────────────────────

interface RunPayrollModalProps {
  employees: Employee[];
  onConfirm: (period: string) => void;
  onClose: () => void;
  running: boolean;
}

function RunPayrollModal({ employees, onConfirm, onClose, running }: RunPayrollModalProps) {
  const now    = new Date();
  const defPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [period, setPeriod] = useState(defPeriod);

  const preview = useMemo(() => {
    let gross = 0, tax = 0, sso = 0;
    for (const e of employees) {
      const sal  = effectiveSalary(e);
      const slip = calcPayslip(sal);
      gross += sal; tax += slip.tax; sso += slip.sso;
    }
    return { gross, deductions: tax + sso, net: gross - tax - sso };
  }, [employees]);

  return (
    <div className="fixed inset-0 h-screen z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Run Payroll</h2>
          <button onClick={onClose} disabled={running}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 disabled:opacity-50">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Pay Period</label>
            <input
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Active employees</span>
              <span className="font-semibold text-slate-900">{employees.length}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Gross pay</span>
              <span className="font-semibold text-slate-900">{formatCurrency(preview.gross)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Deductions (tax + SSO)</span>
              <span className="font-semibold text-red-600">-{formatCurrency(preview.deductions)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold">
              <span className="text-slate-700">Net pay</span>
              <span className="text-emerald-700">{formatCurrency(preview.net)}</span>
            </div>
          </div>

          <p className="text-xs text-slate-400">
            This will create a payroll run record in <strong>draft</strong> status. You can change the status to Processed or Paid from the history table.
          </p>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} disabled={running}
            className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(period)}
            disabled={running || !period}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            {running ? "Running…" : "Confirm & Run"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Payslip Modal ──────────────────────────────────────────────────────

interface PayslipModalProps {
  employee: Employee;
  period: string;
  onClose: () => void;
}

function PayslipModal({ employee: emp, period, onClose }: PayslipModalProps) {
  const sal             = effectiveSalary(emp);
  const { tax, sso, net } = calcPayslip(sal);
  const mainBank        = emp.bankAccounts?.find((b) => b.isMain) ?? emp.bankAccounts?.[0];
  const isHourly        = emp.salary === 0 && (emp.hourlyRate ?? 0) > 0;

  return (
    <div className="fixed inset-0 h-screen z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            {emp.photo ? (
              <img src={emp.photo} alt="" className="w-10 h-10 rounded-xl object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
              </div>
            )}
            <div>
              <h2 className="text-base font-semibold text-slate-900">{emp.name}</h2>
              <p className="text-xs text-slate-400">{emp.position} · {emp.department}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Payslip — {period}</div>
            <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-medium">{emp.id}</span>
          </div>

          {/* Earnings */}
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Earnings</p>
            </div>
            <div className="divide-y divide-slate-50">
              {isHourly ? (
                <div className="flex justify-between px-4 py-3 text-sm">
                  <span className="text-slate-600 flex items-center gap-1">
                    <BadgeCheck size={12} className="text-blue-400" />
                    Hourly × 160 hrs ({formatCurrency(emp.hourlyRate ?? 0)}/hr)
                  </span>
                  <span className="font-semibold text-slate-900">{formatCurrency(sal)}</span>
                </div>
              ) : (
                <div className="flex justify-between px-4 py-3 text-sm">
                  <span className="text-slate-600">Base Salary</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(sal)}</span>
                </div>
              )}
              <div className="flex justify-between px-4 py-3 text-sm bg-slate-50 font-semibold">
                <span className="text-slate-700">Gross Pay</span>
                <span className="text-slate-900">{formatCurrency(sal)}</span>
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Deductions</p>
            </div>
            <div className="divide-y divide-slate-50">
              <div className="flex justify-between px-4 py-3 text-sm">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <ShieldCheck size={12} className="text-blue-400" />
                  Personal Income Tax (10%)
                </span>
                <span className="font-medium text-red-600">-{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between px-4 py-3 text-sm">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <ShieldCheck size={12} className="text-amber-400" />
                  Social Security Fund (5%, max ฿750)
                  {emp.ssfFundType && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                      มาตรา {emp.ssfFundType}
                    </span>
                  )}
                </span>
                <span className="font-medium text-orange-600">-{formatCurrency(sso)}</span>
              </div>
              <div className="flex justify-between px-4 py-3 text-sm bg-slate-50 font-semibold">
                <span className="text-slate-700">Total Deductions</span>
                <span className="text-red-700">-{formatCurrency(tax + sso)}</span>
              </div>
            </div>
          </div>

          {/* Net pay */}
          <div className="bg-blue-600 rounded-xl p-4 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Banknote size={20} className="text-blue-200" />
              <div>
                <p className="text-blue-200 text-xs">Net Pay</p>
                <p className="text-2xl font-bold">{formatCurrency(net)}</p>
              </div>
            </div>
            {mainBank && (
              <div className="text-right text-xs">
                <p className="text-blue-200">Paid to</p>
                <p className="font-semibold text-white">{mainBank.bankName}</p>
                <p className="font-mono text-blue-100">{mainBank.accountNumber}</p>
              </div>
            )}
          </div>

          {/* SSF details */}
          {(emp.ssfStatus === "active" || emp.ssfHospital) && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-2 text-sm">
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck size={12} /> Social Security Fund
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {emp.ssn && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-slate-400">SSN</span>
                    <span className="font-mono text-slate-700">{emp.ssn}</span>
                  </div>
                )}
                {emp.ssfHospital && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-slate-400">Hospital</span>
                    <span className="text-slate-700">{emp.ssfHospital}</span>
                  </div>
                )}
                {emp.ssfEnrollmentDate && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-slate-400">Enrolled</span>
                    <span className="text-slate-700">{emp.ssfEnrollmentDate}</span>
                  </div>
                )}
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-400">Employer SSO</span>
                  <span className="text-slate-700 font-medium">{formatCurrency(sso)} / mo</span>
                </div>
              </div>
            </div>
          )}

          {/* Bank accounts */}
          {emp.bankAccounts && emp.bankAccounts.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Bank Accounts</p>
              {emp.bankAccounts.map((b) => (
                <div key={b.id} className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border text-sm",
                  b.isMain ? "border-blue-200 bg-blue-50" : "border-slate-100 bg-white"
                )}>
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0",
                    b.isMain ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600")}>
                    {b.bankName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-slate-800 text-xs">{b.bankName}</p>
                      {b.isMain && <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded font-bold">MAIN</span>}
                    </div>
                    <p className="text-xs text-slate-400 font-mono">{b.accountNumber} · {b.branch}</p>
                  </div>
                  <CreditCard size={14} className={b.isMain ? "text-blue-500" : "text-slate-300"} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────

export default function PayrollPage() {
  const [employees,    setEmployees]    = useState<Employee[]>([]);
  const [payrollRuns,  setPayrollRuns]  = useState<PayrollRun[]>([]);
  const [loadingEmps,  setLoadingEmps]  = useState(true);
  const [loadingRuns,  setLoadingRuns]  = useState(true);
  const [search,       setSearch]       = useState("");
  const [viewEmpId,    setViewEmpId]    = useState<string | null>(null);
  const [showRunModal, setShowRunModal] = useState(false);
  const [running,      setRunning]      = useState(false);

  const fetchEmployees = useCallback(() => {
    setLoadingEmps(true);
    fetch("/api/employees?status=active")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => { setEmployees(data); setLoadingEmps(false); })
      .catch(() => setLoadingEmps(false));
  }, []);

  const fetchRuns = useCallback(() => {
    setLoadingRuns(true);
    fetch("/api/hr/payroll")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => { setPayrollRuns(data); setLoadingRuns(false); })
      .catch(() => setLoadingRuns(false));
  }, []);

  useEffect(() => { fetchEmployees(); fetchRuns(); }, [fetchEmployees, fetchRuns]);

  const handleRunPayroll = async (period: string) => {
    setRunning(true);
    try {
      const res = await fetch("/api/hr/payroll", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ period }),
      });
      if (res.ok) {
        setShowRunModal(false);
        fetchRuns();
      }
    } finally {
      setRunning(false);
    }
  };

  const handleStatusChange = async (runId: string, status: string) => {
    const res = await fetch(`/api/hr/payroll/${runId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status }),
    });
    if (res.ok) fetchRuns();
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return !q
      ? employees
      : employees.filter((e) =>
          e.name.toLowerCase().includes(q) ||
          e.department.toLowerCase().includes(q) ||
          e.position.toLowerCase().includes(q) ||
          e.id.toLowerCase().includes(q)
        );
  }, [search, employees]);

  const totals = useMemo(() => {
    let gross = 0, tax = 0, sso = 0;
    for (const e of filtered) {
      const sal  = effectiveSalary(e);
      const slip = calcPayslip(sal);
      gross += sal; tax += slip.tax; sso += slip.sso;
    }
    return { gross, tax, sso, net: gross - tax - sso };
  }, [filtered]);

  const latestRun = payrollRuns[0];
  const now       = new Date();
  const currentPeriod = latestRun?.period
    ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const viewEmp = viewEmpId ? employees.find((e) => e.id === viewEmpId) : null;

  return (
    <div>
      <Header
        title="Payroll"
        subtitle="Run payroll and view payment history"
        actions={
          <button
            onClick={() => setShowRunModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Play size={16} /> Run Payroll
          </button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Current Period Summary */}
        <div className="bg-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-blue-200 text-sm mb-1">Current Period</p>
              <h2 className="text-2xl font-bold">{currentPeriod}</h2>
            </div>
            {latestRun && (
              <span className={`text-xs px-3 py-1 rounded-full font-medium capitalize ${
                latestRun.status === "paid" ? "bg-emerald-500 text-white" : "bg-blue-500 text-white"
              }`}>
                {latestRun.status}
              </span>
            )}
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div><p className="text-blue-200 text-xs mb-1">Gross Pay</p><p className="text-xl font-bold">{formatCurrency(totals.gross)}</p></div>
            <div><p className="text-blue-200 text-xs mb-1">Tax (10%)</p><p className="text-xl font-bold">-{formatCurrency(totals.tax)}</p></div>
            <div><p className="text-blue-200 text-xs mb-1">SSO (5%)</p><p className="text-xl font-bold">-{formatCurrency(totals.sso)}</p></div>
            <div><p className="text-blue-200 text-xs mb-1">Net Pay</p><p className="text-xl font-bold">{formatCurrency(totals.net)}</p></div>
          </div>
        </div>

        {/* Employee Payroll Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-900 flex-1">
              Employee Payroll — {currentPeriod}
            </h3>
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee…"
              className="w-48 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="flex items-center gap-2 text-sm text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50">
              <Download size={14} /> Export
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Employee</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Department</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Bank</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Gross</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tax</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">SSO</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Net Pay</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">SSF Status</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingEmps ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-8 text-center text-sm text-slate-400">
                      <Loader2 size={20} className="animate-spin inline mr-2" />Loading employees…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-10 text-center text-sm text-slate-400">
                      {search ? `No employees matching "${search}"` : "No active employees found. Add employees in HR → Employees."}
                    </td>
                  </tr>
                ) : filtered.map((emp) => {
                  const sal              = effectiveSalary(emp);
                  const { tax, sso, net } = calcPayslip(sal);
                  const main             = emp.bankAccounts?.find((b) => b.isMain) ?? emp.bankAccounts?.[0];
                  const isHourly         = emp.salary === 0 && (emp.hourlyRate ?? 0) > 0;
                  return (
                    <tr
                      key={emp.id}
                      onClick={() => setViewEmpId(emp.id)}
                      className="hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          {emp.photo ? (
                            <img src={emp.photo} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                              {emp.firstName.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-slate-800 text-sm">{emp.name}</p>
                            <p className="text-xs text-slate-400 flex items-center gap-1">
                              {emp.position}
                              {isHourly && <span className="text-[10px] bg-amber-100 text-amber-700 px-1 py-0.5 rounded font-medium">Hourly</span>}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{emp.department}</td>
                      <td className="px-5 py-3">
                        {main ? (
                          <div>
                            <p className="text-xs font-medium text-slate-700">{main.bankName}</p>
                            <p className="text-xs text-slate-400 font-mono">{main.accountNumber}</p>
                          </div>
                        ) : <span className="text-slate-400 text-xs">—</span>}
                      </td>
                      <td className="px-5 py-3 text-right text-slate-700">{formatCurrency(sal)}</td>
                      <td className="px-5 py-3 text-right text-red-600">-{formatCurrency(tax)}</td>
                      <td className="px-5 py-3 text-right text-orange-600">-{formatCurrency(sso)}</td>
                      <td className="px-5 py-3 text-right font-bold text-slate-900">{formatCurrency(net)}</td>
                      <td className="px-5 py-3">
                        {emp.ssfStatus === "active" ? (
                          <span className="flex items-center gap-1 text-xs text-emerald-700 font-medium">
                            <CheckCircle2 size={11} /> Active
                          </span>
                        ) : emp.ssfStatus === "inactive" ? (
                          <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                            <Clock size={11} /> Inactive
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <AlertCircle size={11} /> Not enrolled
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <ChevronRight size={14} className="text-slate-300" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {!loadingEmps && filtered.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-50 border-t-2 border-slate-200">
                    <td colSpan={3} className="px-5 py-3 text-sm font-bold text-slate-800">TOTAL ({filtered.length} employees)</td>
                    <td className="px-5 py-3 text-right font-bold text-slate-900">{formatCurrency(totals.gross)}</td>
                    <td className="px-5 py-3 text-right font-bold text-red-600">-{formatCurrency(totals.tax)}</td>
                    <td className="px-5 py-3 text-right font-bold text-orange-600">-{formatCurrency(totals.sso)}</td>
                    <td className="px-5 py-3 text-right font-bold text-emerald-700 text-base">{formatCurrency(totals.net)}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Payroll History */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-900">Payroll History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Period</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Employees</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Gross Pay</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Deductions</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Net Pay</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingRuns ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-8 text-center text-sm text-slate-400">
                      <Loader2 size={20} className="animate-spin inline mr-2" />Loading history…
                    </td>
                  </tr>
                ) : payrollRuns.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-sm text-slate-400">
                      No payroll runs yet. Click <strong>Run Payroll</strong> to create the first one.
                    </td>
                  </tr>
                ) : payrollRuns.map((run, i) => (
                  <tr key={run.id} className={cn(i % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50/50 hover:bg-slate-50")}>
                    <td className="px-5 py-3 font-medium text-slate-800">{run.period}</td>
                    <td className="px-5 py-3 text-slate-600">{run.date}</td>
                    <td className="px-5 py-3 text-right text-slate-700">{run.employees}</td>
                    <td className="px-5 py-3 text-right text-slate-700">{formatCurrency(run.grossPay)}</td>
                    <td className="px-5 py-3 text-right text-red-600">-{formatCurrency(run.deductions)}</td>
                    <td className="px-5 py-3 text-right font-bold text-slate-900">{formatCurrency(run.netPay)}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${statusColors[run.status] ?? "bg-slate-100 text-slate-600"}`}>
                        {run.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {run.status === "draft" && (
                        <button
                          onClick={() => handleStatusChange(run.id, "processed")}
                          className="text-xs text-blue-600 border border-blue-200 px-2 py-1 rounded-lg hover:bg-blue-50 whitespace-nowrap"
                        >
                          Mark Processed
                        </button>
                      )}
                      {run.status === "processed" && (
                        <button
                          onClick={() => handleStatusChange(run.id, "paid")}
                          className="text-xs text-emerald-600 border border-emerald-200 px-2 py-1 rounded-lg hover:bg-emerald-50 whitespace-nowrap"
                        >
                          Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showRunModal && (
        <RunPayrollModal
          employees={employees}
          onConfirm={handleRunPayroll}
          onClose={() => setShowRunModal(false)}
          running={running}
        />
      )}

      {viewEmp && (
        <PayslipModal
          employee={viewEmp}
          period={currentPeriod}
          onClose={() => setViewEmpId(null)}
        />
      )}
    </div>
  );
}
