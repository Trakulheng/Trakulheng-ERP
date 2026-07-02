"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { pointsSettings, tierThresholds, tierColors, Tier } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { CheckCircle2, Save } from "lucide-react";

type TierRow = {
  tier: Tier;
  min: number;
  max: number | null;
  multiplier: number;
};

const TIER_ORDER: Tier[] = ["bronze", "silver", "gold", "platinum"];
const TIER_LABELS: Record<Tier, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
};

function toTierRows(): TierRow[] {
  return TIER_ORDER.map((tier) => ({
    tier,
    min: tierThresholds[tier].min,
    max: tierThresholds[tier].max,
    multiplier: tierThresholds[tier].multiplier,
  }));
}

export default function PointsSettingsPage() {
  const [earn, setEarn] = useState(pointsSettings.earnRate);
  const [per, setPer] = useState(pointsSettings.earnPer);
  const [minPurchase, setMinPurchase] = useState(pointsSettings.minPurchase);
  const [expiry, setExpiry] = useState(pointsSettings.expiryMonths);
  const [tiers, setTiers] = useState<TierRow[]>(toTierRows());
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
  }

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 1500);
    return () => clearTimeout(t);
  }, [saved]);

  function updateTier(tier: Tier, field: "min" | "max" | "multiplier", value: number) {
    setTiers((prev) =>
      prev.map((r) => (r.tier === tier ? { ...r, [field]: value } : r))
    );
  }

  const goldTier = tiers.find((r) => r.tier === "gold");
  const goldMultiplier = goldTier?.multiplier ?? 2;
  const previewSpend = 10000;
  const basePoints = Math.floor((previewSpend / per) * earn);
  const goldPoints = Math.round(basePoints * goldMultiplier);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header
        title="Points & Rewards Config"
        actions={
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Save size={15} />
            Save Changes
          </button>
        }
      />

      {saved && (
        <div className="mx-6 mt-4 flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium px-4 py-3 rounded-xl">
          <CheckCircle2 size={16} className="shrink-0" />
          Settings saved successfully
        </div>
      )}

      <div className="p-6 space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-5">Earn Rules</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Points Earned</label>
              <input
                type="number"
                min={1}
                value={earn}
                onChange={(e) => setEarn(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-400 mt-1.5">Points awarded per qualifying purchase</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Per (THB)</label>
              <input
                type="number"
                min={1}
                value={per}
                onChange={(e) => setPer(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-400 mt-1.5">Spend amount to earn the above points</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Min Purchase (THB)</label>
              <input
                type="number"
                min={0}
                value={minPurchase}
                onChange={(e) => setMinPurchase(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-400 mt-1.5">Minimum order value to qualify for points</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Point Expiry (months)</label>
              <input
                type="number"
                min={1}
                value={expiry}
                onChange={(e) => setExpiry(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-400 mt-1.5">Months before unspent points expire</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-5">Tier Thresholds</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 uppercase tracking-wide border-b border-slate-100">
                  <th className="pb-3 text-left font-medium">Tier</th>
                  <th className="pb-3 text-left font-medium">Min Points</th>
                  <th className="pb-3 text-left font-medium">Max Points</th>
                  <th className="pb-3 text-left font-medium">Multiplier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {tiers.map((row) => (
                  <tr key={row.tier} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 pr-4">
                      <span
                        className={cn(
                          "text-xs font-medium px-2.5 py-1 rounded-full border",
                          tierColors[row.tier].bg,
                          tierColors[row.tier].text,
                          tierColors[row.tier].border
                        )}
                      >
                        {TIER_LABELS[row.tier]}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      {row.tier === "bronze" ? (
                        <input
                          type="number"
                          value={0}
                          disabled
                          className="w-28 px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-400 cursor-not-allowed"
                        />
                      ) : (
                        <input
                          type="number"
                          min={0}
                          value={row.min}
                          onChange={(e) => updateTier(row.tier, "min", Number(e.target.value))}
                          className="w-28 px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      {row.tier === "platinum" ? (
                        <input
                          type="text"
                          value="∞"
                          readOnly
                          className="w-28 px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-400 cursor-not-allowed"
                        />
                      ) : (
                        <input
                          type="number"
                          min={0}
                          value={row.max ?? 0}
                          onChange={(e) => updateTier(row.tier, "max", Number(e.target.value))}
                          className="w-28 px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      )}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0.1}
                          step={0.1}
                          value={row.multiplier}
                          onChange={(e) => updateTier(row.tier, "multiplier", Number(e.target.value))}
                          className="w-24 px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-xs text-slate-400">×</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-3">Live Preview</h2>
          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border shrink-0",
                tierColors.gold.bg,
                tierColors.gold.text,
                tierColors.gold.border
              )}
            >
              Au
            </div>
            <div>
              <p className="text-sm text-slate-600">
                A <span className="font-semibold text-amber-700">Gold</span> customer spending{" "}
                <span className="font-semibold text-slate-800">
                  ฿{previewSpend.toLocaleString()}
                </span>{" "}
                earns:
              </p>
              <p className="text-2xl font-bold text-amber-700 mt-0.5">
                {goldPoints.toLocaleString()} pts
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Base {basePoints} pts × {goldMultiplier}× Gold multiplier
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
