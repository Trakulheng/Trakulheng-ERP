"use client";

import { Header } from "@/components/layout/Header";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { DollarSign, Users, TrendingUp, ShoppingCart } from "lucide-react";
import { customers, salesOrders, revenueData } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

const stageColors: Record<string, string> = {
  prospect: "bg-slate-100 text-slate-600",
  quoted: "bg-blue-100 text-blue-700",
  negotiation: "bg-purple-100 text-purple-700",
  confirmed: "bg-amber-100 text-amber-700",
  invoiced: "bg-orange-100 text-orange-700",
  delivered: "bg-emerald-100 text-emerald-700",
};

export default function SalesPage() {
  const totalRevenue = salesOrders.reduce((s, o) => s + o.amount, 0);
  const activeCustomers = customers.filter(c => c.status === "active").length;
  const pipelineValue = salesOrders.filter(o => !["delivered", "invoiced"].includes(o.stage)).reduce((s, o) => s + o.amount * o.probability / 100, 0);
  const ordersThisMonth = salesOrders.length;

  return (
    <div>
      <Header
        title="Sales & CRM"
        subtitle="Pipeline, customers, and revenue tracking"
        actions={
          <Link href="/sales/orders" className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <ShoppingCart size={16} />
            New Order
          </Link>
        }
      />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Pipeline Revenue" value={formatCurrency(totalRevenue)} change={8.3} subtitle="vs last month" icon={DollarSign} iconColor="blue" />
          <StatsCard title="Weighted Pipeline" value={formatCurrency(pipelineValue)} change={12.1} subtitle="expected" icon={TrendingUp} iconColor="green" />
          <StatsCard title="Active Customers" value={activeCustomers.toString()} change={5} subtitle="accounts" icon={Users} iconColor="purple" />
          <StatsCard title="Orders This Month" value={ordersThisMonth.toString()} change={16.7} subtitle="total" icon={ShoppingCart} iconColor="orange" />
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-base font-semibold text-slate-900 mb-4">Revenue by Month</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => [`฿${((v as number)/1000).toFixed(0)}K`, "Revenue"]} />
              <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pipeline Stages */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-900">Sales Pipeline</h3>
              <Link href="/sales/orders" className="text-sm text-blue-600 hover:underline">All orders</Link>
            </div>
            <div className="divide-y divide-slate-100">
              {salesOrders.map((order, i) => (
                <div key={order.id} className={`flex items-center justify-between px-5 py-3 hover:bg-slate-50 ${i % 2 === 0 ? "" : "bg-slate-50/30"}`}>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{order.customer}</p>
                    <p className="text-xs text-slate-500">{order.id} • {order.items} items</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">{formatCurrency(order.amount)}</p>
                      <p className="text-xs text-slate-400">{order.probability}% probability</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${stageColors[order.stage]}`}>
                      {order.stage}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Customers */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-900">Top Customers</h3>
              <Link href="/sales/customers" className="text-sm text-blue-600 hover:underline">All customers</Link>
            </div>
            <div className="divide-y divide-slate-100">
              {customers.sort((a, b) => b.totalSpend - a.totalSpend).map((cust, i) => (
                <div key={cust.id} className={`flex items-center justify-between px-5 py-3 hover:bg-slate-50 ${i % 2 === 0 ? "" : "bg-slate-50/30"}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">
                      {cust.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{cust.name}</p>
                      <p className="text-xs text-slate-500">{cust.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">{formatCurrency(cust.totalSpend)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cust.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                      {cust.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
