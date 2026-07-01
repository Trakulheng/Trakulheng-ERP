"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import {
  crmCustomers as initialCrmCustomers,
  pointsTransactions as initialPointsTransactions,
  redemptions as initialRedemptions,
  giftItems,
  salesOrders,
  getTier,
  tierColors,
  tierThresholds,
  pointsSettings,
  Tier,
} from "@/lib/mock-data";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import { X, Search, Eye, ChevronRight, Plus, Gift } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────

interface CrmCustomer {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  birthDate: string;
  joinDate: string;
  pointsBalance: number;
  totalPointsEarned: number;
  totalPointsRedeemed: number;
  totalSpend: number;
  lastVisit: string;
  branchId: string;
  notes: string;
}

interface PointsTransaction {
  id: string;
  customerId: string;
  type: "earn" | "redeem";
  points: number;
  description: string;
  date: string;
  balanceAfter: number;
  processedBy: string;
}

interface Redemption {
  id: string;
  customerId: string;
  customerName: string;
  rewardId: string;
  rewardName: string;
  pointsUsed: number;
  date: string;
  status: "completed" | "pending" | "cancelled";
  processedBy: string;
}

const TIER_LABELS: Record<Tier, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
};

const TIER_ORDER: Tier[] = ["bronze", "silver", "gold", "platinum"];

function getInitials(c: CrmCustomer) {
  return (c.firstName[0] + c.lastName[0]).toUpperCase();
}

function getNextTier(tier: Tier): Tier | null {
  const idx = TIER_ORDER.indexOf(tier);
  if (idx === TIER_ORDER.length - 1) return null;
  return TIER_ORDER[idx + 1];
}

// ── Add Customer Modal ────────────────────────────────────────────────

interface AddCustomerModalProps {
  onClose: () => void;
  onSave: (c: CrmCustomer) => void;
  count: number;
}

