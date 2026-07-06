import { Header } from "@/components/layout/Header";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { TodayTodosWidget } from "@/components/dashboard/TodayTodosWidget";
import { DollarSign, TrendingDown, Package, Users, AlertTriangle, Clock, CheckSquare, CalendarOff } from "lucide-react";
import { kpiData, invoices, products, payrollRuns } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DEFAULT_WIDGETS, type WidgetConfig } from "@/lib/dashboard-widgets";

const statusColors: Record<string, string> = {
  paid:    "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  overdue: "bg-red-100 text-red-700",
};

const stockColors: Record<string, string> = {
  ok:  "bg-emerald-100 text-emerald-700",
  low: "bg-amber-100 text-amber-700",
  out: "bg-red-100 text-red-700",
};

async function getWidgetConfig(role: string): Promise<WidgetConfig[]> {
  try {
    const config = await prisma.dashboardConfig.findUnique({ where: { role } });
    if (config?.widgets) return config.widgets as WidgetConfig[];
  } catch {}
  return DEFAULT_WIDGETS[role] ?? DEFAULT_WIDGETS.staff;
}

function isEnabled(widgets: WidgetConfig[], id: string) {
  const w = widgets.find((x) => x.id === id);
  return w ? w.enabled : false;
}

function sortedEnabled(widgets: WidgetConfig[]) {
  return widgets.filter((w) => w.enabled).sort((a, b) => a.order - b.order);
}

export default async function DashboardPage() {
  const user    = await getSessionUser();
  const role    = user?.role ?? "staff";
  const widgets = await getWidgetConfig(role);
  const enabled = sortedEnabled(widgets);

  const recentInvoices   = invoices.slice(0, 5);
  const lowStockProducts = products.filter((p) => p.status !== "ok").slice(0, 5);

  const kpiIds    = ["revenue", "expenses", "inventory_value", "headcount"];
  const kpiWidgets = enabled.filter((w) => kpiIds.includes(w.id));

  const kpiCards = [
    { id: "revenue",         title: "Monthly Revenue",   value: formatCurrency(kpiData.totalRevenue),  change: kpiData.revenueChange,   subtitle: "vs last month", icon: DollarSign, iconColor: "blue"   as const },
    { id: "expenses",        title: "Monthly Expenses",  value: formatCurrency(kpiData.totalExpenses), change: kpiData.expensesChange,  subtitle: "vs last month", icon: TrendingDown, iconColor: "red"  as const },
    { id: "inventory_value", title: "Inventory Value",   value: formatCurrency(kpiData.inventoryValue),change: kpiData.inventoryChange, subtitle: "vs last month", icon: Package,  iconColor: "orange" as const },
    { id: "headcount",       title: "Headcount",         value: kpiData.headcount.toString(),          change: kpiData.headcountChange, subtitle: "employees",    icon: Users,    iconColor: "purple" as const },
  ].filter((c) => kpiWidgets.some((w) => w.id === c.id));

  return (
    <div>
      <Header
        title="Dashboard"
        subtitle={`Welcome back${user?.name ? `, ${user.name}` : ""} — here's what's happening today.`}
      />

      <div className="p-6 space-y-6">
        {/* KPI Cards — only render if there are any */}
        {kpiCards.length > 0 && (
          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${
            kpiCards.length === 4 ? "lg:grid-cols-4" :
            kpiCards.length === 3 ? "lg:grid-cols-3" :
            kpiCards.length === 2 ? "lg:grid-cols-2" : ""
          }`}>
            {kpiCards.map((card) => (
              <StatsCard
                key={card.id}
                title={card.title}
                value={card.value}
                change={card.change}
                subtitle={card.subtitle}
                icon={card.icon}
                iconColor={card.iconColor}
              />
            ))}
          </div>
        )}

        {/* Revenue Chart */}
        {isEnabled(widgets, "revenue_chart") && <RevenueChart />}

        {/* Middle row: invoices + stock alerts */}
        {(isEnabled(widgets, "recent_invoices") || isEnabled(widgets, "stock_alerts")) && (
          <div className={`grid grid-cols-1 gap-6 ${
            isEnabled(widgets, "recent_invoices") && isEnabled(widgets, "stock_alerts") ? "lg:grid-cols-2" : ""
          }`}>
            {isEnabled(widgets, "recent_invoices") && (
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
            )}

            {isEnabled(widgets, "stock_alerts") && (
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
            )}
          </div>
        )}

        {/* Payroll */}
        {isEnabled(widgets, "payroll") && (
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
        )}

        {/* Tasks — placeholder */}
        {isEnabled(widgets, "tasks") && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
              <CheckSquare size={16} className="text-emerald-500" />
              <h3 className="text-base font-semibold text-slate-900">My Tasks</h3>
            </div>
            <div className="px-5 py-8 text-center text-sm text-slate-400">
              Task management coming soon.
            </div>
          </div>
        )}

        {/* Leave requests — placeholder */}
        {isEnabled(widgets, "leave_requests") && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
              <CalendarOff size={16} className="text-violet-500" />
              <h3 className="text-base font-semibold text-slate-900">Leave Requests</h3>
            </div>
            <div className="px-5 py-8 text-center text-sm text-slate-400">
              Leave request management coming soon.
            </div>
          </div>
        )}

        {/* Today's To-do List — staff widget */}
        {isEnabled(widgets, "shift_todos") && (
          <TodayTodosWidget employeeId={user?.employeeRecordId} />
        )}

        {/* Empty state */}
        {enabled.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-16 text-center">
            <p className="text-slate-400 text-sm">No widgets configured for your role. Contact an admin to set up your dashboard.</p>
          </div>
        )}
      </div>
    </div>
  );
}
