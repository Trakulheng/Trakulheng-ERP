"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import {
  Shield, Check, X, Eye, Pencil, Plus, Save, Lock, Info, Trash2, Tag,
  ChevronUp, ChevronDown, LayoutDashboard, CheckSquare, DollarSign,
  Package, TrendingUp, UserCheck, HeartHandshake, Settings as SettingsIcon,
  PanelLeft,
} from "lucide-react";

const MENU_SECTIONS = [
  { id: "dashboard",  label: "Dashboard",   icon: LayoutDashboard },
  { id: "tasks",      label: "Tasks",        icon: CheckSquare     },
  { id: "finance",    label: "Finance",      icon: DollarSign      },
  { id: "inventory",  label: "Inventory",    icon: Package         },
  { id: "sales_crm",  label: "Sales & CRM",  icon: TrendingUp      },
  { id: "hr_payroll", label: "HR & Payroll", icon: UserCheck       },
  { id: "crm",        label: "CRM",          icon: HeartHandshake  },
  { id: "settings",   label: "Settings",     icon: SettingsIcon    },
];

const DEFAULT_MENU_ORDER = MENU_SECTIONS.map((s) => s.id);

// ── Types ─────────────────────────────────────────────────────────────

type Action = "create" | "edit" | "view" | "sidebar";

interface ModulePerms {
  create:   boolean;
  edit:     boolean;
  view:     boolean;
  sidebar?: boolean;
}

type PermMatrix = Record<string, ModulePerms>;

