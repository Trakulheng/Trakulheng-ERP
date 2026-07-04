"use client";

import { useState, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import {
  redemptions as seedRedemptions,
  giftItems,
  crmCustomers,
  getTier,
  tierColors,
} from "@/lib/mock-data";
import { cn, formatNumber } from "@/lib/utils";
import {
  Gift,
  TicketCheck,
  TrendingDown,
  Star,
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  X,
  User,
  Filter,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type RStatus = "completed" | "pending" | "cancelled";

interface Redemption {
  id: string;
  customerId: string;
  customerName: string;
  rewardId: string;
  rewardName: string;
  pointsUsed: number;
  date: string;
  status: RStatus;
  processedBy: string;
  notes?: string;
}

// ─── Extended seed data (add pending + cancelled examples) ────────────────────

const extraRedemptions: Redemption[] = [
  {
    id: "RD-005", customerId: "CRM-002", customerName: "Somchai Rattana",
    rewardId: "GIFT-002", rewardName: "DDK Safety Vest", pointsUsed: 800,
    date: "2026-07-02", status: "pending", processedBy: "System",
  },
  {
    id: "RD-006", customerId: "CRM-004", customerName: "Maria Santos",
    rewardId: "GIFT-006", rewardName: "100 Bonus Points", pointsUsed: 1000,
    date: "2026-07-01", status: "pending", processedBy: "Staff",
    notes: "Customer in-store pickup",
  },
  {
    id: "RD-007", customerId: "CRM-007", customerName: "Wiroj Chaiyasit",
    rewardId: "GIFT-003", rewardName: "10% Discount Voucher", pointsUsed: 500,
    date: "2026-06-28", status: "cancelled", processedBy: "Admin",
    notes: "Customer changed mind — points restored",
  },
  {
    id: "RD-008", customerId: "CRM-001", customerName: "John Smith",
    rewardId: "GIFT-004", rewardName: "Free Delivery (1 Order)", pointsUsed: 300,
    date: "2026-06-25", status: "completed", processedBy: "Admin",
  },
  {
    id: "RD-009", customerId: "CRM-008", customerName: "Naruemon Phakdee",
    rewardId: "GIFT-005", rewardName: "Premium Tool Set", pointsUsed: 2000,
    date: "2026-06-20", status: "pending", processedBy: "Staff",
  },
  {
    id: "RD-010", customerId: "CRM-003", customerName: "Ahmed Hassan",
    rewardId: "GIFT-001", rewardName: "DDK Branded Mug", pointsUsed: 200,
    date: "2026-06-18", status: "completed", processedBy: "System",
  },
];

const ALL_REDEMPTIONS: Redemption[] = [
  ...(seedRedemptions as Redemption[]),
  ...extraRedemptions,
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<RStatus, string> = {
  completed: "bg-emerald-100 text-emerald-700",
  pending:   "bg-amber-100 text-amber-700",
  cancelled: "bg-red-100 text-red-600",
};

const STATUS_ICONS: Record<RStatus, React.ElementType> = {
  completed: CheckCircle2,
  pending:   Clock,
  cancelled: XCircle,
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

// ─── Customer Detail Panel ────────────────────────────────────────────────────

function CustomerPanel({
  customerId,
  onClose,
}: {
  customerId: string;
  onClose: () => void;
}) {
  const customer = crmCustomers.find((c) => c.id === customerId);
  if (!customer) return null;
  const tier = getTier(customer.pointsBalance);
  const c = tierColors[tier];
  const tierLabels: Record<string, string> = {
    bronze: "Bronze", silver: "Silver", gold: "Gold", platinum: "Platinum",
  };

  const customerRedemptions = ALL_REDEMPTIONS.filter((r) => r.customerId === customerId);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-900">Customer Profile</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg">
            <X size={16} className="text-slate-500" />
          </button>
        </div>

        <div className="px-6 py-5">
          {/* Avatar + tier */}
          <div className="flex items-center gap-4 mb-5">
            <div
              className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold border-2",
                c.bg, c.text, c.border
              )}
            >
              {customer.firstName[0]}{customer.lastName[0]}
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-base">
                {customer.firstName} {customer.lastName}
              </p>
              <p className="text-sm text-slate-500">{customer.email}</p>
              <p className="text-sm text-slate-500">{customer.phone}</p>
            </div>
            <span
              className={cn(
                "ml-auto text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0",
                c.bg, c.text, c.border
              )}
            >
              {tierLabels[tier]}
            </span>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: "Points Balance", value: formatNumber(customer.pointsBalance), color: "text-amber-600" },
              { label: "Total Earned",   value: formatNumber(customer.totalPointsEarned), color: "text-emerald-600" },
              { label: "Total Redeemed", value: formatNumber(customer.totalPointsRedeemed), color: "text-red-500" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-slate-50 rounded-xl p-3 text-center">
                <p className={cn("text-lg font-bold", color)}>{value}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-tight">{label}</p>
              </div>
            ))}
          </div>

          {/* Redemption history for this customer */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Redemption History ({customerRedemptions.length})
            </p>
            {customerRedemptions.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-3">No redemptions yet</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {customerRedemptions.map((r) => {
                  const StatusIcon = STATUS_ICONS[r.status];
                  return (
                    <div key={r.id} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg">
                      <Gift size={13} className="text-slate-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-800 truncate">{r.rewardName}</p>
                        <p className="text-xs text-slate-400">{fmtDate(r.date)}</p>
                      </div>
                      <span className="text-xs font-bold text-red-500 shrink-0">
                        −{r.pointsUsed.toLocaleString()}
                      </span>
                      <StatusIcon size={13} className={cn(
                        "shrink-0",
                        r.status === "completed" ? "text-emerald-500" :
                        r.status === "pending" ? "text-amber-500" : "text-red-400"
                      )} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400 flex justify-between">
            <span>Member since {customer.joinDate}</span>
            <span>Last visit {customer.lastVisit}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── New Redemption Modal ─────────────────────────────────────────────────────

function NewRedemptionModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (r: Redemption) => void;
}) {
  const [customerId, setCustomerId] = useState("");
  const [rewardId, setRewardId] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const customer = crmCustomers.find((c) => c.id === customerId);
  const reward = giftItems.find((g) => g.id === rewardId);
  const hasEnough = customer && reward
    ? customer.pointsBalance >= reward.pointsRequired
    : true;

  function handleSubmit() {
    if (!customerId || !rewardId) { setError("Select customer and reward"); return; }
    if (!hasEnough) { setError("Customer has insufficient points"); return; }
    if (reward && reward.stock <= 0) { setError("Reward is out of stock"); return; }
    const r: Redemption = {
      id: `RD-${String(Date.now()).slice(-5)}`,
      customerId,
      customerName: customer ? `${customer.firstName} ${customer.lastName}` : "",
      rewardId,
      rewardName: reward?.name ?? "",
      pointsUsed: reward?.pointsRequired ?? 0,
      date: "2026-07-04",
      status: "pending",
      processedBy: "Admin",
      notes: notes || undefined,
    };
    onSave(r);
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-900">New Redemption</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg">
            <X size={16} className="text-slate-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
              <XCircle size={14} /> {error}
            </div>
          )}

          {/* Customer */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Customer</label>
            <select
              value={customerId}
              onChange={(e) => { setCustomerId(e.target.value); setError(""); }}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— Select customer —</option>
              {crmCustomers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} ({c.pointsBalance.toLocaleString()} pts)
                </option>
              ))}
            </select>
            {customer && (
              <p className="text-xs text-slate-400 mt-1">
                Tier: <span className="font-medium">{getTier(customer.pointsBalance)}</span> ·
                Balance: <span className="font-semibold text-amber-600">{customer.pointsBalance.toLocaleString()} pts</span>
              </p>
            )}
          </div>

          {/* Reward */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Reward</label>
            <select
              value={rewardId}
              onChange={(e) => { setRewardId(e.target.value); setError(""); }}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— Select reward —</option>
              {giftItems.filter((g) => g.status === "active" && g.stock > 0).map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} — {g.pointsRequired.toLocaleString()} pts (stock: {g.stock})
                </option>
              ))}
            </select>
          </div>

          {/* Points preview */}
          {customer && reward && (
            <div
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border text-sm",
                hasEnough
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-red-50 border-red-200 text-red-700"
              )}
            >
              {hasEnough ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
              <span>
                Redeeming <strong>{reward.pointsRequired.toLocaleString()} pts</strong> ·
                Remaining:{" "}
                <strong>
                  {(customer.pointsBalance - reward.pointsRequired).toLocaleString()} pts
                </strong>
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notes (optional)</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Staff note, pickup instructions…"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Create Redemption
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RedemptionsPage() {
  const [list, setList] = useState<Redemption[]>(ALL_REDEMPTIONS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<RStatus | "all">("all");
  const [sortKey, setSortKey] = useState<"date" | "points">("date");
  const [customerPanelId, setCustomerPanelId] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  // Totals
  const totalPoints = list.reduce((s, r) => s + r.pointsUsed, 0);
  const completedPts = list.filter((r) => r.status === "completed").reduce((s, r) => s + r.pointsUsed, 0);
  const pendingCount = list.filter((r) => r.status === "pending").length;
  const cancelledCount = list.filter((r) => r.status === "cancelled").length;

  const mostPopularId = list
    .filter((r) => r.status === "completed")
    .reduce<Record<string, number>>((acc, r) => {
      acc[r.rewardId] = (acc[r.rewardId] ?? 0) + 1;
      return acc;
    }, {});
  const topRewardId = Object.entries(mostPopularId).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topReward = giftItems.find((g) => g.id === topRewardId);

  // Per-category breakdown
  const byCat = useMemo(() => {
    const acc: Record<string, number> = {};
    list
      .filter((r) => r.status === "completed")
      .forEach((r) => {
        const cat = giftItems.find((g) => g.id === r.rewardId)?.category ?? "Other";
        acc[cat] = (acc[cat] ?? 0) + r.pointsUsed;
      });
    return Object.entries(acc).sort((a, b) => b[1] - a[1]);
  }, [list]);

  const maxCatPts = byCat[0]?.[1] ?? 1;

  // Filtered + sorted list
  const filtered = useMemo(() => {
    return list
      .filter((r) => {
        const q = search.toLowerCase();
        const matchSearch =
          !q ||
          r.customerName.toLowerCase().includes(q) ||
          r.rewardName.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q);
        const matchStatus = statusFilter === "all" || r.status === statusFilter;
        return matchSearch && matchStatus;
      })
      .sort((a, b) =>
        sortKey === "date"
          ? b.date.localeCompare(a.date)
          : b.pointsUsed - a.pointsUsed
      );
  }, [list, search, statusFilter, sortKey]);

  function process(id: string) {
    setList((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "completed", processedBy: "Admin" } : r))
    );
  }

  function cancel(id: string) {
    setList((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "cancelled" } : r))
    );
  }

  const statusTabs: { key: RStatus | "all"; label: string }[] = [
    { key: "all",       label: `All (${list.length})` },
    { key: "pending",   label: `Pending (${pendingCount})` },
    { key: "completed", label: `Completed (${list.filter((r) => r.status === "completed").length})` },
    { key: "cancelled", label: `Cancelled (${cancelledCount})` },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header
        title="Redemption History"
        subtitle="Manage all reward redemptions and point usage"
        actions={
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            <Plus size={15} /> New Redemption
          </button>
        }
      />

      <div className="p-6 space-y-6">
        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Redemptions",    value: list.length,                         icon: TicketCheck,  color: "text-violet-600", bg: "bg-violet-50" },
            { label: "Total Points Used",    value: totalPoints.toLocaleString(),          icon: TrendingDown, color: "text-red-500",    bg: "bg-red-50"    },
            { label: "Pending Processing",   value: pendingCount,                          icon: Clock,        color: "text-amber-600",  bg: "bg-amber-50"  },
            { label: "Most Popular Reward",  value: topReward?.name ?? "—",               icon: Star,         color: "text-amber-600",  bg: "bg-amber-50"  },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-500">{label}</p>
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", bg)}>
                  <Icon size={18} className={color} />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 truncate">{value}</p>
            </div>
          ))}
        </div>

        {/* Category breakdown bar */}
        {byCat.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Filter size={14} className="text-slate-400" />
                Points Used by Category
              </h3>
              <span className="text-xs text-slate-400">Completed redemptions only · {completedPts.toLocaleString()} pts total</span>
            </div>
            <div className="space-y-3">
              {byCat.map(([cat, pts]) => (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-slate-600 w-24 shrink-0">{cat}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-blue-500 transition-all"
                      style={{ width: `${(pts / maxCatPts) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 w-20 text-right shrink-0">
                    {pts.toLocaleString()} pts
                  </span>
                  <span className="text-xs text-slate-400 w-10 text-right shrink-0">
                    {completedPts > 0 ? `${Math.round((pts / completedPts) * 100)}%` : "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Table section */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="px-5 py-4 border-b border-slate-100 space-y-3">
            {/* Search + sort */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search by customer, reward, or ID…"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Sort:</span>
                <button
                  onClick={() => setSortKey(sortKey === "date" ? "points" : "date")}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  {sortKey === "date" ? "By Date" : "By Points"}
                  <ChevronDown size={12} />
                </button>
              </div>
            </div>

            {/* Status filter tabs */}
            <div className="flex gap-1.5 flex-wrap">
              {statusTabs.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                    statusFilter === key
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["ID", "Customer", "Reward", "Category", "Points Used", "Date", "Status", "Processed By", ""].map(
                    (h, i) => (
                      <th
                        key={h + i}
                        className={cn(
                          "px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap",
                          i > 3 ? "text-right" : "text-left",
                          i === 8 && "text-center"
                        )}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                      No redemptions match your filters
                    </td>
                  </tr>
                )}
                {filtered.map((r) => {
                  const StatusIcon = STATUS_ICONS[r.status];
                  const customer = crmCustomers.find((c) => c.id === r.customerId);
                  const tier = getTier(customer?.pointsBalance ?? 0);
                  const tc = tierColors[tier];
                  const cat = giftItems.find((g) => g.id === r.rewardId)?.category ?? "—";

                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-slate-400 whitespace-nowrap">
                        {r.id}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={() => setCustomerPanelId(r.customerId)}
                          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                        >
                          <div
                            className={cn(
                              "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                              tc.bg, tc.text
                            )}
                          >
                            {r.customerName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-slate-800 text-xs">{r.customerName}</p>
                            <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full", tc.bg, tc.text)}>
                              {tier}
                            </span>
                          </div>
                          <User size={10} className="text-slate-300" />
                        </button>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Gift size={13} className="text-slate-400 shrink-0" />
                          <div>
                            <p className="text-slate-700 font-medium text-xs">{r.rewardName}</p>
                            {r.notes && (
                              <p className="text-[10px] text-slate-400 italic truncate max-w-[160px]">{r.notes}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                          {cat}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span className="font-semibold text-red-600 text-sm">
                          −{r.pointsUsed.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500 text-xs whitespace-nowrap">
                        {fmtDate(r.date)}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
                            STATUS_COLORS[r.status]
                          )}
                        >
                          <StatusIcon size={10} />
                          {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500 text-xs whitespace-nowrap">
                        {r.processedBy}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {r.status === "pending" && (
                          <div className="flex items-center gap-1.5 justify-center">
                            <button
                              onClick={() => process(r.id)}
                              title="Mark as completed"
                              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-50"
                            >
                              <CheckCircle2 size={11} /> Process
                            </button>
                            <button
                              onClick={() => cancel(r.id)}
                              title="Cancel redemption"
                              className="p-1 text-red-400 hover:bg-red-50 rounded-lg border border-red-100"
                            >
                              <XCircle size={13} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer totals */}
          {filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <span>{filtered.length} redemption{filtered.length !== 1 ? "s" : ""}</span>
              <span className="font-semibold text-slate-700">
                Total: −{filtered.reduce((s, r) => s + r.pointsUsed, 0).toLocaleString()} pts
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {customerPanelId && (
        <CustomerPanel
          customerId={customerPanelId}
          onClose={() => setCustomerPanelId(null)}
        />
      )}

      {showNewModal && (
        <NewRedemptionModal
          onClose={() => setShowNewModal(false)}
          onSave={(r) => {
            setList((prev) => [r, ...prev]);
            setShowNewModal(false);
          }}
        />
      )}
    </div>
  );
}
