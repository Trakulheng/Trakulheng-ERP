import { Header } from "@/components/layout/Header";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Package, AlertTriangle, ShoppingCart, Truck } from "lucide-react";
import { products, purchaseOrders, suppliers } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

const statusColors: Record<string, string> = {
  ok: "bg-emerald-100 text-emerald-700",
  low: "bg-amber-100 text-amber-700",
  out: "bg-red-100 text-red-700",
};

const poStatusColors: Record<string, string> = {
  received: "bg-emerald-100 text-emerald-700",
  "in-transit": "bg-blue-100 text-blue-700",
  pending: "bg-amber-100 text-amber-700",
};

export default function InventoryPage() {
  const totalValue = products.reduce((s, p) => s + p.stock * p.unitPrice, 0);
  const lowStock = products.filter(p => p.status === "low").length;
  const outOfStock = products.filter(p => p.status === "out").length;
  const openPOs = purchaseOrders.filter(po => po.status !== "received").length;

  return (
    <div>
      <Header
        title="Inventory & Warehouse"
        subtitle="Manage stock levels, orders, and suppliers"
        actions={
          <Link href="/inventory/products" className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Package size={16} />
            Add Product
          </Link>
        }
      />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Inventory Value" value={formatCurrency(totalValue)} change={-2.1} subtitle="total" icon={Package} iconColor="blue" />
          <StatsCard title="Low Stock Items" value={lowStock.toString()} change={25} subtitle="need reorder" icon={AlertTriangle} iconColor="orange" />
          <StatsCard title="Out of Stock" value={outOfStock.toString()} change={100} subtitle="critical" icon={Package} iconColor="red" />
          <StatsCard title="Open Purchase Orders" value={openPOs.toString()} change={0} subtitle="in progress" icon={ShoppingCart} iconColor="purple" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-900">Stock Alerts</h3>
              <Link href="/inventory/products" className="text-sm text-blue-600 hover:underline">All products</Link>
            </div>
            <div className="divide-y divide-slate-100">
              {products.filter(p => p.status !== "ok").map((p, i) => (
                <div key={p.id} className={`flex items-center justify-between px-5 py-3 hover:bg-slate-50 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`}>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.id} • {p.category}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">{p.stock} units</p>
                      <p className="text-xs text-slate-400">min: {p.minStock}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColors[p.status]}`}>
                      {p.status === "out" ? "Out of Stock" : "Low Stock"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-900">Purchase Orders</h3>
              <Link href="/inventory/purchase-orders" className="text-sm text-blue-600 hover:underline">All orders</Link>
            </div>
            <div className="divide-y divide-slate-100">
              {purchaseOrders.map((po, i) => (
                <div key={po.id} className={`flex items-center justify-between px-5 py-3 hover:bg-slate-50 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`}>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{po.supplier}</p>
                    <p className="text-xs text-slate-500">{po.id} • Expected: {po.expectedDate}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-900">{formatCurrency(po.total)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${poStatusColors[po.status]}`}>
                      {po.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Suppliers */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
            <Truck size={16} className="text-slate-500" />
            <h3 className="text-base font-semibold text-slate-900">Suppliers</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Supplier</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Contact</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {suppliers.map((sup, i) => (
                  <tr key={sup.id} className={i % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50/50 hover:bg-slate-50"}>
                    <td className="px-5 py-3 font-medium text-slate-800">{sup.name}</td>
                    <td className="px-5 py-3 text-slate-600">{sup.contact} • {sup.email}</td>
                    <td className="px-5 py-3 text-slate-600">{sup.category}</td>
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
