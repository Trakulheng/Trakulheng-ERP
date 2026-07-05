"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { useBranch } from "@/context/BranchContext";
import { cn } from "@/lib/utils";
import {
  Users, UserCheck, Shield, UserPlus, Search, Pencil, Trash2, X,
  ChevronDown, Check, Mail, RefreshCw, Clock,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────

type UserRole   = "admin" | "manager" | "staff" | "viewer";
type UserStatus = "active" | "inactive" | "pending";

interface SystemUser {
  id:         string;
  employeeId: string;
  name:       string;
  email:      string;
  role:       UserRole;
  branchId:   string;
  branchIds:  string[];
  status:     UserStatus;
  startDate:  string;
  endDate:    string | null;
  lastLogin:  string;
  createdAt:  string;
}

interface Employee {
  id: string; name: string; department: string; position: string;
  hireDate: string; status: string; branchId?: string;
}

// ── Constants ─────────────────────────────────────────────────────────

const ROLE_COLORS: Record<UserRole, string> = {
  admin:   "bg-red-100 text-red-700",
  manager: "bg-amber-100 text-amber-700",
  staff:   "bg-blue-100 text-blue-700",
  viewer:  "bg-slate-100 text-slate-500",
};

const ROLE_LABELS: Record<UserRole, string> = {
  admin:   "Admin",
  manager: "Manager",
  staff:   "Staff",
  viewer:  "Viewer",
};

const STATUS_COLORS: Record<UserStatus, string> = {
  active:   "bg-emerald-100 text-emerald-700",
  inactive: "bg-slate-100 text-slate-500",
  pending:  "bg-amber-100 text-amber-700",
};

const STATUS_LABELS: Record<UserStatus, string> = {
  active:   "Active",
  inactive: "Inactive",
  pending:  "Invite Sent",
};

const AVATAR_COLORS = ["bg-blue-500","bg-violet-500","bg-emerald-500","bg-amber-500","bg-rose-500","bg-indigo-500"];

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function formatLastLogin(iso: string, status: UserStatus) {
  if (status === "pending") return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" })
    + " " + d.toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit", hour12:false });
}

// ── Employee search combobox ──────────────────────────────────────────

function EmpCombobox({ value, onChange, employees }: { value: string; onChange: (emp: Employee) => void; employees: Employee[] }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = employees.find((e) => e.id === value);

  const filtered = useMemo(() =>
    employees.filter((e) =>
      e.name.toLowerCase().includes(q.toLowerCase()) ||
      e.department.toLowerCase().includes(q.toLowerCase()) ||
      e.position.toLowerCase().includes(q.toLowerCase())
    ).slice(0, 7),
  [q, employees]);

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 rounded-lg cursor-pointer hover:border-blue-400">
        {selected ? (
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">{selected.name[0]}</div>
            <span className="font-medium text-slate-800 truncate">{selected.name}</span>
            <span className="text-xs text-slate-400">{selected.position}</span>
          </div>
        ) : (
          <span className="text-slate-400 flex-1">Search from employee list...</span>
        )}
        <ChevronDown size={13} className="text-slate-400 shrink-0" />
      </div>
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto py-1">
            {filtered.map((emp) => (
              <button key={emp.id} onClick={() => { onChange(emp); setOpen(false); setQ(""); }}
                className={cn("w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 text-left",
                  value === emp.id && "bg-blue-50")}>
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">{emp.name[0]}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 truncate">{emp.name}</p>
                  <p className="text-xs text-slate-400">{emp.position} · {emp.department}</p>
                </div>
                {value === emp.id && <Check size={13} className="text-blue-600 shrink-0" />}
              </button>
            ))}
            {filtered.length === 0 && <p className="text-xs text-slate-400 px-3 py-2">No employees found</p>}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Branch multi-select ───────────────────────────────────────────────

function BranchMultiSelect({ selected, onChange }: { selected: string[]; onChange: (ids: string[]) => void }) {
  const { branches } = useBranch();
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 min-h-[32px]">
        {selected.map((id) => {
          const b = branches.find((x) => x.id === id);
          return b ? (
            <span key={id} className="flex items-center gap-1 text-xs bg-blue-50 border border-blue-200 text-blue-700 px-2 py-0.5 rounded-full">
              {b.name}
              <button onClick={() => toggle(id)} className="hover:text-red-600"><X size={10} /></button>
            </span>
          ) : null;
        })}
        {selected.length === 0 && <span className="text-xs text-slate-400">No branches selected</span>}
      </div>
      {branches.length === 0 ? (
        <p className="text-xs text-slate-400">No branches configured yet — add branches in Settings → Branches.</p>
      ) : (
        <div className="grid grid-cols-2 gap-1">
          {branches.map((b) => (
            <button key={b.id} onClick={() => toggle(b.id)}
              className={cn("flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg border transition-colors text-left",
                selected.includes(b.id)
                  ? "border-blue-400 bg-blue-50 text-blue-700"
                  : "border-slate-200 text-slate-600 hover:border-slate-300")}>
              <div className={cn("w-4 h-4 rounded flex items-center justify-center shrink-0",
                selected.includes(b.id) ? "bg-blue-500" : "bg-slate-200")}>
                {selected.includes(b.id) && <Check size={9} className="text-white" />}
              </div>
              <span className="truncate">{b.name}</span>
              {b.isHeadOffice && <span className="text-amber-600 text-[10px] ml-auto">HQ</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Add/Edit Modal ────────────────────────────────────────────────────

interface UserModalProps {
  initial?: SystemUser;
  onClose: () => void;
  onSave: (u: SystemUser) => Promise<void>;
  onResendInvite?: () => void;
  resending?: boolean;
  saving: boolean;
  saveError: string;
}

function UserModal({ initial, onClose, onSave, onResendInvite, resending, saving, saveError }: UserModalProps) {
  const isEdit = !!initial;
  const { branches } = useBranch();

  const [empList,    setEmpList]    = useState<Employee[]>([]);
  const [employeeId, setEmployeeId] = useState(initial?.employeeId ?? "");
  const [name,       setName]       = useState(initial?.name       ?? "");
  const [email,      setEmail]      = useState(initial?.email      ?? "");
  const [role,       setRole]       = useState<UserRole>(initial?.role ?? "staff");
  const [branchIds,  setBranchIds]  = useState<string[]>(initial?.branchIds ?? []);
  const [startDate,  setStartDate]  = useState(initial?.startDate  ?? new Date().toISOString().split("T")[0]);
  const [endDate,    setEndDate]    = useState(initial?.endDate     ?? "");

  useEffect(() => {
    fetch("/api/employees")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setEmpList(data))
      .catch(() => {});
  }, []);

  const handleEmployeePick = (emp: Employee) => {
    setEmployeeId(emp.id);
    setName(emp.name);
    if (!email) {
      const slug = emp.name.toLowerCase().replace(/\s+/g, ".");
      setEmail(`${slug}@trakulheng.co.th`);
    }
    if (emp.hireDate) setStartDate(emp.hireDate);
    if (emp.branchId && !branchIds.includes(emp.branchId)) {
      setBranchIds([emp.branchId]);
    }
  };

  const canSave = name.trim() && email.trim() && branchIds.length > 0;

  const handleSave = async () => {
    const u: SystemUser = {
      id:         initial?.id ?? "",
      employeeId,
      name,
      email,
      role,
      branchId:   branchIds[0] ?? "",
      branchIds,
      status:     initial?.status ?? "pending",
      startDate,
      endDate:    endDate || null,
      lastLogin:  initial?.lastLogin  ?? new Date().toISOString(),
      createdAt:  initial?.createdAt  ?? new Date().toISOString().split("T")[0],
    };
    await onSave(u);
  };

  const linkedEmp = empList.find((e) => e.id === employeeId);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{isEdit ? "Edit User" : "Add User"}</h2>
            {!isEdit && (
              <p className="text-xs text-blue-600 mt-0.5 flex items-center gap-1">
                <Mail size={11} /> An invitation email will be sent automatically
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Link to Employee */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Link to Employee Record</label>
            <EmpCombobox value={employeeId} onChange={handleEmployeePick} employees={empList} />
            {linkedEmp && (
              <div className="mt-2 p-3 bg-slate-50 rounded-lg text-xs text-slate-600 space-y-1">
                <div className="flex gap-4">
                  <span>Dept: <strong>{linkedEmp.department}</strong></span>
                  <span>Position: <strong>{linkedEmp.position}</strong></span>
                </div>
                <div className="flex gap-4">
                  <span>Hire Date: <strong>{linkedEmp.hireDate}</strong></span>
                  <span>Status: <strong className="capitalize">{linkedEmp.status}</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* Identity */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Account Details</p>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Full Name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Somchai Wannasuk"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Email * <span className="text-slate-400">(invite will be sent here)</span></label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@trakulheng.co.th"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="staff">Staff</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Access Period</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Start Date</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <p className="text-xs text-slate-400 mt-1">Pre-filled from employee hire date</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">End Date <span className="text-slate-400">(optional)</span></label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <p className="text-xs text-slate-400 mt-1">Leave blank for no expiry</p>
              </div>
            </div>
          </div>

          {/* Branches */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Branch Access <span className="text-blue-600">{branchIds.length}</span></p>
            <BranchMultiSelect selected={branchIds} onChange={setBranchIds} />
          </div>
        </div>

        {saveError && (
          <div className="mx-6 mb-4 px-3.5 py-2.5 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">{saveError}</div>
        )}

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 sticky bottom-0 bg-white">
          <div className="flex items-center gap-2">
            <button onClick={onClose} disabled={saving}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
            {isEdit && initial?.status === "pending" && onResendInvite && (
              <button onClick={onResendInvite} disabled={resending || saving}
                className="flex items-center gap-1.5 px-4 py-2 text-sm text-amber-700 border border-amber-300 bg-amber-50 rounded-lg hover:bg-amber-100 disabled:opacity-50">
                <RefreshCw size={13} className={resending ? "animate-spin" : ""} />
                {resending ? "Sending…" : "Resend Invite"}
              </button>
            )}
          </div>
          <button disabled={!canSave || saving} onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40">
            {saving && <RefreshCw size={13} className="animate-spin" />}
            {saving ? "Sending invite…" : isEdit ? "Save Changes" : "Create & Send Invite"}
            {!saving && !isEdit && <Mail size={13} />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 4000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl text-sm animate-fade-in">
      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
        <Check size={12} className="text-white" />
      </div>
      {message}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────

export default function UserManagementPage() {
  const { branches } = useBranch();
  const [users,        setUsers]       = useState<SystemUser[]>([]);
  const [loadingUsers, setLoadingUsers]= useState(true);
  const [search,       setSearch]      = useState("");
  const [roleFilter,   setRoleFilter]  = useState<"all" | UserRole>("all");
  const [modalOpen,    setModalOpen]   = useState(false);
  const [editingUser,  setEditingUser] = useState<SystemUser | undefined>(undefined);
  const [deleteId,     setDeleteId]    = useState<string | null>(null);
  const [saving,       setSaving]      = useState(false);
  const [saveError,    setSaveError]   = useState("");
  const [toast,        setToast]       = useState("");
  const [resending,    setResending]   = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/users");
      if (res.ok) setUsers(await res.json());
    } catch {}
    setLoadingUsers(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = useMemo(() => users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchRole   = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  }), [users, search, roleFilter]);

  const stats = useMemo(() => ({
    total:   users.length,
    active:  users.filter((u) => u.status === "active").length,
    admins:  users.filter((u) => u.role === "admin").length,
    pending: users.filter((u) => u.status === "pending").length,
  }), [users]);

  const openNew  = () => { setSaveError(""); setEditingUser(undefined); setModalOpen(true); };
  const openEdit = (u: SystemUser) => { setSaveError(""); setEditingUser(u); setModalOpen(true); };

  const handleSave = async (u: SystemUser) => {
    setSaving(true);
    setSaveError("");
    try {
      const isEdit = !!u.id;
      const endpoint = isEdit ? `/api/settings/users/${u.id}` : "/api/settings/users";
      const method   = isEdit ? "PATCH" : "POST";
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(u),
      });
      const data = await res.json();
      if (!res.ok) { setSaveError(data.error ?? "Failed to save user."); return; }

      setUsers((prev) => {
        const idx = prev.findIndex((x) => x.id === data.id);
        if (idx >= 0) { const next = [...prev]; next[idx] = data; return next; }
        return [data, ...prev];
      });
      setModalOpen(false);
      if (!isEdit) setToast(`Invitation sent to ${data.email}`);
    } catch {
      setSaveError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/settings/users/${id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); alert(d.error); return; }
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setDeleteId(null);
    } catch {
      alert("Failed to delete user.");
    }
  };

  const handleResendInvite = async (u: SystemUser) => {
    setResending(u.id);
    try {
      const res = await fetch(`/api/settings/users/${u.id}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action: "resend-invite" }),
      });
      if (res.ok) setToast(`Invitation resent to ${u.email}`);
      else { const d = await res.json(); alert(d.error); }
    } catch {
      alert("Failed to resend invitation.");
    } finally {
      setResending(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header
        title="User Management"
        actions={
          <button onClick={openNew}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
            <UserPlus size={16} /> Add User
          </button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label:"Total Users",  value:stats.total,  icon:Users,     color:"text-blue-600",   bg:"bg-blue-50" },
            { label:"Active",       value:stats.active, icon:UserCheck, color:"text-emerald-600",bg:"bg-emerald-50" },
            { label:"Admins",       value:stats.admins, icon:Shield,    color:"text-red-600",    bg:"bg-red-50" },
          ].map(({ label, value, icon:Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-500">{label}</span>
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", bg)}>
                  <Icon size={18} className={color} />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              {label === "Total Users" && stats.pending > 0 && (
                <p className="text-xs text-amber-600 mt-1">{stats.pending} invite{stats.pending !== 1 ? "s" : ""} pending</p>
              )}
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
          </div>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="staff">Staff</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 uppercase tracking-wide border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 text-left font-medium">User</th>
                <th className="px-4 py-3 text-left font-medium">Role</th>
                <th className="px-4 py-3 text-left font-medium">Branches</th>
                <th className="px-4 py-3 text-left font-medium">Access Period</th>
                <th className="px-4 py-3 text-left font-medium">Last Login</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loadingUsers && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-400">Loading users…</td></tr>
              )}
              {!loadingUsers && filtered.map((u, i) => {
                const today   = new Date();
                const expired = u.endDate && new Date(u.endDate) < today;
                return (
                  <tr key={u.id} className={cn("hover:bg-slate-50 transition-colors", expired && "opacity-60")}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0", AVATAR_COLORS[i % AVATAR_COLORS.length])}>
                          {u.name ? initials(u.name) : "?"}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{u.name || "(unnamed)"}</p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full", ROLE_COLORS[u.role])}>
                        {ROLE_LABELS[u.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(u.branchIds ?? []).slice(0, 2).map((bid) => {
                          const b = branches.find((x: any) => x.id === bid);
                          return b ? (
                            <span key={bid} className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">{b.code}</span>
                          ) : null;
                        })}
                        {(u.branchIds ?? []).length > 2 && (
                          <span className="text-xs text-slate-400">+{(u.branchIds ?? []).length - 2}</span>
                        )}
                        {(u.branchIds ?? []).length === 0 && <span className="text-xs text-slate-300">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      <div>{u.startDate || "—"}</div>
                      {u.endDate && <div className={cn("text-xs", expired ? "text-red-500 font-medium" : "text-slate-400")}>→ {u.endDate}{expired ? " (expired)" : ""}</div>}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {u.status === "pending" ? (
                        <span className="flex items-center gap-1 text-amber-500"><Clock size={11} /> Awaiting setup</span>
                      ) : formatLastLogin(u.lastLogin, u.status)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full", STATUS_COLORS[u.status])}>
                        {STATUS_LABELS[u.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {u.status === "pending" && (
                          <button
                            onClick={() => handleResendInvite(u)}
                            disabled={resending === u.id}
                            title="Resend invite"
                            className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 disabled:opacity-40">
                            <RefreshCw size={14} className={resending === u.id ? "animate-spin" : ""} />
                          </button>
                        )}
                        <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => setDeleteId(u.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loadingUsers && filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-400">
                  {users.length === 0 ? "No users yet. Add the first user to get started." : "No users match your search."}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <UserModal
          initial={editingUser}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
          onResendInvite={editingUser ? () => handleResendInvite(editingUser) : undefined}
          resending={editingUser ? resending === editingUser.id : false}
          saving={saving}
          saveError={saveError}
        />
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><Trash2 size={22} className="text-red-600" /></div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">Delete User</h3>
            <p className="text-sm text-slate-500 mb-6">
              Remove <strong>{users.find((u) => u.id === deleteId)?.name}</strong>? This will revoke all access and cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
              <button onClick={() => void handleDelete(deleteId!)} className="flex-1 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} onDone={() => setToast("")} />}
    </div>
  );
}
