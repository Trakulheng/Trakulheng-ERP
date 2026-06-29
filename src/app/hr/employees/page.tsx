import { Header } from "@/components/layout/Header";
import { employees } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import { Plus, Download } from "lucide-react";

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  "on-leave": "bg-amber-100 text-amber-700",
  inactive: "bg-slate-100 text-slate-500",
};

export default function EmployeesPage() {
  const totalSalary = employees.reduce((s, e) => s + e.salary, 0);

  return (
    <div>
      <Header
        title="Employees"
        subtitle={`${employees.length} employees • ${formatCurrency(totalSalary)}/month total payroll`}
        actions={
          <button className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Plus size={16} />
            Add Employee
          </button>
        }
      />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {["Engineering", "Finance", "Sales", "HR", "Operations", "IT", "Marketing"].map((dept) => {
            const count = employees.filter(e => e.department === dept).length;
            if (count === 0) return null;
            return (
              <div key={dept} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <p className="text-xs font-medium text-slate-500">{dept}</p>
                <p className="text-2xl font-bold text-slate-900">{count}</p>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-900">Employee Directory</h3>
            <button className="flex items-center gap-2 text-sm text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50">
              <Download size={14} />
              Export
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">ID</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Department</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Position</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Hire Date</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Salary</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp, i) => (
                  <tr key={emp.id} className={i % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50/50 hover:bg-slate-50"}>
                    <td className="px-5 py-3 font-mono text-xs text-slate-500">{emp.id}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                          {emp.name.charAt(0)}
                        </div>
                        <span className="font-medium text-slate-800">{emp.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{emp.department}</td>
                    <td className="px-5 py-3 text-slate-700">{emp.position}</td>
                    <td className="px-5 py-3 text-slate-600">{emp.hireDate}</td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-900">{formatCurrency(emp.salary)}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${statusColors[emp.status]}`}>
                        {emp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t border-slate-200">
                  <td colSpan={5} className="px-5 py-3 text-sm font-semibold text-slate-700">Total Monthly Payroll</td>
                  <td className="px-5 py-3 text-right font-bold text-slate-900">{formatCurrency(totalSalary)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
