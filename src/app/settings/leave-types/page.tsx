"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import { Plus, Pencil, Trash2, X, Sparkles, CalendarDays, CheckCircle2, BookOpen } from "lucide-react";

interface LeaveType {
  id: string; name: string; daysPerYear: number; isPaid: boolean;
  carryOver: boolean; maxCarryOver: number; requireDoc: boolean;
  color: string; thaiLawRef?: string; isActive: boolean;
}

const COLORS = [
  { key: "blue",    label: "Blue",    dot: "bg-blue-500" },
  { key: "red",     label: "Red",     dot: "bg-red-500" },
  { key: "emerald", label: "Green",   dot: "bg-emerald-500" },
  { key: "amber",   label: "Amber",   dot: "bg-amber-500" },
  { key: "violet",  label: "Violet",  dot: "bg-violet-500" },
  { key: "pink",    label: "Pink",    dot: "bg-pink-500" },
  { key: "indigo",  label: "Indigo",  dot: "bg-indigo-500" },
  { key: "slate",   label: "Slate",   dot: "bg-slate-500" },
];

const colorDot: Record<string, string> = {
  blue: "bg-blue-500", red: "bg-red-500", emerald: "bg-emerald-500", amber: "bg-amber-500",
  violet: "bg-violet-500", pink: "bg-pink-500", indigo: "bg-indigo-500", slate: "bg-slate-500",
};
const colorBadge: Record<string, string> = {
  blue: "bg-blue-100 text-blue-700", red: "bg-red-100 text-red-700",
  emerald: "bg-emerald-100 text-emerald-700", amber: "bg-amber-100 text-amber-700",
  violet: "bg-violet-100 text-violet-700", pink: "bg-pink-100 text-pink-700",
  indigo: "bg-indigo-100 text-indigo-700", slate: "bg-slate-100 text-slate-600",
};

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
    <div className="fixed inset-0 h-screen z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-base font-semibold text-slate-900">{initial ? "Edit Leave Type" : "Add Leave Type"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-4">
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
                {COLORS.map((c) => (
                  <button key={c.key} type="button" onClick={() => setColor(c.key)}
                    className={cn("w-6 h-6 rounded-full transition-all", c.dot, color === c.key ? "ring-2 ring-offset-2 ring-slate-400 scale-110" : "opacity-70 hover:opacity-100")} />
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {[
              { id: "paid", label: "Paid leave", sub: "Employee is paid during this leave", val: isPaid, set: setIsPaid },
              { id: "carry", label: "Allow carry-over", sub: "Unused days roll into next year", val: carryOver, set: setCarryOver },
              { id: "doc", label: "Require document", sub: "Certificate / doctor note required", val: requireDoc, set: setRequireDoc },
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
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 shrink-0">
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

export default function LeaveTypesPage() {
  const [types,     setTypes]     = useState<LeaveType[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState<LeaveType | null | "new">(null);
  const [deleteId,  setDeleteId]  = useState<string | null>(null);
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState("");
  const [seeding,   setSeeding]   = useState(false);

  const fetchTypes = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/settings/leave-types");
      if (r.ok) setTypes(await r.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTypes(); }, [fetchTypes]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const r = await fetch("/api/settings/leave-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seedDefaults: true }),
      });
      if (r.ok) await fetchTypes();
    } finally { setSeeding(false); }
  };

  const handleSave = async (data: Omit<LeaveType, "id" | "isActive">) => {
    setSaving(true); setSaveError("");
    try {
      const isEdit = modal && modal !== "new";
      const url = isEdit ? `/api/settings/leave-types/${(modal as LeaveType).id}` : "/api/settings/leave-types";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) { if (res.status === 401) { window.location.href = "/auth/login"; return; } setSaveError(json.error ?? "Failed to save."); return; }
      await fetchTypes(); setModal(null);
    } catch { setSaveError("Something went wrong."); }
    finally { setSaving(false); }
  };

  const handleToggleActive = async (lt: LeaveType) => {
    await fetch(`/api/settings/leave-types/${lt.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !lt.isActive }),
    });
    setTypes((prev) => prev.map((t) => t.id === lt.id ? { ...t, isActive: !lt.isActive } : t));
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/settings/leave-types/${id}`, { method: "DELETE" });
    setTypes((prev) => prev.filter((t) => t.id !== id));
    setDeleteId(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header
        title="Leave Types"
        subtitle="Configure leave entitlements aligned with Thai Labour Law"
        actions={
          <div className="flex items-center gap-2">
            {types.length === 0 && (
              <button onClick={handleSeed} disabled={seeding}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50">
                <Sparkles size={15} /> {seeding ? "Seeding…" : "Seed Thai Law Defaults"}
              </button>
            )}
            <button onClick={() => { setSaveError(""); setModal("new"); }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
              <Plus size={16} /> Add Leave Type
            </button>
          </div>
        }
      />

      <div className="p-6 space-y-4">
        {/* Thai Law info banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
          <BookOpen size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 space-y-0.5">
            <p className="font-semibold">Thai Labour Protection Act (พ.ร.บ.คุ้มครองแรงงาน)</p>
            <p>Annual Leave min 6 days (s.30) · Sick Leave 30 days paid (s.32) · Personal Leave 3 days (s.34) · Maternity 98 days/45 paid (s.41)</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-400">Loading…</div>
          ) : types.length === 0 ? (
            <div className="py-16 text-center">
              <CalendarDays size={32} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-600">No leave types configured</p>
              <p className="text-xs text-slate-400 mt-1">Seed Thai Labour Law defaults or add manually.</p>
              <button onClick={handleSeed} disabled={seeding}
                className="mt-4 px-4 py-2 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 flex items-center gap-2 mx-auto disabled:opacity-50">
                <Sparkles size={14} /> {seeding ? "Seeding…" : "Seed Thai Law Defaults"}
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
                  <th className="px-5 py-3 text-left font-medium">Thai Law Ref</th>
                  <th className="px-5 py-3 text-center font-medium">Active</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {types.map((lt) => (
                  <tr key={lt.id} className={cn("hover:bg-slate-50 transition-colors", !lt.isActive && "opacity-50")}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", colorDot[lt.color] ?? "bg-slate-400")} />
                        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", colorBadge[lt.color] ?? "bg-slate-100 text-slate-600")}>{lt.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-center font-semibold text-slate-800">{lt.daysPerYear === 0 ? "∞" : lt.daysPerYear}</td>
                    <td className="px-5 py-3 text-center">
                      {lt.isPaid ? <CheckCircle2 size={15} className="text-emerald-500 mx-auto" /> : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-3 text-center text-xs text-slate-500">
                      {lt.carryOver ? (lt.maxCarryOver > 0 ? `≤${lt.maxCarryOver}d` : "Yes") : "—"}
                    </td>
                    <td className="px-5 py-3 text-center">
                      {lt.requireDoc ? <CheckCircle2 size={15} className="text-amber-500 mx-auto" /> : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-400 max-w-[200px] truncate">{lt.thaiLawRef || "—"}</td>
                    <td className="px-5 py-3 text-center">
                      <button onClick={() => handleToggleActive(lt)}
                        className={cn("w-9 h-5 rounded-full transition-colors relative", lt.isActive ? "bg-emerald-500" : "bg-slate-200")}>
                        <span className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform", lt.isActive ? "translate-x-4" : "translate-x-0.5")} />
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
      </div>

      {modal !== null && (
        <LeaveTypeModal
          initial={modal === "new" ? undefined : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
          saving={saving}
          error={saveError}
        />
      )}

      {deleteId && (
        <div className="fixed inset-0 h-screen z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-600" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">Delete Leave Type</h3>
            <p className="text-sm text-slate-500 mb-6">
              Remove <strong>{types.find((t) => t.id === deleteId)?.name}</strong>? Existing leave records will keep the type label.
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
