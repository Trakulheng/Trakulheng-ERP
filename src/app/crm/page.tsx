"use client";

import { Header } from "@/components/layout/Header";
import {
  crmCustomers,
  pointsTransactions,
  redemptions,
  campaigns,
  crmMonthlyData,
  getTier,
  tierColors,
  Tier,
} from "@/lib/mock-data";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import { Users, Star, TrendingUp, Gift, Zap } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const TIERS: Tier[] = ["platinum", "gold", "silver", "bronze"];
const tierLabels: Record<Tier, string> = { bronze:"Bronze", silver:"Silver", gold:"Gold", platinum:"Platinum" };

const campaignStatusColors: Record<string, string> = {
  active:    "bg-emerald-100 text-emerald-700",
  scheduled: "bg-blue-100 text-blue-700",
  ended:     "bg-slate-100 text-slate-500",
};

export default function CRMPage() {
  const totalMembers = crmCustomers.length;
  const premiumMembers = crmCustomers.filter((c) => {
    const t = getTier(c.pointsBalance);
    return t === "platinum" || t === "gold";
  }).length;
  const pointsInCirculation = crmCustomers.reduce((acc, c) => acc + c.pointsBalance, 0);
  const totalRedeemed = redemptions.reduce((acc, r) => acc + r.pointsUsed, 0);

  const tierCounts: Record<Tier, number> = { bronze:0, silver:0, gold:0, platinum:0 };
  crmCustomers.forEach((c) => { tierCounts[getTier(c.pointsBalance)]++; });

  const recentActivity = [...pointsTransactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  const topCustomers = [...crmCustomers].sort((a, b) => b.pointsBalance - a.pointsBalance).slice(0, 5);
  const activeCampaigns = campaigns.filter((c) => c.status === "active");

  function getInitials(customerId: string) {
    const c = crmCustomers.find((x) => x.id === customerId);
    return c ? (c.firstName[0] + c.lastName[0]).toUpperCase() : "?";
  }
  function getCustomerName(customerId: string) {
    const c = crmCustomers.find((x) => x.id === customerId);
    return c ? `${c.firstName} ${c.lastName}` : "Unknown";
  }

  return (
    <div>
      <Header title="CRM Overview" subtitle="Customer relationship & loyalty management" />

      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label:"Total Members",        value:totalMembers,                    sub:"Registered CRM members",      icon:Users,      color:"blue"    },
            { label:"Premium Members",      value:premiumMembers,                  sub:"Gold & Platinum tier",         icon:Star,       color:"amber"   },
            { label:"Points in Circulation",value:formatNumber(pointsInCirculation),sub:"Active points balance",     icon:TrendingUp, color:"emerald" },
            { label:"Total Redeemed",       value:formatNumber(totalRedeemed),     sub:"All-time points redeemed",    icon:Gift,       color:"violet"  },
          ].map(({ label, value, sub, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-500 font-medium">{label}</p>
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center",
                  color==="blue" && "bg-blue-100 text-blue-600",
                  color==="amber" && "bg-amber-100 text-amber-600",
                  color==="emerald" && "bg-emerald-100 text-emerald-600",
                  color==="violet" && "bg-violet-100 text-violet-600",
                )}>
                  <Icon size={18} />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900">{value}</p>
              <p className="text-xs text-slate-400 mt-1">{sub}</p>
            </div>
          ))}
        </div>

        {/* Points Flow Chart + Active Campaigns */}
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Points Flow (12 Months)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={crmMonthlyData} margin={{ top:4, right:8, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize:11, fill:"#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:11, fill:"#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => (v as number).toLocaleString()} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11 }} />
                <Bar dataKey="pointsEarned"   name="Earned"   fill="#3b82f6" radius={[3,3,0,0]} />
                <Bar dataKey="pointsRedeemed" name="Redeemed" fill="#f43f5e" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Tier Breakdown</h3>
            <div className="space-y-4">
              {TIERS.map((tier) => {
                const count = tierCounts[tier];
                const pct = totalMembers > 0 ? (count / totalMembers) * 100 : 0;
                const colors = tierColors[tier];
                return (
                  <div key={tier}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full border", colors.bg, colors.text, colors.border)}>
                        {tierLabels[tier]}
                      </span>
                      <span className="text-xs text-slate-500">{count} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className={cn("h-2 rounded-full", colors.bg, "border", colors.border)}
                        style={{ width:`${pct}%`, minWidth: pct > 0 ? "4px" : "0" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={14} className="text-amber-500" />
                <p className="text-sm font-semibold text-slate-700">Active Campaigns</p>
              </div>
              <div className="space-y-2">
                {activeCampaigns.map((camp) => (
                  <div key={camp.id} className="flex items-start justify-between gap-2">
                    <p className="text-xs text-slate-700 font-medium leading-snug">{camp.name}</p>
                    <span className={cn("text-xs font-semibold px-1.5 py-0.5 rounded-full shrink-0", campaignStatusColors[camp.status])}>
                      {camp.type === "multiplier" ? `×${camp.value}` : `+${camp.value}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity + Top Customers */}
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {recentActivity.map((tx) => {
                const isEarn = tx.type === "earn";
                const name = getCustomerName(tx.customerId);
                const initials = getInitials(tx.customerId);
                const tier = getTier(crmCustomers.find((c) => c.id === tx.customerId)?.pointsBalance ?? 0);
                const colors = tierColors[tier];
                return (
                  <div key={tx.id} className="flex items-center gap-3">
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0", colors.bg, colors.text)}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-800 truncate">{name}</p>
                      <p className="text-xs text-slate-400 truncate">{tx.description}</p>
                    </div>
                    <span className={cn("text-xs font-bold shrink-0", isEarn ? "text-emerald-600" : "text-red-500")}>
                      {isEarn ? "+" : ""}{tx.points}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700">Top Customers by Points</h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {["#","Customer","Tier","Points","Total Spend","Last Visit"].map((h, i) => (
                    <th key={h} className={cn("text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3", i > 2 ? "text-right" : "text-left")}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topCustomers.map((c, i) => {
                  const tier = getTier(c.pointsBalance);
                  const colors = tierColors[tier];
                  return (
                    <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-bold text-slate-300">#{i+1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold", colors.bg, colors.text)}>
                            {(c.firstName[0]+c.lastName[0]).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800">{c.firstName} {c.lastName}</p>
                            <p className="text-xs text-slate-400">{c.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full border", colors.bg, colors.text, colors.border)}>
                          {tierLabels[tier]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900 text-sm">{formatNumber(c.pointsBalance)}</td>
                      <td className="px-4 py-3 text-right text-slate-600 text-sm">{formatCurrency(c.totalSpend)}</td>
                      <td className="px-4 py-3 text-right text-xs text-slate-400">{c.lastVisit}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
