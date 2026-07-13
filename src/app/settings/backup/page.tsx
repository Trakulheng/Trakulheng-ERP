"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import {
  Download, Upload, ShieldCheck, AlertTriangle, CheckCircle2,
  Loader2, Database, FileJson, Trash2, Clock, Calendar, Play,
  Settings2, RefreshCw,
} from "lucide-react";

interface Snapshot {
  id: string;
  label: string;
  sizeBytes: number;
  createdAt: string;
}

interface BackupConfig {
  enabled: boolean;
  retentionDays: number;
  scheduleTime: string;
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const DEFAULT_CONFIG: BackupConfig = { enabled: true, retentionDays: 30, scheduleTime: "23:00" };

export default function BackupPage() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [snapsLoading, setSnapsLoading] = useState(true);
  const [config, setConfig] = useState<BackupConfig>(DEFAULT_CONFIG);
  const [configLoading, setConfigLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);
  const [fullSettings, setFullSettings] = useState<Record<string, unknown>>({});

  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [creatingManual, setCreatingManual] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [restoreResult, setRestoreResult] = useState<Record<string, number> | null>(null);
  const [restoreError, setRestoreError] = useState("");
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  const loadSnapshots = useCallback(async () => {
    setSnapsLoading(true);
    try {
      const res = await fetch("/api/settings/backup/snapshots");
      if (res.ok) setSnapshots(await res.json());
    } finally {
      setSnapsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSnapshots();
    fetch("/api/settings/general")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) { setFullSettings(d); if (d.backup) setConfig({ ...DEFAULT_CONFIG, ...d.backup }); }
        setConfigLoading(false);
      })
      .catch(() => setConfigLoading(false));
  }, [loadSnapshots]);

  async function saveConfig() {
    setSavingConfig(true);
    setConfigSaved(false);
    try {
      const res = await fetch("/api/settings/general", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fullSettings, backup: config }),
      });
      if (!res.ok) {
        if (res.status === 401) { window.location.href = "/auth/login"; return; }
      } else {
        setConfigSaved(true);
        setTimeout(() => setConfigSaved(false), 3000);
      }
    } finally {
      setSavingConfig(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch("/api/settings/backup");
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ddk-erp-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  async function createManualBackup() {
    setCreatingManual(true);
    try {
      const res = await fetch("/api/settings/backup/snapshots", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      if (res.ok) await loadSnapshots();
    } finally {
      setCreatingManual(false);
    }
  }

  async function downloadSnapshot(id: string) {
    const a = document.createElement("a");
    a.href = `/api/settings/backup/snapshots/${id}`;
    a.download = "";
    a.click();
  }

  async function deleteSnapshot(id: string) {
    setDeletingId(id);
    try {
      await fetch(`/api/settings/backup/snapshots/${id}`, { method: "DELETE" });
      setSnapshots((s) => s.filter((x) => x.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setConfirmRestore(true);
    setRestoreResult(null);
    setRestoreError("");
    e.target.value = "";
  }

  async function handleRestore() {
    if (!pendingFile) return;
    setImporting(true);
    setConfirmRestore(false);
    setRestoreError("");
    setRestoreResult(null);
    try {
      const text = await pendingFile.text();
      let json: unknown;
      try { json = JSON.parse(text); } catch { setRestoreError("Invalid JSON file."); return; }
      const res = await fetch("/api/settings/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      });
      if (!res.ok) {
        if (res.status === 401) { window.location.href = "/auth/login"; return; }
        const d = await res.json();
        setRestoreError(d.error ?? "Restore failed.");
        return;
      }
      const result = await res.json();
      setRestoreResult(result.restored);
      setPendingFile(null);
    } finally {
      setImporting(false);
    }
  }

  const LABEL: Record<string, string> = {
    generalSetting: "General Settings", branches: "Branches", departments: "Departments",
    leaveTypes: "Leave Types", brands: "Brands", productCategories: "Product Categories",
    supplierCategories: "Supplier Categories", rolePermissions: "Role Permissions",
    employees: "Employees", products: "Products", suppliers: "Suppliers",
    customers: "Customers", invoices: "Invoices", expenses: "Expenses",
    expenseLimits: "Expense Limits", taskLists: "Task Lists", tasks: "Tasks",
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header title="Backup & Restore" subtitle="Automated daily backups and manual export/import." />

      <div className="p-6 max-w-3xl space-y-6">

        {/* ── Schedule Config ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-2">
            <Settings2 size={16} className="text-violet-600" />
            <h2 className="text-base font-semibold text-slate-900">Automatic Backup Schedule</h2>
          </div>
          <div className="px-6 py-5 space-y-5">
            {configLoading ? (
              <div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin text-slate-400" /></div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800">Enable daily backups</p>
                    <p className="text-xs text-slate-500 mt-0.5">Snapshot is saved automatically every night at the scheduled time</p>
                  </div>
                  <button
                    onClick={() => setConfig((c) => ({ ...c, enabled: !c.enabled }))}
                    className={`relative w-11 h-6 rounded-full transition-colors ${config.enabled ? "bg-violet-600" : "bg-slate-200"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${config.enabled ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      <Clock size={13} className="inline mr-1 text-slate-400" />
                      Backup time (server UTC)
                    </label>
                    <input
                      type="time"
                      value={config.scheduleTime}
                      onChange={(e) => setConfig((c) => ({ ...c, scheduleTime: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      <Calendar size={13} className="inline mr-1 text-slate-400" />
                      Keep backups for (days)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={config.retentionDays}
                      onChange={(e) => setConfig((c) => ({ ...c, retentionDays: Math.max(1, Math.min(365, parseInt(e.target.value) || 1)) }))}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={saveConfig}
                    disabled={savingConfig}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    {savingConfig ? <Loader2 size={14} className="animate-spin" /> : null}
                    {savingConfig ? "Saving…" : "Save Schedule"}
                  </button>
                  {configSaved && (
                    <span className="flex items-center gap-1.5 text-sm text-emerald-600">
                      <CheckCircle2 size={14} /> Saved
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400">
                  Note: The cron schedule is fixed at <strong>23:00 UTC</strong> via Vercel. The &quot;backup time&quot; field above is for display only and reflects when the job runs. To change the actual trigger time, update <code className="bg-slate-100 px-1 rounded">vercel.json</code>.
                </p>
              </>
            )}
          </div>
        </div>

        {/* ── Snapshot History ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database size={16} className="text-blue-600" />
              <h2 className="text-base font-semibold text-slate-900">Backup History</h2>
              <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">{snapshots.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={loadSnapshots} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                <RefreshCw size={14} />
              </button>
              <button
                onClick={createManualBackup}
                disabled={creatingManual}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                {creatingManual ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                {creatingManual ? "Creating…" : "Backup Now"}
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-50">
            {snapsLoading ? (
              <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-slate-300" /></div>
            ) : snapshots.length === 0 ? (
              <div className="text-center py-10 text-sm text-slate-400">
                <Database size={28} className="mx-auto mb-2 opacity-30" />
                No backups yet. Click &quot;Backup Now&quot; to create one.
              </div>
            ) : (
              snapshots.map((s) => (
                <div key={s.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <Database size={14} className="text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{s.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{fmtDate(s.createdAt)} · {fmtSize(s.sizeBytes)}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => downloadSnapshot(s.id)}
                      title="Download"
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      <Download size={14} />
                    </button>
                    <button
                      onClick={() => deleteSnapshot(s.id)}
                      disabled={deletingId === s.id}
                      title="Delete"
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50"
                    >
                      {deletingId === s.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Manual Export ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-2">
            <Download size={16} className="text-slate-600" />
            <h2 className="text-base font-semibold text-slate-900">Export as File</h2>
          </div>
          <div className="px-6 py-5">
            <p className="text-sm text-slate-500 mb-4">Download a <code className="bg-slate-100 px-1 rounded text-xs">.json</code> snapshot directly to your computer — independent of the backup history above.</p>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 hover:bg-slate-50 disabled:opacity-60 text-slate-700 text-sm font-medium rounded-lg transition-colors"
            >
              {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              {exporting ? "Exporting…" : "Download Backup File"}
            </button>
          </div>
        </div>

        {/* ── Restore ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-2">
            <Upload size={16} className="text-amber-600" />
            <h2 className="text-base font-semibold text-slate-900">Restore from File</h2>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-800">
                This merges backup data into the current database. Existing records with matching IDs will be overwritten.
              </p>
            </div>

            <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={handleFileSelect} />

            <button
              onClick={() => fileRef.current?.click()}
              disabled={importing}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {importing ? <Loader2 size={14} className="animate-spin" /> : <FileJson size={14} />}
              {importing ? "Restoring…" : "Select Backup File"}
            </button>

            {confirmRestore && pendingFile && (
              <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={15} className="text-slate-600" />
                  <p className="text-sm font-semibold text-slate-900">Confirm Restore</p>
                </div>
                <p className="text-sm text-slate-600">
                  Restore <strong>{pendingFile.name}</strong> ({fmtSize(pendingFile.size)})?
                </p>
                <div className="flex gap-2">
                  <button onClick={handleRestore} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg">
                    Yes, Restore Now
                  </button>
                  <button onClick={() => { setConfirmRestore(false); setPendingFile(null); }} className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {restoreError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <AlertTriangle size={14} className="text-red-600 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700">{restoreError}</p>
              </div>
            )}

            {restoreResult && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600" />
                  <p className="text-sm font-semibold text-emerald-800">Restore completed successfully</p>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                  {Object.entries(restoreResult).map(([key, count]) => (
                    <div key={key} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">{LABEL[key] ?? key}</span>
                      <span className="font-semibold text-emerald-700">{count} records</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Neon PITR hint */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4">
          <p className="text-sm font-semibold text-blue-900">Need to restore a specific date from before the last backup?</p>
          <p className="text-sm text-blue-700 mt-1">
            Use <strong>Neon Point-in-Time Restore</strong> from your Neon dashboard (paid plans only). Go to <strong>neon.tech → your project → Restore</strong>.
          </p>
        </div>

      </div>
    </div>
  );
}
