"use client";

import { useState, useMemo, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { usePermissions } from "@/lib/use-permissions";
import {
  products as initialProducts,
  stockMovements as initialMovements,
  suppliers, branches,
  poLineItems, purchaseOrders,
  PRODUCT_CATEGORIES,
  StockStatus, StockMovementType,
} from "@/lib/mock-data";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import {
  Plus, Search, Pencil, Trash2, X, Package,
  AlertTriangle, TrendingDown, ArrowUpCircle, ArrowDownCircle,
  RefreshCw, RotateCcw, Eye, Layers, BarChart2, Clock,
  ChevronDown, ChevronUp,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────

type Product      = (typeof initialProducts)[number];
type StockMovement = (typeof initialMovements)[number];
type SortKey      = "name" | "stock" | "unitPrice" | "stockValue" | "leadTime";
type SortDir      = "asc" | "desc";

const statusColors: Record<StockStatus, string> = {
  ok:  "bg-emerald-100 text-emerald-700",
  low: "bg-amber-100 text-amber-700",
  out: "bg-red-100 text-red-700",
};
const statusLabels: Record<StockStatus, string> = {
  ok: "In Stock", low: "Low Stock", out: "Out of Stock",
};
const movementColors: Record<StockMovementType, string> = {
  receive:    "text-emerald-600",
  issue:      "text-red-500",
  adjustment: "text-amber-600",
  return:     "text-blue-600",
};
const movementIcons: Record<StockMovementType, React.ReactNode> = {
  receive:    <ArrowUpCircle  size={14} />,
  issue:      <ArrowDownCircle size={14} />,
  adjustment: <RefreshCw size={14} />,
  return:     <RotateCcw size={14} />,
};

function deriveStatus(stock: number, minStock: number): StockStatus {
  if (stock === 0) return "out";
  if (stock < minStock) return "low";
  return "ok";
}

// ── Form shape ────────────────────────────────────────────────────────

const emptyForm = {
  name: "", category: PRODUCT_CATEGORIES[0] as string,
  unitPrice: 0, stock: 0, minStock: 0,
  description: "", barcode: "", supplierId: "",
  size: "", leadTime: 0, brand: "",
};

// ── Add / Edit Modal ──────────────────────────────────────────────────

interface AddEditModalProps {
  initial?: Partial<typeof emptyForm>;
  editId: string | null;
  onClose: () => void;
  onSave: (data: typeof emptyForm, id: string | null) => void;
  nextSku: string;
  brandSuggestions: string[];
}

function AddEditModal({ initial, editId, onClose, onSave, nextSku, brandSuggestions }: AddEditModalProps) {
  const [form, setForm] = useState({ ...emptyForm, ...initial });
  const [apiCategories, setApiCategories] = useState<string[]>([]);
  const set = <K extends keyof typeof emptyForm>(k: K, v: (typeof emptyForm)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    fetch("/api/settings/product-categories")
      .then((r) => r.ok ? r.json() : [])
      .then((data: { name: string }[]) => {
        if (Array.isArray(data) && data.length > 0) {
          const names = data.map((c) => c.name);
          setApiCategories(names);
          setForm((f) => ({ ...f, category: f.category || names[0] }));
        }
      })
      .catch(() => {});
  }, []);

  const valid = form.name.trim() && form.unitPrice > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40">
      <div className="flex min-h-full items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{editId ? "Edit Product" : "Add New Product"}</h2>
            {!editId && <p className="text-xs text-slate-400 mt-0.5">New SKU: <span className="font-mono font-medium text-blue-600">{nextSku}</span></p>}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Product Name *</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)}
              placeholder='e.g. Industrial Valve 4"'
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* Category + Brand */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Category *</label>
              <select value={form.category} onChange={(e) => set("category", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                {(apiCategories.length > 0 ? apiCategories : PRODUCT_CATEGORIES as readonly string[]).map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Brand</label>
              <input value={form.brand} onChange={(e) => set("brand", e.target.value)}
                list="brand-suggestions" placeholder="e.g. Siemens, ABB, 3M"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <datalist id="brand-suggestions">
                {brandSuggestions.map((b) => <option key={b} value={b} />)}
              </datalist>
            </div>
          </div>

          {/* Size + Lead time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Size / Specification</label>
              <input value={form.size} onChange={(e) => set("size", e.target.value)}
                placeholder='e.g. 2", M/L, 6205, 10kW'
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <p className="text-xs text-slate-400 mt-1">Dimension, spec, or model code</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Lead Time (days)</label>
              <input type="number" min="0" value={form.leadTime || ""}
                onChange={(e) => set("leadTime", parseInt(e.target.value) || 0)}
                placeholder="0"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <p className="text-xs text-slate-400 mt-1">Days from order to delivery</p>
            </div>
          </div>

          {/* Price + Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Unit Price (THB) *</label>
              <input type="number" min="0" value={form.unitPrice || ""}
                onChange={(e) => set("unitPrice", parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Reorder Point (Min Stock)</label>
              <input type="number" min="0" value={form.minStock || ""}
                onChange={(e) => set("minStock", parseInt(e.target.value) || 0)}
                placeholder="0"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {/* Opening stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Opening Stock</label>
              <input type="number" min="0" value={form.stock || ""}
                onChange={(e) => set("stock", parseInt(e.target.value) || 0)}
                placeholder="0"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <p className="text-xs text-slate-400 mt-1">Current quantity on hand</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Barcode / Part No.</label>
              <input value={form.barcode} onChange={(e) => set("barcode", e.target.value)}
                placeholder="e.g. 8850001000010"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {/* Supplier */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Default Supplier</label>
            <select value={form.supplierId} onChange={(e) => set("supplierId", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">— None —</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
            <textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)}
              placeholder="Product specifications, dimensions, ratings, use cases..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          {form.unitPrice > 0 && form.stock > 0 && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
              <span className="text-sm text-blue-700 font-medium">Opening Stock Value</span>
              <span className="text-lg font-bold text-blue-800">{formatCurrency(form.unitPrice * form.stock)}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
          <button onClick={() => onSave(form, editId)} disabled={!valid}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed">
            {editId ? "Save Changes" : "Add Product"}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}

// ── Stock Adjustment Modal ────────────────────────────────────────────

interface AdjustModalProps {
  product: Product;
  onClose: () => void;
  onConfirm: (type: StockMovementType, qty: number, refNo: string, note: string) => void;
}

function AdjustModal({ product, onClose, onConfirm }: AdjustModalProps) {
  const [type, setType] = useState<StockMovementType>("receive");
  const [qty, setQty]   = useState(0);
  const [refNo, setRefNo] = useState("");
  const [note, setNote]   = useState("");

  const newStock = type === "issue" ? product.stock - qty : product.stock + qty;
  const valid    = qty > 0 && (type !== "issue" || qty <= product.stock);

  const typeConfig: Record<StockMovementType, { label: string; color: string; hint: string }> = {
    receive:    { label:"Receive Stock",   color:"emerald", hint:"Adding stock from supplier / purchase order" },
    issue:      { label:"Issue / Sell",    color:"red",     hint:"Removing stock for order or consumption" },
    adjustment: { label:"Adjustment",      color:"amber",   hint:"Correct stock count after physical count" },
    return:     { label:"Return / Refund", color:"blue",    hint:"Stock returned from customer or site" },
  };
  const typeKeys = Object.keys(typeConfig) as StockMovementType[];

  return (
    <div className="fixed inset-0 h-screen z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Adjust Stock</h2>
            <p className="text-xs text-slate-400 mt-0.5">{product.name} · Current: <span className="font-semibold text-slate-700">{product.stock} units</span></p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Movement Type</label>
            <div className="grid grid-cols-2 gap-2">
              {typeKeys.map((t) => (
                <button key={t} onClick={() => setType(t)}
                  className={cn("px-3 py-2.5 text-sm font-medium rounded-lg border-2 transition-all text-left",
                    type === t
                      ? typeConfig[t].color === "emerald" ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : typeConfig[t].color === "red"     ? "border-red-500 bg-red-50 text-red-700"
                      : typeConfig[t].color === "amber"   ? "border-amber-500 bg-amber-50 text-amber-700"
                      : "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  )}>
                  <span className="flex items-center gap-1.5">{movementIcons[t]} {typeConfig[t].label}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-2">{typeConfig[type].hint}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Quantity *</label>
            <input type="number" min="1" value={qty || ""} onChange={(e) => setQty(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {type === "issue" && qty > product.stock && (
              <p className="text-xs text-red-500 mt-1">Cannot issue more than current stock ({product.stock})</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Reference No.</label>
            <input value={refNo} onChange={(e) => setRefNo(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. PO-006 / SO-008 / ADJ-002" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
            <input value={note} onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Reason for adjustment..." />
          </div>
          {qty > 0 && valid && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex justify-between text-sm"><span className="text-slate-500">Current</span><span className="font-semibold">{product.stock}</span></div>
              <div className="flex justify-between text-sm mt-1"><span className={movementColors[type]}>{type === "issue" ? "− Issued" : "+ Added"}</span><span className={cn("font-semibold", movementColors[type])}>{type === "issue" ? `−${qty}` : `+${qty}`}</span></div>
              <div className="border-t border-slate-200 mt-2 pt-2 flex justify-between text-sm font-bold">
                <span className="text-slate-700">New Stock</span>
                <span className={cn(newStock <= 0 ? "text-red-600" : newStock < product.minStock ? "text-amber-600" : "text-emerald-600")}>
                  {Math.max(0, newStock)}
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
          <button onClick={() => onConfirm(type, qty, refNo, note)} disabled={!valid}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Product Detail Modal ──────────────────────────────────────────────

interface DetailModalProps {
  product: Product;
  movements: StockMovement[];
  onClose: () => void;
  onEdit: () => void;
  onAdjust: () => void;
}

function DetailModal({ product, movements, onClose, onEdit, onAdjust }: DetailModalProps) {
  const myMovements = movements.filter((m) => m.productId === product.id).sort((a, b) => b.date.localeCompare(a.date));
  const supplier    = suppliers.find((s) => s.id === product.supplierId);
  const stockPct    = product.minStock > 0 ? Math.min(100, (product.stock / (product.minStock * 3)) * 100) : product.stock > 0 ? 100 : 0;
  const anyProduct = product as Record<string, unknown>;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40">
      <div className="flex min-h-full items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><Package size={20} className="text-blue-600" /></div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">{product.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-slate-400 font-mono">{product.id}</p>
                {(product as any).brand && <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{(product as any).brand}</span>}
                {(product as any).size && <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-mono">{(product as any).size}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onAdjust} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50"><RefreshCw size={13} /> Adjust</button>
            <button onClick={onEdit} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Pencil size={13} /> Edit</button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 ml-1"><X size={16} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-3 gap-6">
          <div className="col-span-1 space-y-4">
            <div className="bg-slate-50 rounded-xl p-4 space-y-3 text-sm">
              <div><p className="text-xs text-slate-400">Category</p><p className="font-medium text-slate-800">{product.category}</p></div>
              <div><p className="text-xs text-slate-400">Unit Price</p><p className="font-bold text-slate-900 text-base">{formatCurrency(product.unitPrice)}</p></div>
              {(product as any).size && <div><p className="text-xs text-slate-400">Size / Spec</p><p className="font-mono text-sm text-slate-700">{(product as any).size}</p></div>}
              {(product as any).leadTime !== undefined && (product as any).leadTime > 0 && (
                <div className="flex items-center gap-1.5"><Clock size={12} className="text-slate-400" /><div><p className="text-xs text-slate-400">Lead Time</p><p className="font-medium text-slate-800">{(product as any).leadTime} days</p></div></div>
              )}
              <div><p className="text-xs text-slate-400">Barcode</p><p className="font-mono text-xs text-slate-700">{product.barcode || "—"}</p></div>
              <div><p className="text-xs text-slate-400">Supplier</p><p className="font-medium text-slate-800">{supplier?.name ?? "—"}</p></div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-1">Stock Level</p>
              <div className="flex items-baseline gap-1.5 mb-2">
                <span className="text-3xl font-bold text-slate-900">{product.stock}</span>
                <span className="text-sm text-slate-400">/ min {product.minStock}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div className={cn("h-3 rounded-full", product.status === "ok" ? "bg-emerald-500" : product.status === "low" ? "bg-amber-400" : "bg-red-400")}
                  style={{ width: `${stockPct}%` }} />
              </div>
              <div className="flex justify-between mt-2">
                <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", statusColors[product.status])}>{statusLabels[product.status]}</span>
                <span className="text-xs text-slate-400">{formatCurrency(product.stock * product.unitPrice)}</span>
              </div>
            </div>

            {product.description && (
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <p className="text-xs text-slate-400 mb-1">Description</p>
                <p className="text-sm text-slate-700 leading-relaxed">{product.description}</p>
              </div>
            )}
          </div>

          <div className="col-span-2 space-y-6">
            {/* Purchase Orders for this product */}
            {(() => {
              const myPOLines = poLineItems.filter((l) => l.productId === product.id);
              if (myPOLines.length === 0) return null;
              return (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-sm font-semibold text-slate-700">Purchase Orders</h3>
                    <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{myPOLines.length}</span>
                  </div>
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="text-left px-3 py-2.5 font-semibold text-slate-500">PO #</th>
                          <th className="text-left px-3 py-2.5 font-semibold text-slate-500">Supplier</th>
                          <th className="text-left px-3 py-2.5 font-semibold text-slate-500">Date</th>
                          <th className="text-right px-3 py-2.5 font-semibold text-slate-500">Qty</th>
                          <th className="text-right px-3 py-2.5 font-semibold text-slate-500">Unit Cost</th>
                          <th className="text-left px-3 py-2.5 font-semibold text-slate-500">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {myPOLines.map((pl) => {
                          const po = purchaseOrders.find((p) => p.id === pl.poId);
                          if (!po) return null;
                          return (
                            <tr key={pl.id} className="hover:bg-slate-50">
                              <td className="px-3 py-2 font-mono text-blue-600 font-semibold">{po.id}</td>
                              <td className="px-3 py-2 text-slate-700">{po.supplier}</td>
                              <td className="px-3 py-2 text-slate-500">{po.date}</td>
                              <td className="px-3 py-2 text-right font-semibold text-slate-800">{pl.qty}</td>
                              <td className="px-3 py-2 text-right text-slate-700">{formatCurrency(pl.unitPrice)}</td>
                              <td className="px-3 py-2">
                                <span className={cn("px-1.5 py-0.5 rounded-full font-medium capitalize",
                                  po.status === "received"   ? "bg-emerald-100 text-emerald-700" :
                                  po.status === "in-transit" ? "bg-blue-100 text-blue-700" :
                                  po.status === "pending"    ? "bg-amber-100 text-amber-700" :
                                  "bg-slate-100 text-slate-500"
                                )}>{po.status}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

            <div>
            <div className="flex items-center gap-2 mb-3"><BarChart2 size={15} className="text-slate-400" /><h3 className="text-sm font-semibold text-slate-700">Stock Movement History</h3></div>
            {myMovements.length === 0 ? (
              <div className="text-center py-10 text-sm text-slate-400">No movements recorded yet.</div>
            ) : (
              <div className="space-y-2">
                {myMovements.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      m.type === "receive" ? "bg-emerald-100 text-emerald-600" : m.type === "issue" ? "bg-red-100 text-red-600" : m.type === "return" ? "bg-blue-100 text-blue-600" : "bg-amber-100 text-amber-600")}>
                      {movementIcons[m.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-700 capitalize">{m.type}</span>
                        {m.refNo && <span className="text-xs font-mono text-blue-600">{m.refNo}</span>}
                      </div>
                      <p className="text-xs text-slate-400 truncate">{m.note || "—"}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={cn("text-sm font-bold", movementColors[m.type])}>{m.type === "issue" ? `−${m.qty}` : `+${Math.abs(m.qty)}`}</p>
                      <p className="text-xs text-slate-400">→ {m.balanceAfter}</p>
                    </div>
                    <div className="text-right shrink-0 w-20">
                      <p className="text-xs text-slate-400">{m.date}</p>
                      <p className="text-xs text-slate-300">{m.processedBy}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

// ── Sort header button ────────────────────────────────────────────────

function SortTh({ label, col, sort, onSort }: { label: string; col: SortKey; sort: { key: SortKey; dir: SortDir }; onSort: (k: SortKey) => void }) {
  const active = sort.key === col;
  return (
    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer select-none hover:text-slate-700"
      onClick={() => onSort(col)}>
      <span className="flex items-center gap-1">
        {label}
        {active ? (sort.dir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ChevronDown size={12} className="opacity-20" />}
      </span>
    </th>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────

export default function ProductsPage() {
  const { can } = usePermissions();
  const [list, setList]       = useState<Product[]>(initialProducts as Product[]);
  const [movements, setMovements] = useState<StockMovement[]>(initialMovements as StockMovement[]);
  const [search, setSearch]   = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [brandFilter, setBrandFilter]       = useState("all");
  const [statusFilter, setStatusFilter]     = useState<"all" | StockStatus>("all");
  const [sort, setSort]       = useState<{ key: SortKey; dir: SortDir }>({ key: "name", dir: "asc" });
  const [showAddEdit, setShowAddEdit] = useState(false);
  const [editId, setEditId]   = useState<string | null>(null);
  const [viewId, setViewId]   = useState<string | null>(null);
  const [adjustId, setAdjustId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Column visibility based on role permissions
  const [colVis, setColVis] = useState({ price: true, stockValue: true, leadTime: true });

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.ok ? r.json() : null),
      fetch("/api/settings/role-permissions").then((r) => r.ok ? r.json() : null),
    ]).then((results) => {
      const me = results[0];
      const rp = results[1];
      if (!me?.role || !rp?.permissions) return;
      const p = rp.permissions[me.role] ?? {};
      setColVis({
        price:      p.col_prod_price?.view   ?? true,
        stockValue: p.col_prod_stk_val?.view ?? true,
        leadTime:   p.col_prod_lead?.view    ?? true,
      });
    }).catch(() => {});
  }, []);

  const toggleSort = (key: SortKey) => setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }));

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let res = list.filter((p) => {
      const matchQ      = !q || p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || (p.barcode?.includes(q));
      const matchCat    = categoryFilter === "all" || p.category === categoryFilter;
      const matchBrand  = brandFilter === "all" || (p as any).brand === brandFilter;
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      return matchQ && matchCat && matchBrand && matchStatus;
    });
    res = [...res].sort((a, b) => {
      let av: string | number, bv: string | number;
      switch (sort.key) {
        case "name":       av = a.name;       bv = b.name;       break;
        case "stock":      av = a.stock;      bv = b.stock;      break;
        case "unitPrice":  av = a.unitPrice;  bv = b.unitPrice;  break;
        case "stockValue": av = a.stock * a.unitPrice; bv = b.stock * b.unitPrice; break;
        case "leadTime":   av = (a as any).leadTime ?? 0; bv = (b as any).leadTime ?? 0; break;
        default: return 0;
      }
      return sort.dir === "asc" ? (av < bv ? -1 : av > bv ? 1 : 0) : (av > bv ? -1 : av < bv ? 1 : 0);
    });
    return res;
  }, [list, search, categoryFilter, brandFilter, statusFilter, sort]);

  const totalValue = useMemo(() => list.reduce((s, p) => s + p.stock * p.unitPrice, 0), [list]);
  const nextSku    = `SKU-${String(list.length + 1).padStart(3, "0")}`;
  const categories = ["all", ...Array.from(new Set(list.map((p) => p.category)))];
  const allBrands  = ["all", ...Array.from(new Set(list.map((p) => (p as any).brand).filter(Boolean)))];

  const openEdit = (id: string) => { setEditId(id); setShowAddEdit(true); };

  const handleSave = (data: typeof emptyForm, id: string | null) => {
    const status = deriveStatus(data.stock, data.minStock);
    if (id) {
      setList((prev) => prev.map((p) => p.id === id ? { ...p, ...data, status } : p));
    } else {
      const today = new Date().toISOString().split("T")[0];
      const newProduct: Product = { id: nextSku, ...data, status } as unknown as Product;
      setList((prev) => [...prev, newProduct]);
      if (data.stock > 0) {
        const m: StockMovement = {
          id: `SM-${String(movements.length + 1).padStart(3, "0")}`,
          productId: nextSku, type: "receive", qty: data.stock,
          refNo: "OPEN", date: today, note: "Opening stock",
          processedBy: "Admin", balanceAfter: data.stock,
        };
        setMovements((prev) => [...prev, m]);
      }
    }
    setShowAddEdit(false); setEditId(null);
  };

  const handleAdjust = (productId: string, type: StockMovementType, qty: number, refNo: string, note: string) => {
    const today = new Date().toISOString().split("T")[0];
    setList((prev) => prev.map((p) => {
      if (p.id !== productId) return p;
      const ns = type === "issue" ? Math.max(0, p.stock - qty) : Math.max(0, p.stock + qty);
      return { ...p, stock: ns, status: deriveStatus(ns, p.minStock) };
    }));
    const product  = list.find((p) => p.id === productId)!;
    const newStock = type === "issue" ? Math.max(0, product.stock - qty) : Math.max(0, product.stock + qty);
    setMovements((prev) => [...prev, {
      id: `SM-${String(movements.length + 1).padStart(3, "0")}`,
      productId, type, qty: type === "issue" ? -qty : qty,
      refNo: refNo || "MANUAL", date: today, note: note || "",
      processedBy: "Admin", balanceAfter: newStock,
    }]);
    setAdjustId(null);
  };

  const handleDelete = (id: string) => {
    setList((prev) => prev.filter((p) => p.id !== id));
    setDeleteId(null);
    if (viewId === id) setViewId(null);
  };

  const editProduct   = editId   ? list.find((p) => p.id === editId)   : null;
  const viewProduct   = viewId   ? list.find((p) => p.id === viewId)   : null;
  const adjustProduct = adjustId ? list.find((p) => p.id === adjustId) : null;

  return (
    <div>
      <Header
        title="Products"
        subtitle={`${list.length} products · Total inventory value ${formatCurrency(totalValue)}`}
        actions={can("inv_products", "create") ? (
          <button onClick={() => { setEditId(null); setShowAddEdit(true); }}
            className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 font-medium">
            <Plus size={16} /> Add Product
          </button>
        ) : undefined}
      />

      <div className="p-6 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label:"Total Products",  value:list.length,                                    icon:Layers,        color:"blue",    sub:"SKUs in catalog" },
            { label:"Inventory Value", value:formatCurrency(totalValue),                      icon:BarChart2,     color:"emerald", sub:"At current unit prices" },
            { label:"Low Stock",       value:list.filter((p) => p.status === "low").length,  icon:AlertTriangle, color:"amber",   sub:"Below reorder point" },
            { label:"Out of Stock",    value:list.filter((p) => p.status === "out").length,  icon:TrendingDown,  color:"red",     sub:"Zero quantity on hand" },
          ].map(({ label, value, icon: Icon, color, sub }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-500 font-medium">{label}</p>
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center",
                  color === "blue"    && "bg-blue-100 text-blue-600",
                  color === "emerald" && "bg-emerald-100 text-emerald-600",
                  color === "amber"   && "bg-amber-100 text-amber-600",
                  color === "red"     && "bg-red-100 text-red-600")}>
                  <Icon size={18} />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              <p className="text-xs text-slate-400 mt-1">{sub}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, SKU, barcode..."
              className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">All Categories</option>
            {categories.filter((c) => c !== "all").map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">All Brands</option>
            {allBrands.filter((b) => b !== "all").map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            {(["all","ok","low","out"] as const).map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={cn("px-3 py-1 text-xs font-medium rounded-md transition-colors",
                  statusFilter === s ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
                {s === "all" ? "All" : statusLabels[s]}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 ml-auto">{filtered.length} of {list.length}</p>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">SKU</th>
                  <SortTh label="Product" col="name" sort={sort} onSort={toggleSort} />
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Brand / Size</th>
                  <SortTh label="Stock"      col="stock"      sort={sort} onSort={toggleSort} />
                  {colVis.price      && <SortTh label="Unit Price" col="unitPrice"  sort={sort} onSort={toggleSort} />}
                  {colVis.stockValue && <SortTh label="Stock Value" col="stockValue" sort={sort} onSort={toggleSort} />}
                  {colVis.leadTime   && <SortTh label="Lead Time"  col="leadTime"   sort={sort} onSort={toggleSort} />}
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((p) => {
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-5 py-3 font-mono text-xs text-slate-500 font-medium">{p.id}</td>
                      <td className="px-5 py-3">
                        <button onClick={() => setViewId(p.id)} className="text-left">
                          <p className="font-medium text-slate-800 group-hover:text-blue-600 transition-colors">{p.name}</p>
                          {p.barcode && <p className="text-xs text-slate-400 font-mono">{p.barcode}</p>}
                        </button>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-xs font-medium text-slate-600">{(p as any).brand || "—"}</p>
                        {(p as any).size && <p className="text-xs text-slate-400 font-mono">{(p as any).size}</p>}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className={cn("font-semibold", p.status === "out" ? "text-red-600" : p.status === "low" ? "text-amber-600" : "text-slate-900")}>
                          {formatNumber(p.stock)}
                        </span>
                        <span className="text-slate-400 text-xs ml-1">/ {p.minStock}</span>
                      </td>
                      {colVis.price      && <td className="px-5 py-3 text-right text-slate-700">{formatCurrency(p.unitPrice)}</td>}
                      {colVis.stockValue && <td className="px-5 py-3 text-right font-semibold text-slate-900">{formatCurrency(p.stock * p.unitPrice)}</td>}
                      {colVis.leadTime   && <td className="px-5 py-3 text-right text-slate-500 text-xs">{(p as any).leadTime ? `${(p as any).leadTime}d` : "—"}</td>}
                      <td className="px-5 py-3">
                        <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium", statusColors[p.status])}>{statusLabels[p.status]}</span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setViewId(p.id)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600"><Eye size={14} /></button>
                          {can("inv_products", "edit") && <button onClick={() => setAdjustId(p.id)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-emerald-600"><RefreshCw size={14} /></button>}
                          {can("inv_products", "edit") && <button onClick={() => openEdit(p.id)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"><Pencil size={14} /></button>}
                          {can("inv_products", "edit") && <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t border-slate-200">
                  <td colSpan={4} className="px-5 py-3 text-sm font-semibold text-slate-700">Total ({filtered.length} shown)</td>
                  {colVis.price && <td />}
                  {colVis.stockValue
                    ? <td className="px-5 py-3 text-right font-bold text-slate-900">{formatCurrency(filtered.reduce((s, p) => s + p.stock * p.unitPrice, 0))}</td>
                    : null}
                  {colVis.leadTime && <td />}
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-16 text-center"><Package size={32} className="mx-auto text-slate-300 mb-3" /><p className="text-sm text-slate-400">No products match your filters.</p></div>
          )}
        </div>
      </div>

      {showAddEdit && (
        <AddEditModal editId={editId} nextSku={nextSku}
          brandSuggestions={allBrands.filter((b) => b !== "all")}
          initial={editProduct ? {
            name: editProduct.name, category: editProduct.category,
            unitPrice: editProduct.unitPrice, stock: editProduct.stock,
            minStock: editProduct.minStock, description: editProduct.description,
            barcode: editProduct.barcode, supplierId: editProduct.supplierId,
            size: (editProduct as any).size ?? "",
            leadTime: (editProduct as any).leadTime ?? 0,
            brand: (editProduct as any).brand ?? "",
          } : undefined}
          onClose={() => { setShowAddEdit(false); setEditId(null); }}
          onSave={handleSave}
        />
      )}
      {viewProduct && (
        <DetailModal product={viewProduct} movements={movements}
          onClose={() => setViewId(null)}
          onEdit={() => { setViewId(null); openEdit(viewProduct.id); }}
          onAdjust={() => { setViewId(null); setAdjustId(viewProduct.id); }}
        />
      )}
      {adjustProduct && (
        <AdjustModal product={adjustProduct} onClose={() => setAdjustId(null)}
          onConfirm={(type, qty, refNo, note) => handleAdjust(adjustProduct.id, type, qty, refNo, note)}
        />
      )}
      {deleteId && (
        <div className="fixed inset-0 h-screen z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><Trash2 size={22} className="text-red-600" /></div>
            <h2 className="text-base font-semibold text-slate-900 mb-1">Delete Product</h2>
            <p className="text-sm text-slate-500 mb-2">{list.find((p) => p.id === deleteId)?.name}</p>
            <p className="text-xs text-slate-400 mb-6">This will permanently remove the product and cannot be undone.</p>
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
