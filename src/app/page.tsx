import { Header } from "@/components/layout/Header";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { TodayTodosWidget } from "@/components/dashboard/TodayTodosWidget";
import { ClockInOutWidget } from "@/components/dashboard/ClockInOutWidget";
import { PendingShiftsWidget } from "@/components/dashboard/PendingShiftsWidget";
import { DollarSign, TrendingDown, Package, Users, AlertTriangle, Clock, CheckSquare, CalendarOff, CheckCircle2, XCircle } from "lucide-react";
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
    if (config?.widgets) {
      const saved    = config.widgets as WidgetConfig[];
      const defaults = DEFAULT_WIDGETS[role] ?? DEFAULT_WIDGETS.staff;
      const savedIds = new Set(saved.map((w) => w.id));
      const newWidgets = defaults.filter((w) => !savedIds.has(w.id));
      return newWidgets.length > 0 ? [...saved, ...newWidgets] : saved;
    }
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

  // Fetch pending shift assignments for this employee
  const pendingShiftRows = user?.employeeRecordId
    ? await prisma.shiftAssignment.findMany({
        where: { employeeId: user.employeeRecordId, confirmStatus: "pending" },
        orderBy: { date: "asc" },
        take: 20,
      })
    : [];
  const shiftTemplateIds = Array.from(new Set(pendingShiftRows.map((s) => s.shiftId).filter(Boolean))) as string[];
  const shiftTemplates = shiftTemplateIds.length > 0
    ? await prisma.shiftTemplate.findMany({ where: { id: { in: shiftTemplateIds } } })
    : [];
  const pendingShifts = pendingShiftRows.map((row) => {
    const tpl = row.shiftId ? shiftTemplates.find((t) => t.id === row.shiftId) : null;
    return {
      id:         row.id,
      date:       row.date,
      shiftCode:  tpl?.code   ?? null,
      shiftName:  tpl?.name   ?? null,
      shiftStart: tpl?.startTime ?? null,
      shiftEnd:   tpl?.endTime   ?? null,
      branchId:   row.branchId,
      note:       row.note ?? null,
    };
  });

  // Fetch own leave requests for the dashboard widget
  const myLeaveRequests = user?.employeeRecordId
    ? await prisma.leaveRequest.findMany({
        where: { employeeId: user.employeeRecordId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, type: true, fromDate: true, toDate: true, days: true, status: true, note: true },
      })
    : [];

  // For managers/admins: also fetch pending team requests (other employees)
  const teamPendingLeave = (role === "admin" || role === "manager")
    ? await prisma.leaveRequest.findMany({
        where: {
          status: "pending",
          ...(user?.employeeRecordId ? { employeeId: { not: user.employeeRecordId } } : {}),
        },
        orderBy: { createdAt: "asc" },
        take: 5,
        include: { employee: { select: { name: true, employeeId: true } } },
      })
    : [];

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

        {/* Leave requests widget */}
        {isEnabled(widgets, "leave_requests") && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CalendarOff size={16} className="text-violet-500" />
                <h3 className="text-base font-semibold text-slate-900">
                  {(role === "admin" || role === "manager") && teamPendingLeave.length > 0
                    ? `Leave Requests · ${teamPendingLeave.length} pending approval`
                    : "My Leave Requests"}
                </h3>
              </div>
              <a href="/hr/leave" className="text-sm text-blue-600 hover:underline">View all</a>
            </div>

            {/* Manager: pending team requests */}
            {(role === "admin" || role === "manager") && teamPendingLeave.length > 0 && (
              <div>
                <p className="px-5 pt-3 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wide">Pending Approval</p>
                <div className="divide-y divide-slate-50">
                  {teamPendingLeave.map((lr) => (
                    <div key={lr.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{lr.employee.name}</p>
                        <p className="text-xs text-slate-500">{lr.type} · {lr.fromDate.toISOString().slice(0,10)} → {lr.toDate.toISOString().slice(0,10)} ({lr.days}d)</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">
                          <Clock size={10} /> Pending
                        </span>
                        <a href="/hr/leave" className="text-xs px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium">Review</a>
                      </div>
                    </div>
                  ))}
                </div>
                {myLeaveRequests.length > 0 && <div className="border-t border-slate-100 mt-1" />}
              </div>
            )}

            {/* Own leave requests */}
            {myLeaveRequests.length > 0 ? (
              <div>
                {(role === "admin" || role === "manager") && teamPendingLeave.length > 0 && (
                  <p className="px-5 pt-3 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wide">My Requests</p>
                )}
                <div className="divide-y divide-slate-50">
                  {myLeaveRequests.map((lr) => {
                    const statusStyle =
                      lr.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                      lr.status === "rejected"  ? "bg-red-100 text-red-700" :
                      "bg-amber-100 text-amber-700";
                    const StatusIcon = lr.status === "approved" ? CheckCircle2 : lr.status === "rejected" ? XCircle : Clock;
                    return (
                      <div key={lr.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                        <div>
                          <p className="text-sm font-medium text-slate-800">{lr.type}</p>
                          <p className="text-xs text-slate-500">{lr.fromDate.toISOString().slice(0,10)} → {lr.toDate.toISOString().slice(0,10)} ({lr.days} day{lr.days !== 1 ? "s" : ""})</p>
                        </div>
                        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium capitalize ${statusStyle}`}>
                          <StatusIcon size={10} /> {lr.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (myLeaveRequests.length === 0 && (role !== "admin" && role !== "manager" || teamPendingLeave.length === 0)) ? (
              <div className="px-5 py-8 text-center">
                <CalendarOff size={24} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm text-slate-400">No leave requests yet.</p>
                <a href="/hr/leave" className="mt-2 inline-block text-sm text-blue-600 hover:underline">Submit a request</a>
              </div>
            ) : null}
          </div>
        )}

        {/* Pending shift confirmations — shown for any role that has pending shifts */}
        {(isEnabled(widgets, "pending_shifts") || pendingShifts.length > 0) && (
          <PendingShiftsWidget initialShifts={pendingShifts} />
        )}

        {/* Clock In / Out widget */}
        {isEnabled(widgets, "clock_inout") && <ClockInOutWidget />}

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
