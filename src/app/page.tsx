import { Header } from "@/components/layout/Header";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { DollarSign, TrendingDown, Package, Users, AlertTriangle, Clock } from "lucide-react";
import { kpiData, invoices, products, payrollRuns } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";

const statusColors: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  overdue: "bg-red-100 text-red-700",
};

const stockColors: Record<string, string> = {
  ok: "bg-emerald-100 text-emerald-700",
  low: "bg-amber-100 text-amber-700",
  out: "bg-red-100 text-red-700",
};

export default function DashboardPage() {
  const recentInvoices = invoices.slice(0, 5);
  const lowStockProducts = products.filter((p) => p.status !== "ok").slice(0, 5);

  return (
    <div>
      <Header title="Dashboard" subtitle="Welcome back — here's what's happening today." />

      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Monthly Revenue"
            value={formatCurrency(kpiData.totalRevenue)}
            change={kpiData.revenueChange}
            subtitle="vs last month"
            icon={DollarSign}
            iconColor="blue"
          />
          <StatsCard
            title="Monthly Expenses"
            value={formatCurrency(kpiData.totalExpenses)}
            change={kpiData.expensesChange}
            subtitle="vs last month"
            icon={TrendingDown}
            iconColor="red"
          />
          <StatsCard
            title="Inventory Value"
            value={formatCurrency(kpiData.inventoryValue)}
            change={kpiData.inventoryChange}
            subtitle="vs last month"
            icon={Package}
            iconColor="orange"
          />
          <StatsCard
            title="Headcount"
            value={kpiData.headcount.toString()}
            change={kpiData.headcountChange}
            subtitle="employees"
            icon={Users}
            iconColor="purple"
          />
        </div>

        {/* Revenue Chart */}
        <RevenueChart />

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Invoices */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-900">Recent Invoices</h3>
              <a href="/finance/invoices" className="text-sm text-blue-600 hover:underline">View all</a>
            </div>
            <div className="divide-y divide-slate-50">
              {recentInvoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{inv.id}</p>
                    <p className="text-xs text-slate-500">{inv.customer}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-800">{formatCurrency(inv.amount)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColors[inv.status]}`}>
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-500" />
                <h3 className="text-base font-semibold text-slate-900">Stock Alerts</h3>
              </div>
              <a href="/inventory/products" className="text-sm text-blue-600 hover:underline">View all</a>
            </div>
            <div className="divide-y divide-slate-50">
              {lowStockProducts.map((prod) => (
                <div key={prod.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{prod.name}</p>
                    <p className="text-xs text-slate-500">{prod.id} • {prod.category}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-600">{prod.stock} units</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${stockColors[prod.status]}`}>
                      {prod.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming Payroll */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
            <Clock size={16} className="text-blue-500" />
            <h3 className="text-base font-semibold text-slate-900">Upcoming Payroll</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Period</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Employees</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Gross Pay</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Net Pay</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payrollRuns.slice(0, 3).map((run, i) => (
                  <tr key={run.id} className={i % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50/50 hover:bg-slate-50"}>
                    <td className="px-5 py-3 font-medium text-slate-800">{run.period}</td>
                    <td className="px-5 py-3 text-slate-600">{run.employees}</td>
                    <td className="px-5 py-3 text-right text-slate-800">{formatCurrency(run.grossPay)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-900">{formatCurrency(run.netPay)}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                        run.status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                      }`}>
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
