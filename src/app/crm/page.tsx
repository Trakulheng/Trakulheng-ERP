"use client";

import { Header } from "@/components/layout/Header";
import {
  crmCustomers,
  pointsTransactions,
  redemptions,
  getTier,
  tierColors,
  Tier,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils";
import { Users, Star, TrendingUp, Gift } from "lucide-react";

const TIERS: Tier[] = ["bronze", "silver", "gold", "platinum"];

const tierLabels: Record<Tier, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
};

function getInitials(customerId: string): string {
  const c = crmCustomers.find((x) => x.id === customerId);
  if (!c) return "?";
  return (c.firstName[0] + c.lastName[0]).toUpperCase();
}

function getCustomerName(customerId: string): string {
  const c = crmCustomers.find((x) => x.id === customerId);
  if (!c) return "Unknown";
  return `${c.firstName} ${c.lastName}`;
}

export default function CRMPage() {
  const totalMembers = crmCustomers.length;
  const premiumMembers = crmCustomers.filter((c) => {
    const t = getTier(c.pointsBalance);
    return t === "platinum" || t === "gold";
  }).length;
  const pointsInCirculation = crmCustomers.reduce(
    (acc, c) => acc + c.pointsBalance,
    0
  );
  const totalRedeemed = redemptions.reduce((acc, r) => acc + r.pointsUsed, 0);

  const tierCounts: Record<Tier, number> = {
    bronze: 0,
    silver: 0,
    gold: 0,
    platinum: 0,
  };
  crmCustomers.forEach((c) => {
    tierCounts[getTier(c.pointsBalance)]++;
  });

  const recentActivity = [...pointsTransactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);

  const topCustomers = [...crmCustomers]
    .sort((a, b) => b.pointsBalance - a.pointsBalance)
    .slice(0, 5);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header title="CRM" subtitle="Customer Relationship Management" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-500 font-medium">Total Members</p>
              <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users size={18} className="text-blue-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900">{totalMembers}</p>
            <p className="text-xs text-slate-400 mt-1">Registered CRM members</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-500 font-medium">Platinum / Gold</p>
              <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
                <Star size={18} className="text-amber-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900">{premiumMembers}</p>
            <p className="text-xs text-slate-400 mt-1">Premium tier members</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-500 font-medium">Points in Circulation</p>
              <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                <TrendingUp size={18} className="text-emerald-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {formatNumber(pointsInCirculation)}
            </p>
            <p className="text-xs text-slate-400 mt-1">Active points balance</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-500 font-medium">Total Redeemed</p>
              <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center">
                <Gift size={18} className="text-violet-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {formatNumber(totalRedeemed)}
            </p>
            <p className="text-xs text-slate-400 mt-1">Points redeemed total</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Tier Breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">
              Tier Breakdown
            </h3>
            <div className="space-y-4">
              {TIERS.map((tier) => {
                const count = tierCounts[tier];
                const pct = totalMembers > 0 ? (count / totalMembers) * 100 : 0;
                const colors = tierColors[tier];
                return (
                  <div key={tier}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={cn(
                          "text-xs font-semibold px-2 py-0.5 rounded-full border",
                          colors.bg,
                          colors.text,
                          colors.border
                        )}
                      >
                        {tierLabels[tier]}
                      </span>
                      <span className="text-xs text-slate-500">
                        {count} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className={cn("h-2 rounded-full", colors.bg, "border", colors.border)}
                        style={{ width: `${pct}%`, minWidth: pct > 0 ? "4px" : "0" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">
              Recent Activity
            </h3>
            <div className="space-y-3">
              {recentActivity.map((tx) => {
                const isEarn = tx.type === "earn";
                const name = getCustomerName(tx.customerId);
                const initials = getInitials(tx.customerId);
                const tier = getTier(
                  crmCustomers.find((c) => c.id === tx.customerId)?.pointsBalance ?? 0
                );
                const colors = tierColors[tier];
                return (
                  <div key={tx.id} className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                        colors.bg,
                        colors.text
                      )}
                    >
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {name}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {tx.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={cn(
                          "text-xs font-semibold px-2 py-0.5 rounded-full",
                          isEarn
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-600"
                        )}
                      >
                        {isEarn ? "Earn" : "Redeem"}
                      </span>
                      <span
                        className={cn(
                          "text-sm font-bold w-16 text-right",
                          isEarn ? "text-emerald-600" : "text-red-500"
                        )}
                      >
                        {isEarn ? "+" : ""}
                        {tx.points}
                      </span>
                      <span className="text-xs text-slate-400 w-20 text-right">
                        {tx.date}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700">Top Customers by Points</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3">
                  Rank
                </th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3">
                  Name
                </th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3">
                  Tier
                </th>
                <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3">
                  Points Balance
                </th>
                <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3">
                  Total Spend
                </th>
                <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3">
                  Last Visit
                </th>
              </tr>
            </thead>
            <tbody>
              {topCustomers.map((c, i) => {
                const tier = getTier(c.pointsBalance);
                const colors = tierColors[tier];
                return (
                  <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <span className="text-sm font-bold text-slate-400">#{i + 1}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                            colors.bg,
                            colors.text
                          )}
                        >
                          {(c.firstName[0] + c.lastName[0]).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            {c.firstName} {c.lastName}
                          </p>
                          <p className="text-xs text-slate-400">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          "text-xs font-semibold px-2 py-0.5 rounded-full border",
                          colors.bg,
                          colors.text,
                          colors.border
                        )}
                      >
                        {tierLabels[tier]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-sm font-bold text-slate-900">
                        {formatNumber(c.pointsBalance)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-sm text-slate-600">
                        ฿{formatNumber(c.totalSpend)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-xs text-slate-400">{c.lastVisit}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
