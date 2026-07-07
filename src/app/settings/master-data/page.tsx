"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import {
  Plus, Pencil, Trash2, X, Layers, Truck, Users, CreditCard, CalendarDays,
  Sparkles, BookOpen, Database,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SimpleCategory { id: string; name: string; description?: string }
interface LookupItem     { id: string; type: string; label: string; order: number; isActive: boolean }
interface LeaveType {
  id: string; name: string; daysPerYear: number; isPaid: boolean;
  carryOver: boolean; maxCarryOver: number; requireDoc: boolean;
  color: string; thaiLawRef?: string; isActive: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const LEAVE_COLORS = [
  { key: "blue",    dot: "bg-blue-500" },  { key: "red",     dot: "bg-red-500" },
  { key: "emerald", dot: "bg-emerald-500" },{ key: "amber",   dot: "bg-amber-500" },
  { key: "violet",  dot: "bg-violet-500" },{ key: "pink",    dot: "bg-pink-500" },
  { key: "indigo",  dot: "bg-indigo-500" },{ key: "slate",   dot: "bg-slate-500" },
];
const colorDot: Record<string, string> = {
  blue:"bg-blue-500", red:"bg-red-500", emerald:"bg-emerald-500", amber:"bg-amber-500",
  violet:"bg-violet-500", pink:"bg-pink-500", indigo:"bg-indigo-500", slate:"bg-slate-500",
};
const colorBadge: Record<string, string> = {
  blue:"bg-blue-100 text-blue-700", red:"bg-red-100 text-red-700",
  emerald:"bg-emerald-100 text-emerald-700", amber:"bg-amber-100 text-amber-700",
  violet:"bg-violet-100 text-violet-700", pink:"bg-pink-100 text-pink-700",
  indigo:"bg-indigo-100 text-indigo-700", slate:"bg-slate-100 text-slate-600",
};

// ─── Shared Modals ───────────────────────────────────────────────────────────

function DeleteDialog({ label, onCancel, onConfirm }: {
  label: string; onCancel: () => void; onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center" onClick={(e) => e.stopPropagation()}>
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <Trash2 size={22} className="text-red-600" />
        </div>
        <h3 className="text-base font-semibold text-slate-900 mb-1">Delete Item</h3>
        <p className="text-sm text-slate-500 mb-6">Remove <strong>{label}</strong>? This action cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
        </div>
      </div>
    </div>
  );
}

// ─── Category Tab (Product & Supplier Categories) ────────────────────────────

function CategoryModal({ initial, noun, onClose, onSave, saving, error }: {
  initial?: SimpleCategory; noun: string; onClose: () => void;
  onSave: (d: { name: string; description: string }) => void;
  saving: boolean; error: string;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [desc, setDesc] = useState(initial?.description ?? "");
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">{initial ? `Edit ${noun}` : `Add ${noun}`}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} autoFocus
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Description <span className="text-slate-400">(optional)</span></label>
            <textarea rows={2} value={desc} onChange={(e) => setDesc(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
          <button onClick={() => onSave({ name, description: desc })} disabled={saving || !name.trim()}
            className="flex-1 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40">
            {saving ? "Saving…" : initial ? "Save Changes" : `Add ${noun}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function CategoryTab({ apiBase, noun, icon: Icon, emptyHint }: {
  apiBase: string; noun: string; icon: React.ElementType; emptyHint: string;
}) {
  const [items,     setItems]     = useState<SimpleCategory[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState<SimpleCategory | null | "new">(null);
  const [deleteId,  setDeleteId]  = useState<string | null>(null);
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState("");

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try { const r = await fetch(apiBase); if (r.ok) setItems(await r.json()); }
    finally { setLoading(false); }
  }, [apiBase]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const handleSave = async (data: { name: string; description: string }) => {
    setSaving(true); setSaveError("");
    try {
      const isEdit = modal && modal !== "new";
      const url = isEdit ? `${apiBase}/${(modal as SimpleCategory).id}` : apiBase;
      const res = await fetch(url, { method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const json = await res.json();
      if (!res.ok) { setSaveError(json.error ?? "Failed to save."); return; }
      await fetch_(); setModal(null);
    } catch { setSaveError("Something went wrong."); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    await fetch(`${apiBase}/${id}`, { method: "DELETE" });
    setItems((p) => p.filter((c) => c.id !== id)); setDeleteId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => { setSaveError(""); setModal("new"); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          <Plus size={15} /> Add {noun}
        </button>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? <div className="py-12 text-center text-sm text-slate-400">Loading…</div>
        : items.length === 0 ? (
          <div className="py-16 text-center">
            <Icon size={32} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-600">No {noun.toLowerCase()}s yet</p>
            <p className="text-xs text-slate-400 mt-1">{emptyHint}</p>
            <button onClick={() => { setSaveError(""); setModal("new"); }}
              className="mt-4 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add {noun}</button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 uppercase tracking-wide border-b border-slate-100 bg-slate-50">
                <th className="px-5 py-3 text-left font-medium">#</th>
                <th className="px-5 py-3 text-left font-medium">Name</th>
                <th className="px-5 py-3 text-left font-medium">Description</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items.map((item, i) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 text-slate-400 text-xs">{i + 1}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                        <Icon size={13} className="text-blue-500" />
                      </div>
                      <span className="font-medium text-slate-800">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-xs">{item.description || "—"}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => { setSaveError(""); setModal(item); }}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"><Pencil size={14} /></button>
                      <button onClick={() => setDeleteId(item.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {modal !== null && (
        <CategoryModal initial={modal === "new" ? undefined : modal} noun={noun}
          onClose={() => setModal(null)} onSave={handleSave} saving={saving} error={saveError} />
      )}
      {deleteId && (
        <DeleteDialog label={items.find((c) => c.id === deleteId)?.name ?? ""}
          onCancel={() => setDeleteId(null)} onConfirm={() => handleDelete(deleteId)} />
      )}
    </div>
  );
}

// ─── Lookup Tab (Business Types, Payment Terms) ───────────────────────────────

function LookupModal({ initial, noun, onClose, onSave, saving, error }: {
  initial?: LookupItem; noun: string; onClose: () => void;
  onSave: (label: string) => void; saving: boolean; error: string;
}) {
  const [label, setLabel] = useState(initial?.label ?? "");
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">{initial ? `Edit ${noun}` : `Add ${noun}`}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>
        <div className="p-6">
          <label className="block text-xs font-medium text-slate-600 mb-1">Label *</label>
          <input value={label} onChange={(e) => setLabel(e.target.value)} autoFocus
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {error && <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
          <button onClick={() => onSave(label)} disabled={saving || !label.trim()}
            className="flex-1 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40">
            {saving ? "Saving…" : initial ? "Save Changes" : `Add ${noun}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function LookupTab({ lookupType, noun, icon: Icon, defaultSeedLabel }: {
  lookupType: string; noun: string; icon: React.ElementType; defaultSeedLabel: string;
}) {
  const [items,     setItems]     = useState<LookupItem[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState<LookupItem | null | "new">(null);
  const [deleteId,  setDeleteId]  = useState<string | null>(null);
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState("");
  const [seeding,   setSeeding]   = useState(false);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/settings/lookup-values?type=${lookupType}`);
      if (r.ok) setItems(await r.json());
    } finally { setLoading(false); }
  }, [lookupType]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const r = await fetch("/api/settings/lookup-values", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seedDefaults: true, type: lookupType }),
      });
      if (r.ok) await fetch_();
    } finally { setSeeding(false); }
  };

  const handleSave = async (label: string) => {
    setSaving(true); setSaveError("");
    try {
      const isEdit = modal && modal !== "new";
      const url = isEdit ? `/api/settings/lookup-values/${(modal as LookupItem).id}` : "/api/settings/lookup-values";
      const body = isEdit ? { label } : { type: lookupType, label };
      const res = await fetch(url, { method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok) { setSaveError(json.error ?? "Failed to save."); return; }
      await fetch_(); setModal(null);
    } catch { setSaveError("Something went wrong."); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/settings/lookup-values/${id}`, { method: "DELETE" });
    setItems((p) => p.filter((i) => i.id !== id)); setDeleteId(null);
  };

  const handleToggle = async (item: LookupItem) => {
    await fetch(`/api/settings/lookup-values/${item.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !item.isActive }),
    });
    setItems((p) => p.map((i) => i.id === item.id ? { ...i, isActive: !item.isActive } : i));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        {items.length === 0 && (
          <button onClick={handleSeed} disabled={seeding}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50">
            <Sparkles size={15} /> {seeding ? "Seeding…" : `Seed ${defaultSeedLabel}`}
          </button>
        )}
        <button onClick={() => { setSaveError(""); setModal("new"); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          <Plus size={15} /> Add {noun}
        </button>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? <div className="py-12 text-center text-sm text-slate-400">Loading…</div>
        : items.length === 0 ? (
          <div className="py-16 text-center">
            <Icon size={32} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-600">No {noun.toLowerCase()}s configured</p>
            <p className="text-xs text-slate-400 mt-1">Seed defaults or add manually.</p>
            <button onClick={handleSeed} disabled={seeding}
              className="mt-4 px-4 py-2 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 flex items-center gap-2 mx-auto disabled:opacity-50">
              <Sparkles size={14} /> {seeding ? "Seeding…" : `Seed ${defaultSeedLabel}`}
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 uppercase tracking-wide border-b border-slate-100 bg-slate-50">
                <th className="px-5 py-3 text-left font-medium">#</th>
                <th className="px-5 py-3 text-left font-medium">Label</th>
                <th className="px-5 py-3 text-center font-medium">Active</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items.map((item, i) => (
                <tr key={item.id} className={cn("hover:bg-slate-50", !item.isActive && "opacity-50")}>
                  <td className="px-5 py-3 text-slate-400 text-xs">{i + 1}</td>
                  <td className="px-5 py-3 font-medium text-slate-800">{item.label}</td>
                  <td className="px-5 py-3 text-center">
                    <button onClick={() => handleToggle(item)}
                      className={cn("relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                        item.isActive ? "bg-emerald-500" : "bg-slate-200")}>
                      <span className={cn("inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform",
                        item.isActive ? "translate-x-4" : "translate-x-1")} />
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => { setSaveError(""); setModal(item); }}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"><Pencil size={14} /></button>
                      <button onClick={() => setDeleteId(item.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {modal !== null && (
        <LookupModal initial={modal === "new" ? undefined : modal} noun={noun}
          onClose={() => setModal(null)} onSave={handleSave} saving={saving} error={saveError} />
      )}
      {deleteId && (
        <DeleteDialog label={items.find((i) => i.id === deleteId)?.label ?? ""}
          onCancel={() => setDeleteId(null)} onConfirm={() => handleDelete(deleteId)} />
      )}
    </div>
  );
}

// ─── Leave Types Tab ──────────────────────────────────────────────────────────

function LeaveTypeModal({ initial, onClose, onSave, saving, error }: {
  initial?: LeaveType; onClose: () => void;
  onSave: (d: Omit<LeaveType, "id" | "isActive">) => void;
  saving: boolean; error: string;
}) {
  const [name,         setName]         = useState(initial?.name ?? "");
  const [daysPerYear,  setDaysPerYear]  = useState(initial?.daysPerYear ?? 6);
  const [isPaid,       setIsPaid]       = useState(initial?.isPaid ?? true);
  const [carryOver,    setCarryOver]    = useState(initial?.carryOver ?? false);
  const [maxCarryOver, setMaxCarryOver] = useState(initial?.maxCarryOver ?? 0);
  const [requireDoc,   setRequireDoc]   = useState(initial?.requireDoc ?? false);
  const [color,        setColor]        = useState(initial?.color ?? "blue");
  const [thaiLawRef,   setThaiLawRef]   = useState(initial?.thaiLawRef ?? "");

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
          <h2 className="text-base font-semibold text-slate-900">{initial ? "Edit Leave Type" : "Add Leave Type"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} autoFocus
              placeholder="e.g. Annual Leave"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Days / Year <span className="text-slate-400">(0 = unlimited)</span></label>
              <input type="number" min="0" value={daysPerYear} onChange={(e) => setDaysPerYear(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Color</label>
              <div className="flex gap-1.5 flex-wrap pt-1">
                {LEAVE_COLORS.map((c) => (
                  <button key={c.key} type="button" onClick={() => setColor(c.key)}
                    className={cn("w-6 h-6 rounded-full transition-all", c.dot,
                      color === c.key ? "ring-2 ring-offset-2 ring-slate-400 scale-110" : "opacity-70 hover:opacity-100")} />
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {[
              { id: "paid",  label: "Paid leave",          sub: "Employee is paid during this leave", val: isPaid,      set: setIsPaid },
              { id: "carry", label: "Allow carry-over",    sub: "Unused days roll into next year",    val: carryOver,   set: setCarryOver },
              { id: "doc",   label: "Require document",    sub: "Certificate / doctor note required", val: requireDoc,  set: setRequireDoc },
            ].map(({ id, label, sub, val, set }) => (
              <label key={id} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors",
                val ? "border-blue-200 bg-blue-50" : "border-slate-200 hover:bg-slate-50")}>
                <input type="checkbox" checked={val} onChange={(e) => set(e.target.checked)} className="w-4 h-4 rounded accent-blue-600" />
                <div>
                  <p className="text-sm font-medium text-slate-800">{label}</p>
                  <p className="text-xs text-slate-400">{sub}</p>
                </div>
              </label>
            ))}
          </div>
          {carryOver && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Max carry-over days <span className="text-slate-400">(0 = same as entitlement)</span></label>
              <input type="number" min="0" value={maxCarryOver} onChange={(e) => setMaxCarryOver(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Thai Law Reference <span className="text-slate-400">(optional)</span></label>
            <input value={thaiLawRef} onChange={(e) => setThaiLawRef(e.target.value)}
              placeholder="e.g. Labour Protection Act s.30"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 sticky bottom-0 bg-white">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
          <button onClick={() => onSave({ name, daysPerYear, isPaid, carryOver, maxCarryOver, requireDoc, color, thaiLawRef })}
            disabled={saving || !name.trim()}
            className="flex-1 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40">
            {saving ? "Saving…" : initial ? "Save Changes" : "Add Leave Type"}
          </button>
        </div>
      </div>
    </div>
  );
}

function LeaveTypesTab() {
  const [types,     setTypes]     = useState<LeaveType[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState<LeaveType | null | "new">(null);
  const [deleteId,  setDeleteId]  = useState<string | null>(null);
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState("");
  const [seeding,   setSeeding]   = useState(false);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try { const r = await fetch("/api/settings/leave-types"); if (r.ok) setTypes(await r.json()); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const r = await fetch("/api/settings/leave-types", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seedDefaults: true }),
      });
      if (r.ok) await fetch_();
    } finally { setSeeding(false); }
  };

  const handleSave = async (data: Omit<LeaveType, "id" | "isActive">) => {
    setSaving(true); setSaveError("");
    try {
      const isEdit = modal && modal !== "new";
      const url = isEdit ? `/api/settings/leave-types/${(modal as LeaveType).id}` : "/api/settings/leave-types";
      const res = await fetch(url, { method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const json = await res.json();
      if (!res.ok) { setSaveError(json.error ?? "Failed to save."); return; }
      await fetch_(); setModal(null);
    } catch { setSaveError("Something went wrong."); }
    finally { setSaving(false); }
  };

  const handleToggle = async (lt: LeaveType) => {
    await fetch(`/api/settings/leave-types/${lt.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !lt.isActive }),
    });
    setTypes((p) => p.map((t) => t.id === lt.id ? { ...t, isActive: !lt.isActive } : t));
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/settings/leave-types/${id}`, { method: "DELETE" });
    setTypes((p) => p.filter((t) => t.id !== id)); setDeleteId(null);
  };

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-3">
        <BookOpen size={15} className="text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800">
          <strong>Thai Labour Protection Act (พ.ร.บ.คุ้มครองแรงงาน):</strong>{" "}
          Annual min 6 days (s.30) · Sick 30 days paid (s.32) · Personal 3 days (s.34) · Maternity 98 days / 45 paid (s.41)
        </p>
      </div>
      <div className="flex justify-end gap-2">
        {types.length === 0 && (
          <button onClick={handleSeed} disabled={seeding}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50">
            <Sparkles size={15} /> {seeding ? "Seeding…" : "Seed Thai Law Defaults"}
          </button>
        )}
        <button onClick={() => { setSaveError(""); setModal("new"); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          <Plus size={15} /> Add Leave Type
        </button>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? <div className="py-12 text-center text-sm text-slate-400">Loading…</div>
        : types.length === 0 ? (
          <div className="py-16 text-center">
            <CalendarDays size={32} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-600">No leave types configured</p>
            <button onClick={handleSeed} disabled={seeding}
              className="mt-4 px-4 py-2 text-sm bg-amber-500 text-white rounded-lg flex items-center gap-2 mx-auto">
              <Sparkles size={14} /> Seed Thai Law Defaults
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 uppercase tracking-wide border-b border-slate-100 bg-slate-50">
                <th className="px-5 py-3 text-left font-medium">Leave Type</th>
                <th className="px-5 py-3 text-center font-medium">Days/Yr</th>
                <th className="px-5 py-3 text-center font-medium">Paid</th>
                <th className="px-5 py-3 text-center font-medium">Carry Over</th>
                <th className="px-5 py-3 text-center font-medium">Doc Req.</th>
                <th className="px-5 py-3 text-center font-medium">Active</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {types.map((lt) => (
                <tr key={lt.id} className={cn("hover:bg-slate-50", !lt.isActive && "opacity-50")}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", colorDot[lt.color] ?? "bg-slate-400")} />
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", colorBadge[lt.color] ?? "bg-slate-100 text-slate-600")}>{lt.name}</span>
                      {lt.thaiLawRef && <span className="text-[10px] text-slate-400 truncate max-w-[140px]">{lt.thaiLawRef}</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-center text-sm font-medium text-slate-700">{lt.daysPerYear === 0 ? "∞" : lt.daysPerYear}</td>
                  <td className="px-5 py-3 text-center text-base">{lt.isPaid ? "✓" : "—"}</td>
                  <td className="px-5 py-3 text-center text-xs text-slate-500">
                    {lt.carryOver ? (lt.maxCarryOver > 0 ? `${lt.maxCarryOver}d max` : "Yes") : "—"}
                  </td>
                  <td className="px-5 py-3 text-center text-base">{lt.requireDoc ? "✓" : "—"}</td>
                  <td className="px-5 py-3 text-center">
                    <button onClick={() => handleToggle(lt)}
                      className={cn("relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                        lt.isActive ? "bg-emerald-500" : "bg-slate-200")}>
                      <span className={cn("inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform",
                        lt.isActive ? "translate-x-4" : "translate-x-1")} />
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => { setSaveError(""); setModal(lt); }}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"><Pencil size={14} /></button>
                      <button onClick={() => setDeleteId(lt.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {modal !== null && (
        <LeaveTypeModal initial={modal === "new" ? undefined : modal}
          onClose={() => setModal(null)} onSave={handleSave} saving={saving} error={saveError} />
      )}
      {deleteId && (
        <DeleteDialog label={types.find((t) => t.id === deleteId)?.name ?? ""}
          onCancel={() => setDeleteId(null)} onConfirm={() => handleDelete(deleteId)} />
      )}
    </div>
  );
}

// ─── Tab Definitions ──────────────────────────────────────────────────────────

const TABS = [
  { id: "product_cats",    label: "Product Categories",  icon: Layers },
  { id: "supplier_cats",   label: "Supplier Categories", icon: Truck },
  { id: "business_types",  label: "Business Types",      icon: Users },
  { id: "payment_terms",   label: "Payment Terms",       icon: CreditCard },
  { id: "leave_types",     label: "Leave Types",         icon: CalendarDays },
] as const;

type TabId = typeof TABS[number]["id"];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState<TabId>("product_cats");

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header
        title="Master Data"
        subtitle="Manage dropdown values and lookup lists used across the system"
      />

      <div className="p-6 space-y-4">
        {/* Tab Nav */}
        <div className="flex gap-1 flex-wrap bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
          {TABS.map((t) => {
            const TIcon = t.icon;
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  activeTab === t.id
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100")}>
                <TIcon size={15} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "product_cats" && (
            <CategoryTab
              apiBase="/api/settings/product-categories"
              noun="Category"
              icon={Layers}
              emptyHint="Add categories used to classify your products."
            />
          )}
          {activeTab === "supplier_cats" && (
            <CategoryTab
              apiBase="/api/settings/supplier-categories"
              noun="Category"
              icon={Truck}
              emptyHint="Add categories used to classify your suppliers."
            />
          )}
          {activeTab === "business_types" && (
            <LookupTab
              lookupType="business_type"
              noun="Business Type"
              icon={Users}
              defaultSeedLabel="Defaults"
            />
          )}
          {activeTab === "payment_terms" && (
            <LookupTab
              lookupType="payment_term"
              noun="Payment Term"
              icon={CreditCard}
              defaultSeedLabel="Defaults"
            />
          )}
          {activeTab === "leave_types" && <LeaveTypesTab />}
        </div>

        {/* Info banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 text-sm text-blue-700">
          <Database size={15} className="shrink-0 mt-0.5 text-blue-500" />
          <p>Changes made here are reflected immediately across the system — dropdowns in forms will show the updated values.</p>
        </div>
      </div>
    </div>
  );
}
