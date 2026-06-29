import { Header } from "@/components/layout/Header";
import { customers } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import { Plus } from "lucide-react";

export default function CustomersPage() {
  const total = customers.reduce((s, c) => s + c.totalSpend, 0);
  const active = customers.filter(c => c.status === "active").length;

  return (
    <div>
      <Header
        title="Customers"
        subtitle={`${customers.length} customers • ${formatCurrency(total)} total spend`}
        actions={
          <button className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Plus size={16} />
            Add Customer
          </button>
        }
      />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500 mb-1">Total Customers</p>
            <p className="text-2xl font-bold text-slate-900">{customers.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500 mb-1">Active Accounts</p>
            <p className="text-2xl font-bold text-emerald-600">{active}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500 mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(total)}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-900">Customer Directory</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Customer</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Contact</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Spend</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.sort((a, b) => b.totalSpend - a.totalSpend).map((cust, i) => (
                  <tr key={cust.id} className={i % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50/50 hover:bg-slate-50"}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                          {cust.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{cust.name}</p>
                          <p className="text-xs text-slate-500">{cust.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{cust.contact}</td>
                    <td className="px-5 py-3 text-slate-600">{cust.email}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cust.type === "Enterprise" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
                        {cust.type}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-900">{formatCurrency(cust.totalSpend)}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${cust.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {cust.status}
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
