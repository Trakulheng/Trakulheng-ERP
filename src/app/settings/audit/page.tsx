"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import { Search, RefreshCw, Filter, User, Clock, FileText, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";

interface AuditEntry {
  id: string; userId: string | null; userName: string | null; userRole: string | null;
  action: string; entity: string; entityId: string | null;
  details: Record<string, unknown> | null; createdAt: string;
}

const ACTION_COLORS: Record<string, string> = {
  create: "bg-emerald-100 text-emerald-700",
  update: "bg-blue-100 text-blue-700",
  delete: "bg-red-100 text-red-700",
  login:  "bg-violet-100 text-violet-700",
  export: "bg-amber-100 text-amber-700",
  default:"bg-slate-100 text-slate-600",
};

const ENTITIES = ["All", "Employee", "Payroll", "Invoice", "Product", "PO", "Branch", "User", "Settings"];
const ACTIONS  = ["All", "create", "update", "delete", "login", "export"];

export default function AuditLogPage() {
  const [logs,        setLogs]        = useState<AuditEntry[]>([]);
  const [total,       setTotal]       = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [entityFilter,setEntityFilter]= useState("All");
  const [actionFilter,setActionFilter]= useState("All");
  const [expanded,    setExpanded]    = useState<string | null>(null);
  const [offset,      setOffset]      = useState(0);
  const PAGE = 50;

  const fetchLogs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: String(PAGE), offset: String(offset) });
    if (entityFilter !== "All") params.set("entity", entityFilter);
    if (actionFilter !== "All") params.set("action", actionFilter);
    fetch(`/api/audit?${params}`)
      .then((r) => r.ok ? r.json() : { logs: [], total: 0 })
      .then((d) => { setLogs(d.logs ?? []); setTotal(d.total ?? 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [entityFilter, actionFilter, offset]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const filtered = search
    ? logs.filter((l) =>
        l.userName?.toLowerCase().includes(search.toLowerCase()) ||
        l.entity.toLowerCase().includes(search.toLowerCase()) ||
        l.action.toLowerCase().includes(search.toLowerCase()) ||
        l.entityId?.toLowerCase().includes(search.toLowerCase()))
    : logs;

  const formatDate = (d: string) => {
    const dt = new Date(d);
    return dt.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header
        title="Audit Log"
        subtitle={`${total} total events recorded`}
        actions={
          <button onClick={fetchLogs} className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        }
      />

      <div className="p-6 space-y-4">
        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by user, entity, action..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex items-center gap-1.5">
            <Filter size={13} className="text-slate-400" />
            <select value={entityFilter} onChange={(e) => { setEntityFilter(e.target.value); setOffset(0); }}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {ENTITIES.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setOffset(0); }}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            {ACTIONS.map((a) => <option key={a} value={a === "All" ? "All" : a}>{a === "All" ? "All Actions" : a.charAt(0).toUpperCase() + a.slice(1)}</option>)}
          </select>
          <span className="text-xs text-slate-400 ml-auto">{filtered.length} shown</span>
        </div>

        {/* Log Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <RefreshCw size={20} className="animate-spin mr-2" /> Loading audit log…
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
              <FileText size={32} className="opacity-40" />
              <p className="text-sm">No audit events found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filtered.map((log) => {
                const color = ACTION_COLORS[log.action] ?? ACTION_COLORS.default;
                const isOpen = expanded === log.id;
                const hasDetails = log.details && Object.keys(log.details).length > 0;
                return (
                  <div key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <div className="flex items-center gap-4 px-5 py-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <User size={14} className="text-slate-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-slate-800">{log.userName ?? "System"}</span>
                          {log.userRole && <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded capitalize">{log.userRole}</span>}
                          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize", color)}>{log.action}</span>
                          <span className="text-sm text-slate-600">{log.entity}{log.entityId ? ` #${log.entityId}` : ""}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock size={11} /> {formatDate(log.createdAt)}
                        </div>
                        {hasDetails && (
                          <button onClick={() => setExpanded(isOpen ? null : log.id)}
                            className="p-1 rounded hover:bg-slate-100 text-slate-400">
                            {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        )}
                      </div>
                    </div>
                    {isOpen && hasDetails && (
                      <div className="px-5 pb-3 pl-17">
                        <pre className="text-xs bg-slate-50 border border-slate-100 rounded-lg p-3 overflow-x-auto text-slate-600 max-h-48">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {total > PAGE && (
          <div className="flex items-center justify-between text-sm text-slate-500">
            <button onClick={() => setOffset(Math.max(0, offset - PAGE))} disabled={offset === 0}
              className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40">
              Previous
            </button>
            <span>Page {Math.floor(offset / PAGE) + 1} of {Math.ceil(total / PAGE)}</span>
            <button onClick={() => setOffset(offset + PAGE)} disabled={offset + PAGE >= total}
              className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40">
              Next
            </button>
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-sm text-amber-700">
          <AlertCircle size={15} className="shrink-0 mt-0.5 text-amber-500" />
          <p>Audit events are recorded automatically when users create, update, or delete records. Events are stored permanently and cannot be deleted.</p>
        </div>
      </div>
    </div>
  );
}
