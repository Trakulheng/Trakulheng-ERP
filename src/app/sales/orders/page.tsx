import { Header } from "@/components/layout/Header";
import { salesOrders } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import { Plus } from "lucide-react";

const stageColors: Record<string, string> = {
  prospect: "bg-slate-100 text-slate-600",
  quoted: "bg-blue-100 text-blue-700",
  negotiation: "bg-purple-100 text-purple-700",
  confirmed: "bg-amber-100 text-amber-700",
  invoiced: "bg-orange-100 text-orange-700",
  delivered: "bg-emerald-100 text-emerald-700",
};

const stages = ["prospect", "quoted", "negotiation", "confirmed", "invoiced", "delivered"];

export default function OrdersPage() {
  const totalValue = salesOrders.reduce((s, o) => s + o.amount, 0);

  return (
    <div>
      <Header
        title="Sales Orders"
        subtitle={`${salesOrders.length} orders • ${formatCurrency(totalValue)} total`}
        actions={
          <button className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Plus size={16} />
            New Order
          </button>
        }
      />
      <div className="p-6 space-y-6">
        {/* Stage Summary */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
          {stages.map((stage) => {
            const stageOrders = salesOrders.filter(o => o.stage === stage);
            const stageValue = stageOrders.reduce((s, o) => s + o.amount, 0);
            return (
              <div key={stage} className={`rounded-xl border p-3 shadow-sm text-center ${stageColors[stage]}`}>
                <p className="text-lg font-bold">{stageOrders.length}</p>
                <p className="text-xs font-medium capitalize">{stage}</p>
                {stageOrders.length > 0 && <p className="text-xs mt-0.5 opacity-70">{formatCurrency(stageValue)}</p>}
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-900">All Sales Orders</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Order #</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Customer</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Items</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Probability</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Stage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {salesOrders.map((order, i) => (
                  <tr key={order.id} className={i % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50/50 hover:bg-slate-50"}>
                    <td className="px-5 py-3 font-mono text-blue-600 font-medium">{order.id}</td>
                    <td className="px-5 py-3 font-medium text-slate-800">{order.customer}</td>
                    <td className="px-5 py-3 text-slate-600">{order.date}</td>
                    <td className="px-5 py-3 text-right text-slate-700">{order.items}</td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-900">{formatCurrency(order.amount)}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-slate-200 rounded-full h-1.5">
                          <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${order.probability}%` }} />
                        </div>
                        <span className="text-xs text-slate-600">{order.probability}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${stageColors[order.stage]}`}>
                        {order.stage}
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
