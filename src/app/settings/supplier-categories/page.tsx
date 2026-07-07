"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import { Plus, Pencil, Trash2, X, Truck } from "lucide-react";

interface SupplierCategory {
  id: string; name: string; description?: string;
}

function CategoryModal({ initial, onClose, onSave, saving, error }: {
  initial?: SupplierCategory; onClose: () => void;
  onSave: (data: { name: string; description: string }) => void;
  saving: boolean; error: string;
}) {
  const [name,        setName]        = useState(initial?.name        ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">{initial ? "Edit Category" : "Add Category"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Category Name *</label>
            <input
              value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Equipment"
              autoFocus
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Description <span className="text-slate-400">(optional)</span></label>
            <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description of this category"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
          <button
            onClick={() => onSave({ name, description })}
            disabled={saving || !name.trim()}
            className="flex-1 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40"
          >
            {saving ? "Saving…" : initial ? "Save Changes" : "Add Category"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SupplierCategoriesPage() {
  const [cats,      setCats]      = useState<SupplierCategory[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState<SupplierCategory | null | "new">(null);
  const [deleteId,  setDeleteId]  = useState<string | null>(null);
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState("");

  const fetchCats = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/settings/supplier-categories");
      if (r.ok) setCats(await r.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCats(); }, [fetchCats]);

  const handleSave = async (data: { name: string; description: string }) => {
    setSaving(true); setSaveError("");
    try {
      const isEdit = modal && modal !== "new";
      const url = isEdit ? `/api/settings/supplier-categories/${(modal as SupplierCategory).id}` : "/api/settings/supplier-categories";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) { setSaveError(json.error ?? "Failed to save."); return; }
      await fetchCats();
      setModal(null);
    } catch { setSaveError("Something went wrong."); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/settings/supplier-categories/${id}`, { method: "DELETE" });
      setCats((prev) => prev.filter((c) => c.id !== id));
      setDeleteId(null);
    } catch { alert("Failed to delete category."); }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header
        title="Supplier Categories"
        actions={
          <button onClick={() => { setSaveError(""); setModal("new"); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
            <Plus size={16} /> Add Category
          </button>
        }
      />

      <div className="p-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-400">Loading…</div>
          ) : cats.length === 0 ? (
            <div className="py-16 text-center">
              <Truck size={32} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-600">No supplier categories yet</p>
              <p className="text-xs text-slate-400 mt-1">Add your first supplier category to get started.</p>
              <button onClick={() => { setSaveError(""); setModal("new"); }}
                className="mt-4 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Add Category
              </button>
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
                {cats.map((cat, i) => (
                  <tr key={cat.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 text-slate-400 text-xs">{i + 1}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                          <Truck size={13} className="text-blue-500" />
                        </div>
                        <span className="font-medium text-slate-800">{cat.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-400 text-xs">{cat.description || "—"}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setSaveError(""); setModal(cat); }}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleteId(cat.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal !== null && (
        <CategoryModal
          initial={modal === "new" ? undefined : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
          saving={saving}
          error={saveError}
        />
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-600" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">Delete Category</h3>
            <p className="text-sm text-slate-500 mb-6">
              Remove <strong>{cats.find((c) => c.id === deleteId)?.name}</strong>?
              Existing suppliers will keep their category label.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
