import { Header } from "@/components/layout/Header";
import { suppliers } from "@/lib/mock-data";
import { Plus } from "lucide-react";

export default function SuppliersPage() {
  return (
    <div>
      <Header
        title="Suppliers"
        subtitle={`${suppliers.length} suppliers`}
        actions={
          <button className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Plus size={16} />
            Add Supplier
          </button>
        }
      />
      <div className="p-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-900">Supplier Directory</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">ID</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Supplier Name</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Contact</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Phone</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {suppliers.map((sup, i) => (
                  <tr key={sup.id} className={i % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50/50 hover:bg-slate-50"}>
                    <td className="px-5 py-3 font-mono text-xs text-slate-500">{sup.id}</td>
                    <td className="px-5 py-3 font-medium text-slate-800">{sup.name}</td>
                    <td className="px-5 py-3 text-slate-600">{sup.contact}</td>
                    <td className="px-5 py-3 text-slate-600">{sup.email}</td>
                    <td className="px-5 py-3 text-slate-600">{sup.phone}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                        {sup.category}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <span className="text-amber-500">★</span>
                        <span className="text-sm font-medium text-slate-700">{sup.rating}</span>
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
