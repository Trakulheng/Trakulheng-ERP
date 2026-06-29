import { Header } from "@/components/layout/Header";
import { products } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import { Plus, Download } from "lucide-react";

const statusColors: Record<string, string> = {
  ok: "bg-emerald-100 text-emerald-700",
  low: "bg-amber-100 text-amber-700",
  out: "bg-red-100 text-red-700",
};

const statusLabels: Record<string, string> = {
  ok: "In Stock",
  low: "Low Stock",
  out: "Out of Stock",
};

export default function ProductsPage() {
  const totalValue = products.reduce((s, p) => s + p.stock * p.unitPrice, 0);

  return (
    <div>
      <Header
        title="Products"
        subtitle={`${products.length} products • Total value: ${formatCurrency(totalValue)}`}
        actions={
          <button className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Plus size={16} />
            Add Product
          </button>
        }
      />
      <div className="p-6">
        {/* Status Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "In Stock", count: products.filter(p => p.status === "ok").length, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
            { label: "Low Stock", count: products.filter(p => p.status === "low").length, color: "text-amber-600 bg-amber-50 border-amber-100" },
            { label: "Out of Stock", count: products.filter(p => p.status === "out").length, color: "text-red-600 bg-red-50 border-red-100" },
          ].map((item) => (
            <div key={item.label} className={`rounded-xl border p-4 shadow-sm ${item.color}`}>
              <p className="text-2xl font-bold">{item.count}</p>
              <p className="text-sm font-medium">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-900">Product Catalog</h3>
            <button className="flex items-center gap-2 text-sm text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50">
              <Download size={14} />
              Export
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">SKU</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Stock Qty</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Unit Price</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Stock Value</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((prod, i) => (
                  <tr key={prod.id} className={i % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50/50 hover:bg-slate-50"}>
                    <td className="px-5 py-3 font-mono text-xs text-slate-600 font-medium">{prod.id}</td>
                    <td className="px-5 py-3 font-medium text-slate-800">{prod.name}</td>
                    <td className="px-5 py-3 text-slate-600">{prod.category}</td>
                    <td className="px-5 py-3 text-right">
                      <span className={`font-semibold ${prod.status === "out" ? "text-red-600" : prod.status === "low" ? "text-amber-600" : "text-slate-900"}`}>
                        {prod.stock}
                      </span>
                      <span className="text-slate-400 text-xs ml-1">/ min {prod.minStock}</span>
                    </td>
                    <td className="px-5 py-3 text-right text-slate-700">{formatCurrency(prod.unitPrice)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-900">{formatCurrency(prod.stock * prod.unitPrice)}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[prod.status]}`}>
                        {statusLabels[prod.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t border-slate-200">
                  <td colSpan={5} className="px-5 py-3 text-sm font-semibold text-slate-700">Total Inventory Value</td>
                  <td className="px-5 py-3 text-right font-bold text-slate-900">{formatCurrency(totalValue)}</td>
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
