"use client";

import { useState, useMemo, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { suppliers as initialSuppliers, purchaseOrders, products, POStatus } from "@/lib/mock-data";
import { cn, formatCurrency } from "@/lib/utils";
import {
  Plus, Search, Eye, Pencil, Trash2, X, Star,
  Globe, Phone, Mail, Building2, Tag, CreditCard, FileText, Package,
  CheckCircle2, XCircle, UserPlus,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────

interface ContactPerson { name: string; email: string; phone: string; }

interface Supplier {
  id: string; name: string;
  contact: string; email: string; phone: string;
  contacts?: ContactPerson[];
  category: string; rating: number;
  address: string; country: string; paymentTerms: string;
  taxId: string; notes: string; status: "active" | "inactive";
}

type SupplierStatus = "active" | "inactive";

const FALLBACK_CATEGORIES = ["General","Equipment","Parts","Fittings","Mechanical","Electrical","Safety","Materials"] as const;
const COUNTRIES   = ["Thailand","Singapore","Hong Kong","Malaysia","Japan","China","Germany","USA"] as const;
const PAYMENT_TERMS = ["COD","Net 15","Net 30","Net 45","Net 60"] as const;

const categoryColors: Record<string, string> = {
  General:    "bg-slate-100 text-slate-600",
  Equipment:  "bg-blue-100 text-blue-700",
  Parts:      "bg-amber-100 text-amber-700",
  Fittings:   "bg-emerald-100 text-emerald-700",
  Mechanical: "bg-violet-100 text-violet-700",
  Electrical: "bg-yellow-100 text-yellow-700",
  Safety:     "bg-red-100 text-red-700",
  Materials:  "bg-orange-100 text-orange-700",
};

const poStatusConfig: Record<POStatus, { label: string; color: string }> = {
  pending:      { label: "Pending",     color: "bg-amber-100 text-amber-700" },
  "in-transit": { label: "In Transit",  color: "bg-blue-100 text-blue-700" },
  received:     { label: "Received",    color: "bg-emerald-100 text-emerald-700" },
  cancelled:    { label: "Cancelled",   color: "bg-red-100 text-red-700" },
};

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((n) => (
        <Star key={n} size={size} className={n <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"} />
      ))}
      <span className="ml-1 text-xs text-slate-500 font-medium">{rating.toFixed(1)}</span>
    </span>
  );
}

// ── Add/Edit Modal ────────────────────────────────────────────────────

interface SupplierModalProps {
  initial?: Supplier;
  nextId: string;
  apiCategories: string[];
  onClose: () => void;
  onSave: (s: Supplier) => void;
}

const EMPTY_CONTACT: ContactPerson = { name: "", email: "", phone: "" };

