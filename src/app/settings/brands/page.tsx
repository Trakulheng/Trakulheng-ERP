"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import { Plus, Pencil, Trash2, X, Check, Tag } from "lucide-react";

interface Brand {
  id: string; name: string; code: string; description?: string; status: "active" | "inactive";
}

function BrandModal({ initial, onClose, onSave, saving, error }: {
  initial?: Brand; onClose: () => void;
  onSave: (b: Partial<Brand>) => void; saving: boolean; error: string;
}) {
  const [name,        setName]        = useState(initial?.name        ?? "");
  const [code,        setCode]        = useState(initial?.code        ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [status,      setStatus]      = useState<"active"|"inactive">(initial?.status ?? "active");

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">{initial ? "Edit Brand" : "Add Brand"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Brand Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Daddy Don't Know"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Brand Code * <span className="text-slate-400">(used in branch avatar)</span></label>
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. DDK"
              maxLength={6}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
            <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
            <div className="flex gap-2">
              {(["active","inactive"] as const).map((s) => (
                <button key={s} onClick={() => setStatus(s)}
                  className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium capitalize transition-all",
                    status === s
                      ? s === "active" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-400 bg-slate-100 text-slate-600"
                      : "border-slate-200 text-slate-400 hover:border-slate-300")}>
                  {s === "active" ? <Check size={12} /> : <X size={12} />}{s}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} disabled={saving} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
          <button
            disabled={!name.trim() || !code.trim() || saving}
            onClick={() => onSave({ name, code, description, status })}
            className="px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40">
            {saving ? "Saving…" : initial ? "Save Changes" : "Add Brand"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BrandsPage() {
  const [brands,      setBrands]      = useState<Brand[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [modalOpen,   setModalOpen]   = useState(false);
  const [editing,     setEditing]     = useState<Brand | undefined>();
  const [deleteId,    setDeleteId]    = useState<string | null>(null);
  const [saving,      setSaving]      = useState(false);
  const [saveError,   setSaveError]   = useState("");
  const [toast,       setToast]       = useState("");

  const fetch_ = useCallback(async () => {
    try {
      const r = await fetch("/api/settings/brands");
      if (r.ok) setBrands(await r.json());
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  const handleSave = async (data: Partial<Brand>) => {
    setSaving(true); setSaveError("");
    try {
      const isEdit = !!editing;
      const res = await fetch(isEdit ? `/api/settings/brands/${editing!.id}` : "/api/settings/brands", {
        method:  isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) { setSaveError(json.error ?? "Failed to save."); return; }
      setBrands((prev) => {
        const idx = prev.findIndex((b) => b.id === json.id);
        if (idx >= 0) { const n = [...prev]; n[idx] = json; return n; }
        return [...prev, json];
      });
      setModalOpen(false); setEditing(undefined);
      setToast(isEdit ? "Brand updated." : "Brand added.");
      setTimeout(() => setToast(""), 3000);
    } catch { setSaveError("Something went wrong."); }
    finally   { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/settings/brands/${id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); alert(d.error); return; }
      setBrands((prev) => prev.filter((b) => b.id !== id));
      setDeleteId(null);
    } catch { alert("Failed to delete."); }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header title="Brands" subtitle="Manage your brands for branch assignment"
        actions={
          <button onClick={() => { setSaveError(""); setEditing(undefined); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
            <Plus size={16} /> Add Brand
          </button>
        }
      />

      <div className="p-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 uppercase tracking-wide border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 text-left font-medium">Brand</th>
                <th className="px-4 py-3 text-left font-medium">Code</th>
                <th className="px-4 py-3 text-left font-medium">Description</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading && <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">Loading…</td></tr>}
              {!loading && brands.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center">
                  <Tag size={32} className="mx-auto text-slate-200 mb-3" />
                  <p className="text-sm text-slate-400">No brands yet. Add your first brand to get started.</p>
                </td></tr>
              )}
              {brands.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">{b.code.slice(0,3)}</div>
                      <span className="font-medium text-slate-800">{b.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">{b.code}</span></td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{b.description || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full",
                      b.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500")}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => { setSaveError(""); setEditing(b); setModalOpen(true); }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"><Pencil size={15} /></button>
                      <button onClick={() => setDeleteId(b.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <BrandModal initial={editing} onClose={() => { setModalOpen(false); setEditing(undefined); }}
          onSave={handleSave} saving={saving} error={saveError} />
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><Trash2 size={22} className="text-red-600" /></div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">Delete Brand</h3>
            <p className="text-sm text-slate-500 mb-6">Remove <strong>{brands.find((b) => b.id === deleteId)?.name}</strong>? Branches using this brand will not be affected.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
              <button onClick={() => void handleDelete(deleteId!)} className="flex-1 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-slate-900 text-white text-sm px-4 py-3 rounded-xl shadow-xl">
          <Check size={14} className="text-emerald-400" />{toast}
        </div>
      )}
    </div>
  );
}
