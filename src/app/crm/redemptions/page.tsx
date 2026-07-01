"use client";

import { Header } from "@/components/layout/Header";
import { redemptions as initialRedemptions, giftItems, crmCustomers } from "@/lib/mock-data";
import { Gift, TicketCheck, Star, TrendingDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Redemption = (typeof initialRedemptions)[number];

const statusColors: Record<string, string> = {
  completed: "bg-emerald-100 text-emerald-700",
  pending:   "bg-amber-100 text-amber-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function RedemptionsPage() {
  const [list] = useState<Redemption[]>(initialRedemptions);

  const totalPoints = list.reduce((s, r) => s + r.pointsUsed, 0);
  const mostPopularId = list.reduce<Record<string, number>>((acc, r) => {
    acc[r.rewardId] = (acc[r.rewardId] ?? 0) + 1;
    return acc;
  }, {});
  const topRewardId = Object.entries(mostPopularId).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topReward = giftItems.find((g) => g.id === topRewardId);

  const tierCounts = crmCustomers.reduce<Record<string, number>>((acc, c) => {
    const tier = c.pointsBalance >= 10000 ? "Platinum" : c.pointsBalance >= 5000 ? "Gold" : c.pointsBalance >= 1000 ? "Silver" : "Bronze";
    acc[tier] = (acc[tier] ?? 0) + 1;
    return acc;
  }, {});

  const sorted = [...list].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <Header
        title="Redemption History"
        subtitle="All points redeemed by customers"
      />

      <div className="p-6 space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center">
              <TicketCheck size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{list.length}</p>
              <p className="text-sm text-slate-500">Total Redemptions</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
              <TrendingDown size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{totalPoints.toLocaleString()}</p>
              <p className="text-sm text-slate-500">Total Points Used</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
              <Star size={20} />
            </div>
            <div>
              <p className="text-base font-bold text-slate-900 truncate">{topReward?.name ?? "—"}</p>
              <p className="text-sm text-slate-500">Most Popular Reward</p>
            </div>
          </div>
        </div>

        {/* Tier summary */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Member Tier Distribution</h3>
          <div className="grid grid-cols-4 gap-4">
            {(["Platinum", "Gold", "Silver", "Bronze"] as const).map((tier) => {
              const count = tierCounts[tier] ?? 0;
              const total = crmCustomers.length;
              const pct = total ? Math.round((count / total) * 100) : 0;
              const colors: Record<string, string> = {
                Platinum: "bg-violet-500", Gold: "bg-amber-400", Silver: "bg-slate-400", Bronze: "bg-orange-400",
              };
              const textColors: Record<string, string> = {
                Platinum: "text-violet-700", Gold: "text-amber-700", Silver: "text-slate-600", Bronze: "text-orange-700",
              };
              return (
                <div key={tier} className="text-center">
                  <p className={cn("text-lg font-bold", textColors[tier])}>{count}</p>
                  <div className="w-full bg-slate-100 rounded-full h-2 my-2">
                    <div className={cn("h-2 rounded-full", colors[tier])} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-slate-500">{tier} · {pct}%</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700">All Redemptions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Reward</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Points Used</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Processed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sorted.map((r, i) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-400 text-xs">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center shrink-0">
                          {r.customerName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <span className="font-medium text-slate-800">{r.customerName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Gift size={14} className="text-slate-400 shrink-0" />
                        <span className="text-slate-700">{r.rewardName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-red-600">−{r.pointsUsed.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{r.date}</td>
                    <td className="px-4 py-3">
                      <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", statusColors[r.status] ?? "bg-slate-100 text-slate-500")}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{r.processedBy}</td>
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
