"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { branches as initialBranches, employees, BranchEmployeeRole } from "@/lib/mock-data";
import {
  MapPin, Phone, Mail, Users, Building2, Plus, Pencil, Trash2, X,
  Check, Search, Lock, Globe, Calendar, Layers, SquareStack,
  MessageCircle, ExternalLink, ChevronDown, Shield, User,
  Upload, FileText, Banknote,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────

type Branch   = (typeof initialBranches)[number];
type Employee = (typeof employees)[number];
type UserRole = "admin" | "owner" | "manager" | "employee";

const ROLE_LABELS: Record<UserRole, string> = {
  admin:    "Admin",
  owner:    "Owner",
  manager:  "Manager",
  employee: "Employee",
};

const CAN_TOGGLE_STATUS: UserRole[] = ["admin", "owner"];

// ── Toast ──────────────────────────────────────────────────────────────

function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="fixed bottom-6 right-6 z-[200] flex items-center gap-2.5 bg-slate-900 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg animate-in slide-in-from-bottom-4">
      <Lock size={14} className="text-amber-400" />
      {msg}
    </div>
  );
}

// ── Employee search combobox ──────────────────────────────────────────

interface EmpComboboxProps {
  value: string;
  onChange: (id: string, name: string) => void;
  placeholder?: string;
}

