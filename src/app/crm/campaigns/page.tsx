"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { campaigns as initialCampaigns, tierColors, Tier } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import {
  Plus,
  Zap,
  Clock,
  CheckCircle2,
  Star,
  Calendar,
  X,
  Pencil,
} from "lucide-react";

type CampaignStatus = "active" | "scheduled" | "ended";
type CampaignType = "multiplier" | "bonus";

interface Campaign {
  id: string;
  name: string;
  description: string;
  type: CampaignType;
  value: number;
  startDate: string;
  endDate: string;
  status: CampaignStatus;
  eligibleTiers: Tier[];
  participantCount: number;
  pointsIssued: number;
  createdBy: string;
}

const ALL_TIERS: Tier[] = ["bronze", "silver", "gold", "platinum"];

const TIER_LABELS: Record<Tier, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const emptyForm = {
  name: "",
  description: "",
  type: "multiplier" as CampaignType,
  value: 2,
  startDate: "",
  endDate: "",
  eligibleTiers: ["bronze", "silver", "gold", "platinum"] as Tier[],
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const active = campaigns.filter((c) => c.status === "active").length;
  const scheduled = campaigns.filter((c) => c.status === "scheduled").length;
  const ended = campaigns.filter((c) => c.status === "ended").length;
  const totalPts = campaigns.reduce((s, c) => s + c.pointsIssued, 0);

  function openNew() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setModalOpen(true);
  }

  function openEdit(c: Campaign) {
    setEditingId(c.id);
    setForm({
      name: c.name,
      description: c.description,
      type: c.type,
      value: c.value,
      startDate: c.startDate,
      endDate: c.endDate,
      eligibleTiers: [...c.eligibleTiers],
    });
    setModalOpen(true);
  }

  function handleSave() {
    if (!form.name.trim() || !form.startDate || !form.endDate) return;
    if (editingId) {
      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === editingId
            ? { ...c, ...form }
            : c
        )
      );
    } else {
      const newCamp: Campaign = {
        id: `CAMP-${String(campaigns.length + 1).padStart(3, "0")}`,
        ...form,
        status: "scheduled",
        participantCount: 0,
        pointsIssued: 0,
        createdBy: "Admin",
      };
      setCampaigns((prev) => [newCamp, ...prev]);
    }
    setModalOpen(false);
  }

  function handleEnd(id: string) {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "ended" } : c))
    );
  }

  function handleActivate(id: string) {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "active" } : c))
    );
  }

  function toggleTier(tier: Tier) {
    setForm((f) => ({
      ...f,
      eligibleTiers: f.eligibleTiers.includes(tier)
        ? f.eligibleTiers.filter((t) => t !== tier)
        : [...f.eligibleTiers, tier],
    }));
  }

  const statusBadge: Record<CampaignStatus, string> = {
    active: "bg-emerald-100 text-emerald-700",
    scheduled: "bg-blue-100 text-blue-700",
    ended: "bg-slate-100 text-slate-500",
  };

  const statusLabel: Record<CampaignStatus, string> = {
    active: "Active",
    scheduled: "Scheduled",
    ended: "Ended",
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header
        title="Loyalty Campaigns"
        actions={
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            New Campaign
          </button>
        }
      />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Active Campaigns", value: active, icon: Zap, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Scheduled", value: scheduled, icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Ended", value: ended, icon: CheckCircle2, color: "text-slate-500", bg: "bg-slate-100" },
            { label: "Total Points Issued", value: totalPts.toLocaleString(), icon: Star, color: "text-amber-600", bg: "bg-amber-50" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-500">{label}</span>
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", bg)}>
                  <Icon size={18} className={color} />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">{value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {campaigns.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 pr-3">
                  <p className="font-semibold text-slate-900">{c.name}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{c.description}</p>
                </div>
                <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full shrink-0", statusBadge[c.status])}>
                  {statusLabel[c.status]}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {c.type === "multiplier" ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                    ×{c.value} Multiplier
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-100 text-violet-700">
                    +{c.value} pts Bonus
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Calendar size={14} className="text-slate-400 shrink-0" />
                <span>{formatDate(c.startDate)} → {formatDate(c.endDate)}</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {c.eligibleTiers.map((tier) => (
                  <span
                    key={tier}
                    className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded-full border",
                      tierColors[tier].bg,
                      tierColors[tier].text,
                      tierColors[tier].border
                    )}
                  >
                    {TIER_LABELS[tier]}
                  </span>
                ))}
              </div>

              <p className="text-xs text-slate-400">
                {c.participantCount} participants · {c.pointsIssued.toLocaleString()} pts issued
              </p>

              <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                <button
                  onClick={() => openEdit(c)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <Pencil size={14} />
                  Edit
                </button>
                {c.status === "active" && (
                  <button
                    onClick={() => handleEnd(c.id)}
                    className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    End Campaign
                  </button>
                )}
                {c.status === "scheduled" && (
                  <button
                    onClick={() => handleActivate(c.id)}
                    className="px-3 py-1.5 text-sm text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors"
                  >
                    Activate
                  </button>
                )}
                {c.status === "ended" && (
                  <button
                    disabled
                    className="px-3 py-1.5 text-sm text-slate-400 border border-slate-200 rounded-lg cursor-not-allowed"
                  >
                    Ended
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingId ? "Edit Campaign" : "New Campaign"}
              </h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <X size={18} className="text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Campaign Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Summer Double Points"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Brief description of the campaign"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as CampaignType }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="multiplier">Multiplier</option>
                    <option value="bonus">Bonus</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Value ({form.type === "multiplier" ? "×" : "pts"})
                  </label>
                  <input
                    type="number"
                    value={form.value}
                    min={1}
                    onChange={(e) => setForm((f) => ({ ...f, value: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Eligible Tiers</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_TIERS.map((tier) => {
                    const selected = form.eligibleTiers.includes(tier);
                    return (
                      <button
                        key={tier}
                        type="button"
                        onClick={() => toggleTier(tier)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
                          selected
                            ? cn(tierColors[tier].bg, tierColors[tier].text, tierColors[tier].border)
                            : "border-slate-200 text-slate-400 hover:bg-slate-50"
                        )}
                      >
                        {TIER_LABELS[tier]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingId ? "Save Changes" : "Create Campaign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
