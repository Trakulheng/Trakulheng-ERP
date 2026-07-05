"use client";

import { useState, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { employees, payrollRuns, expenses } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  Play, Download, X, User, CreditCard, Building2,
  ShieldCheck, Banknote, BadgeCheck, ChevronRight,
  AlertCircle, CheckCircle2, Clock,
} from "lucide-react";

const TAX_RATE = 0.10;
const SSO_EMP  = 0.05;   // employee contribution
const SSO_MAX  = 750;    // monthly cap

function calcPayslip(salary: number) {
  const tax  = Math.round(salary * TAX_RATE);
  const sso  = Math.min(Math.round(salary * SSO_EMP), SSO_MAX);
  const net  = salary - tax - sso;
  return { tax, sso, net };
}

const statusColors: Record<string, string> = {
  paid:      "bg-emerald-100 text-emerald-700",
  processed: "bg-blue-100 text-blue-700",
  draft:     "bg-slate-100 text-slate-600",
};

// ── Payslip Modal ──────────────────────────────────────────────────────

interface PayslipModalProps {
  employee: (typeof employees)[number];
  period: string;
  onClose: () => void;
}

function PayslipModal({ employee: emp, period, onClose }: PayslipModalProps) {
  const { tax, sso, net } = calcPayslip(emp.salary);
  const mainBank = emp.bankAccounts?.find((b) => b.isMain) ?? emp.bankAccounts?.[0];

  // Any reimbursed expenses this employee has in the current payroll run (PAY-001)
  const reimbursements = expenses.filter(
    (e) => e.employeeId === emp.id && e.reimbursedInPayroll === "PAY-001"
  );
  const totalReimbursed = reimbursements.reduce((s, e) => s + e.amount, 0);

  const grossTotal = emp.salary + totalReimbursed;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">{emp.name}</h2>
              <p className="text-xs text-slate-400">{emp.position} · {emp.department}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Period badge */}
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
              <div className="flex justify-between px-4 py-3 text-sm">
                <span className="text-slate-600">Base Salary</span>
                <span className="font-semibold text-slate-900">{formatCurrency(emp.salary)}</span>
              </div>
              {reimbursements.map((r) => (
                <div key={r.id} className="flex justify-between px-4 py-3 text-sm">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <BadgeCheck size={12} className="text-emerald-500" />
                    Reimbursement — {r.description.length > 30 ? r.description.slice(0, 30) + "…" : r.description}
                  </span>
                  <span className="font-medium text-emerald-700">+{formatCurrency(r.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between px-4 py-3 text-sm bg-slate-50 font-semibold">
                <span className="text-slate-700">Gross Pay</span>
                <span className="text-slate-900">{formatCurrency(grossTotal)}</span>
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
                <p className="text-2xl font-bold">{formatCurrency(net + totalReimbursed)}</p>
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
  const currentPayroll = payrollRuns[0] ?? { period: "—", status: "draft", employees: 0, grossPay: 0, deductions: 0, netPay: 0, id: "", date: "" };
  const [viewEmpId, setViewEmpId] = useState<string | null>(null);
  const [search, setSearch]       = useState("");

  const viewEmp = viewEmpId ? employees.find((e) => e.id === viewEmpId) : null;

  const filtered = useMemo(() =>
    employees.filter((e) => {
      const q = search.toLowerCase();
      return !q || e.name.toLowerCase().includes(q) || e.department.toLowerCase().includes(q) || e.position.toLowerCase().includes(q);
    }),
    [search]
  );

  const totals = useMemo(() => {
    const gross = employees.reduce((s, e) => s + e.salary, 0);
    const tax   = employees.reduce((s, e) => s + calcPayslip(e.salary).tax, 0);
    const sso   = employees.reduce((s, e) => s + calcPayslip(e.salary).sso, 0);
    const net   = employees.reduce((s, e) => s + calcPayslip(e.salary).net, 0);
    return { gross, tax, sso, net };
  }, []);

  return (
    <div>
      <Header
        title="Payroll"
        subtitle="Run payroll and view payment history"
        actions={
          <button className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
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
              <h2 className="text-2xl font-bold">{currentPayroll.period}</h2>
            </div>
            <span className={`text-xs px-3 py-1 rounded-full font-medium capitalize ${
              currentPayroll.status === "paid" ? "bg-emerald-500 text-white" : "bg-blue-500 text-white"
            }`}>
              {currentPayroll.status}
            </span>
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
              Employee Payroll — {currentPayroll.period}
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
                {filtered.map((emp) => {
                  const { tax, sso, net } = calcPayslip(emp.salary);
                  const main = emp.bankAccounts?.find((b) => b.isMain) ?? emp.bankAccounts?.[0];
                  const reimb = expenses.filter((e) => e.employeeId === emp.id && e.reimbursedInPayroll === "PAY-001")
                    .reduce((s, e) => s + e.amount, 0);
                  return (
                    <tr
                      key={emp.id}
                      onClick={() => setViewEmpId(emp.id)}
                      className="hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                            {emp.firstName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800 text-sm">{emp.name}</p>
                            <p className="text-xs text-slate-400">{emp.position}</p>
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
                      <td className="px-5 py-3 text-right text-slate-700">
                        {formatCurrency(emp.salary)}
                        {reimb > 0 && (
                          <div className="text-xs text-emerald-600">+{formatCurrency(reimb)}</div>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right text-red-600">-{formatCurrency(tax)}</td>
                      <td className="px-5 py-3 text-right text-orange-600">-{formatCurrency(sso)}</td>
                      <td className="px-5 py-3 text-right font-bold text-slate-900">{formatCurrency(net + reimb)}</td>
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
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Run ID</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Period</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Employees</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Gross Pay</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Deductions</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Net Pay</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payrollRuns.map((run, i) => (
                  <tr key={run.id} className={i % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50/50 hover:bg-slate-50"}>
                    <td className="px-5 py-3 font-mono text-xs text-slate-600">{run.id}</td>
                    <td className="px-5 py-3 font-medium text-slate-800">{run.period}</td>
                    <td className="px-5 py-3 text-slate-600">{run.date}</td>
                    <td className="px-5 py-3 text-right text-slate-700">{run.employees}</td>
                    <td className="px-5 py-3 text-right text-slate-700">{formatCurrency(run.grossPay)}</td>
                    <td className="px-5 py-3 text-right text-red-600">-{formatCurrency(run.deductions)}</td>
                    <td className="px-5 py-3 text-right font-bold text-slate-900">{formatCurrency(run.netPay)}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${statusColors[run.status]}`}>
                        {run.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {viewEmp && (
        <PayslipModal
          employee={viewEmp}
          period={currentPayroll.period}
          onClose={() => setViewEmpId(null)}
        />
      )}
    </div>
  );
}