function EmpCombobox({ value, onChange, placeholder = "Search employee..." }: EmpComboboxProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen]   = useState(false);
  const ref               = useRef<HTMLDivElement>(null);

  const selected = employees.find((e) => e.id === value);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return employees.filter(
      (e) => e.name.toLowerCase().includes(q) || e.department?.toLowerCase().includes(q) || e.position?.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [query]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 rounded-lg cursor-pointer hover:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500">
        <User size={13} className="text-slate-400 shrink-0" />
        {selected ? (
          <div className="flex-1 min-w-0">
            <span className="font-medium text-slate-800">{selected.name}</span>
            <span className="text-slate-400 ml-1.5 text-xs">{selected.position}</span>
          </div>
        ) : (
          <span className="text-slate-400 flex-1">{placeholder}</span>
        )}
        <ChevronDown size={13} className="text-slate-400 shrink-0" />
      </div>
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type to search..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 && <p className="text-xs text-slate-400 px-3 py-2">No employees found</p>}
            {filtered.map((emp) => (
              <button
                key={emp.id}
                onClick={() => { onChange(emp.id, emp.name); setOpen(false); setQuery(""); }}
                className={cn("w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 text-left",
                  value === emp.id && "bg-blue-50")}>
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                  {emp.name[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{emp.name}</p>
                  <p className="text-xs text-slate-400 truncate">{emp.position} · {emp.department}</p>
                </div>
                {value === emp.id && <Check size={14} className="text-blue-600 ml-auto shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Branch Modal ───────────────────────────────────────────────────────

type AssignedEmp = { id: string; role: BranchEmployeeRole };

type BranchFormState = {
  code: string;
  name: string;
  brand: string;
  status: "active" | "inactive";
  address: string;
  googleMapsUrl: string;
  location: string;
  floor: string;
  sizeSqm: number | "";
  phone: string;
  email: string;
  lineId: string;
  managerId: string;
  manager: string;
  startDate: string;
  assignedEmployeeIds: string[];
  assignedEmployees: AssignedEmp[];
  // Rental & Lease
  rentFrom: string;
  rentTo: string;
  lessorName: string;
  lessorContactFirst: string;
  lessorContactLast: string;
  lessorContactTel: string;
  lessorContactEmail: string;
  lessorContactLineId: string;
  rentMonthly: number | "";
  rentalDocs: string[];
};

const emptyForm: BranchFormState = {
  code: "", name: "", brand: "", status: "active",
  address: "", googleMapsUrl: "", location: "", floor: "", sizeSqm: "",
  phone: "", email: "", lineId: "",
  managerId: "", manager: "", startDate: "",
  assignedEmployeeIds: [],
  assignedEmployees: [],
  rentFrom: "", rentTo: "",
  lessorName: "",
  lessorContactFirst: "", lessorContactLast: "",
  lessorContactTel: "", lessorContactEmail: "", lessorContactLineId: "",
  rentMonthly: "",
  rentalDocs: [],
};

interface BranchModalProps {
  initial?: Branch;
  currentRole: UserRole;
  nextId: string;
  onClose: () => void;
  onSave: (b: Branch) => void;
  onToast: (msg: string) => void;
}

function BranchModal({ initial, currentRole, nextId, onClose, onSave, onToast }: BranchModalProps) {
  const isEdit = !!initial;
  const canStatus = CAN_TOGGLE_STATUS.includes(currentRole);

  const [form, setForm] = useState<BranchFormState>(() => initial ? {
    code:                initial.code,
    name:                initial.name,
    brand:               (initial as any).brand               ?? "",
    status:              initial.status,
    address:             initial.address,
    googleMapsUrl:       (initial as any).googleMapsUrl        ?? "",
    location:            (initial as any).location             ?? "",
    floor:               (initial as any).floor                ?? "",
    sizeSqm:             (initial as any).sizeSqm              ?? "",
    phone:               initial.phone,
    email:               initial.email,
    lineId:              (initial as any).lineId               ?? "",
    managerId:           (initial as any).managerId            ?? "",
    manager:             initial.manager,
    startDate:           (initial as any).startDate            ?? "",
    assignedEmployeeIds: (initial as any).assignedEmployeeIds  ?? [],
    assignedEmployees:   ((initial as any).assignedEmployees   ?? []) as AssignedEmp[],
    rentFrom:            (initial as any).rentFrom            ?? "",
    rentTo:              (initial as any).rentTo              ?? "",
    lessorName:          (initial as any).lessorName          ?? "",
    lessorContactFirst:  (initial as any).lessorContactFirst  ?? "",
    lessorContactLast:   (initial as any).lessorContactLast   ?? "",
    lessorContactTel:    (initial as any).lessorContactTel    ?? "",
    lessorContactEmail:  (initial as any).lessorContactEmail  ?? "",
    lessorContactLineId: (initial as any).lessorContactLineId ?? "",
    rentMonthly:         (initial as any).rentMonthly         ?? "",
    rentalDocs:          (initial as any).rentalDocs          ?? [],
  } : { ...emptyForm });

  const [empSearch, setEmpSearch] = useState("");
  const rentalDocRef = useRef<HTMLInputElement>(null);

  const availableEmps = useMemo(() => {
    const q = empSearch.toLowerCase();
    return employees.filter((e) =>
      !form.assignedEmployees.some((ae) => ae.id === e.id) &&
      (e.name.toLowerCase().includes(q) || e.position?.toLowerCase().includes(q) || e.department?.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [empSearch, form.assignedEmployees]);

  const set = <K extends keyof BranchFormState>(key: K, val: BranchFormState[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const addEmp = (id: string) => {
    setForm((f) => {
      if (f.assignedEmployees.some((ae) => ae.id === id)) return f;
      const newList = [...f.assignedEmployees, { id, role: "staff" as BranchEmployeeRole }];
      return { ...f, assignedEmployees: newList, assignedEmployeeIds: newList.map((ae) => ae.id) };
    });
  };

  const removeEmp = (id: string) => {
    setForm((f) => {
      const newList = f.assignedEmployees.filter((ae) => ae.id !== id);
      return { ...f, assignedEmployees: newList, assignedEmployeeIds: newList.map((ae) => ae.id) };
    });
  };

  const setEmpRole = (id: string, role: BranchEmployeeRole) => {
    setForm((f) => ({
      ...f,
      assignedEmployees: f.assignedEmployees.map((ae) => ae.id === id ? { ...ae, role } : ae),
    }));
  };

  const handleStatusChange = (val: "active" | "inactive") => {
    if (!canStatus) {
      onToast("Requires Admin or Owner permission to change branch status.");
      return;
    }
    set("status", val);
  };

  const handleSave = () => {
    const base: Branch = {
      id:        initial?.id ?? nextId,
      isHeadOffice: initial?.isHeadOffice ?? false,
      lat:       (initial as any)?.lat    ?? 0,
      lng:       (initial as any)?.lng    ?? 0,
      radiusMeters: (initial as any)?.radiusMeters ?? 200,
      employees: form.assignedEmployees.length,
      ...form,
      assignedEmployeeIds: form.assignedEmployees.map((ae) => ae.id),
      sizeSqm: typeof form.sizeSqm === "number" ? form.sizeSqm : 0,
    } as unknown as Branch;
    onSave(base);
  };

  const canSave = form.code.trim() && form.name.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{isEdit ? "Edit Branch" : "Add New Branch"}</h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{initial?.id ?? nextId}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic */}
          <section className="space-y-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">Basic Information</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Branch Code *</label>
                <input value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} maxLength={5}
                  placeholder="e.g. BKK"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Branch Name *</label>
                <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Bangkok Branch"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Brand</label>
              <input value={form.brand} onChange={(e) => set("brand", e.target.value)} placeholder="e.g. DDK Enterprise"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1.5">
                Status
                {!canStatus && <span className="flex items-center gap-1 text-amber-600 font-normal"><Lock size={10} /> Admin/Owner only</span>}
              </label>
              <div className="flex gap-2">
                {(["active", "inactive"] as const).map((s) => (
                  <button key={s} onClick={() => handleStatusChange(s)}
                    className={cn("flex items-center gap-1.5 px-4 py-2 rounded-lg border-2 text-sm font-medium capitalize transition-all",
                      form.status === s
                        ? s === "active" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-red-400 bg-red-50 text-red-700"
                        : "border-slate-200 text-slate-500 hover:border-slate-300",
                      !canStatus && "cursor-not-allowed opacity-60"
                    )}>
                    {s === "active" ? <Check size={13} /> : <X size={13} />}
                    {s}
                    {!canStatus && <Lock size={10} className="ml-1 text-amber-500" />}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Location */}
          <section className="space-y-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">Location</p>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Address</label>
              <textarea rows={2} value={form.address} onChange={(e) => set("address", e.target.value)}
                placeholder="Street address, subdistrict, district, province, postcode"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1.5">
                Google Maps URL
                {form.googleMapsUrl && (
                  <a href={form.googleMapsUrl} target="_blank" rel="noopener noreferrer"
                    className="text-blue-500 hover:underline flex items-center gap-0.5"><ExternalLink size={10} /> Open</a>
                )}
              </label>
              <input value={form.googleMapsUrl} onChange={(e) => set("googleMapsUrl", e.target.value)}
                placeholder="https://maps.google.com/?q=..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className="block text-xs font-medium text-slate-600 mb-1">District / Location</label>
                <input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Silom, Bangkok"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Floor</label>
                <input value={form.floor} onChange={(e) => set("floor", e.target.value)} placeholder="e.g. G, 2, B1"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Size (sq.m)</label>
                <input type="number" min={0} value={form.sizeSqm}
                  onChange={(e) => set("sizeSqm", e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="850"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="space-y-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">Contact</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
                <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="0x-xxx-xxxx"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="branch@ddk.co.th"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Line ID</label>
              <input value={form.lineId} onChange={(e) => set("lineId", e.target.value)} placeholder="@branchlineid"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </section>

          {/* Management */}
          <section className="space-y-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">Management</p>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Branch Manager</label>
              <EmpCombobox
                value={form.managerId}
                onChange={(id, name) => setForm((f) => ({ ...f, managerId: id, manager: name }))}
                placeholder="Search from employee list..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Starting Date</label>
              <input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </section>

          {/* Rental & Lease */}
          <section className="space-y-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <Banknote size={13} className="text-slate-400" /> Rental &amp; Lease
            </p>

            {/* Period */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Rental Period — From</label>
                <input type="date" value={form.rentFrom} onChange={(e) => set("rentFrom", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Rental Period — To</label>
                <input type="date" value={form.rentTo} onChange={(e) => set("rentTo", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            {/* Rent amount */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Rent Amount (THB/month)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">฿</span>
                <input type="number" min={0} value={form.rentMonthly}
                  onChange={(e) => set("rentMonthly", e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="0"
                  className="w-full pl-7 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            {/* Lessor name */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Lessor Name</label>
              <input value={form.lessorName} onChange={(e) => set("lessorName", e.target.value)}
                placeholder="Company or individual name of the property owner"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            {/* Lessor contact person */}
            <div className="space-y-3 pl-4 border-l-2 border-slate-100">
              <p className="text-xs font-medium text-slate-500">Lessor Contact Person</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">First Name</label>
                  <input value={form.lessorContactFirst} onChange={(e) => set("lessorContactFirst", e.target.value)}
                    placeholder="First name"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Last Name</label>
                  <input value={form.lessorContactLast} onChange={(e) => set("lessorContactLast", e.target.value)}
                    placeholder="Last name"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Tel</label>
                  <input value={form.lessorContactTel} onChange={(e) => set("lessorContactTel", e.target.value)}
                    placeholder="0x-xxx-xxxx"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                  <input type="email" value={form.lessorContactEmail} onChange={(e) => set("lessorContactEmail", e.target.value)}
                    placeholder="contact@lessor.com"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Line ID</label>
                <input value={form.lessorContactLineId} onChange={(e) => set("lessorContactLineId", e.target.value)}
                  placeholder="@lineId"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            {/* Rental documents */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">Rental Documents</label>
              <input
                ref={rentalDocRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  if (files.length > 0) {
                    set("rentalDocs", [...form.rentalDocs, ...files.map((f) => f.name)]);
                    e.target.value = "";
                  }
                }}
              />
              <button
                type="button"
                onClick={() => rentalDocRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                <Upload size={16} />
                Click to upload rental documents
              </button>
              {form.rentalDocs.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {form.rentalDocs.map((name, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
                      <FileText size={13} className="text-blue-500 shrink-0" />
                      <span className="text-xs text-slate-700 flex-1 truncate">{name}</span>
                      <button
                        onClick={() => set("rentalDocs", form.rentalDocs.filter((_, j) => j !== i))}
                        className="text-slate-300 hover:text-red-500 transition-colors shrink-0">
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-slate-400 mt-1.5">PDF, JPG, PNG, DOC — multiple files allowed</p>
            </div>
          </section>

          {/* Assigned employees */}
          <section className="space-y-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">
              Assigned Employees
              <span className="ml-2 text-blue-600 font-bold">{form.assignedEmployees.length}</span>
            </p>

            {/* Line-item table */}
            {form.assignedEmployees.length > 0 && (
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Name</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Position · Dept</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Role</th>
                      <th className="px-4 py-2.5 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {form.assignedEmployees.map((ae) => {
                      const emp = employees.find((e) => e.id === ae.id);
                      if (!emp) return null;
                      return (
                        <tr key={ae.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                                {emp.name[0]}
                              </div>
                              <span className="font-medium text-slate-800 text-xs">{emp.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-slate-400">{emp.position} · {emp.department}</td>
                          <td className="px-4 py-2.5">
                            <select
                              value={ae.role}
                              onChange={(e) => setEmpRole(ae.id, e.target.value as BranchEmployeeRole)}
                              className="px-2 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                            >
                              <option value="manager">Manager</option>
                              <option value="staff">Staff</option>
                              <option value="viewer">Viewer</option>
                            </select>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <button onClick={() => removeEmp(ae.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                              <X size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Search to add */}
            <div>
              <div className="relative mb-2">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={empSearch}
                  onChange={(e) => setEmpSearch(e.target.value)}
                  placeholder="Search employees to assign..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {empSearch.trim() && (
                <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                  {availableEmps.length === 0 && (
                    <p className="text-xs text-slate-400 px-4 py-3">No employees found</p>
                  )}
                  {availableEmps.map((e) => (
                    <button key={e.id} onClick={() => { addEmp(e.id); setEmpSearch(""); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 border-b border-slate-100 last:border-0 text-left">
                      <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold shrink-0">
                        {e.name[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800">{e.name}</p>
                        <p className="text-xs text-slate-400">{e.position} · {e.department}</p>
                      </div>
                      <Plus size={14} className="text-blue-500 shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 sticky bottom-0 bg-white">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
          <button disabled={!canSave} onClick={handleSave}
            className="px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40">
            {isEdit ? "Save Changes" : "Add Branch"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────

export default function BranchesPage() {
  const [list,        setList]        = useState<Branch[]>(initialBranches as Branch[]);
  const [currentRole, setCurrentRole] = useState<UserRole>("admin");
  const [showModal,   setShowModal]   = useState(false);
  const [editBranch,  setEditBranch]  = useState<Branch | undefined>(undefined);
  const [deleteId,    setDeleteId]    = useState<string | null>(null);
  const [toast,       setToast]       = useState<string | null>(null);

  const nextId  = `BR-${String(list.length + 1).padStart(3, "0")}`;
  const active  = list.filter((b) => b.status === "active").length;
  const totalEmp= list.reduce((s, b) => s + (b.employees ?? 0), 0);

  const openAdd  = () => { setEditBranch(undefined); setShowModal(true); };
  const openEdit = (b: Branch) => { setEditBranch(b); setShowModal(true); };

  const handleSave = (b: Branch) => {
    setList((prev) => {
      const idx = prev.findIndex((x) => x.id === b.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = b; return next; }
      return [...prev, b];
    });
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    setList((prev) => prev.filter((b) => b.id !== id));
    setDeleteId(null);
  };

  const toggleStatus = (b: Branch) => {
    if (!CAN_TOGGLE_STATUS.includes(currentRole)) {
      setToast("Requires Admin or Owner permission to change branch status.");
      return;
    }
    if (b.isHeadOffice) return;
    setList((prev) => prev.map((x) => x.id === b.id ? { ...x, status: x.status === "active" ? "inactive" : "active" } : x));
  };

  return (
    <div>
      <Header
        title="Branch Settings"
        subtitle="Manage your company branches and locations"
        actions={
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
            <Plus size={16} /> Add Branch
          </button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Role demo bar */}
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <Shield size={15} className="text-amber-600 shrink-0" />
          <span className="text-sm text-amber-800 font-medium">Demo — Current Role:</span>
          <div className="flex gap-1">
            {(["owner","admin","manager","employee"] as UserRole[]).map((r) => (
              <button key={r} onClick={() => setCurrentRole(r)}
                className={cn("px-3 py-1 text-xs font-medium rounded-full transition-colors",
                  currentRole === r ? "bg-amber-600 text-white" : "bg-amber-100 text-amber-700 hover:bg-amber-200")}>
                {ROLE_LABELS[r]}
              </button>
            ))}
          </div>
          {!CAN_TOGGLE_STATUS.includes(currentRole) && (
            <span className="ml-auto flex items-center gap-1 text-xs text-amber-600"><Lock size={11} />Status toggle locked</span>
          )}
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Branches",  value: list.length, icon: Building2, color: "blue" },
            { label: "Active",          value: active,       icon: Check,    color: "emerald" },
            { label: "Total Employees", value: totalEmp,     icon: Users,    color: "violet" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center",
                color === "blue"    && "bg-blue-100 text-blue-600",
                color === "emerald" && "bg-emerald-100 text-emerald-600",
                color === "violet"  && "bg-violet-100 text-violet-600")}>
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
          {list.map((branch) => {
            const br = branch as any;
            const assignedCount = br.assignedEmployeeIds?.length ?? branch.employees;
            return (
              <div key={branch.id} className={cn(
                "bg-white rounded-xl border shadow-sm p-5 flex flex-col gap-4 transition-opacity",
                branch.status === "inactive" ? "border-slate-200 opacity-60" : "border-slate-200")}>

                {/* Card header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center text-xs font-bold leading-none",
                      branch.status === "active" ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500")}>
                      {branch.code.slice(0, 3)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-900">{branch.name}</h3>
                        {branch.isHeadOffice && (
                          <span className="text-xs bg-amber-100 text-amber-700 font-medium px-2 py-0.5 rounded-full">HQ</span>
                        )}
                        {br.brand && br.brand !== branch.name && (
                          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{br.brand}</span>
                        )}
                        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full",
                          branch.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500")}>
                          {branch.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 font-mono">{branch.id} · {branch.code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEdit(branch)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700"><Pencil size={15} /></button>
                    {!branch.isHeadOffice && (
                      <button onClick={() => setDeleteId(branch.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600"><Trash2 size={15} /></button>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div className="flex items-start gap-2 text-slate-600 col-span-2">
                    <MapPin size={13} className="mt-0.5 shrink-0 text-slate-400" />
                    <span className="text-xs">{branch.address}</span>
                  </div>
                  {br.location && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Globe size={13} className="shrink-0 text-slate-400" />
                      <span className="text-xs">{br.location}</span>
                    </div>
                  )}
                  {br.floor && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Layers size={13} className="shrink-0 text-slate-400" />
                      <span className="text-xs">Floor {br.floor}{br.sizeSqm ? ` · ${br.sizeSqm} sq.m` : ""}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone size={13} className="shrink-0 text-slate-400" />
                    <span className="text-xs">{branch.phone}</span>
                  </div>
                  {branch.email && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail size={13} className="shrink-0 text-slate-400" />
                      <span className="text-xs">{branch.email}</span>
                    </div>
                  )}
                  {br.lineId && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <MessageCircle size={13} className="shrink-0 text-slate-400" />
                      <span className="text-xs">{br.lineId}</span>
                    </div>
                  )}
                  {br.googleMapsUrl && (
                    <div className="flex items-center gap-2">
                      <MapPin size={13} className="shrink-0 text-slate-400" />
                      <a href={br.googleMapsUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                        Open in Maps <ExternalLink size={10} />
                      </a>
                    </div>
                  )}
                  {br.startDate && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar size={13} className="shrink-0 text-slate-400" />
                      <span className="text-xs">Since {br.startDate}</span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5"><Users size={12} />{assignedCount} employees</span>
                    <span>Manager: <span className="text-slate-700 font-medium">{branch.manager}</span></span>
                  </div>
                  {!branch.isHeadOffice && (
                    <button
                      onClick={() => toggleStatus(branch)}
                      className={cn(
                        "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors",
                        !CAN_TOGGLE_STATUS.includes(currentRole)
                          ? "border-slate-200 text-slate-400 cursor-not-allowed"
                          : branch.status === "active"
                            ? "border-slate-200 text-slate-600 hover:border-red-200 hover:text-red-600 hover:bg-red-50"
                            : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      )}>
                      {!CAN_TOGGLE_STATUS.includes(currentRole) && <Lock size={10} />}
                      {branch.status === "active" ? "Deactivate" : "Activate"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showModal && (
        <BranchModal
          initial={editBranch}
          currentRole={currentRole}
          nextId={nextId}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          onToast={(msg) => setToast(msg)}
        />
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><Trash2 size={22} className="text-red-600" /></div>
            <h2 className="text-base font-semibold text-slate-900 mb-1">Delete Branch</h2>
            <p className="text-sm text-slate-500 mb-6">This will permanently remove the branch and cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
              <button onClick={() => handleDelete(deleteId!)} className="flex-1 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
