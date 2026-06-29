"use client";

import { Header } from "@/components/layout/Header";
import { branches as initialBranches } from "@/lib/mock-data";
import {
  MapPin,
  Phone,
  Mail,
  Users,
  Building2,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Branch = (typeof initialBranches)[number];

const emptyForm = {
  code: "",
  name: "",
  address: "",
  phone: "",
  email: "",
  manager: "",
};

export default function BranchesPage() {
  const [list, setList] = useState<Branch[]>(initialBranches);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (b: Branch) => {
    setEditId(b.id);
    setForm({ code: b.code, name: b.name, address: b.address, phone: b.phone, email: b.email, manager: b.manager });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name || !form.code) return;
    if (editId) {
      setList((prev) => prev.map((b) => b.id === editId ? { ...b, ...form } : b));
    } else {
      const newBranch: Branch = {
        id: `BR-${String(list.length + 1).padStart(3, "0")}`,
        ...form,
        employees: 0,
        status: "active",
        isHeadOffice: false,
      };
      setList((prev) => [...prev, newBranch]);
    }
    setShowForm(false);
    setEditId(null);
  };

  const handleDelete = (id: string) => {
    setList((prev) => prev.filter((b) => b.id !== id));
    setDeleteId(null);
  };

  const toggleStatus = (id: string) => {
    setList((prev) =>
      prev.map((b) =>
        b.id === id && !b.isHeadOffice
          ? { ...b, status: b.status === "active" ? "inactive" : "active" }
          : b
      )
    );
  };

  const active = list.filter((b) => b.status === "active").length;
  const totalEmp = list.reduce((s, b) => s + b.employees, 0);

  return (
    <div>
      <Header
        title="Branch Settings"
        subtitle="Manage your company branches and locations"
        actions={
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            Add Branch
          </button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Branches", value: list.length, icon: Building2, color: "blue" },
            { label: "Active", value: active, icon: Check, color: "emerald" },
            { label: "Total Employees", value: totalEmp, icon: Users, color: "violet" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                color === "blue" && "bg-blue-100 text-blue-600",
                color === "emerald" && "bg-emerald-100 text-emerald-600",
                color === "violet" && "bg-violet-100 text-violet-600",
              )}>
                <Icon size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
                <p className="text-sm text-slate-500">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Branch cards */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {list.map((branch) => (
            <div
              key={branch.id}
              className={cn(
                "bg-white rounded-xl border shadow-sm p-5 flex flex-col gap-4 transition-opacity",
                branch.status === "inactive" ? "border-slate-200 opacity-60" : "border-slate-200"
              )}
            >
              {/* Card header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold",
                    branch.status === "active" ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"
                  )}>
                    {branch.code.slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{branch.name}</h3>
                      {branch.isHeadOffice && (
                        <span className="text-xs bg-amber-100 text-amber-700 font-medium px-2 py-0.5 rounded-full">HQ</span>
                      )}
                      <span className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-full",
                        branch.status === "active"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      )}>
                        {branch.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">ID: {branch.id} · Code: {branch.code}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(branch)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    <Pencil size={15} />
                  </button>
                  {!branch.isHeadOffice && (
                    <button
                      onClick={() => setDeleteId(branch.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2 text-slate-600">
                  <MapPin size={14} className="mt-0.5 shrink-0 text-slate-400" />
                  {branch.address}
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone size={14} className="shrink-0 text-slate-400" />
                  {branch.phone}
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail size={14} className="shrink-0 text-slate-400" />
                  {branch.email}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Users size={13} />
                    {branch.employees} employees
                  </span>
                  <span>Manager: <span className="text-slate-700 font-medium">{branch.manager}</span></span>
                </div>
                {!branch.isHeadOffice && (
                  <button
                    onClick={() => toggleStatus(branch.id)}
                    className={cn(
                      "text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors",
                      branch.status === "active"
                        ? "border-slate-200 text-slate-600 hover:border-red-200 hover:text-red-600 hover:bg-red-50"
                        : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    )}
                  >
                    {branch.status === "active" ? "Deactivate" : "Activate"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add / Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">
                {editId ? "Edit Branch" : "Add New Branch"}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Branch Code *</label>
                  <input
                    value={form.code}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                    maxLength={5}
                    placeholder="e.g. BKK"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Branch Name *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Bangkok Branch"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Address</label>
                <input
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder="Street, City, Province, Postcode"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="0x-xxx-xxxx"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                  <input
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="branch@company.com"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Branch Manager</label>
                <input
                  value={form.manager}
                  onChange={(e) => setForm((f) => ({ ...f, manager: e.target.value }))}
                  placeholder="Full name"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!form.name || !form.code}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {editId ? "Save Changes" : "Add Branch"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-600" />
            </div>
            <h2 className="text-base font-semibold text-slate-900 mb-1">Delete Branch</h2>
            <p className="text-sm text-slate-500 mb-6">
              This will permanently remove the branch. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