interface RoleDef {
  id:      string;
  label:   string;
  color:   string;
  badge:   string;
  locked?: boolean;
  custom?: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────

const SYSTEM_ROLES: RoleDef[] = [
  { id: "admin",   label: "Admin",   color: "text-red-700",   badge: "bg-red-100 text-red-700",   locked: true },
  { id: "manager", label: "Manager", color: "text-amber-700", badge: "bg-amber-100 text-amber-700" },
  { id: "staff",   label: "Staff",   color: "text-blue-700",  badge: "bg-blue-100 text-blue-700"  },
  { id: "viewer",  label: "Viewer",  color: "text-slate-600", badge: "bg-slate-100 text-slate-600" },
];

const COLOR_OPTIONS: { label: string; color: string; badge: string }[] = [
  { label: "Purple",  color: "text-purple-700",  badge: "bg-purple-100 text-purple-700"  },
  { label: "Teal",    color: "text-teal-700",    badge: "bg-teal-100 text-teal-700"      },
  { label: "Pink",    color: "text-pink-700",    badge: "bg-pink-100 text-pink-700"      },
  { label: "Indigo",  color: "text-indigo-700",  badge: "bg-indigo-100 text-indigo-700"  },
  { label: "Orange",  color: "text-orange-700",  badge: "bg-orange-100 text-orange-700"  },
  { label: "Emerald", color: "text-emerald-700", badge: "bg-emerald-100 text-emerald-700"},
  { label: "Rose",    color: "text-rose-700",    badge: "bg-rose-100 text-rose-700"      },
  { label: "Cyan",    color: "text-cyan-700",    badge: "bg-cyan-100 text-cyan-700"      },
];

const MODULES: { id: string; label: string; group: string; description: string }[] = [
  { id: "finance_overview",  label: "Overview",         group: "Finance",   description: "Finance dashboard and summary" },
  { id: "finance_invoices",  label: "Invoices",         group: "Finance",   description: "Create, edit and view invoices" },
  { id: "finance_expenses",  label: "Expenses",         group: "Finance",   description: "Create, edit and view expense records" },
  { id: "inv_overview",      label: "Overview",         group: "Inventory", description: "Inventory dashboard and summary" },
  { id: "inv_products",      label: "Products",         group: "Inventory", description: "Manage product catalogue and stock" },
  { id: "inv_po",            label: "Purchase Orders",  group: "Inventory", description: "Create and manage POs sent to suppliers" },
  { id: "inv_po_prices",    label: "See PO Unit Prices", group: "Inventory", description: "View unit prices and totals in purchase orders" },
  { id: "inv_gr",            label: "Goods Receive",    group: "Inventory", description: "Receive stock against a PO" },
  { id: "inv_suppliers",     label: "Suppliers",        group: "Inventory", description: "Manage supplier list and details" },
  { id: "sales_overview",    label: "Overview",         group: "Sales",     description: "Sales dashboard and summary" },
  { id: "sales_customers",   label: "Customers",        group: "Sales",     description: "Customer profiles and records" },
  { id: "sales_orders",      label: "Sales Orders",     group: "Sales",     description: "Create and manage sales orders" },
  { id: "hr_overview",       label: "Overview",         group: "HR",        description: "HR dashboard and summary" },
  { id: "hr_employees",      label: "Employees",        group: "HR",        description: "Employee records and profiles" },
  { id: "hr_payroll",        label: "Payroll",          group: "HR",        description: "Payroll runs and salary data" },
  { id: "hr_leave",          label: "Leave",            group: "HR",        description: "Leave requests and approvals" },
  { id: "hr_attendance",     label: "Attendance",       group: "HR",        description: "Clock-in/out and attendance records" },
  { id: "hr_shifts",         label: "Shift Management", group: "HR",        description: "Schedule shifts and manage assignments" },
  { id: "crm_overview",      label: "Overview",         group: "CRM",       description: "CRM dashboard and summary" },
  { id: "crm_customers",     label: "CRM Customers",    group: "CRM",       description: "Loyalty members and points" },
  { id: "crm_campaigns",     label: "Campaigns",        group: "CRM",       description: "Marketing campaigns" },
  { id: "crm_rewards",       label: "Rewards",          group: "CRM",       description: "Reward catalogue management" },
  { id: "crm_redemptions",   label: "Redemptions",      group: "CRM",       description: "Redeem and manage customer rewards" },
  { id: "crm_analytics",     label: "CRM Analytics",    group: "CRM",       description: "CRM performance analytics and reports" },
  { id: "set_general",       label: "General Settings", group: "Settings",  description: "Company information and preferences" },
  { id: "set_branches",      label: "Branches",         group: "Settings",  description: "Branch management" },
  { id: "set_brands",        label: "House Brands",     group: "Settings",  description: "Brand configuration" },
  { id: "set_departments",   label: "Departments",      group: "Settings",  description: "Department structure" },
  { id: "set_users",         label: "Users",            group: "Settings",  description: "System user management" },
  { id: "set_dashboard",     label: "Dashboard Layout", group: "Settings",  description: "Configure dashboard widgets per role" },
  { id: "set_roles",         label: "Role Permissions", group: "Settings",  description: "This permissions matrix" },
  { id: "set_points",        label: "Points Config",    group: "Settings",  description: "Loyalty points rules and configuration" },
  { id: "set_security",      label: "Security",         group: "Settings",  description: "PIN and biometric access settings" },
  { id: "set_audit",         label: "Audit Log",        group: "Settings",  description: "View system audit trail" },
  { id: "set_notifications", label: "Notifications",    group: "Settings",  description: "Notification preferences" },
  { id: "set_appearance",    label: "Appearance",       group: "Settings",  description: "Theme and display settings" },
  // Column Visibility
  { id: "col_emp_salary",    label: "Employee: Salary",       group: "Column Visibility", description: "Show salary & compensation in employee table" },
  { id: "col_emp_verified",  label: "Employee: Verified",     group: "Column Visibility", description: "Show identity verification status in employee table" },
  { id: "col_emp_hire_date", label: "Employee: Hire Date",    group: "Column Visibility", description: "Show hire date in employee table" },
  { id: "col_emp_type",      label: "Employee: Type",         group: "Column Visibility", description: "Show employment type (full-time/part-time) in employee table" },
  { id: "col_prod_price",    label: "Product: Unit Price",    group: "Column Visibility", description: "Show unit price in product list" },
  { id: "col_prod_stk_val",  label: "Product: Stock Value",   group: "Column Visibility", description: "Show total stock value in product list" },
  { id: "col_prod_lead",     label: "Product: Lead Time",     group: "Column Visibility", description: "Show lead time in product list" },
];

const GROUPS = Array.from(new Set(MODULES.map((m) => m.group)));

// ── Defaults ──────────────────────────────────────────────────────────

const FULL: ModulePerms      = { create: true,  edit: true,  view: true,  sidebar: true  };
const VIEW_ONLY: ModulePerms = { create: false, edit: false, view: true,  sidebar: true  };
const NO_ACCESS: ModulePerms = { create: false, edit: false, view: false, sidebar: false };

function emptyPermMatrix(): PermMatrix {
  return Object.fromEntries(MODULES.map((m) => [m.id, { ...NO_ACCESS }]));
}

function buildDefault(): Record<string, PermMatrix> {
  const ids = MODULES.map((m) => m.id);

  const admin: PermMatrix   = Object.fromEntries(ids.map((id) => [id, { ...FULL }]));

  const OVERVIEW_IDS = ["finance_overview","inv_overview","sales_overview","hr_overview","crm_overview"];

  const manager: PermMatrix = Object.fromEntries(ids.map((id) => {
    if (OVERVIEW_IDS.includes(id))                                     return [id, { ...VIEW_ONLY }];
    if (["set_users","set_roles"].includes(id))                        return [id, { ...NO_ACCESS }];
    if (["set_general","set_branches"].includes(id))                   return [id, { ...VIEW_ONLY }];
    if (["hr_payroll","crm_campaigns"].includes(id))                   return [id, { ...VIEW_ONLY }];
    return [id, { ...FULL }];
  }));

  const staff: PermMatrix   = Object.fromEntries(ids.map((id) => {
    if (OVERVIEW_IDS.includes(id))                                     return [id, { ...VIEW_ONLY }];
    if (id.startsWith("set_"))                                         return [id, { ...NO_ACCESS }];
    if (["hr_employees","hr_payroll"].includes(id))                    return [id, { ...NO_ACCESS }];
    if (["inv_suppliers","crm_campaigns","crm_rewards"].includes(id))  return [id, { ...VIEW_ONLY }];
    if (["finance_invoices","finance_expenses"].includes(id))          return [id, { ...VIEW_ONLY }];
    if (id === "inv_po_prices")                                        return [id, { ...NO_ACCESS }];
    // Column visibility defaults for staff
    if (id === "col_emp_salary")       return [id, { ...NO_ACCESS }];
    if (id.startsWith("col_"))         return [id, { ...VIEW_ONLY }];
    return [id, { ...FULL }];
  }));

  const viewer: PermMatrix  = Object.fromEntries(ids.map((id) => {
    if (id.startsWith("set_"))         return [id, { ...NO_ACCESS }];
    if (id === "hr_payroll")           return [id, { ...NO_ACCESS }];
    if (id === "inv_po_prices")        return [id, { ...NO_ACCESS }];
    // Column visibility defaults for viewer
    if (["col_emp_salary","col_emp_verified","col_prod_price","col_prod_stk_val"].includes(id)) return [id, { ...NO_ACCESS }];
    if (id.startsWith("col_"))         return [id, { ...VIEW_ONLY }];
    return [id, { ...VIEW_ONLY }];
  }));

  return { admin, manager, staff, viewer };
}

// ── Toggle cell ───────────────────────────────────────────────────────

function ToggleCell({ checked, locked, onChange, action }: {
  checked: boolean; locked: boolean; onChange: () => void; action: Action;
}) {
  const icons: Record<Action, React.ReactNode> = {
    create: <Plus size={11} />, edit: <Pencil size={11} />, view: <Eye size={11} />, sidebar: <PanelLeft size={11} />,
  };
  return (
    <button
      onClick={locked ? undefined : onChange}
      disabled={locked}
      title={locked ? "Admin always has full access" : `Toggle ${action}`}
      className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors mx-auto",
        locked
          ? "cursor-default bg-slate-100 text-slate-300"
          : checked
            ? "bg-emerald-500 text-white hover:bg-emerald-600"
            : "bg-slate-100 text-slate-300 hover:bg-slate-200 hover:text-slate-500"
      )}>
      {locked ? <Lock size={10} /> : checked ? icons[action] : <X size={10} />}
    </button>
  );
}