function SupplierModal({ initial, nextId, apiCategories, onClose, onSave }: SupplierModalProps) {
  const categories = apiCategories.length > 0 ? apiCategories : [...FALLBACK_CATEGORIES];

  const [form, setForm] = useState<Supplier>(initial ?? {
    id: nextId, name: "", contact: "", email: "", phone: "",
    category: categories[0] ?? "General", rating: 4.0,
    address: "", country: "Thailand", paymentTerms: "Net 30",
    taxId: "", notes: "", status: "active" as const,
    contacts: [{ ...EMPTY_CONTACT }],
  });

  // Sync contacts array from legacy contact/email/phone on init
  const [contacts, setContacts] = useState<ContactPerson[]>(() => {
    if (initial?.contacts && initial.contacts.length > 0) return initial.contacts;
    return [{ name: initial?.contact ?? "", email: initial?.email ?? "", phone: initial?.phone ?? "" }];
  });

  const set = (key: keyof Supplier, val: string | number) =>
    setForm((p) => ({ ...p, [key]: val }));

  const addContact = () => setContacts((prev) => [...prev, { ...EMPTY_CONTACT }]);
  const removeContact = (i: number) => setContacts((prev) => prev.filter((_, idx) => idx !== i));
  const updateContact = (i: number, field: keyof ContactPerson, val: string) =>
    setContacts((prev) => prev.map((c, idx) => idx === i ? { ...c, [field]: val } : c));

  const isEdit = !!initial;

  const handleSave = () => {
    const primary = contacts[0] ?? EMPTY_CONTACT;
    onSave({
      ...form,
      contact: primary.name,
      email:   primary.email,
      phone:   primary.phone,
      contacts,
    });
  };

  const canSave = form.name && contacts[0]?.name && contacts[0]?.email;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{isEdit ? "Edit Supplier" : "New Supplier"}</h2>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">{form.id}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Company Info */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Company Info</p>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Supplier Name *</label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)}
                placeholder="Company name"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Category *</label>
                <select value={form.category} onChange={(e) => set("category", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {categories.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Country</label>
                <select value={form.country} onChange={(e) => set("country", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Address</label>
              <input value={form.address} onChange={(e) => set("address", e.target.value)}
                placeholder="Full address"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Tax ID</label>
              <input value={form.taxId} onChange={(e) => set("taxId", e.target.value)}
                placeholder="Tax ID / VAT number"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {/* Contact Persons */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact Persons</p>
              <button
                type="button"
                onClick={addContact}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <UserPlus size={12} /> Add Contact
              </button>
            </div>

            {contacts.map((c, i) => (
              <div key={i} className="rounded-xl border border-slate-200 p-4 space-y-3 relative">
                {contacts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeContact(i)}
                    className="absolute top-3 right-3 p-1 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <X size={13} />
                  </button>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold shrink-0">
                    {i + 1}
                  </div>
                  <span className="text-xs font-medium text-slate-500">{i === 0 ? "Primary Contact" : `Contact ${i + 1}`}</span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Name {i === 0 && <span className="text-red-400">*</span>}</label>
                  <input value={c.name} onChange={(e) => updateContact(i, "name", e.target.value)}
                    placeholder="Full name"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Email {i === 0 && <span className="text-red-400">*</span>}</label>
                    <input type="email" value={c.email} onChange={(e) => updateContact(i, "email", e.target.value)}
                      placeholder="contact@example.com"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
                    <input type="tel" value={c.phone} onChange={(e) => updateContact(i, "phone", e.target.value)}
                      placeholder="+66-2-000-0000"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Commercial Terms */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Commercial Terms</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Payment Terms</label>
                <select value={form.paymentTerms} onChange={(e) => set("paymentTerms", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {PAYMENT_TERMS.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Rating (1–5)</label>
                <input type="number" min="1" max="5" step="0.1"
                  value={form.rating} onChange={(e) => set("rating", parseFloat(e.target.value) || 1)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
              <select value={form.status} onChange={(e) => set("status", e.target.value as SupplierStatus)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
            <textarea rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)}
              placeholder="Lead times, special terms, discount thresholds..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 sticky bottom-0 bg-white">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
          <button
            disabled={!canSave}
            onClick={handleSave}
            className="px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40">
            {isEdit ? "Save Changes" : "Add Supplier"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Detail Modal ──────────────────────────────────────────────────────

interface DetailModalProps {
  supplier: Supplier;
  onClose: () => void;
  onEdit: (s: Supplier) => void;
}

function DetailModal({ supplier, onClose, onEdit }: DetailModalProps) {
  const myPOs = purchaseOrders.filter((po) => po.supplierId === supplier.id);
  const myProducts = products.filter((p) => p.supplierId === supplier.id);
  const totalSpend = myPOs.filter((po) => po.status === "received").reduce((s, po) => s + po.total, 0);

  const allContacts: ContactPerson[] = supplier.contacts && supplier.contacts.length > 0
    ? supplier.contacts
    : [{ name: supplier.contact ?? "", email: supplier.email ?? "", phone: supplier.phone ?? "" }];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-lg">
              {supplier.name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900">{supplier.name}</h2>
                <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                  supplier.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500")}>
                  {supplier.status === "active" ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", categoryColors[supplier.category] ?? "bg-slate-100 text-slate-600")}>
                  {supplier.category}
                </span>
                <StarRating rating={supplier.rating} size={12} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onEdit(supplier)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50">
              <Pencil size={12} /> Edit
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total POs",   value: String(myPOs.length),       icon: <FileText size={16} className="text-blue-600" />,   bg: "bg-blue-50" },
              { label: "Total Spend", value: formatCurrency(totalSpend),  icon: <CreditCard size={16} className="text-emerald-600" />, bg: "bg-emerald-50" },
              { label: "Products",    value: String(myProducts.length),   icon: <Package size={16} className="text-violet-600" />,  bg: "bg-violet-50" },
            ].map(({ label, value, icon, bg }) => (
              <div key={label} className={cn("rounded-xl p-4 flex items-center gap-3", bg)}>
                {icon}
                <div>
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="text-base font-bold text-slate-800">{value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Contacts */}
            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Contacts</p>
              <div className="space-y-3">
                {allContacts.map((c, i) => (
                  <div key={i} className={cn("space-y-1 text-sm", i > 0 && "pt-3 border-t border-slate-200")}>
                    {allContacts.length > 1 && (
                      <p className="text-xs text-slate-400 font-medium">{i === 0 ? "Primary" : `Contact ${i + 1}`}</p>
                    )}
                    <div className="flex items-center gap-2 text-slate-700"><Building2 size={14} className="text-slate-400 shrink-0" />{c.name || "—"}</div>
                    <div className="flex items-center gap-2 text-slate-700"><Mail size={14} className="text-slate-400 shrink-0" />{c.email || "—"}</div>
                    <div className="flex items-center gap-2 text-slate-700"><Phone size={14} className="text-slate-400 shrink-0" />{c.phone || "—"}</div>
                  </div>
                ))}
                <div className="flex items-center gap-2 text-slate-700 text-sm pt-1"><Globe size={14} className="text-slate-400 shrink-0" />{supplier.address || "—"}</div>
                <div className="flex items-center gap-2 text-slate-500 text-xs"><Tag size={13} className="text-slate-300 shrink-0" />{supplier.country}</div>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Commercial</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-400">Tax ID</span><span className="font-mono text-xs text-slate-700">{supplier.taxId || "—"}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Payment</span><span className="font-medium text-slate-700">{supplier.paymentTerms}</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-400">Rating</span><StarRating rating={supplier.rating} size={12} /></div>
                <div className="flex justify-between items-center"><span className="text-slate-400">Category</span>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", categoryColors[supplier.category] ?? "bg-slate-100 text-slate-600")}>
                    {supplier.category}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {supplier.notes && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-700 mb-1">Notes</p>
              <p className="text-sm text-amber-800">{supplier.notes}</p>
            </div>
          )}

          {myProducts.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Supplied Products</p>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">SKU</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Product</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Category</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500">Stock</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500">Unit Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {myProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{p.id}</td>
                        <td className="px-4 py-2.5 font-medium text-slate-800">{p.name}</td>
                        <td className="px-4 py-2.5 text-slate-500 text-xs">{p.category}</td>
                        <td className="px-4 py-2.5 text-right">
                          <span className={cn("text-xs font-semibold",
                            p.stock === 0 ? "text-red-600" : p.stock < p.minStock ? "text-amber-600" : "text-emerald-600")}>
                            {p.stock}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-medium text-slate-700">{formatCurrency(p.unitPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {myPOs.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Purchase Order History</p>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">PO #</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Date</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Expected</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500">Items</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500">Total</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {myPOs.map((po) => {
                      const cfg = poStatusConfig[po.status];
                      return (
                        <tr key={po.id} className="hover:bg-slate-50">
                          <td className="px-4 py-2.5 font-mono font-semibold text-blue-600 text-xs">{po.id}</td>
                          <td className="px-4 py-2.5 text-slate-600">{po.date}</td>
                          <td className="px-4 py-2.5 text-slate-500 text-xs">{po.expectedDate}</td>
                          <td className="px-4 py-2.5 text-right text-slate-600">{po.items}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-slate-900">{formatCurrency(po.total)}</td>
                          <td className="px-4 py-2.5">
                            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", cfg.color)}>{cfg.label}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────

export default function SuppliersPage() {
  const [supplierList, setSupplierList] = useState<Supplier[]>(initialSuppliers as Supplier[]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | undefined>(undefined);
  const [viewId, setViewId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [apiCategories, setApiCategories] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/settings/supplier-categories")
      .then((r) => r.ok ? r.json() : [])
      .then((data: { name: string }[]) => { if (data.length > 0) setApiCategories(data.map((c) => c.name)); })
      .catch(() => {});
  }, []);

  const nextId = `SUP-${String(supplierList.length + 1).padStart(3, "0")}`;
  const categories = useMemo(() => {
    const set = new Set(supplierList.map((s) => s.category));
    return Array.from(set).sort();
  }, [supplierList]);

  const filtered = useMemo(() => supplierList.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.name.toLowerCase().includes(q) || (s.contact ?? "").toLowerCase().includes(q) || s.category.toLowerCase().includes(q) || s.country.toLowerCase().includes(q);
    const matchCat = categoryFilter === "all" || s.category === categoryFilter;
    return matchSearch && matchCat;
  }), [supplierList, search, categoryFilter]);

  const stats = useMemo(() => ({
    total: supplierList.length,
    active: supplierList.filter((s) => s.status === "active").length,
    avgRating: supplierList.length ? (supplierList.reduce((s, x) => s + x.rating, 0) / supplierList.length) : 0,
    categories: new Set(supplierList.map((s) => s.category)).size,
  }), [supplierList]);

  const viewSupplier = viewId ? supplierList.find((s) => s.id === viewId) : null;

  const openAdd  = () => { setEditSupplier(undefined); setShowModal(true); };
  const openEdit = (s: Supplier) => { setEditSupplier(s); setShowModal(true); setViewId(null); };

  const handleSave = (s: Supplier) => {
    setSupplierList((prev) => {
      const idx = prev.findIndex((x) => x.id === s.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = s; return next; }
      return [...prev, s];
    });
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    setSupplierList((prev) => prev.filter((s) => s.id !== id));
    setDeleteId(null);
    if (viewId === id) setViewId(null);
  };

  return (
    <div>
      <Header
        title="Suppliers"
        subtitle={`${stats.total} suppliers · ${stats.active} active`}
        actions={
          <button onClick={openAdd}
            className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
            <Plus size={16} /> Add Supplier
          </button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label:"Total Suppliers", value:stats.total,                     icon:<Building2 size={18} />,    color:"blue"    },
            { label:"Active",          value:stats.active,                    icon:<CheckCircle2 size={18} />, color:"emerald" },
            { label:"Avg Rating",      value:stats.avgRating.toFixed(1)+" ★", icon:<Star size={18} />,         color:"amber"   },
            { label:"Categories",      value:stats.categories,                icon:<Tag size={18} />,           color:"violet"  },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-500 font-medium">{label}</p>
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center",
                  color === "blue"    && "bg-blue-100 text-blue-600",
                  color === "emerald" && "bg-emerald-100 text-emerald-600",
                  color === "amber"   && "bg-amber-100 text-amber-600",
                  color === "violet"  && "bg-violet-100 text-violet-600",
                )}>
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
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search suppliers, contacts, countries..."
              className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1 flex-wrap">
            <button onClick={() => setCategoryFilter("all")}
              className={cn("px-3 py-1 text-xs font-medium rounded-md transition-colors",
                categoryFilter === "all" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
              All
            </button>
            {categories.map((c) => (
              <button key={c} onClick={() => setCategoryFilter(c)}
                className={cn("px-3 py-1 text-xs font-medium rounded-md transition-colors",
                  categoryFilter === c ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Cards grid */}
        {filtered.length === 0 ? (
          <div className="py-24 text-center">
            <Building2 size={36} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm text-slate-400">No suppliers found matching your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((s) => {
              const myPOs = purchaseOrders.filter((po) => po.supplierId === s.id);
              const poTotal = myPOs.filter((po) => po.status === "received").reduce((acc, po) => acc + po.total, 0);
              const isActive = s.status === "active";
              const contactCount = s.contacts ? s.contacts.length : 1;
              return (
                <div key={s.id}
                  className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow p-5 group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center font-bold text-blue-700 text-lg shrink-0">
                        {s.name[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate text-sm">{s.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-medium", categoryColors[s.category] ?? "bg-slate-100 text-slate-600")}>
                            {s.category}
                          </span>
                          <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-medium",
                            isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500")}>
                            {isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3"><StarRating rating={s.rating} size={13} /></div>

                  <div className="space-y-1.5 mb-4 text-xs text-slate-500">
                    <div className="flex items-center gap-2"><Building2 size={12} className="shrink-0" />{s.contact || "—"}</div>
                    <div className="flex items-center gap-2"><Mail size={12} className="shrink-0" /><span className="truncate">{s.email || "—"}</span></div>
                    <div className="flex items-center gap-2"><Globe size={12} className="shrink-0" />{s.country}</div>
                    <div className="flex items-center gap-2"><CreditCard size={12} className="shrink-0" />{s.paymentTerms}</div>
                    {contactCount > 1 && (
                      <div className="flex items-center gap-2 text-blue-500">
                        <UserPlus size={12} className="shrink-0" />{contactCount} contacts
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 py-3 border-t border-slate-100 text-xs text-slate-500 mb-4">
                    <div className="flex items-center gap-1">
                      <FileText size={12} className="text-slate-400" />
                      <span><strong className="text-slate-800 font-semibold">{myPOs.length}</strong> POs</span>
                    </div>
                    <div className="w-px h-3 bg-slate-200" />
                    <div className="flex items-center gap-1">
                      <CreditCard size={12} className="text-slate-400" />
                      <span className="font-semibold text-slate-700">{formatCurrency(poTotal)}</span> received
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setViewId(s.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
                      <Eye size={12} /> View
                    </button>
                    <button onClick={() => openEdit(s)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50">
                      <Pencil size={12} /> Edit
                    </button>
                    <button onClick={() => setDeleteId(s.id)}
                      className="flex items-center justify-center p-1.5 text-slate-400 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <SupplierModal
          initial={editSupplier}
          nextId={nextId}
          apiCategories={apiCategories}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}

      {viewSupplier && (
        <DetailModal
          supplier={supplierList.find((s) => s.id === viewSupplier.id)!}
          onClose={() => setViewId(null)}
          onEdit={openEdit}
        />
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <XCircle size={22} className="text-red-600" />
            </div>
            <h2 className="text-base font-semibold text-slate-900 mb-1">Delete Supplier</h2>
            <p className="text-sm text-slate-500 mb-6">
              Remove <strong>{supplierList.find((s) => s.id === deleteId)?.name}</strong>? This cannot be undone.
            </p>
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