function AddCustomerModal({ onClose, onSave, count }: AddCustomerModalProps) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    address: "",
    birthDate: "",
    branchId: "BR-001",
    notes: "",
  });

  const set = (field: string, val: string) =>
    setForm((prev) => ({ ...prev, [field]: val }));

  const handleSave = () => {
    if (!form.firstName || !form.lastName || !form.phone || !form.email) return;
    const today = new Date().toISOString().split("T")[0];
    const newId = `CRM-${String(count + 1).padStart(3, "0")}`;
    onSave({
      id: newId,
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone,
      email: form.email,
      address: form.address,
      birthDate: form.birthDate,
      joinDate: today,
      pointsBalance: 0,
      totalPointsEarned: 0,
      totalPointsRedeemed: 0,
      totalSpend: 0,
      lastVisit: today,
      branchId: form.branchId,
      notes: form.notes,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">Add New Customer</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                First Name *
              </label>
              <input
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.firstName}
                onChange={(e) => set("firstName", e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Last Name *
              </label>
              <input
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.lastName}
                onChange={(e) => set("lastName", e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Phone *</label>
            <input
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Email *</label>
            <input
              type="email"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Address</label>
            <input
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Birth Date
              </label>
              <input
                type="date"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.birthDate}
                onChange={(e) => set("birthDate", e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Branch</label>
              <select
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.branchId}
                onChange={(e) => set("branchId", e.target.value)}
              >
                <option value="BR-001">Head Office</option>
                <option value="BR-002">Chiang Mai</option>
                <option value="BR-003">Phuket</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Notes</label>
            <textarea
              rows={2}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
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
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40"
            disabled={!form.firstName || !form.lastName || !form.phone || !form.email}
          >
            Add Customer
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add Points Mini Modal ─────────────────────────────────────────────

interface AddPointsModalProps {
  customer: CrmCustomer;
  onClose: () => void;
  onConfirm: (points: number, amount: number) => void;
}

function AddPointsModal({ customer, onClose, onConfirm }: AddPointsModalProps) {
  const [amountStr, setAmountStr] = useState("");
  const amount = parseFloat(amountStr) || 0;
  const tier = getTier(customer.pointsBalance);
  const multiplier = tierThresholds[tier].multiplier;
  const earned = amount >= pointsSettings.minPurchase
    ? Math.floor((amount / pointsSettings.earnPer) * pointsSettings.earnRate * multiplier)
    : 0;

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-800">Add Points</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg">
            <X size={16} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">
              Purchase Amount (THB)
            </label>
            <input
              type="number"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 5000"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
            />
            {amount > 0 && amount < pointsSettings.minPurchase && (
              <p className="text-xs text-amber-600 mt-1">
                Minimum purchase is ฿{pointsSettings.minPurchase} to earn points.
              </p>
            )}
          </div>
          {earned > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
              <p className="text-xs text-emerald-600 mb-1">Points to be earned</p>
              <p className="text-2xl font-bold text-emerald-700">+{formatNumber(earned)}</p>
              <p className="text-xs text-emerald-500 mt-0.5">
                {TIER_LABELS[tier]} multiplier: ×{multiplier}
              </p>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(earned, amount)}
            disabled={earned <= 0}
            className="px-4 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-40"
          >
            Confirm +{formatNumber(earned)} pts
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Redeem Modal ──────────────────────────────────────────────────────

interface RedeemModalProps {
  customer: CrmCustomer;
  onClose: () => void;
  onConfirm: (giftId: string, giftName: string, points: number) => void;
}

function RedeemModal({ customer, onClose, onConfirm }: RedeemModalProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const activeGifts = giftItems.filter(
    (g) => g.status === "active" && g.stock > 0
  );
  const selectedGift = activeGifts.find((g) => g.id === selected);

  if (confirming && selectedGift) {
    return (
      <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800">Confirm Redemption</h2>
            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg">
              <X size={16} />
            </button>
          </div>
          <div className="p-5">
            <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 text-center mb-4">
              <p className="text-sm font-semibold text-slate-800">{selectedGift.name}</p>
              <p className="text-2xl font-bold text-violet-700 mt-2">
                -{formatNumber(selectedGift.pointsRequired)} pts
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Balance after: {formatNumber(customer.pointsBalance - selectedGift.pointsRequired)} pts
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-100">
            <button
              onClick={() => setConfirming(false)}
              className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Back
            </button>
            <button
              onClick={() =>
                onConfirm(selectedGift.id, selectedGift.name, selectedGift.pointsRequired)
              }
              className="px-4 py-1.5 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700"
            >
              Confirm Redemption
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Redeem Points</h2>
            <p className="text-xs text-slate-400">
              Balance: {formatNumber(customer.pointsBalance)} pts
            </p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg">
            <X size={16} />
          </button>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-3 gap-3 max-h-72 overflow-y-auto">
            {activeGifts.map((gift) => {
              const canAfford = customer.pointsBalance >= gift.pointsRequired;
              const isSelected = selected === gift.id;
              return (
                <button
                  key={gift.id}
                  onClick={() => canAfford && setSelected(gift.id)}
                  disabled={!canAfford}
                  title={
                    !canAfford
                      ? `Need ${formatNumber(gift.pointsRequired - customer.pointsBalance)} more pts`
                      : ""
                  }
                  className={cn(
                    "relative border rounded-xl p-3 text-left transition-all",
                    isSelected
                      ? "border-violet-500 bg-violet-50"
                      : canAfford
                      ? "border-slate-200 hover:border-violet-300 hover:bg-violet-50"
                      : "border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed"
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg mb-2 flex items-center justify-center",
                      `bg-${gift.color}-100`
                    )}
                  >
                    <Gift size={16} className={`text-${gift.color}-600`} />
                  </div>
                  <p className="text-xs font-semibold text-slate-800 leading-tight mb-1">
                    {gift.name}
                  </p>
                  <p className="text-xs text-slate-400 mb-2">{gift.category}</p>
                  <p
                    className={cn(
                      "text-sm font-bold",
                      canAfford ? "text-violet-700" : "text-slate-400"
                    )}
                  >
                    {formatNumber(gift.pointsRequired)} pts
                  </p>
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">
            Cancel
          </button>
          <button
            onClick={() => setConfirming(true)}
            disabled={!selected}
            className="px-4 py-1.5 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-40"
          >
            Next
            <ChevronRight size={14} className="inline ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Customer Detail Modal ─────────────────────────────────────────────

interface CustomerDetailModalProps {
  customer: CrmCustomer;
  transactions: PointsTransaction[];
  redeemHistory: Redemption[];
  onClose: () => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onUpdateProfile: (id: string, data: Partial<CrmCustomer>) => void;
  onAddPoints: (customerId: string, points: number, amount: number) => void;
  onRedeem: (customerId: string, giftId: string, giftName: string, points: number) => void;
}

function CustomerDetailModal({
  customer,
  transactions,
  redeemHistory,
  onClose,
  onUpdateNotes,
  onUpdateProfile,
  onAddPoints,
  onRedeem,
}: CustomerDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"points" | "spend" | "profile">("points");
  const [notes, setNotes] = useState(customer.notes);
  const [showAddPoints, setShowAddPoints] = useState(false);
  const [showRedeem, setShowRedeem] = useState(false);
  const [profileForm, setProfileForm] = useState({
    address: customer.address,
    birthDate: customer.birthDate,
    notes: customer.notes,
  });

  const tier = getTier(customer.pointsBalance);
  const colors = tierColors[tier];
  const nextTier = getNextTier(tier);
  const nextThreshold = nextTier ? tierThresholds[nextTier].min : null;
  const currentMin = tierThresholds[tier].min;
  const ptsToNext = nextThreshold ? nextThreshold - customer.pointsBalance : 0;
  const progressPct = nextThreshold
    ? Math.min(
        100,
        ((customer.pointsBalance - currentMin) / (nextThreshold - currentMin)) * 100
      )
    : 100;

  const myTransactions = transactions
    .filter((t) => t.customerId === customer.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  const myOrders = salesOrders.filter(
    (o) =>
      o.customer
        .toLowerCase()
        .includes(customer.firstName.toLowerCase()) ||
      o.customer.toLowerCase().includes(customer.lastName.toLowerCase())
  );

  const myRedemptions = redeemHistory
    .filter((r) => r.customerId === customer.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl shadow-xl flex max-h-[90vh] overflow-hidden">
        {/* Left Panel */}
        <div className="w-1/3 bg-slate-50 border-r border-slate-200 p-6 flex flex-col gap-4 overflow-y-auto">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">{customer.id}</span>
            <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-lg">
              <X size={16} />
            </button>
          </div>

          {/* Avatar */}
          <div className="flex flex-col items-center gap-2">
            <div
              className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold",
                colors.bg,
                colors.text
              )}
            >
              {getInitials(customer)}
            </div>
            <p className="text-base font-semibold text-slate-900">
              {customer.firstName} {customer.lastName}
            </p>
            <span
              className={cn(
                "text-xs font-semibold px-2.5 py-0.5 rounded-full border",
                colors.bg,
                colors.text,
                colors.border
              )}
            >
              {TIER_LABELS[tier]}
            </span>
          </div>

          {/* Points display */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
            <p className="text-xs text-slate-400 mb-1">Points Balance</p>
            <p className="text-3xl font-bold text-slate-900">
              {formatNumber(customer.pointsBalance)}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">pts</p>
          </div>

          {/* Tier progress */}
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500">Tier Progress</span>
              {nextTier ? (
                <span className="text-xs text-slate-400">
                  {formatNumber(ptsToNext)} pts to {TIER_LABELS[nextTier]}
                </span>
              ) : (
                <span className="text-xs text-violet-600 font-semibold">Max Tier</span>
              )}
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className={cn("h-2 rounded-full", colors.bg, "border", colors.border)}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Info */}
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-xs text-slate-400">Phone</p>
              <p className="font-medium text-slate-800">{customer.phone}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Email</p>
              <p className="font-medium text-slate-800 break-all">{customer.email}</p>
            </div>
            {customer.address && (
              <div>
                <p className="text-xs text-slate-400">Address</p>
                <p className="font-medium text-slate-800">{customer.address}</p>
              </div>
            )}
            {customer.birthDate && (
              <div>
                <p className="text-xs text-slate-400">Birth Date</p>
                <p className="font-medium text-slate-800">{customer.birthDate}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-slate-400">Join Date</p>
              <p className="font-medium text-slate-800">{customer.joinDate}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Last Visit</p>
              <p className="font-medium text-slate-800">{customer.lastVisit}</p>
            </div>
          </div>

          {/* Notes */}
          <div>
            <p className="text-xs text-slate-400 mb-1">Notes</p>
            <textarea
              rows={3}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => onUpdateNotes(customer.id, notes)}
            />
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 px-6">
            {(["points", "spend", "profile"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-3 text-sm font-medium border-b-2 transition-colors capitalize -mb-px",
                  activeTab === tab
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                )}
              >
                {tab === "points"
                  ? "Points History"
                  : tab === "spend"
                  ? "Spend History"
                  : "Profile"}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {/* Tab: Points History */}
            {activeTab === "points" && (
              <div>
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setShowAddPoints(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                  >
                    <Plus size={14} />
                    Add Points
                  </button>
                  <button
                    onClick={() => setShowRedeem(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700"
                  >
                    <Gift size={14} />
                    Redeem Points
                  </button>
                </div>

                {myTransactions.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">No transactions yet.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider py-2 pr-4">Date</th>
                        <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider py-2 pr-4">Type</th>
                        <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider py-2 pr-4">Description</th>
                        <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wider py-2 pr-4">Points</th>
                        <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wider py-2">Balance After</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myTransactions.map((tx) => (
                        <tr key={tx.id} className="border-b border-slate-50">
                          <td className="py-2.5 pr-4 text-slate-500">{tx.date}</td>
                          <td className="py-2.5 pr-4">
                            <span
                              className={cn(
                                "text-xs font-semibold px-2 py-0.5 rounded-full",
                                tx.type === "earn"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-red-100 text-red-600"
                              )}
                            >
                              {tx.type === "earn" ? "Earn" : "Redeem"}
                            </span>
                          </td>
                          <td className="py-2.5 pr-4 text-slate-600 max-w-xs truncate">
                            {tx.description}
                          </td>
                          <td
                            className={cn(
                              "py-2.5 pr-4 text-right font-bold",
                              tx.type === "earn" ? "text-emerald-600" : "text-red-500"
                            )}
                          >
                            {tx.type === "earn" ? "+" : ""}
                            {tx.points}
                          </td>
                          <td className="py-2.5 text-right text-slate-500">
                            {formatNumber(tx.balanceAfter)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {myRedemptions.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                      Redemption Records
                    </h4>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider py-2 pr-4">Date</th>
                          <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider py-2 pr-4">Reward</th>
                          <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wider py-2">Points Used</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myRedemptions.map((r) => (
                          <tr key={r.id} className="border-b border-slate-50">
                            <td className="py-2.5 pr-4 text-slate-500">{r.date}</td>
                            <td className="py-2.5 pr-4 text-slate-700">{r.rewardName}</td>
                            <td className="py-2.5 text-right font-bold text-violet-600">
                              -{formatNumber(r.pointsUsed)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Spend History */}
            {activeTab === "spend" && (
              <div>
                {myOrders.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">No orders found.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider py-2 pr-4">Date</th>
                        <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider py-2 pr-4">Order #</th>
                        <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wider py-2 pr-4">Amount</th>
                        <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider py-2">Stage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myOrders.map((o) => (
                        <tr key={o.id} className="border-b border-slate-50">
                          <td className="py-2.5 pr-4 text-slate-500">{o.date}</td>
                          <td className="py-2.5 pr-4 font-medium text-blue-600">{o.id}</td>
                          <td className="py-2.5 pr-4 text-right font-medium text-slate-800">
                            {formatCurrency(o.amount)}
                          </td>
                          <td className="py-2.5">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">
                              {o.stage}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Tab: Profile */}
            {activeTab === "profile" && (
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Address</label>
                  <input
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={profileForm.address}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, address: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Birth Date</label>
                  <input
                    type="date"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={profileForm.birthDate}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, birthDate: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Notes</label>
                  <textarea
                    rows={4}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    value={profileForm.notes}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, notes: e.target.value }))
                    }
                  />
                </div>
                <button
                  onClick={() => onUpdateProfile(customer.id, profileForm)}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddPoints && (
        <AddPointsModal
          customer={customer}
          onClose={() => setShowAddPoints(false)}
          onConfirm={(pts, amount) => {
            onAddPoints(customer.id, pts, amount);
            setShowAddPoints(false);
          }}
        />
      )}

      {showRedeem && (
        <RedeemModal
          customer={customer}
          onClose={() => setShowRedeem(false)}
          onConfirm={(giftId, giftName, points) => {
            onRedeem(customer.id, giftId, giftName, points);
            setShowRedeem(false);
          }}
        />
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────

const ALL_TIERS: Array<Tier | "all"> = ["all", "bronze", "silver", "gold", "platinum"];
const TIER_TAB_LABELS: Record<Tier | "all", string> = {
  all: "All",
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
};

export default function CRMCustomersPage() {
  const [customers, setCustomers] = useState<CrmCustomer[]>(
    initialCrmCustomers as CrmCustomer[]
  );
  const [txs, setTxs] = useState<PointsTransaction[]>(
    initialPointsTransactions as PointsTransaction[]
  );
  const [redemptionList, setRedemptionList] = useState<Redemption[]>(
    initialRedemptions as Redemption[]
  );

  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<Tier | "all">("all");
  const [selectedCustomer, setSelectedCustomer] = useState<CrmCustomer | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.includes(q);
    const matchTier =
      tierFilter === "all" || getTier(c.pointsBalance) === tierFilter;
    return matchSearch && matchTier;
  });

  const handleAddCustomer = (c: CrmCustomer) => {
    setCustomers((prev) => [...prev, c]);
    setShowAdd(false);
  };

  const handleUpdateNotes = (id: string, notes: string) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, notes } : c))
    );
    if (selectedCustomer?.id === id) {
      setSelectedCustomer((prev) => (prev ? { ...prev, notes } : prev));
    }
  };

  const handleUpdateProfile = (id: string, data: Partial<CrmCustomer>) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...data } : c))
    );
    if (selectedCustomer?.id === id) {
      setSelectedCustomer((prev) => (prev ? { ...prev, ...data } : prev));
    }
  };

  const handleAddPoints = (customerId: string, points: number, amount: number) => {
    const today = new Date().toISOString().split("T")[0];
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return;
    const newBalance = customer.pointsBalance + points;
    const newTx: PointsTransaction = {
      id: `PTX-${String(txs.length + 1).padStart(3, "0")}`,
      customerId,
      type: "earn",
      points,
      description: `Purchase ฿${formatNumber(amount)}`,
      date: today,
      balanceAfter: newBalance,
      processedBy: "Admin",
    };
    setTxs((prev) => [newTx, ...prev]);
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId
          ? {
              ...c,
              pointsBalance: newBalance,
              totalPointsEarned: c.totalPointsEarned + points,
              lastVisit: today,
            }
          : c
      )
    );
    if (selectedCustomer?.id === customerId) {
      setSelectedCustomer((prev) =>
        prev
          ? {
              ...prev,
              pointsBalance: newBalance,
              totalPointsEarned: prev.totalPointsEarned + points,
              lastVisit: today,
            }
          : prev
      );
    }
  };

  const handleRedeem = (
    customerId: string,
    giftId: string,
    giftName: string,
    points: number
  ) => {
    const today = new Date().toISOString().split("T")[0];
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return;
    const newBalance = customer.pointsBalance - points;
    const newTx: PointsTransaction = {
      id: `PTX-${String(txs.length + 1).padStart(3, "0")}`,
      customerId,
      type: "redeem",
      points: -points,
      description: `Redeemed: ${giftName}`,
      date: today,
      balanceAfter: newBalance,
      processedBy: "Admin",
    };
    const newRedemption: Redemption = {
      id: `RD-${String(redemptionList.length + 1).padStart(3, "0")}`,
      customerId,
      customerName: `${customer.firstName} ${customer.lastName}`,
      rewardId: giftId,
      rewardName: giftName,
      pointsUsed: points,
      date: today,
      status: "completed",
      processedBy: "Admin",
    };
    setTxs((prev) => [newTx, ...prev]);
    setRedemptionList((prev) => [newRedemption, ...prev]);
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId
          ? {
              ...c,
              pointsBalance: newBalance,
              totalPointsRedeemed: c.totalPointsRedeemed + points,
            }
          : c
      )
    );
    if (selectedCustomer?.id === customerId) {
      setSelectedCustomer((prev) =>
        prev
          ? {
              ...prev,
              pointsBalance: newBalance,
              totalPointsRedeemed: prev.totalPointsRedeemed + points,
            }
          : prev
      );
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header
        title="CRM Customers"
        subtitle="Customer profiles and loyalty management"
        actions={
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={14} />
            Add Customer
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Filters */}
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-sm">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            {ALL_TIERS.map((t) => (
              <button
                key={t}
                onClick={() => setTierFilter(t)}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                  tierFilter === t
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                {TIER_TAB_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3">Customer</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3">Phone</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3">Email</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3">Tier</th>
                <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3">Points</th>
                <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3">Total Spend</th>
                <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3">Last Visit</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const tier = getTier(c.pointsBalance);
                const colors = tierColors[tier];
                return (
                  <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                            colors.bg,
                            colors.text
                          )}
                        >
                          {getInitials(c)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            {c.firstName} {c.lastName}
                          </p>
                          <p className="text-xs text-slate-400">{c.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-600">{c.phone}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">{c.email}</td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          "text-xs font-semibold px-2 py-0.5 rounded-full border",
                          colors.bg,
                          colors.text,
                          colors.border
                        )}
                      >
                        {TIER_LABELS[tier]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-slate-800">
                      {formatNumber(c.pointsBalance)}
                    </td>
                    <td className="px-5 py-3 text-right text-sm text-slate-600">
                      {formatCurrency(c.totalSpend)}
                    </td>
                    <td className="px-5 py-3 text-right text-xs text-slate-400">
                      {c.lastVisit}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => setSelectedCustomer(c)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
                      >
                        <Eye size={12} />
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-slate-400">
              No customers found.
            </div>
          )}
        </div>
      </div>

      {showAdd && (
        <AddCustomerModal
          count={customers.length}
          onClose={() => setShowAdd(false)}
          onSave={handleAddCustomer}
        />
      )}

      {selectedCustomer && (
        <CustomerDetailModal
          customer={
            customers.find((c) => c.id === selectedCustomer.id) ?? selectedCustomer
          }
          transactions={txs}
          redeemHistory={redemptionList}
          onClose={() => setSelectedCustomer(null)}
          onUpdateNotes={handleUpdateNotes}
          onUpdateProfile={handleUpdateProfile}
          onAddPoints={handleAddPoints}
          onRedeem={handleRedeem}
        />
      )}
    </div>
  );
}
