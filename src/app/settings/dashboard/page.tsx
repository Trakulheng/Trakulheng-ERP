"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Header } from "@/components/layout/Header";
import { ALL_WIDGETS, DEFAULT_WIDGETS, type WidgetConfig } from "@/lib/dashboard-widgets";
import { cn } from "@/lib/utils";
import { GripVertical, Eye, EyeOff, RotateCcw, Save, Check } from "lucide-react";

const ROLES = [
  { id: "admin",   label: "Admin",   color: "bg-red-100 text-red-700" },
  { id: "manager", label: "Manager", color: "bg-amber-100 text-amber-700" },
  { id: "staff",   label: "Staff",   color: "bg-blue-100 text-blue-700" },
  { id: "viewer",  label: "Viewer",  color: "bg-slate-100 text-slate-600" },
] as const;

type Role = typeof ROLES[number]["id"];

const TYPE_COLORS: Record<string, string> = {
  kpi:   "bg-blue-50 text-blue-600 border-blue-200",
  chart: "bg-violet-50 text-violet-600 border-violet-200",
  table: "bg-emerald-50 text-emerald-600 border-emerald-200",
  list:  "bg-amber-50 text-amber-600 border-amber-200",
};

export default function DashboardSettingsPage() {
  const [activeRole, setActiveRole] = useState<Role>("admin");
  const [configs,    setConfigs]    = useState<Record<Role, WidgetConfig[]>>({
    admin:   [...DEFAULT_WIDGETS.admin],
    manager: [...DEFAULT_WIDGETS.manager],
    staff:   [...DEFAULT_WIDGETS.staff],
    viewer:  [...DEFAULT_WIDGETS.viewer],
  });
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [loading, setLoading] = useState(true);

  // DnD state
  const dragIdx  = useRef<number | null>(null);
  const overIdx  = useRef<number | null>(null);

  useEffect(() => {
    (async () => {
      const results = await Promise.all(
        ROLES.map((r) =>
          fetch(`/api/settings/dashboard-config?role=${r.id}`)
            .then((res) => res.ok ? res.json() : null)
        )
      );
      setConfigs({
        admin:   results[0]?.widgets ?? [...DEFAULT_WIDGETS.admin],
        manager: results[1]?.widgets ?? [...DEFAULT_WIDGETS.manager],
        staff:   results[2]?.widgets ?? [...DEFAULT_WIDGETS.staff],
        viewer:  results[3]?.widgets ?? [...DEFAULT_WIDGETS.viewer],
      });
      setLoading(false);
    })();
  }, []);

  const widgets = configs[activeRole].slice().sort((a, b) => a.order - b.order);

  const updateConfig = useCallback((updated: WidgetConfig[]) => {
    setConfigs((prev) => ({ ...prev, [activeRole]: updated }));
  }, [activeRole]);

  const toggleEnabled = (id: string) => {
    updateConfig(
      configs[activeRole].map((w) => w.id === id ? { ...w, enabled: !w.enabled } : w)
    );
  };

  // Drag handlers
  const onDragStart = (idx: number) => { dragIdx.current = idx; };
  const onDragOver  = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    overIdx.current = idx;
  };
  const onDrop = () => {
    if (dragIdx.current === null || overIdx.current === null) return;
    const from = dragIdx.current;
    const to   = overIdx.current;
    if (from === to) return;

    const sorted = [...widgets];
    const [moved] = sorted.splice(from, 1);
    sorted.splice(to, 0, moved);
    updateConfig(sorted.map((w, i) => ({ ...w, order: i })));
    dragIdx.current = null; overIdx.current = null;
  };

  const handleReset = () => {
    setConfigs((prev) => ({ ...prev, [activeRole]: [...DEFAULT_WIDGETS[activeRole]] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/settings/dashboard-config", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ role: activeRole, widgets: configs[activeRole] }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {}
    setSaving(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header title="Dashboard Layout" subtitle="Configure what each role sees on their dashboard" />

      <div className="p-6 space-y-6">
        {/* Role tabs */}
        <div className="flex gap-2 flex-wrap">
          {ROLES.map((r) => (
            <button key={r.id} onClick={() => setActiveRole(r.id)}
              className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border",
                activeRole === r.id
                  ? "bg-white border-blue-400 text-blue-700 shadow-sm"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300")}>
              <span className={cn("text-xs px-1.5 py-0.5 rounded font-mono", r.color)}>{r.label}</span>
              <span className="text-xs text-slate-400">
                {configs[r.id].filter((w) => w.enabled).length}/{ALL_WIDGETS.length} widgets
              </span>
            </button>
          ))}
        </div>

        {/* Widget list */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                {ROLES.find((r) => r.id === activeRole)?.label} Dashboard Widgets
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Drag to reorder · Toggle to show/hide</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
                <RotateCcw size={12} /> Reset defaults
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {saved ? <Check size={12} /> : <Save size={12} />}
                {saved ? "Saved!" : saving ? "Saving…" : "Save Layout"}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-sm text-slate-400">Loading…</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {widgets.map((wc, idx) => {
                const def = ALL_WIDGETS.find((d) => d.id === wc.id);
                if (!def) return null;
                return (
                  <div
                    key={wc.id}
                    draggable
                    onDragStart={() => onDragStart(idx)}
                    onDragOver={(e) => onDragOver(e, idx)}
                    onDrop={onDrop}
                    className={cn(
                      "flex items-center gap-4 px-5 py-3.5 transition-colors cursor-grab active:cursor-grabbing",
                      !wc.enabled && "opacity-40",
                      "hover:bg-slate-50"
                    )}
                  >
                    <GripVertical size={16} className="text-slate-300 shrink-0" />
                    <div className="w-6 h-6 bg-slate-100 rounded text-slate-500 flex items-center justify-center text-xs font-bold shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-800">{def.label}</p>
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-medium uppercase tracking-wide", TYPE_COLORS[def.type])}>
                          {def.type}
                        </span>
                        <span className="text-[10px] text-slate-400 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
                          {def.size === "sm" ? "1/4 width" : def.size === "md" ? "1/2 width" : "Full width"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{def.description}</p>
                    </div>
                    <button onClick={() => toggleEnabled(wc.id)}
                      className={cn("p-2 rounded-lg transition-colors",
                        wc.enabled ? "text-emerald-600 hover:bg-emerald-50" : "text-slate-400 hover:bg-slate-100")}
                      title={wc.enabled ? "Hide widget" : "Show widget"}>
                      {wc.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Preview hint */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
          <strong>How it works:</strong> Each user role sees only their configured widgets on the Dashboard.
          Changes saved here take effect immediately for all users with that role.
          Users cannot modify their own layout — only admins can configure this.
        </div>
      </div>
    </div>
  );
}
