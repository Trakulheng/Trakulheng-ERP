"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { usePermissions } from "@/lib/use-permissions";
import { Header } from "@/components/layout/Header";
import { SalesOrderStage } from "@/lib/mock-data";
import { cn, formatCurrency } from "@/lib/utils";
import {
  Plus, Search, Eye, Trash2, X, ArrowRight,
  ChevronRight, Package, CheckCircle2, FileText, Truck,
  TrendingUp, Clock, Circle,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────

interface Order {
  id: string; _cuid?: string;
  customerId: string; customer: string;
  date: string; deliveryDate: string;
  items: number; amount: number;
  stage: SalesOrderStage; probability: number; notes: string;
  lines?: LineItem[];
}

interface LineItem {
  id: string; soId: string;
  productId: string; productName: string;
  qty: number; unitPrice: number; total: number;
}

interface DraftLine {
  tempId: string; productId: string; productName: string; qty: number; unitPrice: number;
}

interface CustomerOpt { id: string; name: string; contact?: string; phone?: string; address?: string; type?: string; status?: string; }
interface ProductOpt  { id: string; name: string; unitPrice: number; sku?: string; }

// ── Config ─────────────────────────────────────────────────────────────

const STAGES: SalesOrderStage[] = ["prospect", "quoted", "negotiation", "confirmed", "invoiced", "delivered"];

const stageCfg: Record<SalesOrderStage, { label: string; color: string; bg: string; icon: React.ReactNode; prob: number }> = {
  prospect:    { label: "Prospect",    color: "text-slate-600",   bg: "bg-slate-100",   icon: <Circle size={12} />,       prob: 20  },
  quoted:      { label: "Quoted",      color: "text-blue-700",    bg: "bg-blue-100",    icon: <FileText size={12} />,     prob: 40  },
  negotiation: { label: "Negotiation", color: "text-purple-700",  bg: "bg-purple-100",  icon: <TrendingUp size={12} />,   prob: 60  },
  confirmed:   { label: "Confirmed",   color: "text-amber-700",   bg: "bg-amber-100",   icon: <CheckCircle2 size={12} />, prob: 85  },
  invoiced:    { label: "Invoiced",    color: "text-orange-700",  bg: "bg-orange-100",  icon: <Clock size={12} />,        prob: 95  },
  delivered:   { label: "Delivered",   color: "text-emerald-700", bg: "bg-emerald-100", icon: <Truck size={12} />,        prob: 100 },
};

// ── New Order Modal ───────────────────────────────────────────────────

function NewOrderModal({ onClose, onSave, customers, products }: {
  onClose: () => void;
  onSave: (data: { customerId: string; date: string; deliveryDate?: string; stage: SalesOrderStage; probability: number; notes: string; lines: DraftLine[] }) => Promise<void>;
  customers: CustomerOpt[];
  products: ProductOpt[];
}) {
  const [step,         setStep]         = useState<1 | 2>(1);
  const [customerId,   setCustomerId]   = useState(customers[0]?.id ?? "");
  const [orderDate,    setOrderDate]    = useState(new Date().toISOString().split("T")[0]);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [stage,        setStage]        = useState<SalesOrderStage>("prospect");
  const [notes,        setNotes]        = useState("");
  const [lines,        setLines]        = useState<DraftLine[]>([]);
  const [lineProductId,setLineProductId]= useState(products[0]?.id ?? "");
  const [lineQty,      setLineQty]      = useState(1);
  const [linePrice,    setLinePrice]    = useState(products[0]?.unitPrice ?? 0);
  const [saving,       setSaving]       = useState(false);

  const customer = customers.find((c) => c.id === customerId);
  const stTotal  = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
  const cfg      = stageCfg[stage];

  const addLine = () => {
    const prod = products.find((p) => p.id === lineProductId);
    if (!prod) return;
    setLines((prev) => [...prev, {
      tempId: `tmp-${Date.now()}`,
      productId: prod.id, productName: prod.name,
      qty: lineQty, unitPrice: linePrice,
    }]);
    setLineQty(1);
  };

  const handleSubmit = async () => {
    setSaving(true);
    await onSave({ customerId, date: orderDate, deliveryDate: deliveryDate || undefined, stage, probability: cfg.prob, notes, lines });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 h-screen z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-900">New Sales Order</h2>
            <p className="text-xs text-slate-400 mt-0.5">Step {step} of 2: {step === 1 ? "Order Details" : "Line Items"}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>

        {/* Step bar */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-100 bg-slate-50 shrink-0">
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

        <div className="flex-1 overflow-y-auto min-h-0 p-6">
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Customer *</label>
                {customers.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">No customers found. Add a customer first.</p>
                ) : (
                  <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {customers.filter((c) => c.status !== "inactive").map((c) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.type ?? "individual"})</option>
                    ))}
                  </select>
                )}
                {customer && (
                  <div className="mt-2 p-3 bg-slate-50 rounded-lg text-xs text-slate-500 space-y-0.5">
                    {customer.contact && <p>Contact: <span className="text-slate-700 font-medium">{customer.contact}</span>{customer.phone && ` · ${customer.phone}`}</p>}
                    {customer.address && <p>Address: <span className="text-slate-600">{customer.address}</span></p>}
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
                  <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Stage</label>
                <div className="grid grid-cols-3 gap-2">
                  {STAGES.map((s) => {
                    const c = stageCfg[s];
                    return (
                      <button key={s} onClick={() => setStage(s)}
                        className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all",
                          stage === s ? `${c.bg} ${c.color} border-current` : "bg-white text-slate-500 border-slate-200 hover:border-slate-300")}>
                        {c.icon} {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Notes / Instructions</label>
                <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Delivery instructions, special requirements, internal notes..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Add Line Item</p>
                {products.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">No products available. Add products in Inventory first.</p>
                ) : (
                  <div className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5">
                      <label className="block text-xs text-slate-500 mb-1">Product</label>
                      <select value={lineProductId}
                        onChange={(e) => {
                          setLineProductId(e.target.value);
                          const p = products.find((x) => x.id === e.target.value);
                          if (p) setLinePrice(Math.round(p.unitPrice * 1.15));
                        }}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                        {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-slate-500 mb-1">Qty</label>
                      <input type="number" min="1" value={lineQty} onChange={(e) => setLineQty(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-xs text-slate-500 mb-1">Unit Price (฿)</label>
                      <input type="number" min="0" value={linePrice} onChange={(e) => setLinePrice(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="col-span-2">
                      <button onClick={addLine} disabled={lineQty < 1 || linePrice <= 0}
                        className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 font-medium">
                        + Add
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {lines.length === 0 ? (
                <div className="text-center py-8 text-sm text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                  <Package size={28} className="mx-auto mb-2 text-slate-300" />
                  No line items yet. Add products above.
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Product</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500">Qty</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500">Unit Price</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500">Subtotal</th>
                        <th className="px-4 py-2.5"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {lines.map((l) => (
                        <tr key={l.tempId}>
                          <td className="px-4 py-2.5 font-medium text-slate-800">{l.productName}</td>
                          <td className="px-4 py-2.5 text-right text-slate-700">{l.qty}</td>
                          <td className="px-4 py-2.5 text-right text-slate-700">{formatCurrency(l.unitPrice)}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-slate-900">{formatCurrency(l.qty * l.unitPrice)}</td>
                          <td className="px-4 py-2.5">
                            <button onClick={() => setLines((p) => p.filter((x) => x.tempId !== l.tempId))}
                              className="text-slate-300 hover:text-red-500 transition-colors"><X size={14} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 border-t border-slate-200">
                        <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-slate-700">
                          Total ({lines.length} item{lines.length !== 1 ? "s" : ""})
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-blue-700 text-base">{formatCurrency(stTotal)}</td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
          <div className="flex gap-3">
            {step === 2 && (
              <button onClick={() => setStep(1)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">← Back</button>
            )}
            {step === 1 ? (
              <button onClick={() => setStep(2)} disabled={!customerId || !orderDate}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40">
                Next: Add Items <ChevronRight size={14} />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={lines.length === 0 || saving}
                className="px-5 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-40">
                {saving ? "Creating…" : "Create Order"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Detail Modal ───────────────────────────────────────────────────────

function DetailModal({ order, customers, onClose, onStageChange }: {
  order: Order; customers: CustomerOpt[];
  onClose: () => void; onStageChange: (id: string, stage: SalesOrderStage) => void;
}) {
  const customer   = customers.find((c) => c.id === order.customerId);
  const currentIdx = STAGES.indexOf(order.stage);
  const nextStage  = STAGES[currentIdx + 1] as SalesOrderStage | undefined;
  const myLines    = order.lines ?? [];
  const total      = myLines.length > 0 ? myLines.reduce((s, l) => s + l.total, 0) : order.amount;

  return (
    <div className="fixed inset-0 h-screen z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><FileText size={20} className="text-blue-600" /></div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900">{order.id}</h2>
                <span className={cn("flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium",
                  stageCfg[order.stage].bg, stageCfg[order.stage].color)}>
                  {stageCfg[order.stage].icon}{stageCfg[order.stage].label}
                </span>
              </div>
              <p className="text-xs text-slate-400">{order.customer}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-6">
          {/* Stage pipeline */}
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Order Stage</p>
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {STAGES.map((s, i) => {
                const c = stageCfg[s];
                const done = i <= currentIdx;
                const isCurrent = i === currentIdx;
                return (
                  <div key={s} className="flex items-center gap-1 shrink-0">
                    <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                      done ? `${c.bg} ${c.color}` : "bg-white text-slate-400 border border-slate-200",
                      isCurrent && "ring-2 ring-blue-400 ring-offset-1")}>
                      {c.icon}{c.label}
                    </div>
                    {i < STAGES.length - 1 && (
                      <ArrowRight size={12} className={done && i < currentIdx ? "text-slate-400" : "text-slate-200"} />
                    )}
                  </div>
                );
              })}
            </div>
            {nextStage && (
              <button onClick={() => onStageChange(order.id, nextStage)}
                className={cn("mt-3 flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-lg",
                  stageCfg[nextStage].bg, stageCfg[nextStage].color, "hover:opacity-80 transition-opacity")}>
                Advance to {stageCfg[nextStage].label} →
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 text-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</p>
              <p className="font-semibold text-slate-800">{order.customer}</p>
              {customer && (
                <>
                  {customer.contact && <p className="text-slate-500">{customer.contact}</p>}
                  {customer.phone   && <p className="text-slate-500">{customer.phone}</p>}
                  {customer.address && <p className="text-slate-400 text-xs">{customer.address}</p>}
                </>
              )}
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 text-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Order Info</p>
              <div className="flex justify-between"><span className="text-slate-400">Order Date</span><span className="font-medium">{order.date}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Delivery</span><span className="font-medium">{order.deliveryDate}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Items</span><span className="font-medium">{order.items}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Probability</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-slate-200 rounded-full h-1.5">
                    <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${order.probability}%` }} />
                  </div>
                  <span className="text-xs text-slate-600">{order.probability}%</span>
                </div>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2 mt-1">
                <span className="text-slate-600 font-semibold">Total</span>
                <span className="font-bold text-blue-700 text-base">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {order.notes && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-700 mb-1">Notes</p>
              <p className="text-sm text-amber-800">{order.notes}</p>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Line Items</p>
            {myLines.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No detailed line items available.</p>
            ) : (
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Product</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">Qty</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">Unit Price</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {myLines.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-800">{l.productName}</td>
                        <td className="px-4 py-3 text-right text-slate-700">{l.qty}</td>
                        <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(l.unitPrice)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatCurrency(l.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 border-t border-slate-200">
                      <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-slate-700">Order Total</td>
                      <td className="px-4 py-3 text-right font-bold text-blue-700 text-base">{formatCurrency(total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────

export default function OrdersPage() {
  const { can } = usePermissions();
  const [orders,      setOrders]      = useState<Order[]>([]);
  const [customers,   setCustomers]   = useState<CustomerOpt[]>([]);
  const [products,    setProducts]    = useState<ProductOpt[]>([]);
  const [search,      setSearch]      = useState("");
  const [stageFilter, setStageFilter] = useState<SalesOrderStage | "all">("all");
  const [showNew,     setShowNew]     = useState(false);
  const [viewId,      setViewId]      = useState<string | null>(null);
  const [deleteId,    setDeleteId]    = useState<string | null>(null);
  const [loading,     setLoading]     = useState(true);

  const loadOrders = useCallback(() => {
    fetch("/api/sales/orders")
      .then((r) => r.ok ? r.json() : [])
      .then(setOrders)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadOrders();
    // Load customers for modal - from both simple Customer and CustomerProfile
    fetch("/api/sales/customers").then((r) => r.ok ? r.json() : []).then((profiles: any[]) => {
      setCustomers(profiles.map((p) => ({
        id:      p.id,
        name:    p.customerType === "individual" ? `${p.firstName} ${p.lastName}`.trim() || p.id : (p.companyName || p.id),
        contact: p.contactPerson,
        phone:   p.phone,
        address: p.address,
        type:    p.customerType,
        status:  p.status,
      })));
    });
    // Load products
    fetch("/api/products").then((r) => r.ok ? r.json() : []).then((prods: any[]) => {
      setProducts(prods.map((p) => ({ id: p.id, name: p.name, unitPrice: p.unitPrice, sku: p.sku })));
    });
  }, [loadOrders]);

  const filtered = useMemo(() => orders.filter((o) => {
    const q = search.toLowerCase();
    const matchSearch = !q || o.id.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q);
    const matchStage  = stageFilter === "all" || o.stage === stageFilter;
    return matchSearch && matchStage;
  }), [orders, search, stageFilter]);

  const stats = useMemo(() => ({
    total:     orders.reduce((s, o) => s + o.amount, 0),
    pipeline:  orders.filter((o) => o.stage !== "delivered").reduce((s, o) => s + o.amount, 0),
    confirmed: orders.filter((o) => ["confirmed","invoiced"].includes(o.stage)).reduce((s, o) => s + o.amount, 0),
    delivered: orders.filter((o) => o.stage === "delivered").reduce((s, o) => s + o.amount, 0),
  }), [orders]);

  const stageCounts = useMemo(() => {
    const counts: Record<string, { count: number; value: number }> = {};
    STAGES.forEach((s) => { counts[s] = { count: 0, value: 0 }; });
    orders.forEach((o) => { counts[o.stage].count++; counts[o.stage].value += o.amount; });
    return counts;
  }, [orders]);

  const viewOrder = viewId ? orders.find((o) => o.id === viewId) : null;

  const handleSave = async (data: Parameters<Parameters<typeof NewOrderModal>[0]["onSave"]>[0]) => {
    // Find customer name for display
    const cust = customers.find((c) => c.id === data.customerId);
    // We need to create a Customer in the Customer table if it doesn't exist
    // For now, use CustomerProfile as the customer source directly
    const res = await fetch("/api/sales/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId:   data.customerId,
        date:         data.date,
        deliveryDate: data.deliveryDate,
        stage:        data.stage,
        probability:  data.probability,
        notes:        data.notes,
        lines:        data.lines.map((l) => ({
          productId:   l.productId,
          productName: l.productName,
          qty:         l.qty,
          unitPrice:   l.unitPrice,
        })),
      }),
    });
    if (res.ok) {
      const created = await res.json();
      // Override customer name with local lookup since API uses customerId from SalesOrder.Customer
      setOrders((prev) => [{ ...created, customer: cust?.name ?? created.customer }, ...prev]);
      setShowNew(false);
    }
  };

  const handleStageChange = async (id: string, stage: SalesOrderStage) => {
    const res = await fetch(`/api/sales/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
    if (res.ok) {
      const updated = await res.json();
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, stage: updated.stage, probability: updated.probability } : o));
    }
    setViewId(null);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/sales/orders/${id}`, { method: "DELETE" });
    setOrders((prev) => prev.filter((o) => o.id !== id));
    setDeleteId(null);
    if (viewId === id) setViewId(null);
  };

  return (
    <div>
      <Header
        title="Sales Orders"
        subtitle={`${orders.length} orders · ${formatCurrency(stats.total)} total pipeline`}
        actions={can("sales_orders", "create") ? (
          <button onClick={() => setShowNew(true)}
            className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
            <Plus size={16} /> New Order
          </button>
        ) : undefined}
      />

      <div className="p-6 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Pipeline",  value: formatCurrency(stats.total),     icon: <TrendingUp size={18} />,   color: "blue"    },
            { label: "Active Pipeline", value: formatCurrency(stats.pipeline),   icon: <Clock size={18} />,        color: "violet"  },
            { label: "Confirmed",       value: formatCurrency(stats.confirmed),  icon: <CheckCircle2 size={18} />, color: "amber"   },
            { label: "Delivered",       value: formatCurrency(stats.delivered),  icon: <Truck size={18} />,        color: "emerald" },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-500 font-medium">{label}</p>
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center",
                  color === "blue"    && "bg-blue-100 text-blue-600",
                  color === "violet"  && "bg-violet-100 text-violet-600",
                  color === "amber"   && "bg-amber-100 text-amber-600",
                  color === "emerald" && "bg-emerald-100 text-emerald-600")}>
                  {icon}
                </div>
              </div>
              <p className="text-xl font-bold text-slate-900">{value}</p>
            </div>
          ))}
        </div>

        {/* Stage breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Pipeline by Stage</p>
          <div className="grid grid-cols-6 gap-3">
            {STAGES.map((s) => {
              const c  = stageCfg[s];
              const sc = stageCounts[s];
              return (
                <button key={s} onClick={() => setStageFilter(stageFilter === s ? "all" : s)}
                  className={cn("rounded-xl p-3 text-center transition-all border",
                    stageFilter === s
                      ? `${c.bg} ${c.color} border-current shadow-sm`
                      : "bg-slate-50 text-slate-600 border-transparent hover:border-slate-200")}>
                  <p className="text-lg font-bold">{sc.count}</p>
                  <p className="text-xs font-medium mt-0.5">{c.label}</p>
                  {sc.count > 0 && <p className="text-xs opacity-70 mt-0.5">{formatCurrency(sc.value)}</p>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search order# or customer..."
            className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-sm text-slate-400">Loading…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Order #</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Customer</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Delivery</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Items</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Stage</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Probability</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((o) => {
                    const c = stageCfg[o.stage];
                    return (
                      <tr key={o.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-5 py-3">
                          <button onClick={() => setViewId(o.id)} className="font-mono font-semibold text-blue-600 hover:text-blue-800">{o.id}</button>
                        </td>
                        <td className="px-5 py-3 font-medium text-slate-800">{o.customer}</td>
                        <td className="px-5 py-3 text-slate-600">{o.date}</td>
                        <td className="px-5 py-3 text-slate-500 text-xs">{o.deliveryDate}</td>
                        <td className="px-5 py-3 text-right text-slate-700">{o.items}</td>
                        <td className="px-5 py-3 text-right font-semibold text-slate-900">{formatCurrency(o.amount)}</td>
                        <td className="px-5 py-3">
                          <span className={cn("flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium w-fit", c.bg, c.color)}>
                            {c.icon}{c.label}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-14 bg-slate-200 rounded-full h-1.5">
                              <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${o.probability}%` }} />
                            </div>
                            <span className="text-xs text-slate-500">{o.probability}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setViewId(o.id)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600"><Eye size={14} /></button>
                            <button onClick={() => setDeleteId(o.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="py-16 text-center">
              <FileText size={32} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm text-slate-400">No orders match your filter.</p>
            </div>
          )}
        </div>
      </div>

      {showNew && (
        <NewOrderModal
          onClose={() => setShowNew(false)}
          onSave={handleSave}
          customers={customers}
          products={products}
        />
      )}

      {viewOrder && (
        <DetailModal
          order={orders.find((o) => o.id === viewOrder.id)!}
          customers={customers}
          onClose={() => setViewId(null)}
          onStageChange={handleStageChange}
        />
      )}

      {deleteId && (
        <div className="fixed inset-0 h-screen z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><Trash2 size={22} className="text-red-600" /></div>
            <h2 className="text-base font-semibold text-slate-900 mb-1">Delete Order</h2>
            <p className="text-sm text-slate-500 mb-6">Remove <span className="font-semibold">{deleteId}</span>? This cannot be undone.</p>
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
