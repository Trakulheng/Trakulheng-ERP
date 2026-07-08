"use client";

import { useState, useMemo } from "react";
import { usePermissions } from "@/lib/use-permissions";
import { Header } from "@/components/layout/Header";
import {
  invoices as initialInvoices,
  invoiceItems as initialItems,
  customers, branches, employees,
  InvoiceStatus, INVOICE_PAYMENT_TERMS,
} from "@/lib/mock-data";
import { cn, formatCurrency } from "@/lib/utils";
import {
  Plus, Download, Search, Eye, Pencil, Trash2, X, FileText,
  CheckCircle2, Clock, XCircle, AlertTriangle, DollarSign,
  ArrowRight, ChevronRight, Package, User,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────

type Invoice = (typeof initialInvoices)[number];
type InvItem = (typeof initialItems)[number];

interface DraftItem {
  tempId: string;
  description: string;
  qty: number;
  unitPrice: number;
}

const statusConfig: Record<InvoiceStatus, { label: string; color: string; icon: React.ReactNode }> = {
  draft:     { label:"Draft",     color:"bg-slate-100 text-slate-500",    icon:<FileText size={12} /> },
  sent:      { label:"Sent",      color:"bg-blue-100 text-blue-700",      icon:<Clock size={12} /> },
  paid:      { label:"Paid",      color:"bg-emerald-100 text-emerald-700",icon:<CheckCircle2 size={12} /> },
  overdue:   { label:"Overdue",   color:"bg-red-100 text-red-700",        icon:<AlertTriangle size={12} /> },
  cancelled: { label:"Cancelled", color:"bg-slate-100 text-slate-400",    icon:<XCircle size={12} /> },
};

// ── New Invoice Modal ─────────────────────────────────────────────────

interface NewInvoiceModalProps {
  nextId: string;
  onClose: () => void;
  onSave: (inv: Invoice, items: InvItem[]) => void;
}

function NewInvoiceModal({ nextId, onClose, onSave }: NewInvoiceModalProps) {
  const [step, setStep]           = useState<1 | 2>(1);
  const [customerId, setCustomerId] = useState(customers[0].id);
  const [branchId, setBranchId]   = useState(branches[0].id);
  const [date, setDate]           = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate]     = useState("");
  const [paymentTerms, setPaymentTerms] = useState<string>(INVOICE_PAYMENT_TERMS[2]);
  const [discount, setDiscount]   = useState(0);
  const [notes, setNotes]         = useState("");
  const [lines, setLines]         = useState<DraftItem[]>([]);
  const [lineDesc, setLineDesc]   = useState("");
  const [lineQty, setLineQty]     = useState(1);
  const [linePrice, setLinePrice] = useState(0);

  const customer  = customers.find((c) => c.id === customerId)!;
  const subtotal  = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
  const taxAmt    = Math.round(subtotal * 0.07);
  const total     = subtotal + taxAmt - discount;

  const addLine = () => {
    if (!lineDesc.trim() || lineQty < 1 || linePrice <= 0) return;
    setLines((p) => [...p, { tempId: `tmp-${Date.now()}`, description: lineDesc, qty: lineQty, unitPrice: linePrice }]);
    setLineDesc(""); setLineQty(1); setLinePrice(0);
  };

  const handleSubmit = () => {
    const newInv: Invoice = {
      id: nextId, customerId, customer: customer.name, branchId,
      date, dueDate: dueDate || "N/A",
      amount: total, tax: taxAmt, discount,
      status: "sent" as InvoiceStatus,
      paymentTerms, notes, paidDate: null, createdBy: "",
    };
    const newItems: InvItem[] = lines.map((l, i) => ({
      id: `IVI-NEW-${i}`, invoiceId: nextId,
      productId: "", description: l.description,
      qty: l.qty, unitPrice: l.unitPrice, total: l.qty * l.unitPrice,
    }));
    onSave(newInv, newItems);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-base font-semibold text-slate-900">New Invoice</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              <span className="font-mono font-medium text-blue-600">{nextId}</span>
              {" · "}Step {step} of 2
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-3 px-6 py-3 bg-slate-50 border-b border-slate-100">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                step >= s ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500")}>{s}</div>
              <span className={cn("text-xs font-medium", step >= s ? "text-blue-700" : "text-slate-400")}>
                {s === 1 ? "Invoice Details" : "Line Items"}
              </span>
              {s < 2 && <ArrowRight size={12} className="text-slate-300" />}
            </div>
          ))}
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Customer *</label>
                <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {customers.filter((c) => c.status === "active").map((c) => (
                    <option key={c.id} value={c.id}>{c.name} — {c.contact}</option>
                  ))}
                </select>
                {customer && (
                  <div className="mt-2 p-3 bg-slate-50 rounded-lg text-xs text-slate-500 space-y-0.5">
                    <p>Contact: <span className="text-slate-700 font-medium">{customer.contact}</span></p>
                    <p>Email: <span className="text-slate-700">{customer.email}</span> · {customer.phone}</p>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Branch *</label>
                <select value={branchId} onChange={(e) => setBranchId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {branches.filter((b) => b.status === "active").map((b) => (
                    <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Invoice Date *</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Due Date</label>
                  <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Payment Terms</label>
                  <select value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {INVOICE_PAYMENT_TERMS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Discount (฿)</label>
                  <input type="number" min="0" value={discount || ""}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
                <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Payment instructions, delivery notes..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              {/* Add line */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Add Line Item</p>
                <div className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    <label className="block text-xs text-slate-500 mb-1">Description *</label>
                    <input value={lineDesc} onChange={(e) => setLineDesc(e.target.value)}
                      placeholder="Product / service description"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-slate-500 mb-1">Qty</label>
                    <input type="number" min="1" value={lineQty}
                      onChange={(e) => setLineQty(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs text-slate-500 mb-1">Unit Price (฿)</label>
                    <input type="number" min="0" value={linePrice || ""}
                      onChange={(e) => setLinePrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="col-span-2">
                    <button onClick={addLine} disabled={!lineDesc.trim() || lineQty < 1 || linePrice <= 0}
                      className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 font-medium">
                      + Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Lines */}
              {lines.length === 0 ? (
                <div className="text-center py-8 text-sm text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                  <Package size={28} className="mx-auto mb-2 text-slate-300" />
                  Add line items above.
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Description</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500">Qty</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500">Unit Price</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500">Subtotal</th>
                        <th className="px-4 py-2.5"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {lines.map((l) => (
                        <tr key={l.tempId}>
                          <td className="px-4 py-2.5 font-medium text-slate-800">{l.description}</td>
                          <td className="px-4 py-2.5 text-right">{l.qty}</td>
                          <td className="px-4 py-2.5 text-right">{formatCurrency(l.unitPrice)}</td>
                          <td className="px-4 py-2.5 text-right font-semibold">{formatCurrency(l.qty * l.unitPrice)}</td>
                          <td className="px-4 py-2.5 text-center">
                            <button onClick={() => setLines((p) => p.filter((x) => x.tempId !== l.tempId))} className="text-slate-300 hover:text-red-500"><X size={14} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t border-slate-200">
                      <tr className="bg-slate-50">
                        <td colSpan={3} className="px-4 py-2 text-xs text-right text-slate-500">Subtotal</td>
                        <td className="px-4 py-2 text-right text-sm font-semibold">{formatCurrency(subtotal)}</td><td />
                      </tr>
                      <tr className="bg-slate-50">
                        <td colSpan={3} className="px-4 py-1 text-xs text-right text-slate-500">VAT 7%</td>
                        <td className="px-4 py-1 text-right text-sm">{formatCurrency(taxAmt)}</td><td />
                      </tr>
                      {discount > 0 && (
                        <tr className="bg-slate-50">
                          <td colSpan={3} className="px-4 py-1 text-xs text-right text-emerald-600">Discount</td>
                          <td className="px-4 py-1 text-right text-sm text-emerald-600">−{formatCurrency(discount)}</td><td />
                        </tr>
                      )}
                      <tr className="bg-blue-50 border-t border-slate-200">
                        <td colSpan={3} className="px-4 py-2.5 text-sm font-bold text-right text-slate-700">Total</td>
                        <td className="px-4 py-2.5 text-right font-bold text-blue-700 text-base">{formatCurrency(total)}</td><td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 sticky bottom-0 bg-white">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
          <div className="flex gap-3">
            {step === 2 && <button onClick={() => setStep(1)} className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">← Back</button>}
            {step === 1 ? (
              <button onClick={() => setStep(2)} disabled={!customerId || !date}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40">
                Next: Line Items <ChevronRight size={14} />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={lines.length === 0}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-40">
                <FileText size={14} /> Create Invoice
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
  inv: Invoice;
  items: InvItem[];
  onClose: () => void;
  onMarkPaid: (id: string) => void;
  onCancel: (id: string) => void;
}

function DetailModal({ inv, items, onClose, onMarkPaid, onCancel }: DetailModalProps) {
  const myItems  = items.filter((i) => i.invoiceId === inv.id);
  const customer = customers.find((c) => c.id === inv.customerId);
  const branch   = branches.find((b) => b.id === inv.branchId);
  const cfg      = statusConfig[inv.status];
  const createdBy = employees.find((e) => e.id === inv.createdBy);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><FileText size={20} className="text-blue-600" /></div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900">{inv.id}</h2>
                <span className={cn("flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium", cfg.color)}>
                  {cfg.icon}{cfg.label}
                </span>
              </div>
              <p className="text-xs text-slate-400">{inv.customer} · {branch?.name ?? "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {inv.status === "sent" && (
              <button onClick={() => onMarkPaid(inv.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                <CheckCircle2 size={12} /> Mark as Paid
              </button>
            )}
            {(inv.status === "sent" || inv.status === "draft") && (
              <button onClick={() => onCancel(inv.id)}
                className="px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50">Cancel</button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 text-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1"><User size={11} /> Customer</p>
              <p className="font-semibold text-slate-800">{inv.customer}</p>
              {customer && <><p className="text-slate-500">{customer.contact}</p><p className="text-slate-500">{customer.email}</p><p className="text-slate-500">{customer.phone}</p></>}
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 text-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoice Info</p>
              <div className="flex justify-between"><span className="text-slate-500">Date</span><span className="font-medium">{inv.date}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Due Date</span><span className={cn("font-medium", inv.status === "overdue" ? "text-red-600" : "")}>{inv.dueDate}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Terms</span><span className="font-medium">{inv.paymentTerms}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Branch</span><span className="font-medium">{branch?.name ?? "—"}</span></div>
              {inv.paidDate && <div className="flex justify-between"><span className="text-slate-500">Paid</span><span className="font-medium text-emerald-600">{inv.paidDate}</span></div>}
              {createdBy && <div className="flex justify-between"><span className="text-slate-500">Created by</span><span className="font-medium">{createdBy.name}</span></div>}
            </div>
          </div>

          {inv.notes && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-700 mb-1">Notes</p>
              <p className="text-sm text-amber-800">{inv.notes}</p>
            </div>
          )}

          {/* Line items */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Line Items</p>
            {myItems.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">No line items.</p>
            ) : (
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Description</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">Qty</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">Unit Price</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {myItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-800">{item.description}</td>
                        <td className="px-4 py-3 text-right">{item.qty}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                        <td className="px-4 py-3 text-right font-semibold">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t border-slate-200">
                    <tr className="bg-slate-50">
                      <td colSpan={3} className="px-4 py-2 text-xs text-right text-slate-500">Subtotal</td>
                      <td className="px-4 py-2 text-right text-sm font-semibold">{formatCurrency(myItems.reduce((s, i) => s + i.total, 0))}</td>
                    </tr>
                    {inv.tax > 0 && (
                      <tr className="bg-slate-50">
                        <td colSpan={3} className="px-4 py-1 text-xs text-right text-slate-500">VAT 7%</td>
                        <td className="px-4 py-1 text-right text-sm">{formatCurrency(inv.tax)}</td>
                      </tr>
                    )}
                    {inv.discount > 0 && (
                      <tr className="bg-slate-50">
                        <td colSpan={3} className="px-4 py-1 text-xs text-right text-emerald-600">Discount</td>
                        <td className="px-4 py-1 text-right text-sm text-emerald-600">−{formatCurrency(inv.discount)}</td>
                      </tr>
                    )}
                    <tr className="bg-blue-50 border-t border-slate-200">
                      <td colSpan={3} className="px-4 py-3 font-bold text-right text-slate-700">Total</td>
                      <td className="px-4 py-3 text-right font-bold text-blue-700 text-base">{formatCurrency(inv.amount)}</td>
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

// ── Main Page ─────────────────────────────────────────────────────────

export default function InvoicesPage() {
  const { can } = usePermissions();
  const [list,     setList]     = useState<Invoice[]>(initialInvoices as Invoice[]);
  const [items,    setItems]    = useState<InvItem[]>(initialItems as InvItem[]);
  const [search,   setSearch]   = useState("");
  const [statusF,  setStatusF]  = useState<"all" | InvoiceStatus>("all");
  const [showNew,  setShowNew]  = useState(false);
  const [viewId,   setViewId]   = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const nextId = `INV-${String(list.length + 1).padStart(3, "0")}`;

  const filtered = useMemo(() => list.filter((inv) => {
    const q = search.toLowerCase();
    const matchQ = !q || inv.id.toLowerCase().includes(q) || inv.customer.toLowerCase().includes(q);
    const matchS = statusF === "all" || inv.status === statusF;
    return matchQ && matchS;
  }), [list, search, statusF]);

  const totals = useMemo(() => ({
    all:     list.reduce((s, i) => s + i.amount, 0),
    paid:    list.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0),
    sent:    list.filter((i) => i.status === "sent").reduce((s, i) => s + i.amount, 0),
    overdue: list.filter((i) => i.status === "overdue").reduce((s, i) => s + i.amount, 0),
  }), [list]);

  const handleSave = (inv: Invoice, newItems: InvItem[]) => {
    setList((p) => [inv, ...p]);
    setItems((p) => [...p, ...newItems]);
    setShowNew(false);
  };

  const handleMarkPaid = (id: string) => {
    const today = new Date().toISOString().split("T")[0];
    setList((p) => p.map((inv) => inv.id === id ? { ...inv, status: "paid" as InvoiceStatus, paidDate: today } : inv));
    setViewId(null);
  };

  const handleCancel = (id: string) => {
    setList((p) => p.map((inv) => inv.id === id ? { ...inv, status: "cancelled" as InvoiceStatus } : inv));
    setViewId(null);
  };

  const handleDelete = (id: string) => {
    setList((p) => p.filter((inv) => inv.id !== id));
    setItems((p) => p.filter((i) => i.invoiceId !== id));
    setDeleteId(null);
    if (viewId === id) setViewId(null);
  };

  const viewInv = viewId ? list.find((i) => i.id === viewId) : null;

  return (
    <div>
      <Header
        title="Invoices"
        subtitle={`${list.length} invoices · Total ${formatCurrency(totals.all)}`}
        actions={
          <div className="flex gap-2">
            <button className="flex items-center gap-2 text-sm text-slate-600 border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50">
              <Download size={14} /> Export
            </button>
            {can("finance_invoices", "create") && (
              <button onClick={() => setShowNew(true)}
                className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 font-medium">
                <Plus size={16} /> New Invoice
              </button>
            )}
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label:"Total Invoiced", value:totals.all,     color:"blue",    icon:<DollarSign size={18} /> },
            { label:"Paid",           value:totals.paid,    color:"emerald", icon:<CheckCircle2 size={18} /> },
            { label:"Sent / Pending", value:totals.sent,    color:"blue",    icon:<Clock size={18} /> },
            { label:"Overdue",        value:totals.overdue, color:"red",     icon:<AlertTriangle size={18} /> },
          ].map(({ label, value, color, icon }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-500 font-medium">{label}</p>
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center",
                  color === "blue" && "bg-blue-100 text-blue-600",
                  color === "emerald" && "bg-emerald-100 text-emerald-600",
                  color === "red" && "bg-red-100 text-red-600")}>
                  {icon}
                </div>
              </div>
              <p className="text-xl font-bold text-slate-900">{formatCurrency(value)}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search invoice # or customer..."
              className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            {(["all","draft","sent","paid","overdue","cancelled"] as const).map((s) => (
              <button key={s} onClick={() => setStatusF(s)}
                className={cn("px-3 py-1 text-xs font-medium rounded-md transition-colors capitalize",
                  statusF === s ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
                {s === "all" ? "All" : statusConfig[s].label}
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
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Invoice #</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Customer</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Branch</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Due Date</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((inv) => {
                  const cfg    = statusConfig[inv.status];
                  const branch = branches.find((b) => b.id === inv.branchId);
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-5 py-3 font-mono text-blue-600 font-semibold text-xs">{inv.id}</td>
                      <td className="px-5 py-3 font-medium text-slate-800">{inv.customer}</td>
                      <td className="px-5 py-3 text-slate-500 text-xs">{branch?.code ?? "—"}</td>
                      <td className="px-5 py-3 text-slate-500 text-xs">{inv.date}</td>
                      <td className="px-5 py-3 text-xs">
                        <span className={cn(inv.status === "overdue" ? "text-red-600 font-medium" : "text-slate-500")}>{inv.dueDate}</span>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-slate-900">{formatCurrency(inv.amount)}</td>
                      <td className="px-5 py-3">
                        <span className={cn("flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium w-fit", cfg.color)}>
                          {cfg.icon}{cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setViewId(inv.id)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600"><Eye size={14} /></button>
                          {can("finance_invoices", "edit") && (
                            <button onClick={() => setDeleteId(inv.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-12 text-center"><FileText size={28} className="mx-auto text-slate-300 mb-2" /><p className="text-sm text-slate-400">No invoices found.</p></div>
          )}
        </div>
      </div>

      {showNew && <NewInvoiceModal nextId={nextId} onClose={() => setShowNew(false)} onSave={handleSave} />}

      {viewInv && (
        <DetailModal inv={viewInv} items={items}
          onClose={() => setViewId(null)}
          onMarkPaid={handleMarkPaid}
          onCancel={handleCancel}
        />
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><Trash2 size={22} className="text-red-600" /></div>
            <h2 className="text-base font-semibold text-slate-900 mb-1">Delete Invoice</h2>
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
