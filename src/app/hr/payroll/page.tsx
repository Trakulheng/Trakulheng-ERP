import { Header } from "@/components/layout/Header";
import { employees, payrollRuns } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import { Play, Download } from "lucide-react";

const statusColors: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700",
  processed: "bg-blue-100 text-blue-700",
  draft: "bg-slate-100 text-slate-600",
};

export default function PayrollPage() {
  const currentPayroll = payrollRuns[0];
  const TAX_RATE = 0.10;
  const SSO_RATE = 0.05;

  return (
    <div>
      <Header
        title="Payroll"
        subtitle="Run payroll and view payment history"
        actions={
          <button className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Play size={16} />
            Run Payroll
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
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-blue-200 text-xs mb-1">Gross Pay</p>
              <p className="text-xl font-bold">{formatCurrency(currentPayroll.grossPay)}</p>
            </div>
            <div>
              <p className="text-blue-200 text-xs mb-1">Deductions</p>
              <p className="text-xl font-bold">{formatCurrency(currentPayroll.deductions)}</p>
            </div>
            <div>
              <p className="text-blue-200 text-xs mb-1">Net Pay</p>
              <p className="text-xl font-bold">{formatCurrency(currentPayroll.netPay)}</p>
            </div>
          </div>
        </div>

        {/* Employee Payroll Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-900">Employee Payroll — {currentPayroll.period}</h3>
            <button className="flex items-center gap-2 text-sm text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50">
              <Download size={14} />
              Export
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Employee</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Department</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Gross Salary</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tax (10%)</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">SSO (5%)</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Net Pay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp, i) => {
                  const tax = emp.salary * TAX_RATE;
                  const sso = emp.salary * SSO_RATE;
                  const net = emp.salary - tax - sso;
                  return (
                    <tr key={emp.id} className={i % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50/50 hover:bg-slate-50"}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                            {emp.name.charAt(0)}
                          </div>
                          <span className="font-medium text-slate-800">{emp.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{emp.department}</td>
                      <td className="px-5 py-3 text-right text-slate-700">{formatCurrency(emp.salary)}</td>
                      <td className="px-5 py-3 text-right text-red-600">-{formatCurrency(tax)}</td>
                      <td className="px-5 py-3 text-right text-orange-600">-{formatCurrency(sso)}</td>
                      <td className="px-5 py-3 text-right font-bold text-slate-900">{formatCurrency(net)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t-2 border-slate-200">
                  <td colSpan={2} className="px-5 py-3 text-sm font-bold text-slate-800">TOTAL</td>
                  <td className="px-5 py-3 text-right font-bold text-slate-900">
                    {formatCurrency(employees.reduce((s, e) => s + e.salary, 0))}
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-red-600">
                    -{formatCurrency(employees.reduce((s, e) => s + e.salary * TAX_RATE, 0))}
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-orange-600">
                    -{formatCurrency(employees.reduce((s, e) => s + e.salary * SSO_RATE, 0))}
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-emerald-700 text-base">
                    {formatCurrency(employees.reduce((s, e) => s + e.salary * (1 - TAX_RATE - SSO_RATE), 0))}
                  </td>
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
    </div>
  );
}
