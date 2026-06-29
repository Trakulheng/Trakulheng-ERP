import { Header } from "@/components/layout/Header";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Users, DollarSign, CalendarDays, UserCheck } from "lucide-react";
import { employees, leaveRequests } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

export default function HRPage() {
  const totalHeadcount = employees.length;
  const onLeave = employees.filter(e => e.status === "on-leave").length;
  const totalPayroll = employees.reduce((s, e) => s + e.salary, 0);
  const pendingLeave = leaveRequests.filter(l => l.status === "pending").length;

  const deptCounts = employees.reduce<Record<string, number>>((acc, emp) => {
    acc[emp.department] = (acc[emp.department] || 0) + 1;
    return acc;
  }, {});

  const statusColors: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    "on-leave": "bg-amber-100 text-amber-700",
    inactive: "bg-slate-100 text-slate-600",
  };

  const leaveStatusColors: Record<string, string> = {
    approved: "bg-emerald-100 text-emerald-700",
    pending: "bg-amber-100 text-amber-700",
    rejected: "bg-red-100 text-red-700",
  };

  return (
    <div>
      <Header
        title="HR & Payroll"
        subtitle="Manage employees, payroll, and leave requests"
        actions={
          <Link href="/hr/employees" className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Users size={16} />
            Add Employee
          </Link>
        }
      />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Total Employees" value={totalHeadcount.toString()} change={0} subtitle="headcount" icon={Users} iconColor="blue" />
          <StatsCard title="Monthly Payroll" value={formatCurrency(totalPayroll)} change={0} subtitle="gross salaries" icon={DollarSign} iconColor="green" />
          <StatsCard title="On Leave" value={onLeave.toString()} change={0} subtitle="employees" icon={CalendarDays} iconColor="orange" />
          <StatsCard title="Leave Requests" value={pendingLeave.toString()} change={0} subtitle="pending review" icon={UserCheck} iconColor="purple" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Department Breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-900">By Department</h3>
            </div>
            <div className="p-5 space-y-3">
              {Object.entries(deptCounts).map(([dept, count]) => (
                <div key={dept} className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">{dept}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-slate-100 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(count / totalHeadcount) * 100}%` }} />
                    </div>
                    <span className="text-sm font-semibold text-slate-900 w-4 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Employees */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-900">Employee Directory</h3>
              <Link href="/hr/employees" className="text-sm text-blue-600 hover:underline">All employees</Link>
            </div>
            <div className="divide-y divide-slate-100">
              {employees.slice(0, 6).map((emp, i) => (
                <div key={emp.id} className={`flex items-center justify-between px-5 py-3 hover:bg-slate-50 ${i % 2 === 0 ? "" : "bg-slate-50/30"}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{emp.name}</p>
                      <p className="text-xs text-slate-500">{emp.position} • {emp.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-700">{formatCurrency(emp.salary)}/mo</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColors[emp.status]}`}>
                      {emp.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Leave Requests */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
            <CalendarDays size={16} className="text-slate-500" />
            <h3 className="text-base font-semibold text-slate-900">Leave Requests</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Employee</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">From</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">To</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Days</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaveRequests.map((lr, i) => (
                  <tr key={lr.id} className={i % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50/50 hover:bg-slate-50"}>
                    <td className="px-5 py-3 font-medium text-slate-800">{lr.employee}</td>
                    <td className="px-5 py-3 text-slate-600">{lr.type}</td>
                    <td className="px-5 py-3 text-slate-600">{lr.from}</td>
                    <td className="px-5 py-3 text-slate-600">{lr.to}</td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-900">{lr.days}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${leaveStatusColors[lr.status]}`}>
                        {lr.status}
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
