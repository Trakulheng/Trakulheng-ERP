"use client";

import { useState, useMemo, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { usePermissions } from "@/lib/use-permissions";
import {
  purchaseOrders as initialPOs,
  poLineItems as initialLineItems,
  suppliers,
  products,
  branches,
  employees,
  POStatus,
  POApprovalStatus,
  POSendMethod,
} from "@/lib/mock-data";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import {
  Plus, Search, Eye, Trash2, X, CheckCircle2,
  Truck, Clock, XCircle, FileText, Package, ChevronRight,
  ArrowRight, ThumbsUp, ThumbsDown, Mail, MessageCircle,
  Send, AlertTriangle, Bell, Shield,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────

type PO = (typeof initialPOs)[number] & {
  approvalStatus: POApprovalStatus;
  approvalRequestedAt: string;
  sendMethod: POSendMethod;
};

type LineItem = (typeof initialLineItems)[number] & { size?: string };

interface DraftLineItem {
  tempId: string;
  productId: string;
  productName: string;
  size: string;
  qty: number;
  unitPrice: number;
}

type UserRole = "admin" | "manager" | "staff" | "viewer";

const CAN_APPROVE: UserRole[] = ["admin", "manager"];

// ── Status configs ────────────────────────────────────────────────────

const statusConfig: Record<POStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending:      { label: "Pending",     color: "bg-amber-100 text-amber-700",     icon: <Clock size={12} /> },
  "in-transit": { label: "In Transit",  color: "bg-blue-100 text-blue-700",       icon: <Truck size={12} /> },
  received:     { label: "Received",    color: "bg-emerald-100 text-emerald-700", icon: <CheckCircle2 size={12} /> },
  cancelled:    { label: "Cancelled",   color: "bg-red-100 text-red-700",         icon: <XCircle size={12} /> },
};

const approvalConfig: Record<POApprovalStatus, { label: string; color: string; dot: string }> = {
  draft:            { label: "Draft",            color: "bg-slate-100 text-slate-500",    dot: "bg-slate-400" },
  pending_approval: { label: "Pending Approval", color: "bg-amber-100 text-amber-700",    dot: "bg-amber-500" },
  approved:         { label: "Approved",         color: "bg-emerald-100 text-emerald-700",dot: "bg-emerald-500" },
  rejected:         { label: "Rejected",         color: "bg-red-100 text-red-700",        dot: "bg-red-500" },
};

const statusFlow: POStatus[] = ["pending", "in-transit", "received"];

function isOverdue(approvalRequestedAt: string): boolean {
  return Date.now() - new Date(approvalRequestedAt).getTime() > 3_600_000;
}

// ── Send Method Dialog ────────────────────────────────────────────────

interface SendDialogProps {
  poId: string;
  supplierEmail: string;
  onSend: (method: POSendMethod) => void;
  onClose: () => void;
}

function SendDialog({ poId, supplierEmail, onSend, onClose }: SendDialogProps) {
  const [method, setMethod] = useState<"email" | "line">("email");

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Send size={18} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">PO Approved — Send to Supplier</h2>
              <p className="text-xs text-slate-400">{poId}</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600">Choose how to send this purchase order to the supplier:</p>
          <div className="space-y-2">
            {[
              { val: "email" as const, icon: <Mail size={16} />, label: "Email", desc: supplierEmail },
              { val: "line"  as const, icon: <MessageCircle size={16} />, label: "Line Message", desc: "Send via Line Business account" },
            ].map(({ val, icon, label, desc }) => (
              <button key={val} onClick={() => setMethod(val)}
                className={cn("w-full flex items-center gap-4 px-4 py-3 rounded-xl border-2 transition-all text-left",
                  method === val ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300")}>
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                  method === val ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-500")}>
                  {icon}
                </div>
                <div>
                  <p className={cn("text-sm font-semibold", method === val ? "text-blue-700" : "text-slate-700")}>{label}</p>
                  <p className="text-xs text-slate-400">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={() => onSend("none")} className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50">Send Later</button>
          <button onClick={onClose} className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 ml-auto">Cancel</button>
          <button onClick={() => onSend(method)}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
            <Send size={14} /> Send via {method === "email" ? "Email" : "Line"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── New PO Modal ──────────────────────────────────────────────────────

interface NewPOModalProps {
  nextId: string;
  currentRole: UserRole;
  canSeePrice: boolean;
  onClose: () => void;
  onSave: (po: PO, lines: LineItem[]) => void;
}

function NewPOModal({ nextId, currentRole, canSeePrice, onClose, onSave }: NewPOModalProps) {
  const [step, setStep]         = useState<1 | 2>(1);
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? "");
  const [orderDate, setOrderDate]   = useState(new Date().toISOString().split("T")[0]);
  const [expectedDate, setExpectedDate] = useState("");
  const [notes, setNotes]           = useState("");
  const [lines, setLines]           = useState<DraftLineItem[]>([]);
  const [lineProductId, setLineProductId] = useState(products[0]?.id ?? "");
  const [lineSize, setLineSize]     = useState("");
  const [lineQty, setLineQty]       = useState(1);
  const [linePrice, setLinePrice]   = useState(products[0]?.unitPrice ?? 0);

  const supplier    = suppliers.find((s) => s.id === supplierId);
  const total       = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);

  const addLine = () => {
    const prod = products.find((p) => p.id === lineProductId);
    if (!prod) return;
    setLines((prev) => [...prev, {
      tempId: `tmp-${Date.now()}`,
      productId: prod.id, productName: prod.name,
      size: lineSize, qty: lineQty, unitPrice: linePrice,
    }]);
    setLineSize(""); setLineQty(1);
  };

  const removeLine = (tempId: string) => setLines((p) => p.filter((l) => l.tempId !== tempId));

  const handleSubmit = () => {
    const now = new Date().toISOString();
    const newPO: PO = {
      id: nextId, supplierId, supplier: supplier?.name ?? "",
      date: orderDate, expectedDate: expectedDate || "TBD",
      items: lines.length, total, status: "pending",
      approvalStatus: "pending_approval",
      approvalRequestedAt: now,
      sendMethod: "none",
      notes,
    };
    const newLines: LineItem[] = lines.map((l, i) => ({
      id: `PLI-NEW-${i}`, poId: nextId,
      productId: l.productId, productName: l.productName,
      size: l.size,
      qty: l.qty, unitPrice: l.unitPrice, total: l.qty * l.unitPrice,
    }));
    onSave(newPO, newLines);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-base font-semibold text-slate-900">New Purchase Order</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              <span className="font-mono font-medium text-blue-600">{nextId}</span>
              {" · "}Step {step} of 2: {step === 1 ? "Order Details" : "Line Items"}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>

        {/* Info banner */}
        <div className="mx-6 mt-4 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
          <Bell size={12} className="shrink-0" />
          After saving, this PO will be sent to the branch manager for approval before going to the supplier.
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-100 bg-slate-50 mt-3">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                step >= s ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500")}>{s}</div>
              <span className={cn("text-xs font-medium", step >= s ? "text-blue-700" : "text-slate-400")}>
                {s === 1 ? "Order Details" : "Line Items"}
              </span>
              {s < 2 && <ArrowRight size={12} className="text-slate-300" />}
            </div>
          ))}
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Supplier *</label>
                <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {suppliers.filter((s) => s.status === "active").map((s) => (
                    <option key={s.id} value={s.id}>{s.name} — {s.category}</option>
                  ))}
                </select>
                {supplier && (
                  <div className="mt-2 p-3 bg-slate-50 rounded-lg text-xs text-slate-500 space-y-0.5">
                    <p>Contact: <span className="text-slate-700 font-medium">{supplier.contact}</span> · {supplier.phone}</p>
                    <p>Payment Terms: <span className="text-slate-700 font-medium">{supplier.paymentTerms}</span> · Rating: <span className="text-amber-600 font-medium">★ {supplier.rating}</span></p>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Order Date *</label>
                  <input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Expected Delivery</label>
                  <input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Notes / Instructions</label>
                <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Delivery instructions, special requirements..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              {/* Add line form */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Add Line Item</p>
                <div className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4">
                    <label className="block text-xs text-slate-500 mb-1">Product</label>
                    <select value={lineProductId}
                      onChange={(e) => {
                        setLineProductId(e.target.value);
                        const p = products.find((x) => x.id === e.target.value);
                        if (p) setLinePrice(p.unitPrice);
                      }}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-slate-500 mb-1">Size / Spec</label>
                    <input value={lineSize} onChange={(e) => setLineSize(e.target.value)}
                      placeholder='e.g. 2"'
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-slate-500 mb-1">Qty</label>
                    <input type="number" min="1" value={lineQty} onChange={(e) => setLineQty(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  {canSeePrice ? (
                    <div className="col-span-2">
                      <label className="block text-xs text-slate-500 mb-1">Unit Price (฿)</label>
                      <input type="number" min="0" value={linePrice} onChange={(e) => setLinePrice(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  ) : (
                    <div className="col-span-2">
                      <label className="block text-xs text-slate-500 mb-1">Unit Price (฿)</label>
                      <div className="flex items-center gap-1 px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-400">
                        <Shield size={11} /> Hidden
                      </div>
                    </div>
                  )}
                  <div className="col-span-2">
                    <button onClick={addLine} disabled={lineQty < 1 || (canSeePrice && linePrice <= 0)}
                      className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 font-medium">
                      + Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Line items table */}
              {lines.length === 0 ? (
                <div className="text-center py-8 text-sm text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                  <Package size={28} className="mx-auto mb-2 text-slate-300" />
                  No line items yet. Add products above.
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Product</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Size</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500">Qty</th>
                        {canSeePrice && <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500">Unit Price</th>}
                        {canSeePrice && <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500">Subtotal</th>}
                        <th className="px-4 py-2.5"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {lines.map((l) => (
                        <tr key={l.tempId}>
                          <td className="px-4 py-2.5 font-medium text-slate-800">{l.productName}</td>
                          <td className="px-4 py-2.5 text-slate-500 text-xs">{l.size || "—"}</td>
                          <td className="px-4 py-2.5 text-right text-slate-700">{formatNumber(l.qty)}</td>
                          {canSeePrice && <td className="px-4 py-2.5 text-right text-slate-700">{formatCurrency(l.unitPrice)}</td>}
                          {canSeePrice && <td className="px-4 py-2.5 text-right font-semibold text-slate-900">{formatCurrency(l.qty * l.unitPrice)}</td>}
                          <td className="px-4 py-2.5">
                            <button onClick={() => removeLine(l.tempId)} className="text-slate-300 hover:text-red-500 transition-colors"><X size={14} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {canSeePrice && (
                      <tfoot>
                        <tr className="bg-slate-50 border-t border-slate-200">
                          <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-slate-700">Total ({lines.length} items)</td>
                          <td className="px-4 py-3 text-right font-bold text-blue-700 text-base">{formatCurrency(total)}</td>
                          <td />
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 sticky bottom-0 bg-white">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
          <div className="flex gap-3">
            {step === 2 && (
              <button onClick={() => setStep(1)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">← Back</button>
            )}
            {step === 1 ? (
              <button onClick={() => setStep(2)} disabled={!supplierId || !orderDate}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40">
                Next: Add Items <ChevronRight size={14} />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={lines.length === 0}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-40">
                <Bell size={14} /> Submit for Approval
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Detail Modal ──────────────────────────────────────────────────────

interface DetailModalProps {
  po: PO;
  lines: LineItem[];
  currentRole: UserRole;
  canSeePrice: boolean;
  onClose: () => void;
  onStatusChange: (id: string, status: POStatus) => void;
  onApprove: (id: string) => void;
  onReject:  (id: string) => void;
  onCancel:  (id: string) => void;
}

function DetailModal({ po, lines, currentRole, canSeePrice, onClose, onStatusChange, onApprove, onReject, onCancel }: DetailModalProps) {
  const myLines     = lines.filter((l) => l.poId === po.id);
  const supplier    = suppliers.find((s) => s.id === po.supplierId);
  const currentStep = statusFlow.indexOf(po.status as POStatus);
  const canApprove  = CAN_APPROVE.includes(currentRole);
  const overdue     = po.approvalStatus === "pending_approval" && isOverdue(po.approvalRequestedAt);

  const approvalCfg = approvalConfig[po.approvalStatus];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileText size={20} className="text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900">{po.id}</h2>
                <span className={cn("flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium", approvalCfg.color)}>
                  <div className={cn("w-1.5 h-1.5 rounded-full", approvalCfg.dot)} />
                  {approvalCfg.label}
                </span>
                {po.sendMethod !== "none" && (
                  <span className="flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                    {po.sendMethod === "email" ? <Mail size={10} /> : <MessageCircle size={10} />}
                    Sent via {po.sendMethod === "email" ? "Email" : "Line"}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">{po.supplier}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {po.status !== "cancelled" && po.status !== "received" && po.approvalStatus === "approved" && (
              <button onClick={() => onCancel(po.id)}
                className="px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50">
                Cancel PO
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 ml-1"><X size={16} /></button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Approval workflow */}
          {po.approvalStatus === "pending_approval" && (
            <div className={cn("rounded-xl p-4 border", overdue ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200")}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                  {overdue
                    ? <AlertTriangle size={16} className="text-red-600 shrink-0" />
                    : <Bell size={16} className="text-amber-600 shrink-0" />}
                  <div>
                    <p className={cn("text-sm font-semibold", overdue ? "text-red-800" : "text-amber-800")}>
                      {overdue ? "⚠ Approval overdue (>1 hour)" : "Awaiting Branch Manager Approval"}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Requested at {new Date(po.approvalRequestedAt).toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit" })} ·
                      {overdue ? " Branch manager has been notified" : " Pending review"}
                    </p>
                  </div>
                </div>
                {canApprove && (
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => onReject(po.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50">
                      <ThumbsDown size={12} /> Reject
                    </button>
                    <button onClick={() => onApprove(po.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                      <ThumbsUp size={12} /> Approve
                    </button>
                  </div>
                )}
                {!canApprove && (
                  <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0"><Shield size={11} /> Manager/Admin only</span>
                )}
              </div>
            </div>
          )}

          {po.approvalStatus === "rejected" && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
              <XCircle size={16} className="text-red-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-800">PO Rejected by Branch Manager</p>
                <p className="text-xs text-slate-500">Review the line items and resubmit, or cancel this order.</p>
              </div>
            </div>
          )}

          {/* Status flow (only for approved POs) */}
          {po.approvalStatus === "approved" && po.status !== "cancelled" && (
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Order Status</p>
              <div className="flex items-center gap-2">
                {statusFlow.map((s, i) => {
                  const cfg      = statusConfig[s];
                  const done     = i <= currentStep;
                  const isNext   = i === currentStep + 1;
                  return (
                    <div key={s} className="flex items-center gap-2 flex-1">
                      <div className="flex-1">
                        <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
                          done ? cfg.color : "bg-slate-100 text-slate-400")}>
                          {cfg.icon}
                          <span className="text-xs font-semibold">{cfg.label}</span>
                        </div>
                        {isNext && (
                          <button onClick={() => onStatusChange(po.id, s)}
                            className="w-full mt-1 text-xs text-blue-600 hover:underline text-center">
                            Mark as {cfg.label} →
                          </button>
                        )}
                      </div>
                      {i < statusFlow.length - 1 && (
                        <ArrowRight size={14} className={done && i < currentStep ? "text-slate-400" : "text-slate-200"} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {po.status === "cancelled" && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
              <XCircle size={18} className="text-red-500 shrink-0" />
              <p className="text-sm text-red-700 font-medium">This purchase order has been cancelled.</p>
            </div>
          )}

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 text-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Supplier</p>
              <p className="font-semibold text-slate-800">{po.supplier}</p>
              {supplier && (
                <>
                  <p className="text-slate-500">{supplier.contact}</p>
                  <p className="text-slate-500">{supplier.email}</p>
                  <p className="text-slate-500">{supplier.phone}</p>
                </>
              )}
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 text-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Order Info</p>
              <div className="flex justify-between"><span className="text-slate-500">Order Date</span><span className="font-medium">{po.date}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Expected</span><span className="font-medium">{po.expectedDate}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Items</span><span className="font-medium">{po.items}</span></div>
              {supplier && <div className="flex justify-between"><span className="text-slate-500">Payment</span><span className="font-medium">{supplier.paymentTerms}</span></div>}
              {canSeePrice && <div className="flex justify-between"><span className="text-slate-500">Total</span><span className="font-bold text-blue-700">{formatCurrency(po.total)}</span></div>}
            </div>
          </div>

          {po.notes && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-700 mb-1">Notes</p>
              <p className="text-sm text-amber-800">{po.notes}</p>
            </div>
          )}

          {/* Line items */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Line Items</p>
            {myLines.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No line item details available.</p>
            ) : (
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Product</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Size</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">Qty</th>
                      {canSeePrice && <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">Unit Price</th>}
                      {canSeePrice && <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">Subtotal</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {myLines.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-800">{l.productName}</td>
                        <td className="px-4 py-3 text-xs text-slate-400">{(l as any).size || "—"}</td>
                        <td className="px-4 py-3 text-right text-slate-700">{formatNumber(l.qty)}</td>
                        {canSeePrice && <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(l.unitPrice)}</td>}
                        {canSeePrice && <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatCurrency(l.total)}</td>}
                      </tr>
                    ))}
                  </tbody>
                  {canSeePrice && (
                    <tfoot>
                      <tr className="bg-slate-50 border-t border-slate-200">
                        <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-slate-700">Order Total</td>
                        <td className="px-4 py-3 text-right font-bold text-blue-700 text-base">{formatCurrency(po.total)}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────

export default function PurchaseOrdersPage() {
  const { can } = usePermissions();
  const [poList,    setPoList]    = useState<PO[]>(initialPOs as PO[]);
  const [lineItems, setLineItems] = useState<LineItem[]>(initialLineItems as LineItem[]);
  const [search,    setSearch]    = useState("");
  const [statusFilter, setStatusFilter] = useState<POStatus | "all" | "pending_approval">("all");
  const [showNew,   setShowNew]   = useState(false);
  const [viewId,    setViewId]    = useState<string | null>(null);
  const [deleteId,  setDeleteId]  = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>("staff");
  const [sendDialog, setSendDialog]   = useState<string | null>(null);
  const [pricePerms, setPricePerms]   = useState<Record<UserRole, boolean>>({
    admin: true, manager: true, staff: false, viewer: false,
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.ok ? r.json() : null),
      fetch("/api/settings/role-permissions").then((r) => r.ok ? r.json() : null),
    ]).then((results) => {
      const me = results[0];
      const rp = results[1];
      if (me?.role) setCurrentRole(me.role as UserRole);
      if (!rp?.permissions) return;
      const p = rp.permissions;
      setPricePerms({
        admin:   p.admin?.inv_po_prices?.view   ?? true,
        manager: p.manager?.inv_po_prices?.view ?? true,
        staff:   p.staff?.inv_po_prices?.view   ?? false,
        viewer:  p.viewer?.inv_po_prices?.view  ?? false,
      });
    }).catch(() => {});
  }, []);

  const pendingApprovalCount = poList.filter((p) => p.approvalStatus === "pending_approval").length;
  const overdueCount         = poList.filter((p) => p.approvalStatus === "pending_approval" && isOverdue(p.approvalRequestedAt)).length;

  const filtered = useMemo(() => poList.filter((po) => {
    const q = search.toLowerCase();
    const matchSearch  = !q || po.id.toLowerCase().includes(q) || po.supplier.toLowerCase().includes(q);
    const matchStatus  = statusFilter === "all" ? true
      : statusFilter === "pending_approval" ? po.approvalStatus === "pending_approval"
      : po.status === statusFilter;
    return matchSearch && matchStatus;
  }), [poList, search, statusFilter]);

  const stats = useMemo(() => ({
    total:     poList.reduce((s, p) => s + p.total, 0),
    pending:   poList.filter((p) => p.status === "pending").reduce((s, p) => s + p.total, 0),
    inTransit: poList.filter((p) => p.status === "in-transit").reduce((s, p) => s + p.total, 0),
    received:  poList.filter((p) => p.status === "received").reduce((s, p) => s + p.total, 0),
  }), [poList]);

  const nextId  = `PO-${String(poList.length + 1).padStart(3, "0")}`;
  const viewPO  = viewId ? poList.find((p) => p.id === viewId) : null;
  const sendPO  = sendDialog ? poList.find((p) => p.id === sendDialog) : null;
  const sendSupplier = sendPO ? suppliers.find((s) => s.id === sendPO.supplierId) : null;

  const handleSave = (po: PO, lines: LineItem[]) => {
    setPoList((prev) => [po, ...prev]);
    setLineItems((prev) => [...prev, ...lines]);
    setShowNew(false);
  };

  const handleStatusChange = (id: string, status: POStatus) => {
    setPoList((prev) => prev.map((p) => p.id === id ? { ...p, status } : p));
  };

  const handleApprove = (id: string) => {
    setPoList((prev) => prev.map((p) => p.id === id ? { ...p, approvalStatus: "approved" } : p));
    setViewId(null);
    setSendDialog(id);
  };

  const handleReject = (id: string) => {
    setPoList((prev) => prev.map((p) => p.id === id ? { ...p, approvalStatus: "rejected" } : p));
  };

  const handleSend = (method: POSendMethod) => {
    if (sendDialog) {
      setPoList((prev) => prev.map((p) => p.id === sendDialog ? { ...p, sendMethod: method } : p));
    }
    setSendDialog(null);
  };

  const handleCancel = (id: string) => {
    setPoList((prev) => prev.map((p) => p.id === id ? { ...p, status: "cancelled" } : p));
  };

  const handleDelete = (id: string) => {
    setPoList((prev) => prev.filter((p) => p.id !== id));
    setLineItems((prev) => prev.filter((l) => l.poId !== id));
    setDeleteId(null);
    if (viewId === id) setViewId(null);
  };

  const canSeePrice = pricePerms[currentRole] ?? false;

  return (
    <div>
      <Header
        title="Purchase Orders"
        subtitle={`${poList.length} orders · ${canSeePrice ? `Total ${formatCurrency(stats.total)}` : "Prices hidden for your role"}`}
        actions={can("inv_po", "create") ? (
          <button onClick={() => setShowNew(true)}
            className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
            <Plus size={16} /> New PO
          </button>
        ) : undefined}
      />

      <div className="p-6 space-y-6">
        {/* Pending approval banner */}
        {pendingApprovalCount > 0 && (
          <div className={cn("flex items-center gap-3 rounded-xl px-4 py-3 border",
            overdueCount > 0 ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200")}>
            {overdueCount > 0
              ? <AlertTriangle size={16} className="text-red-600 shrink-0" />
              : <Bell size={16} className="text-amber-600 shrink-0" />}
            <div>
              <p className={cn("text-sm font-semibold", overdueCount > 0 ? "text-red-800" : "text-amber-800")}>
                {pendingApprovalCount} PO{pendingApprovalCount > 1 ? "s" : ""} awaiting approval
                {overdueCount > 0 && ` · ${overdueCount} overdue (>1 hour)`}
              </p>
              <p className="text-xs text-slate-500">Branch manager approval required before sending to suppliers.</p>
            </div>
            <button onClick={() => setStatusFilter("pending_approval")}
              className="ml-auto text-xs font-medium text-blue-600 hover:underline shrink-0">
              View pending →
            </button>
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label:"Total PO Value",  value: canSeePrice ? formatCurrency(stats.total)     : "—", color:"blue",    icon:<FileText size={18} /> },
            { label:"Pending",         value: canSeePrice ? formatCurrency(stats.pending)   : "—", color:"amber",   icon:<Clock size={18} /> },
            { label:"In Transit",      value: canSeePrice ? formatCurrency(stats.inTransit) : "—", color:"blue",    icon:<Truck size={18} /> },
            { label:"Received",        value: canSeePrice ? formatCurrency(stats.received)  : "—", color:"emerald", icon:<CheckCircle2 size={18} /> },
          ].map(({ label, value, color, icon }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-500 font-medium">{label}</p>
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center",
                  color === "blue"    && "bg-blue-100 text-blue-600",
                  color === "amber"   && "bg-amber-100 text-amber-600",
                  color === "emerald" && "bg-emerald-100 text-emerald-600")}>
                  {icon}
                </div>
              </div>
              <p className="text-xl font-bold text-slate-900">{value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search PO# or supplier..."
              className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            {([
              ["all",              "All"],
              ["pending_approval", `Pending Approval${pendingApprovalCount ? ` (${pendingApprovalCount})` : ""}`],
              ["pending",          "Pending"],
              ["in-transit",       "In Transit"],
              ["received",         "Received"],
              ["cancelled",        "Cancelled"],
            ] as const).map(([v, l]) => (
              <button key={v} onClick={() => setStatusFilter(v)}
                className={cn("px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap",
                  statusFilter === v
                    ? v === "pending_approval" ? "bg-amber-500 text-white shadow-sm" : "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-700")}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">PO #</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Supplier</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Expected</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Approval</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Items</th>
                  {canSeePrice && <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total</th>}
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((po) => {
                  const cfg  = statusConfig[po.status];
                  const appr = approvalConfig[po.approvalStatus];
                  const od   = po.approvalStatus === "pending_approval" && isOverdue(po.approvalRequestedAt);
                  return (
                    <tr key={po.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-5 py-3 font-mono text-blue-600 font-semibold text-xs">{po.id}</td>
                      <td className="px-5 py-3 font-medium text-slate-800">{po.supplier}</td>
                      <td className="px-5 py-3 text-slate-500 text-xs">{po.date}</td>
                      <td className="px-5 py-3 text-slate-500 text-xs">{po.expectedDate}</td>
                      <td className="px-5 py-3">
                        <span className={cn("flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium w-fit",
                          od ? "bg-red-100 text-red-700" : appr.color)}>
                          <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", od ? "bg-red-500" : appr.dot)} />
                          {od ? "Overdue" : appr.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-slate-700">{po.items}</td>
                      {canSeePrice && <td className="px-5 py-3 text-right font-semibold text-slate-900">{formatCurrency(po.total)}</td>}
                      <td className="px-5 py-3">
                        <span className={cn("flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium w-fit", cfg.color)}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setViewId(po.id)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600"><Eye size={14} /></button>
                          <button onClick={() => setDeleteId(po.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-12 text-center">
              <FileText size={28} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-400">No purchase orders match your filter.</p>
            </div>
          )}
        </div>
      </div>

      {showNew && (
        <NewPOModal nextId={nextId} currentRole={currentRole} canSeePrice={canSeePrice} onClose={() => setShowNew(false)} onSave={handleSave} />
      )}

      {viewPO && (
        <DetailModal
          po={viewPO}
          lines={lineItems}
          currentRole={currentRole}
          canSeePrice={canSeePrice}
          onClose={() => setViewId(null)}
          onStatusChange={handleStatusChange}
          onApprove={handleApprove}
          onReject={handleReject}
          onCancel={handleCancel}
        />
      )}

      {sendPO && (
        <SendDialog
          poId={sendPO.id}
          supplierEmail={sendSupplier?.email ?? "supplier@example.com"}
          onSend={handleSend}
          onClose={() => setSendDialog(null)}
        />
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><Trash2 size={22} className="text-red-600" /></div>
            <h2 className="text-base font-semibold text-slate-900 mb-1">Delete Purchase Order</h2>
            <p className="text-sm text-slate-500 mb-6">Remove <strong>{deleteId}</strong>? This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
              <button onClick={() => handleDelete(deleteId!)} className="flex-1 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
