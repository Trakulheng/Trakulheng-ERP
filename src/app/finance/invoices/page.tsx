import { Header } from "@/components/layout/Header";
import { invoices } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import { Plus, Download, Eye, Edit } from "lucide-react";

const statusColors: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  overdue: "bg-red-100 text-red-700",
};

export default function InvoicesPage() {
  const totals = {
    all: invoices.reduce((s, i) => s + i.amount, 0),
    paid: invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.amount, 0),
    pending: invoices.filter(i => i.status === "pending").reduce((s, i) => s + i.amount, 0),
    overdue: invoices.filter(i => i.status === "overdue").reduce((s, i) => s + i.amount, 0),
  };

  return (
    <div>
      <Header
        title="Invoices"
        subtitle={`${invoices.length} invoices total`}
        actions={
          <button className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Plus size={16} />
            New Invoice
          </button>
        }
      />
      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Invoiced", value: totals.all, color: "text-slate-900" },
            { label: "Paid", value: totals.paid, color: "text-emerald-600" },
            { label: "Pending", value: totals.pending, color: "text-amber-600" },
            { label: "Overdue", value: totals.overdue, color: "text-red-600" },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <p className="text-xs font-medium text-slate-500 mb-1">{item.label}</p>
              <p className={`text-xl font-bold ${item.color}`}>{formatCurrency(item.value)}</p>
            </div>
          ))}
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-900">All Invoices</h3>
            <button className="flex items-center gap-2 text-sm text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50">
              <Download size={14} />
              Export
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Invoice #</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Customer</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Due Date</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv, i) => (
                  <tr key={inv.id} className={i % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50/50 hover:bg-slate-50"}>
                    <td className="px-5 py-3 font-mono font-medium text-blue-600">{inv.id}</td>
                    <td className="px-5 py-3 font-medium text-slate-800">{inv.customer}</td>
                    <td className="px-5 py-3 text-slate-600">{inv.date}</td>
                    <td className="px-5 py-3 text-slate-600">{inv.dueDate}</td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-900">{formatCurrency(inv.amount)}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${statusColors[inv.status]}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                          <Eye size={14} />
                        </button>
                        <button className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                          <Edit size={14} />
                        </button>
                      </div>
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