function SidebarCell({ checked, locked, onChange }: { checked: boolean; locked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={locked ? undefined : onChange}
      disabled={locked}
      title={locked ? "Admin always has full access" : "Toggle sidebar visibility"}
      className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors mx-auto",
        locked
          ? "cursor-default bg-slate-100 text-slate-300"
          : checked
            ? "bg-indigo-500 text-white hover:bg-indigo-600"
            : "bg-slate-100 text-slate-300 hover:bg-slate-200 hover:text-slate-500"
      )}>
      {locked ? <Lock size={10} /> : checked ? <PanelLeft size={11} /> : <X size={10} />}
    </button>
  );
}

// ── Create Role Modal ─────────────────────────────────────────────────

interface CreateRoleModalProps {
  existingRoles: RoleDef[];
  existingPerms: Record<string, PermMatrix>;
  onClose: () => void;
  onSave:  (role: RoleDef, perms: PermMatrix) => void;
}

function CreateRoleModal({ existingRoles, existingPerms, onClose, onSave }: CreateRoleModalProps) {
  const [name,       setName]       = useState("");
  const [colorIdx,   setColorIdx]   = useState(0);
  const [template,   setTemplate]   = useState("viewer");
  const [localPerms, setLocalPerms] = useState<PermMatrix>(
    () => JSON.parse(JSON.stringify(existingPerms["viewer"] ?? emptyPermMatrix()))
  );

  const handleTemplate = (id: string) => {
    setTemplate(id);
    setLocalPerms(
      id === "__empty__"
        ? emptyPermMatrix()
        : JSON.parse(JSON.stringify(existingPerms[id] ?? emptyPermMatrix()))
    );
  };

  const toggle = (moduleId: string, action: Action) => {
    setLocalPerms((prev) => {
      const existing = prev[moduleId] ?? { ...NO_ACCESS };
      const sidebar  = existing.sidebar !== undefined ? existing.sidebar : existing.view;
      const cur      = { ...existing, sidebar };
      const updated  = { ...cur, [action]: !cur[action] };
      if ((action === "create" || action === "edit") && !updated.view) updated.view = true;
      if (action === "view" && !updated.view) { updated.create = false; updated.edit = false; updated.sidebar = false; }
      return { ...prev, [moduleId]: updated };
    });
  };

  const color    = COLOR_OPTIONS[colorIdx];
  const canSave  = name.trim().length > 0;

  const handleSave = () => {
    const id = `custom_${name.trim().toLowerCase().replace(/\s+/g, "_")}_${Date.now()}`;
    onSave({ id, label: name.trim(), color: color.color, badge: color.badge, custom: true }, localPerms);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Shield size={15} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Create New Role</h2>
              <p className="text-xs text-slate-400">Define a custom role with specific permissions</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>

        <div className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Role Name *</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Warehouse Supervisor, Cashier, Accountant…"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Preview badge */}
          {name.trim() && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Preview:</span>
              <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5", color.badge)}>
                <Shield size={11} className={color.color} />
                {name.trim()}
              </span>
            </div>
          )}

          {/* Color picker */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Badge Color</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c, i) => (
                <button key={i} onClick={() => setColorIdx(i)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all",
                    c.badge,
                    colorIdx === i ? "border-slate-600 ring-2 ring-offset-1 ring-slate-300" : "border-transparent hover:scale-105"
                  )}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Template */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Copy Permissions From</label>
            <select
              value={template}
              onChange={(e) => handleTemplate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="__empty__">Start empty (no access)</option>
              {existingRoles.map((r) => (
                <option key={r.id} value={r.id}>Copy from {r.label}</option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1">You can fine-tune individual permissions below</p>
          </div>

          {/* Compact permissions matrix */}
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Module</th>
                  <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 w-16">
                    <div className="flex items-center justify-center gap-1"><Plus size={10} /> Create</div>
                  </th>
                  <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 w-16">
                    <div className="flex items-center justify-center gap-1"><Pencil size={10} /> Edit</div>
                  </th>
                  <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 w-16">
                    <div className="flex items-center justify-center gap-1"><Eye size={10} /> View</div>
                  </th>
                  <th className="text-center px-3 py-2.5 text-xs font-semibold text-indigo-500 w-16">
                    <div className="flex items-center justify-center gap-1"><PanelLeft size={10} /> Sidebar</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {GROUPS.map((group) => (
                  <React.Fragment key={group}>
                    <tr className="bg-slate-50 border-y border-slate-100">
                      <td colSpan={5} className="px-4 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{group}</td>
                    </tr>
                    {MODULES.filter((m) => m.group === group).map((mod) => {
                      const p       = localPerms[mod.id] ?? { ...NO_ACCESS };
                      const sidebar = p.sidebar !== undefined ? p.sidebar : p.view;
                      const isCol   = group === "Column Visibility";
                      return (
                        <tr key={mod.id} className={cn("border-b border-slate-50 hover:bg-slate-50/50", !p.view && "opacity-40")}>
                          <td className="px-4 py-2 text-xs font-medium text-slate-800">{mod.label}</td>
                          <td className="px-3 py-2 text-center">{isCol ? <span className="text-slate-200">—</span> : <ToggleCell checked={p.create} locked={false} action="create" onChange={() => toggle(mod.id, "create")} />}</td>
                          <td className="px-3 py-2 text-center">{isCol ? <span className="text-slate-200">—</span> : <ToggleCell checked={p.edit}   locked={false} action="edit"   onChange={() => toggle(mod.id, "edit")}   />}</td>
                          <td className="px-3 py-2 text-center"><ToggleCell checked={p.view}   locked={false} action="view"   onChange={() => toggle(mod.id, "view")}   /></td>
                          <td className="px-3 py-2 text-center">{isCol ? <span className="text-slate-200">—</span> : <SidebarCell checked={sidebar} locked={false} onChange={() => toggle(mod.id, "sidebar")} />}</td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 sticky bottom-0 bg-white">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
          <button disabled={!canSave} onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40">
            <Plus size={15} /> Create Role
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────

export default function RolePermissionsPage() {
  const [roles,      setRoles]      = useState<RoleDef[]>(SYSTEM_ROLES);
  const [perms,      setPerms]      = useState<Record<string, PermMatrix>>(buildDefault);
  const [menuOrders, setMenuOrders] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(SYSTEM_ROLES.map((r) => [r.id, [...DEFAULT_MENU_ORDER]]))
  );
  const [saved,      setSaved]      = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [saveError,  setSaveError]  = useState("");
  const [loading,    setLoading]    = useState(true);
  const [active,     setActive]     = useState<string>("manager");
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId,   setDeleteId]   = useState<string | null>(null);

  // Load saved permissions and menu orders from DB on mount
  useEffect(() => {
    fetch("/api/settings/role-permissions")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (!d || typeof d !== "object") return;
        if (d.permissions && typeof d.permissions === "object") {
          setPerms((prev) => {
            const merged = { ...prev };
            for (const [roleId, savedPerms] of Object.entries(d.permissions)) {
              if (savedPerms && typeof savedPerms === "object") {
                // Merge on top of defaults so newly-added modules keep their defaults
                merged[roleId] = { ...(prev[roleId] ?? {}), ...(savedPerms as PermMatrix) };
              }
            }
            return merged;
          });
        }
        if (d.menuOrders && typeof d.menuOrders === "object") {
          setMenuOrders((prev) => {
            const merged = { ...prev };
            for (const [roleId, order] of Object.entries(d.menuOrders)) {
              if (Array.isArray(order)) merged[roleId] = order as string[];
            }
            return merged;
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggle = (roleId: string, moduleId: string, action: Action) => {
    setPerms((prev) => {
      const existing = prev[roleId]?.[moduleId] ?? { ...NO_ACCESS };
      const sidebar  = existing.sidebar !== undefined ? existing.sidebar : existing.view;
      const cur      = { ...existing, sidebar };
      const updated  = { ...cur, [action]: !cur[action] };
      if ((action === "create" || action === "edit") && !updated.view) updated.view = true;
      if (action === "view" && !updated.view) { updated.create = false; updated.edit = false; updated.sidebar = false; }
      return { ...prev, [roleId]: { ...prev[roleId], [moduleId]: updated } };
    });
  };

  const moveMenuItem = (roleId: string, idx: number, dir: -1 | 1) => {
    setMenuOrders((prev) => {
      const order = [...(prev[roleId] ?? DEFAULT_MENU_ORDER)];
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= order.length) return prev;
      [order[idx], order[newIdx]] = [order[newIdx], order[idx]];
      return { ...prev, [roleId]: order };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/settings/role-permissions", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ roles: perms, menuOrders }),
      });
      if (!res.ok) {
        const d = await res.json();
        setSaveError(d.error ?? "Failed to save.");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      window.dispatchEvent(new Event("permissions-updated"));
    } catch {
      setSaveError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRole = (role: RoleDef, rolePerms: PermMatrix) => {
    setRoles((prev) => [...prev, role]);
    setPerms((prev) => ({ ...prev, [role.id]: rolePerms }));
    setActive(role.id);
    setShowCreate(false);
  };

  const handleDeleteRole = (id: string) => {
    setRoles((prev) => prev.filter((r) => r.id !== id));
    setPerms((prev) => { const n = { ...prev }; delete n[id]; return n; });
    if (active === id) setActive("manager");
    setDeleteId(null);
  };

  const counts = (roleId: string) => {
    const matrix = perms[roleId] ?? {};
    const all    = MODULES.map((m) => matrix[m.id] ?? NO_ACCESS);
    return {
      full: all.filter((p) => p.create && p.edit && p.view).length,
      view: all.filter((p) => p.view && !p.edit).length,
      none: all.filter((p) => !p.view).length,
    };
  };

  const activeRole = roles.find((r) => r.id === active);

  return (
    <div>
      <Header
        title="Role Permissions"
        subtitle="Define what each role can create, edit, or view"
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
              <Plus size={15} /> Create Role
            </button>
            <div className="flex flex-col items-end gap-1">
              <button onClick={handleSave} disabled={saving || loading}
                className={cn("flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50",
                  saved ? "bg-emerald-600 text-white" : "bg-blue-600 text-white hover:bg-blue-700")}>
                {saving
                  ? <><Save size={15} className="animate-pulse" /> Saving…</>
                  : saved
                    ? <><Check size={15} /> Saved!</>
                    : <><Save size={15} /> Save Permissions</>
                }
              </button>
              {saveError && <p className="text-xs text-red-600">{saveError}</p>}
            </div>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Role cards — flex wrap so custom roles fit naturally */}
        <div className="flex flex-wrap gap-3">
          {roles.map((r) => {
            const c = counts(r.id);
            return (
              <button key={r.id} onClick={() => setActive(r.id)}
                className={cn(
                  "bg-white rounded-xl border p-4 text-left transition-all shadow-sm w-44 shrink-0 relative group",
                  active === r.id ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200 hover:border-slate-300"
                )}>
                {/* Delete button — only for custom roles when selected */}
                {r.custom && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteId(r.id); }}
                    className="absolute top-2 right-2 text-slate-200 group-hover:text-slate-400 hover:!text-red-500 transition-colors"
                    title="Delete role">
                    <Trash2 size={12} />
                  </button>
                )}
                <div className="flex items-center gap-2 mb-3">
                  <Shield size={14} className={r.color} />
                  <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full truncate max-w-[90px]", r.badge)}>{r.label}</span>
                  {r.locked && <Lock size={10} className="text-slate-400 ml-auto shrink-0" />}
                </div>
                <div className="space-y-1 text-xs text-slate-500">
                  <div className="flex items-center justify-between"><span>Full access</span><span className="font-semibold text-emerald-600">{c.full}</span></div>
                  <div className="flex items-center justify-between"><span>View only</span><span className="font-semibold text-blue-500">{c.view}</span></div>
                  <div className="flex items-center justify-between"><span>No access</span><span className="font-semibold text-slate-400">{c.none}</span></div>
                </div>
                {r.custom && (
                  <div className="mt-2 flex items-center gap-1">
                    <Tag size={9} className="text-slate-300" />
                    <span className="text-[10px] text-slate-400">Custom</span>
                  </div>
                )}
              </button>
            );
          })}

          {/* Add Role shortcut card */}
          <button onClick={() => setShowCreate(true)}
            className="bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 p-4 text-left transition-all w-44 shrink-0 flex flex-col items-center justify-center gap-2 hover:border-blue-400 hover:bg-blue-50 group">
            <div className="w-9 h-9 rounded-full bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
              <Plus size={16} className="text-slate-400 group-hover:text-blue-600" />
            </div>
            <span className="text-xs font-medium text-slate-400 group-hover:text-blue-600">New Role</span>
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center flex-wrap gap-4 text-xs text-slate-500 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
          <Info size={14} className="text-blue-500 shrink-0" />
          <span>Editing: <strong className={activeRole?.color}>{activeRole?.label}</strong></span>
          <span className="flex items-center gap-1">
            <div className="w-5 h-5 rounded bg-emerald-500 flex items-center justify-center text-white"><Check size={10} /></div> = allowed
          </span>
          <span className="flex items-center gap-1">
            <div className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center text-slate-300"><X size={10} /></div> = denied
          </span>
          {activeRole?.locked && (
            <span className="flex items-center gap-1 text-amber-600"><Lock size={12} /> Admin is always full access (locked)</span>
          )}
        </div>

        {/* Menu Order */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Sidebar Menu Order</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Drag or use arrows to set the menu order for{" "}
                <span className={activeRole?.color + " font-semibold"}>{activeRole?.label}</span> users
              </p>
            </div>
            <button
              onClick={() => setMenuOrders((prev) => ({ ...prev, [active]: [...DEFAULT_MENU_ORDER] }))}
              className="text-xs text-slate-400 hover:text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors"
            >
              Reset order
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {(menuOrders[active] ?? DEFAULT_MENU_ORDER).map((sectionId, idx) => {
              const section = MENU_SECTIONS.find((s) => s.id === sectionId);
              if (!section) return null;
              const Icon = section.icon;
              const order = menuOrders[active] ?? DEFAULT_MENU_ORDER;
              return (
                <div key={sectionId} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors">
                  <span className="w-6 h-6 flex items-center justify-center text-xs font-semibold text-slate-400 bg-slate-100 rounded shrink-0">
                    {idx + 1}
                  </span>
                  <Icon size={15} className="text-slate-400 shrink-0" />
                  <span className="flex-1 text-sm font-medium text-slate-800">{section.label}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveMenuItem(active, idx, -1)}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                      title="Move up"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      onClick={() => moveMenuItem(active, idx, 1)}
                      disabled={idx === order.length - 1}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                      title="Move down"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Permissions matrix */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 w-64">Module</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 w-24">
                  <div className="flex items-center justify-center gap-1"><Plus size={11} /> Create</div>
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 w-24">
                  <div className="flex items-center justify-center gap-1"><Pencil size={11} /> Edit</div>
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 w-24">
                  <div className="flex items-center justify-center gap-1"><Eye size={11} /> View</div>
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-indigo-500 w-24">
                  <div className="flex items-center justify-center gap-1"><PanelLeft size={11} /> Sidebar</div>
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500">Description</th>
              </tr>
            </thead>
            <tbody>
              {GROUPS.map((group) => {
                const groupMods = MODULES.filter((m) => m.group === group);
                const isLocked  = activeRole?.locked ?? false;
                return (
                  <React.Fragment key={group}>
                    <tr className="bg-slate-50 border-y border-slate-100">
                      <td colSpan={6} className="px-5 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">{group}</td>
                    </tr>
                    {groupMods.map((mod) => {
                      const p          = perms[active]?.[mod.id] ?? { ...NO_ACCESS };
                      const sidebar    = p.sidebar !== undefined ? p.sidebar : p.view;
                      const isNoAccess = !p.view;
                      const isColVis   = group === "Column Visibility";
                      return (
                        <tr key={mod.id} className={cn("border-b border-slate-50 hover:bg-slate-50/50", isNoAccess && "opacity-50")}>
                          <td className="px-5 py-3 font-medium text-slate-800">{mod.label}</td>
                          <td className="px-4 py-3 text-center">{isColVis ? <span className="text-slate-200">—</span> : <ToggleCell checked={p.create} locked={isLocked} action="create" onChange={() => toggle(active, mod.id, "create")} />}</td>
                          <td className="px-4 py-3 text-center">{isColVis ? <span className="text-slate-200">—</span> : <ToggleCell checked={p.edit}   locked={isLocked} action="edit"   onChange={() => toggle(active, mod.id, "edit")}   />}</td>
                          <td className="px-4 py-3 text-center"><ToggleCell checked={p.view}   locked={isLocked} action="view"   onChange={() => toggle(active, mod.id, "view")}   /></td>
                          <td className="px-4 py-3 text-center">{isColVis ? <span className="text-slate-200">—</span> : <SidebarCell checked={sidebar} locked={isLocked} onChange={() => toggle(active, mod.id, "sidebar")} />}</td>
                          <td className="px-5 py-3 text-xs text-slate-400">{mod.description}</td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Role modal */}
      {showCreate && (
        <CreateRoleModal
          existingRoles={roles}
          existingPerms={perms}
          onClose={() => setShowCreate(false)}
          onSave={handleCreateRole}
        />
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-600" />
            </div>
            <h2 className="text-base font-semibold text-slate-900 mb-1">Delete Custom Role</h2>
            <p className="text-sm text-slate-500 mb-6">
              This will permanently remove the role and its permissions. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
              <button onClick={() => handleDeleteRole(deleteId!)} className="flex-1 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
