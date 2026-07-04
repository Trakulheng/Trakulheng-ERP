"use client";

import { useState, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import {
  purchaseOrders as initialPOs,
  poLineItems,
  products as initialProducts,
  suppliers,
  branches,
  employees,
  POStatus,
  StockStatus,
} from "@/lib/mock-data";
import { cn, formatCurrency } from "@/lib/utils";
import {
  PackageCheck, Truck, Clock, X, CheckCircle2, AlertTriangle,
  ArrowRight, User, Building2, CalendarDays, FileText, Package,
  ChevronDown, Printer,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────

type PO = (typeof initialPOs)[number];
type Product = (typeof initialProducts)[number];

interface ReceivedLine {
  lineItemId: string;
  productId: string;
  productName: string;
  orderedQty: number;
  receivedQty: number;
  currentStock: number;
  note: string;
}

interface GRNRecord {
  grnId: string;
  poId: string;
  supplier: string;
  branchId: string;
  receivedBy: string;
  date: string;
  lines: ReceivedLine[];
}

// ── Helpers ───────────────────────────────────────────────────────────

function deriveStatus(stock: number, minStock: number): StockStatus {
  if (stock === 0) return "out";
  if (stock < minStock) return "low";
  return "ok";
}

const poStatusCfg: Record<POStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending:      { label: "Pending",     color: "bg-amber-100 text-amber-700",   icon: <Clock size={13} /> },
  "in-transit": { label: "In Transit",  color: "bg-blue-100 text-blue-700",     icon: <Truck size={13} /> },
  received:     { label: "Received",    color: "bg-emerald-100 text-emerald-700", icon: <CheckCircle2 size={13} /> },
  cancelled:    { label: "Cancelled",   color: "bg-red-100 text-red-700",       icon: <X size={13} /> },
};

// ── Receive Modal ─────────────────────────────────────────────────────

interface ReceiveModalProps {
  po: PO;
  products: Product[];
  onClose: () => void;
  onConfirm: (grn: GRNRecord, updatedProducts: Product[]) => void;
}

function ReceiveModal({ po, products, onClose, onConfirm }: ReceiveModalProps) {
  const myLines = poLineItems.filter((l) => l.poId === po.id);
  const supplier = suppliers.find((s) => s.id === po.supplierId);

  const [branchId, setBranchId]       = useState(branches[0].id);
  const [receivedBy, setReceivedBy]   = useState(employees[0].name);
  const [receiveDate, setReceiveDate] = useState(new Date().toISOString().split("T")[0]);
  const [lines, setLines] = useState<ReceivedLine[]>(
    myLines.map((l) => {
      const prod = products.find((p) => p.id === l.productId);
      return {
        lineItemId:   l.id,
        productId:    l.productId,
        productName:  l.productName,
        orderedQty:   l.qty,
        receivedQty:  l.qty,
        currentStock: prod?.stock ?? 0,
        note: "",
      };
    })
  );

  const setQty = (idx: number, qty: number) =>
    setLines((prev) => prev.map((l, i) => i === idx ? { ...l, receivedQty: Math.max(0, qty) } : l));

  const setNote = (idx: number, note: string) =>
    setLines((prev) => prev.map((l, i) => i === idx ? { ...l, note } : l));

  const receivedTotal = lines.reduce((s, l) => {
    const pi = myLines.find((m) => m.productId === l.productId);
    return s + l.receivedQty * (pi?.unitPrice ?? 0);
  }, 0);

  const hasVariance = lines.some((l) => l.receivedQty !== l.orderedQty);

  const handleConfirm = () => {
    // Build updated products
    const updatedProducts = products.map((p) => {
      const line = lines.find((l) => l.productId === p.id);
      if (!line || line.receivedQty === 0) return p;
      const newStock = p.stock + line.receivedQty;
      return { ...p, stock: newStock, status: deriveStatus(newStock, p.minStock) };
    });

    const grn: GRNRecord = {
      grnId: `GRN-${po.id}-${Date.now().toString(36).toUpperCase()}`,
      poId: po.id,
      supplier: po.supplier,
      branchId,
      receivedBy,
      date: receiveDate,
      lines,
    };

    onConfirm(grn, updatedProducts);
  };

  const branch = branches.find((b) => b.id === branchId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <PackageCheck size={20} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Receive Goods — {po.id}</h2>
              <p className="text-xs text-slate-400">{po.supplier} · {myLines.length} line items</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>

        <div className="p-6 space-y-6">
          {/* PO context */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Purchase Order</p>
              <div className="flex justify-between"><span className="text-slate-400">PO#</span><span className="font-mono font-semibold text-blue-600">{po.id}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Order Date</span><span className="font-medium">{po.date}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Expected</span><span className="font-medium">{po.expectedDate}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Order Value</span><span className="font-semibold text-slate-800">{formatCurrency(po.total)}</span></div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Supplier</p>
              <p className="font-semibold text-slate-800">{supplier?.name}</p>
              {supplier && (
                <>
                  <p className="text-slate-500">{supplier.contact}</p>
                  <p className="text-slate-500">{supplier.email}</p>
                  <p className="text-slate-400 text-xs">{supplier.country} · {supplier.paymentTerms}</p>
                </>
              )}
            </div>
          </div>

          {po.notes && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
              <p className="text-xs font-semibold text-amber-700 mb-0.5">PO Notes</p>
              <p className="text-xs text-amber-800">{po.notes}</p>
            </div>
          )}

          {/* Receive details */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                <Building2 size={12} className="inline mr-1 text-slate-400" />Receiving Branch *
              </label>
              <select value={branchId} onChange={(e) => setBranchId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
                {branches.filter((b) => b.status === "active").map((b) => (
                  <option key={b.id} value={b.id}>{b.code} — {b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                <User size={12} className="inline mr-1 text-slate-400" />Received By *
              </label>
              <select value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
                {employees.filter((e) => e.status === "active").map((e) => (
                  <option key={e.id} value={e.name}>{e.name} ({e.position})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                <CalendarDays size={12} className="inline mr-1 text-slate-400" />Receive Date *
              </label>
              <input type="date" value={receiveDate} onChange={(e) => setReceiveDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>

          {/* Variance warning */}
          {hasVariance && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Quantity Variance Detected</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  One or more items have received quantities that differ from the ordered quantities.
                  Partial receipts will be recorded. Contact the supplier for back-order resolution.
                </p>
              </div>
            </div>
          )}

          {/* Line items table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Line Items — Enter Received Quantities</p>
              <p className="text-xs text-slate-400">Ordered qty pre-filled · adjust if different</p>
            </div>
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Product</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">Ordered</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">Current Stock</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 bg-emerald-50">Received Qty</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">After Receive</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Condition Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {lines.map((line, i) => {
                    const prod = products.find((p) => p.id === line.productId);
                    const afterStock = line.currentStock + line.receivedQty;
                    const variance = line.receivedQty - line.orderedQty;
                    return (
                      <tr key={line.lineItemId} className={cn(
                        "hover:bg-slate-50",
                        variance < 0 && "bg-amber-50/30",
                        variance > 0 && "bg-blue-50/30"
                      )}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800">{line.productName}</p>
                          <p className="text-xs text-slate-400 font-mono">{line.productId}</p>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600 font-medium">{line.orderedQty}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full",
                            line.currentStock === 0 ? "bg-red-100 text-red-700" :
                            prod && line.currentStock < prod.minStock ? "bg-amber-100 text-amber-700" :
                            "bg-slate-100 text-slate-600")}>
                            {line.currentStock}
                          </span>
                        </td>
                        <td className="px-4 py-3 bg-emerald-50/60">
                          <div className="flex items-center justify-end gap-1">
                            <input
                              type="number" min="0" value={line.receivedQty}
                              onChange={(e) => setQty(i, parseInt(e.target.value) || 0)}
                              className="w-20 px-2 py-1.5 text-sm text-right border border-emerald-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                            />
                            {variance !== 0 && (
                              <span className={cn("text-xs font-bold shrink-0",
                                variance > 0 ? "text-blue-600" : "text-amber-600")}>
                                {variance > 0 ? `+${variance}` : variance}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={cn("font-bold",
                            afterStock === 0 ? "text-red-600" :
                            prod && afterStock < prod.minStock ? "text-amber-600" :
                            "text-emerald-700")}>
                            {afterStock}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <input value={line.note} onChange={(e) => setNote(i, e.target.value)}
                            placeholder="Good / Damaged / Short..."
                            className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 border-t border-slate-200">
                    <td className="px-4 py-3 text-sm font-semibold text-slate-700">
                      Received Value
                    </td>
                    <td colSpan={2} className="px-4 py-3 text-right text-sm text-slate-400">
                      Ordered: <span className="font-semibold text-slate-700">{formatCurrency(po.total)}</span>
                    </td>
                    <td className="px-4 py-3 bg-emerald-50/60 text-right font-bold text-emerald-700 text-base">
                      {formatCurrency(receivedTotal)}
                    </td>
                    <td colSpan={2} className="px-4 py-3">
                      {receivedTotal !== po.total && (
                        <span className="text-xs text-amber-600 font-medium">
                          Δ {formatCurrency(Math.abs(receivedTotal - po.total))} variance
                        </span>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Branch context */}
          {branch && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
              <Building2 size={16} className="text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-semibold text-blue-800">Receiving Location: {branch.name}</p>
                <p className="text-blue-600 mt-0.5">{branch.address}</p>
                <p className="text-blue-500 mt-0.5">Branch Manager: {branch.manager}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 sticky bottom-0 bg-white">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
          <div className="flex items-center gap-3">
            <p className="text-xs text-slate-400">
              {lines.filter((l) => l.receivedQty > 0).length}/{lines.length} items to receive
            </p>
            <button
              onClick={handleConfirm}
              disabled={lines.every((l) => l.receivedQty === 0) || !receivedBy || !receiveDate}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-40">
              <PackageCheck size={16} /> Confirm Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── GRN Success Modal ─────────────────────────────────────────────────

interface GRNSuccessProps {
  grn: GRNRecord;
  onClose: () => void;
}

function GRNSuccess({ grn, onClose }: GRNSuccessProps) {
  const branch = branches.find((b) => b.id === grn.branchId);
  const totalReceived = grn.lines.reduce((s, l) => {
    const pi = poLineItems.find((p) => p.id === l.lineItemId || (p.poId === grn.poId && p.productId === l.productId));
    return s + l.receivedQty * (pi?.unitPrice ?? 0);
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* GRN Header */}
        <div className="bg-emerald-600 text-white px-6 py-5 rounded-t-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <CheckCircle2 size={22} className="text-white" />
            </div>
            <div>
              <p className="text-lg font-bold">Goods Received</p>
              <p className="text-emerald-100 text-sm">Inventory has been updated successfully</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* GRN details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Goods Receipt Note</p>
              <div className="flex justify-between"><span className="text-slate-400">GRN #</span><span className="font-mono font-bold text-slate-800">{grn.grnId}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">PO #</span><span className="font-mono font-semibold text-blue-600">{grn.poId}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Date</span><span className="font-medium">{grn.date}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Received By</span><span className="font-medium">{grn.receivedBy}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Branch</span><span className="font-medium">{branch?.name ?? grn.branchId}</span></div>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Summary</p>
              <div className="flex justify-between text-sm"><span className="text-emerald-600">Supplier</span><span className="font-medium text-emerald-800">{grn.supplier}</span></div>
              <div className="flex justify-between text-sm"><span className="text-emerald-600">Items Received</span><span className="font-bold text-emerald-900">{grn.lines.filter(l => l.receivedQty > 0).length}</span></div>
              <div className="flex justify-between text-sm"><span className="text-emerald-600">Total Units</span><span className="font-bold text-emerald-900">{grn.lines.reduce((s, l) => s + l.receivedQty, 0)}</span></div>
              <div className="flex justify-between border-t border-emerald-200 pt-2 mt-1 text-base">
                <span className="font-semibold text-emerald-700">Received Value</span>
                <span className="font-bold text-emerald-900">{formatCurrency(totalReceived)}</span>
              </div>
            </div>
          </div>

          {/* Stock update table */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Inventory Updates Applied</p>
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Product</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500">Received</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500">Before</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500">After</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {grn.lines.filter((l) => l.receivedQty > 0).map((l) => {
                    const afterStock = l.currentStock + l.receivedQty;
                    return (
                      <tr key={l.lineItemId} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5">
                          <p className="font-medium text-slate-800">{l.productName}</p>
                          <p className="text-xs font-mono text-slate-400">{l.productId}</p>
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold text-emerald-700">+{l.receivedQty}</td>
                        <td className="px-4 py-2.5 text-right text-slate-500">{l.currentStock}</td>
                        <td className="px-4 py-2.5 text-right">
                          <span className={cn("font-bold",
                            afterStock === 0 ? "text-red-600" : "text-emerald-700")}>
                            {afterStock}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-500">{l.note || "Good condition"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Data flow note */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-blue-700 mb-2">Data Flow</p>
            <div className="flex items-center gap-2 text-xs text-blue-600">
              <span className="flex items-center gap-1 bg-white border border-blue-200 px-2 py-1 rounded-lg font-medium">PO {grn.poId}</span>
              <ArrowRight size={12} />
              <span className="flex items-center gap-1 bg-white border border-blue-200 px-2 py-1 rounded-lg font-medium">GRN {grn.grnId}</span>
              <ArrowRight size={12} />
              <span className="flex items-center gap-1 bg-emerald-100 border border-emerald-300 px-2 py-1 rounded-lg font-semibold text-emerald-700">Stock Updated</span>
              <ArrowRight size={12} />
              <span className="flex items-center gap-1 bg-white border border-blue-200 px-2 py-1 rounded-lg font-medium">Movement Log</span>
            </div>
            <p className="text-xs text-blue-500 mt-2">
              Stock levels on this page now reflect the update. Navigate to Inventory → Products to view current stock across all items.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
          <button className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
            <Printer size={14} /> Print GRN
          </button>
          <button onClick={onClose}
            className="px-5 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────

export default function GoodsReceivePage() {
  const [pos, setPos] = useState(initialPOs.map((p) => ({ ...p })));
  const [prods, setProds] = useState(initialProducts.map((p) => ({ ...p })));

  const [activeTab, setActiveTab] = useState<"awaiting" | "received">("awaiting");
  const [receivingPO, setReceivingPO] = useState<(typeof initialPOs)[number] | null>(null);
  const [completedGRN, setCompletedGRN] = useState<GRNRecord | null>(null);
  const [grnHistory, setGrnHistory] = useState<GRNRecord[]>([]);

  // Session context (mock current user)
  const currentUser = employees.find((e) => e.department === "Operations") ?? employees[0];
  const currentBranch = branches[0];

  const awaitingPOs = useMemo(() =>
    pos.filter((p) => p.status === "pending" || p.status === "in-transit"),
    [pos]
  );
  const receivedPOs = useMemo(() =>
    pos.filter((p) => p.status === "received"),
    [pos]
  );

  const handleConfirm = (grn: GRNRecord, updatedProducts: typeof prods) => {
    // Update PO status
    setPos((prev) => prev.map((p) => p.id === grn.poId ? { ...p, status: "received" as POStatus } : p));
    // Update products
    setProds(updatedProducts);
    // Record GRN
    setGrnHistory((prev) => [grn, ...prev]);
    setReceivingPO(null);
    setCompletedGRN(grn);
  };

  return (
    <div>
      <Header
        title="Goods Receive"
        subtitle="Receive stock against purchase orders and update inventory"
      />

      <div className="p-6 space-y-6">
        {/* Role context bar */}
        <div className="bg-blue-900 text-white rounded-xl px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <User size={15} className="text-blue-300" />
              <span className="text-blue-100">Logged in as:</span>
              <span className="font-semibold">{currentUser.name}</span>
              <span className="text-blue-300">({currentUser.position})</span>
            </div>
            <div className="w-px h-4 bg-blue-700" />
            <div className="flex items-center gap-2">
              <Building2 size={15} className="text-blue-300" />
              <span className="font-semibold">{currentBranch.name}</span>
            </div>
            <div className="w-px h-4 bg-blue-700" />
            <div className="flex items-center gap-2">
              <CalendarDays size={15} className="text-blue-300" />
              <span>{new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
            </div>
          </div>
          <span className="text-xs bg-blue-700 px-2 py-1 rounded-lg text-blue-100 font-medium">Store Manager Role</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Awaiting Receipt", value: awaitingPOs.length, desc: "POs ready to receive", color: "amber",   icon: <Clock size={18} /> },
            { label: "In Transit",       value: awaitingPOs.filter((p) => p.status === "in-transit").length, desc: "Shipped by supplier", color: "blue",    icon: <Truck size={18} /> },
            { label: "Received Today",   value: grnHistory.filter((g) => g.date === new Date().toISOString().split("T")[0]).length, desc: "GRNs created", color: "emerald", icon: <PackageCheck size={18} /> },
          ].map(({ label, value, desc, color, icon }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center",
                  color === "amber"   && "bg-amber-100 text-amber-600",
                  color === "blue"    && "bg-blue-100 text-blue-600",
                  color === "emerald" && "bg-emerald-100 text-emerald-600",
                )}>
                  {icon}
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
          {([["awaiting", "Awaiting Receipt"], ["received", "Received"]] as const).map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn("px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                activeTab === tab ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
              {label}
              <span className={cn("ml-2 text-xs px-1.5 py-0.5 rounded-full",
                activeTab === tab ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-500")}>
                {tab === "awaiting" ? awaitingPOs.length : receivedPOs.length}
              </span>
            </button>
          ))}
        </div>

        {/* Awaiting receipt */}
        {activeTab === "awaiting" && (
          <>
            {awaitingPOs.length === 0 ? (
              <div className="py-24 text-center bg-white rounded-xl border border-slate-200">
                <CheckCircle2 size={40} className="mx-auto text-emerald-300 mb-3" />
                <p className="text-slate-500 font-medium">All purchase orders have been received.</p>
                <p className="text-sm text-slate-400 mt-1">Great job keeping up with deliveries!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {awaitingPOs.map((po) => {
                  const cfg = poStatusCfg[po.status];
                  const myLines = poLineItems.filter((l) => l.poId === po.id);
                  const sup = suppliers.find((s) => s.id === po.supplierId);
                  const isUrgent = po.status === "in-transit";
                  return (
                    <div key={po.id}
                      className={cn("bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow",
                        isUrgent ? "border-blue-200" : "border-slate-200")}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                            isUrgent ? "bg-blue-100" : "bg-amber-100")}>
                            {isUrgent ? <Truck size={22} className="text-blue-600" /> : <Package size={22} className="text-amber-600" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <span className="font-mono font-bold text-slate-900 text-base">{po.id}</span>
                              <span className={cn("flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium", cfg.color)}>
                                {cfg.icon}{cfg.label}
                              </span>
                              {isUrgent && (
                                <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-medium animate-pulse">
                                  Expected Today
                                </span>
                              )}
                            </div>
                            <p className="font-semibold text-slate-700">{po.supplier}</p>
                            {sup && <p className="text-xs text-slate-400 mt-0.5">{sup.contact} · {sup.email}</p>}

                            <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                              <span className="flex items-center gap-1"><FileText size={11} /> {myLines.length} items</span>
                              <span className="flex items-center gap-1"><CalendarDays size={11} /> Ordered {po.date}</span>
                              <span className={cn("flex items-center gap-1 font-medium", isUrgent ? "text-blue-600" : "")}>
                                <CalendarDays size={11} /> Expected {po.expectedDate}
                              </span>
                              <span className="font-semibold text-slate-700">{formatCurrency(po.total)}</span>
                            </div>

                            {po.notes && (
                              <div className="mt-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-100">
                                {po.notes}
                              </div>
                            )}

                            {/* Mini line preview */}
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {myLines.slice(0, 4).map((l) => (
                                <span key={l.id} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                  {l.productName} ×{l.qty}
                                </span>
                              ))}
                              {myLines.length > 4 && (
                                <span className="text-xs bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full">
                                  +{myLines.length - 4} more
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => setReceivingPO(po)}
                          className={cn("flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold shrink-0 transition-all",
                            isUrgent
                              ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200"
                              : "bg-emerald-600 text-white hover:bg-emerald-700")}>
                          <PackageCheck size={16} />
                          Receive Goods
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Received */}
        {activeTab === "received" && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {receivedPOs.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <Package size={32} className="mx-auto mb-3 text-slate-300" />
                <p className="text-sm">No purchase orders received yet.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500">PO #</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500">Supplier</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500">Order Date</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500">Items</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500">Total</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500">GRN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {receivedPOs.map((po) => {
                    const grn = grnHistory.find((g) => g.poId === po.id);
                    return (
                      <tr key={po.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-mono font-semibold text-blue-600">{po.id}</td>
                        <td className="px-5 py-3 font-medium text-slate-800">{po.supplier}</td>
                        <td className="px-5 py-3 text-slate-600">{po.date}</td>
                        <td className="px-5 py-3 text-right text-slate-600">{po.items}</td>
                        <td className="px-5 py-3 text-right font-semibold text-slate-900">{formatCurrency(po.total)}</td>
                        <td className="px-5 py-3">
                          {grn ? (
                            <span className="flex items-center gap-1 text-xs text-emerald-700 font-medium">
                              <CheckCircle2 size={12} />{grn.grnId}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">Pre-existing</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {receivingPO && (
        <ReceiveModal
          po={receivingPO as typeof initialPOs[number]}
          products={prods}
          onClose={() => setReceivingPO(null)}
          onConfirm={handleConfirm}
        />
      )}

      {completedGRN && (
        <GRNSuccess
          grn={completedGRN}
          onClose={() => setCompletedGRN(null)}
        />
      )}
    </div>
  );
}
