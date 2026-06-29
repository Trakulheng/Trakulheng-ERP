import { Header } from "@/components/layout/Header";
import { expenses } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import { Plus, Download } from "lucide-react";

const statusColors: Record<string, string> = {
  approved: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  rejected: "bg-red-100 text-red-700",
};

export default function ExpensesPage() {
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const approved = expenses.filter(e => e.status === "approved").reduce((s, e) => s + e.amount, 0);
  const pending = expenses.filter(e => e.status === "pending").reduce((s, e) => s + e.amount, 0);

  return (
    <div>
      <Header
        title="Expenses"
        subtitle={`${expenses.length} expense records`}
        actions={
          <button className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Plus size={16} />
            Add Expense
          </button>
        }
      />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500 mb-1">Total Expenses</p>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(total)}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500 mb-1">Approved</p>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(approved)}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500 mb-1">Pending Review</p>
            <p className="text-2xl font-bold text-amber-600">{formatCurrency(pending)}</p>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {["Office Supplies", "Travel", "Utilities", "Marketing", "Software", "Maintenance"].map((cat) => {
            const catExpenses = expenses.filter(e => e.category === cat);
            const catTotal = catExpenses.reduce((s, e) => s + e.amount, 0);
            return (
              <div key={cat} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm">
                  {cat.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">{cat}</p>
                  <p className="text-base font-semibold text-slate-900">{formatCurrency(catTotal)}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-900">All Expenses</h3>
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
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Description</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((exp, i) => (
                  <tr key={exp.id} className={i % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50/50 hover:bg-slate-50"}>
                    <td className="px-5 py-3 font-mono text-slate-600 text-xs">{exp.id}</td>
                    <td className="px-5 py-3 font-medium text-slate-800">{exp.category}</td>
                    <td className="px-5 py-3 text-slate-600">{exp.description}</td>
                    <td className="px-5 py-3 text-slate-600">{exp.date}</td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-900">{formatCurrency(exp.amount)}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${statusColors[exp.status]}`}>
                        {exp.status}
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
