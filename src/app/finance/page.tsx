import { Header } from "@/components/layout/Header";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { DollarSign, TrendingDown, FileText, Clock } from "lucide-react";
import { invoices, expenses } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

export default function FinancePage() {
  const totalRevenue = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const totalPending = invoices.filter(i => i.status === "pending").reduce((s, i) => s + i.amount, 0);
  const totalOverdue = invoices.filter(i => i.status === "overdue").reduce((s, i) => s + i.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  const statusColors: Record<string, string> = {
    paid: "bg-emerald-100 text-emerald-700",
    pending: "bg-amber-100 text-amber-700",
    overdue: "bg-red-100 text-red-700",
  };

  return (
    <div>
      <Header
        title="Finance & Accounting"
        subtitle="Track revenue, expenses, and financial health"
        actions={
          <Link href="/finance/invoices" className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <FileText size={16} />
            New Invoice
          </Link>
        }
      />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Revenue Collected" value={formatCurrency(totalRevenue)} change={6.2} subtitle="vs last month" icon={DollarSign} iconColor="blue" />
          <StatsCard title="Pending Invoices" value={formatCurrency(totalPending)} change={-3.1} subtitle="awaiting payment" icon={Clock} iconColor="orange" />
          <StatsCard title="Overdue Amount" value={formatCurrency(totalOverdue)} change={12.5} subtitle="action required" icon={FileText} iconColor="red" />
          <StatsCard title="Total Expenses" value={formatCurrency(totalExpenses)} change={4.8} subtitle="this month" icon={TrendingDown} iconColor="purple" />
        </div>

        {/* Invoice Summary */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-900">Invoice Overview</h3>
            <Link href="/finance/invoices" className="text-sm text-blue-600 hover:underline">View all invoices</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Invoice #</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Customer</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.slice(0, 5).map((inv, i) => (
                  <tr key={inv.id} className={i % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50/50 hover:bg-slate-50"}>
                    <td className="px-5 py-3 font-mono text-slate-700 font-medium">{inv.id}</td>
                    <td className="px-5 py-3 text-slate-800">{inv.customer}</td>
                    <td className="px-5 py-3 text-slate-600">{inv.date}</td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-900">{formatCurrency(inv.amount)}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColors[inv.status]}`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expense Summary */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-900">Recent Expenses</h3>
            <Link href="/finance/expenses" className="text-sm text-blue-600 hover:underline">View all expenses</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Description</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((exp, i) => (
                  <tr key={exp.id} className={i % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50/50 hover:bg-slate-50"}>
                    <td className="px-5 py-3 font-medium text-slate-800">{exp.category}</td>
                    <td className="px-5 py-3 text-slate-600">{exp.description}</td>
                    <td className="px-5 py-3 text-slate-600">{exp.date}</td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-900">{formatCurrency(exp.amount)}</td>
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
