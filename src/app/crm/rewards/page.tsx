"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { giftItems as initialGiftItems } from "@/lib/mock-data";
import { cn, formatNumber } from "@/lib/utils";
import { X, Plus, Edit2, Package } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────

interface GiftItem {
  id: string;
  name: string;
  category: string;
  pointsRequired: number;
  stock: number;
  status: "active" | "inactive";
  color: string;
}

const CATEGORIES = [
  "Merchandise",
  "Safety",
  "Voucher",
  "Tools",
  "Experience",
  "Bonus",
] as const;

const COLORS = [
  "blue",
  "emerald",
  "amber",
  "violet",
  "red",
  "slate",
  "pink",
  "indigo",
] as const;

type GiftColor = (typeof COLORS)[number];
type GiftCategory = (typeof CATEGORIES)[number];

// ── Gift Modal ─────────────────────────────────────────────────────────

interface GiftModalProps {
  existing?: GiftItem;
  count: number;
  onClose: () => void;
  onSave: (g: GiftItem) => void;
}

function GiftModal({ existing, count, onClose, onSave }: GiftModalProps) {
  const [form, setForm] = useState({
    name: existing?.name ?? "",
    category: (existing?.category ?? "Merchandise") as GiftCategory,
    pointsRequired: existing?.pointsRequired ?? 0,
    stock: existing?.stock ?? 0,
    color: (existing?.color ?? "blue") as GiftColor,
    status: (existing?.status ?? "active") as "active" | "inactive",
  });

  const set = <K extends keyof typeof form>(key: K, val: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleSave = () => {
    if (!form.name) return;
    const id =
      existing?.id ?? `GIFT-${String(count + 1).padStart(3, "0")}`;
    onSave({
      id,
      name: form.name,
      category: form.category,
      pointsRequired: Number(form.pointsRequired),
      stock: Number(form.stock),
      color: form.color,
      status: form.status,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">
            {existing ? "Edit Gift" : "Add Gift"}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Name *</label>
            <input
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Category</label>
              <select
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.category}
                onChange={(e) => set("category", e.target.value as GiftCategory)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Status</label>
              <select
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.status}
                onChange={(e) =>
                  set("status", e.target.value as "active" | "inactive")
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Points Required
              </label>
              <input
                type="number"
                min={0}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.pointsRequired}
                onChange={(e) => set("pointsRequired", Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Stock</label>
              <input
                type="number"
                min={0}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.stock}
                onChange={(e) => set("stock", Number(e.target.value))}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-2 block">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => set("color", c)}
                  className={cn(
                    "w-7 h-7 rounded-full border-2 transition-all",
                    `bg-${c}-500`,
                    form.color === c
                      ? "border-slate-800 scale-110"
                      : "border-transparent"
                  )}
                  title={c}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!form.name}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40"
          >
            {existing ? "Save Changes" : "Add Gift"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────

type TabFilter = "all" | "active" | "inactive";

export default function RewardsPage() {
  const [gifts, setGifts] = useState<GiftItem[]>(initialGiftItems as GiftItem[]);
  const [tab, setTab] = useState<TabFilter>("all");
  const [showModal, setShowModal] = useState(false);
  const [editGift, setEditGift] = useState<GiftItem | null>(null);

  const filtered = gifts.filter((g) => {
    if (tab === "all") return true;
    return g.status === tab;
  });

  const handleSave = (g: GiftItem) => {
    setGifts((prev) => {
      const idx = prev.findIndex((x) => x.id === g.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = g;
        return next;
      }
      return [...prev, g];
    });
    setShowModal(false);
    setEditGift(null);
  };

  const handleToggleStatus = (id: string) => {
    setGifts((prev) =>
      prev.map((g) =>
        g.id === id
          ? { ...g, status: g.status === "active" ? "inactive" : "active" }
          : g
      )
    );
  };

  const tabs: TabFilter[] = ["all", "active", "inactive"];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header
        title="Rewards Catalog"
        subtitle="Manage redeemable gifts and products"
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={14} />
            Add Gift
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit mb-6">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-md capitalize transition-colors",
                tab === t
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Gift Grid */}
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((gift) => (
            <div
              key={gift.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden"
            >
              {/* Color band */}
              <div className={cn("h-2", `bg-${gift.color}-500`)} />

              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      `bg-${gift.color}-100`
                    )}
                  >
                    <Package size={18} className={`text-${gift.color}-600`} />
                  </div>
                  <span
                    className={cn(
                      "text-xs font-semibold px-2 py-0.5 rounded-full",
                      gift.status === "active"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    )}
                  >
                    {gift.status === "active" ? "Active" : "Inactive"}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-slate-800 mb-1">
                  {gift.name}
                </h3>
                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                  {gift.category}
                </span>

                <div className="mt-3 mb-3">
                  <p className={cn("text-2xl font-bold", `text-${gift.color}-600`)}>
                    {formatNumber(gift.pointsRequired)}
                  </p>
                  <p className="text-xs text-slate-400">points required</p>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-3">
                  <span>Stock: {gift.stock >= 999 ? "Unlimited" : gift.stock}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleStatus(gift.id)}
                      className={cn(
                        "px-2 py-1 rounded-lg text-xs font-medium transition-colors",
                        gift.status === "active"
                          ? "bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600"
                          : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                      )}
                    >
                      {gift.status === "active" ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => {
                        setEditGift(gift);
                        setShowModal(true);
                      }}
                      className="p-1.5 hover:bg-slate-100 rounded-lg"
                    >
                      <Edit2 size={13} className="text-slate-500" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center text-slate-400 text-sm">
            No gifts in this category.
          </div>
        )}
      </div>

      {showModal && (
        <GiftModal
          existing={editGift ?? undefined}
          count={gifts.length}
          onClose={() => {
            setShowModal(false);
            setEditGift(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
