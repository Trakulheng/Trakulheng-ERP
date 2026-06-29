import { Header } from "@/components/layout/Header";
import { purchaseOrders } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import { Plus } from "lucide-react";

const statusColors: Record<string, string> = {
  received: "bg-emerald-100 text-emerald-700",
  "in-transit": "bg-blue-100 text-blue-700",
  pending: "bg-amber-100 text-amber-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function PurchaseOrdersPage() {
  const total = purchaseOrders.reduce((s, po) => s + po.total, 0);
  const pending = purchaseOrders.filter(po => po.status === "pending").reduce((s, po) => s + po.total, 0);

  return (
    <div>
      <Header
        title="Purchase Orders"
        subtitle={`${purchaseOrders.length} orders • Total: ${formatCurrency(total)}`}
        actions={
          <button className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Plus size={16} />
            New PO
          </button>
        }
      />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total PO Value", value: formatCurrency(total), color: "text-slate-900" },
            { label: "Pending Orders", value: formatCurrency(pending), color: "text-amber-600" },
            { label: "Received", value: formatCurrency(purchaseOrders.filter(po => po.status === "received").reduce((s, po) => s + po.total, 0)), color: "text-emerald-600" },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <p className="text-xs font-medium text-slate-500 mb-1">{item.label}</p>
              <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-900">All Purchase Orders</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">PO #</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Supplier</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Order Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Expected Date</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Items</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchaseOrders.map((po, i) => (
                  <tr key={po.id} className={i % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50/50 hover:bg-slate-50"}>
                    <td className="px-5 py-3 font-mono text-blue-600 font-medium">{po.id}</td>
                    <td className="px-5 py-3 font-medium text-slate-800">{po.supplier}</td>
                    <td className="px-5 py-3 text-slate-600">{po.date}</td>
                    <td className="px-5 py-3 text-slate-600">{po.expectedDate}</td>
                    <td className="px-5 py-3 text-right text-slate-700">{po.items}</td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-900">{formatCurrency(po.total)}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${statusColors[po.status]}`}>
                        {po.status}
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
