"use client";

import { Header } from "@/components/layout/Header";
import {
  crmCustomers,
  crmMonthlyData,
  giftItems,
  redemptions,
  getTier,
  tierColors,
  Tier,
} from "@/lib/mock-data";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Users, Gift, DollarSign, Star, CreditCard } from "lucide-react";

const TIER_ORDER: Tier[] = ["platinum", "gold", "silver", "bronze"];

const TIER_LABELS: Record<Tier, string> = {
  platinum: "Platinum",
  gold: "Gold",
  silver: "Silver",
  bronze: "Bronze",
};

const TIER_BAR_COLOR: Record<Tier, string> = {
  platinum: "bg-violet-500",
  gold: "bg-amber-400",
  silver: "bg-slate-400",
  bronze: "bg-orange-400",
};

export default function CRMAnalyticsPage() {
  const totalSpend = crmCustomers.reduce((s, c) => s + c.totalSpend, 0);
  const avgValue = crmCustomers.length > 0 ? totalSpend / crmCustomers.length : 0;
  const totalEarned = crmCustomers.reduce((s, c) => s + c.totalPointsEarned, 0);
  const totalRedeemed = crmCustomers.reduce((s, c) => s + c.totalPointsRedeemed, 0);
  const redemptionRate = totalEarned > 0 ? (totalRedeemed / totalEarned) * 100 : 0;
  const pointsLiability = crmCustomers.reduce((s, c) => s + c.pointsBalance, 0);

  const tierCounts: Record<Tier, number> = { bronze: 0, silver: 0, gold: 0, platinum: 0 };
  crmCustomers.forEach((c) => {
    tierCounts[getTier(c.pointsBalance)]++;
  });
  const totalMembers = crmCustomers.length;

  const topCustomers = [...crmCustomers]
    .sort((a, b) => b.totalSpend - a.totalSpend)
    .slice(0, 5);

  const redemptionsByGift: Record<string, { name: string; category: string; count: number; pointsTotal: number }> = {};
  redemptions.forEach((r) => {
    if (!redemptionsByGift[r.rewardId]) {
      const gift = giftItems.find((g) => g.id === r.rewardId);
      redemptionsByGift[r.rewardId] = {
        name: r.rewardName,
        category: gift?.category ?? "—",
        count: 0,
        pointsTotal: 0,
      };
    }
    redemptionsByGift[r.rewardId].count++;
    redemptionsByGift[r.rewardId].pointsTotal += r.pointsUsed;
  });
  const topRewards = Object.values(redemptionsByGift)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header title="CRM Analytics" />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Total Member Spend",
              value: formatCurrency(totalSpend),
              icon: DollarSign,
              color: "text-blue-600",
              bg: "bg-blue-50",
            },
            {
              label: "Avg Member Value",
              value: formatCurrency(avgValue),
              icon: TrendingUp,
              color: "text-emerald-600",
              bg: "bg-emerald-50",
            },
            {
              label: "Redemption Rate",
              value: `${redemptionRate.toFixed(1)}%`,
              icon: Gift,
              color: "text-violet-600",
              bg: "bg-violet-50",
            },
            {
              label: "Points Liability",
              value: formatNumber(pointsLiability) + " pts",
              icon: Star,
              color: "text-amber-600",
              bg: "bg-amber-50",
            },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-500">{label}</span>
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", bg)}>
                  <Icon size={18} className={color} />
                </div>
              </div>
              <p className="text-xl font-bold text-slate-900 truncate">{value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Points Flow</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={crmMonthlyData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={50} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                  formatter={(v, name) => [(v as number).toLocaleString(), name === "pointsEarned" ? "Earned" : "Redeemed"]}
                />
                <Bar dataKey="pointsEarned" fill="#3b82f6" radius={[3, 3, 0, 0]} name="pointsEarned" />
                <Bar dataKey="pointsRedeemed" fill="#f43f5e" radius={[3, 3, 0, 0]} name="pointsRedeemed" />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2 justify-center">
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" /> Earned
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-3 h-3 rounded-sm bg-rose-500 inline-block" /> Redeemed
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Member Growth</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={crmMonthlyData}>
                <defs>
                  <linearGradient id="memberGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={35} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                  formatter={(v) => [v as number, "New Members"]}
                />
                <Area
                  type="monotone"
                  dataKey="newMembers"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#memberGradient)"
                  name="newMembers"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Tier Distribution</h3>
          <div className="space-y-3">
            {TIER_ORDER.map((tier) => {
              const count = tierCounts[tier];
              const pct = totalMembers > 0 ? (count / totalMembers) * 100 : 0;
              return (
                <div key={tier} className="flex items-center gap-4">
                  <span
                    className={cn(
                      "text-xs font-medium px-2.5 py-1 rounded-full w-20 text-center border",
                      tierColors[tier].bg,
                      tierColors[tier].text,
                      tierColors[tier].border
                    )}
                  >
                    {TIER_LABELS[tier]}
                  </span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2.5">
                    <div
                      className={cn("h-2.5 rounded-full transition-all", TIER_BAR_COLOR[tier])}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-slate-700 w-6 text-right">{count}</span>
                  <span className="text-xs text-slate-400 w-10 text-right">{pct.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Users size={16} className="text-blue-600" />
              Top Customers
            </h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 uppercase tracking-wide border-b border-slate-100">
                  <th className="pb-2 text-left font-medium">Rank</th>
                  <th className="pb-2 text-left font-medium">Name</th>
                  <th className="pb-2 text-left font-medium">Tier</th>
                  <th className="pb-2 text-right font-medium">Spend</th>
                  <th className="pb-2 text-right font-medium">Points</th>
                  <th className="pb-2 text-right font-medium">Last Visit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {topCustomers.map((c, i) => {
                  const tier = getTier(c.pointsBalance);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 pr-2">
                        <span className="text-xs font-bold text-slate-400">#{i + 1}</span>
                      </td>
                      <td className="py-2.5 pr-2 font-medium text-slate-800">
                        {c.firstName} {c.lastName}
                      </td>
                      <td className="py-2.5 pr-2">
                        <span
                          className={cn(
                            "text-xs font-medium px-2 py-0.5 rounded-full border",
                            tierColors[tier].bg,
                            tierColors[tier].text,
                            tierColors[tier].border
                          )}
                        >
                          {TIER_LABELS[tier]}
                        </span>
                      </td>
                      <td className="py-2.5 text-right text-slate-700">{formatCurrency(c.totalSpend)}</td>
                      <td className="py-2.5 text-right text-slate-500">{c.pointsBalance.toLocaleString()}</td>
                      <td className="py-2.5 text-right text-slate-400 text-xs">
                        {new Date(c.lastVisit).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Gift size={16} className="text-violet-600" />
              Most Popular Rewards
            </h3>
            {topRewards.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">No redemptions yet</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-400 uppercase tracking-wide border-b border-slate-100">
                    <th className="pb-2 text-left font-medium">Gift</th>
                    <th className="pb-2 text-left font-medium">Category</th>
                    <th className="pb-2 text-right font-medium">Times</th>
                    <th className="pb-2 text-right font-medium">Pts Used</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {topRewards.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 pr-2 font-medium text-slate-800">{r.name}</td>
                      <td className="py-2.5 pr-2">
                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                          {r.category}
                        </span>
                      </td>
                      <td className="py-2.5 text-right text-slate-700 font-semibold">{r.count}</td>
                      <td className="py-2.5 text-right text-slate-400">{r.pointsTotal.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
