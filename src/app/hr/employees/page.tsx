"use client";

import { useState, useMemo, useRef } from "react";
import { Header } from "@/components/layout/Header";
import {
  employees as initialEmployees, branches,
  Employee, EmployeeStatus, EmploymentType, BankAccount, SsfStatus,
  DEPARTMENTS, BANKS, EMPLOYMENT_TYPES, SSF_FUND_TYPES, SSF_HOSPITALS,
} from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  Plus, Search, X, Check, ChevronLeft, ChevronRight,
  User, Briefcase, CreditCard, FileUp,
  Phone, Mail, Calendar, Building2,
  Pencil, Trash2, Upload, FileText, Eye,
  Users, TrendingUp, Clock, UserX, Star,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4;

type BankAccountEntry = Omit<BankAccount, "id"> & { id: string };

const emptyBankAccount = (id: string, accountName = ""): BankAccountEntry => ({
  id, bankName: "SCB", branch: "", accountNumber: "", accountName, isMain: false,
});

interface EmpForm {
  firstName: string; lastName: string;
  firstNameTh: string; lastNameTh: string;
  nickname: string; gender: "male" | "female" | "other";
  dob: string; nationalId: string;
  phone: string; personalEmail: string;
  department: string; position: string;
  employmentType: EmploymentType;
  branchId: string; hireDate: string; probationEndDate: string;
  managerId: string; workEmail: string;
  salary: number | "";
  bankAccounts: BankAccountEntry[];
  ssn: string;
  ssfFundType: "33" | "39" | "40";
  ssfEnrollmentDate: string;
  ssfHospital: string;
  ssfStatus: SsfStatus;
  emergencyName: string; emergencyRelation: string; emergencyPhone: string;
  photo: string; documents: string[];
  status: EmployeeStatus;
}

const EMPTY_FORM: EmpForm = {
  firstName: "", lastName: "", firstNameTh: "", lastNameTh: "",
  nickname: "", gender: "male", dob: "", nationalId: "",
  phone: "", personalEmail: "",
  department: DEPARTMENTS[0], position: "",
  employmentType: "full-time",
  branchId: "", hireDate: "", probationEndDate: "",
  managerId: "", workEmail: "",
  salary: "",
  bankAccounts: [{ ...emptyBankAccount("ba-0"), isMain: true }],
  ssn: "", ssfFundType: "33", ssfEnrollmentDate: "", ssfHospital: "", ssfStatus: "active",
  emergencyName: "", emergencyRelation: "", emergencyPhone: "",
  photo: "", documents: [], status: "active",
};

const STATUS_CFG: Record<EmployeeStatus, { label: string; cls: string }> = {
  active:    { label: "Active",   cls: "bg-emerald-100 text-emerald-700" },
  "on-leave":{ label: "On Leave", cls: "bg-amber-100 text-amber-700"    },
  inactive:  { label: "Inactive", cls: "bg-slate-100 text-slate-500"    },
};

const EMP_TYPE_LABEL: Record<EmploymentType, string> = {
  "full-time": "Full-time", "part-time": "Part-time",
  contract: "Contract", intern: "Intern",
};

// ── Step indicator ─────────────────────────────────────────────────────

const STEPS = [
  { num: 1, label: "Personal",    icon: User       },
  { num: 2, label: "Employment",  icon: Briefcase  },
  { num: 3, label: "Compensation",icon: CreditCard },
  { num: 4, label: "Documents",   icon: FileUp     },
];

function StepBar({ current }: { current: Step }) {
  return (
    <div className="flex items-center gap-0 px-6 py-4 border-b border-slate-100">
      {STEPS.map((s, i) => {
        const done    = current > s.num;
        const active  = current === s.num;
        const Icon    = s.icon;
        return (
          <div key={s.num} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                done   ? "bg-emerald-500 text-white"
                : active ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-400"
              )}>
                {done ? <Check size={13} /> : <Icon size={13} />}
              </div>
              <span className={cn("text-[10px] font-medium whitespace-nowrap", active ? "text-blue-600" : done ? "text-emerald-600" : "text-slate-400")}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn("flex-1 h-px mx-2 mb-3", done ? "bg-emerald-300" : "bg-slate-200")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Field helpers ──────────────────────────────────────────────────────

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const INPUT = "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500";
const SELECT = "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

// ── Add/Edit Modal ─────────────────────────────────────────────────────

interface ModalProps {
  initial?: Employee;
  allEmployees: Employee[];
  nextId: string;
  onClose: () => void;
  onSave: (e: Employee) => void;
}

function EmployeeModal({ initial, allEmployees, nextId, onClose, onSave }: ModalProps) {
  const isEdit = !!initial;
  const [step, setStep] = useState<Step>(1);
  const photoRef = useRef<HTMLInputElement>(null);
  const docRef   = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<EmpForm>(() => initial ? {
    firstName:        initial.firstName,
    lastName:         initial.lastName,
    firstNameTh:      initial.firstNameTh      ?? "",
    lastNameTh:       initial.lastNameTh        ?? "",
    nickname:         initial.nickname          ?? "",
    gender:           initial.gender,
    dob:              initial.dob               ?? "",
    nationalId:       initial.nationalId        ?? "",
    phone:            initial.phone             ?? "",
    personalEmail:    initial.personalEmail     ?? "",
    department:       initial.department,
    position:         initial.position,
    employmentType:   initial.employmentType,
    branchId:         initial.branchId          ?? "",
    hireDate:         initial.hireDate,
    probationEndDate: initial.probationEndDate  ?? "",
    managerId:        initial.managerId         ?? "",
    workEmail:        initial.workEmail         ?? "",
    salary:           initial.salary,
    bankAccounts:     initial.bankAccounts?.length
                        ? initial.bankAccounts
                        : [{ ...emptyBankAccount("ba-0"), isMain: true }],
    ssn:              initial.ssn               ?? "",
    ssfFundType:      initial.ssfFundType       ?? "33",
    ssfEnrollmentDate:initial.ssfEnrollmentDate ?? "",
    ssfHospital:      initial.ssfHospital       ?? "",
    ssfStatus:        initial.ssfStatus         ?? "active",
    emergencyName:    initial.emergencyName     ?? "",
    emergencyRelation:initial.emergencyRelation ?? "",
    emergencyPhone:   initial.emergencyPhone    ?? "",
    photo:            initial.photo             ?? "",
    documents:        initial.documents         ?? [],
    status:           initial.status,
  } : { ...EMPTY_FORM, bankAccounts: [{ ...emptyBankAccount("ba-0"), isMain: true }] });

  const set = <K extends keyof EmpForm>(k: K, v: EmpForm[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const canNext1 = form.firstName.trim() && form.lastName.trim();
  const canNext2 = form.department && form.position.trim() && form.hireDate;
  const canNext3 = true; // salary optional for intern
  const canSave  = canNext1 && canNext2;

  const handleSave = () => {
    const name = `${form.firstName.trim()} ${form.lastName.trim()}`;
    const saved: Employee = {
      ...form,
      id:           initial?.id ?? nextId,
      name,
      salary:       typeof form.salary === "number" ? form.salary : 0,
      bankAccounts: form.bankAccounts,
    } as Employee;
    onSave(saved);
  };

  // Helpers for bankAccounts array
  const updateBankAccount = (id: string, patch: Partial<BankAccountEntry>) =>
    set("bankAccounts", form.bankAccounts.map(a => a.id === id ? { ...a, ...patch } : a));

  const setMain = (id: string) =>
    set("bankAccounts", form.bankAccounts.map(a => ({ ...a, isMain: a.id === id })));

  const addBankAccount = () => {
    const newId = `ba-${Date.now()}`;
    const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
    set("bankAccounts", [...form.bankAccounts, emptyBankAccount(newId, fullName)]);
  };

  const removeBankAccount = (id: string) => {
    const next = form.bankAccounts.filter(a => a.id !== id);
    // Ensure one remains main
    if (next.length && !next.some(a => a.isMain)) next[0].isMain = true;
    set("bankAccounts", next);
  };

  // Auto-fill account name on new accounts when first/last name is typed
  const syncAccountNames = () => {
    const full = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
    if (!full) return;
    set("bankAccounts", form.bankAccounts.map(a =>
      a.accountName ? a : { ...a, accountName: full }
    ));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{isEdit ? "Edit Employee" : "Add New Employee"}</h2>
            <p className="text-xs text-slate-400 font-mono">{initial?.id ?? nextId}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>

        <StepBar current={step} />

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* ── Step 1: Personal ─────────────────────────── */}
          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="First Name (EN)" required>
                  <input value={form.firstName} onChange={e => set("firstName", e.target.value)}
                    onBlur={syncAccountNames} placeholder="e.g. Somchai" className={INPUT} />
                </Field>
                <Field label="Last Name (EN)" required>
                  <input value={form.lastName} onChange={e => set("lastName", e.target.value)}
                    onBlur={syncAccountNames} placeholder="e.g. Wannasuk" className={INPUT} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="ชื่อ (ภาษาไทย)">
                  <input value={form.firstNameTh} onChange={e => set("firstNameTh", e.target.value)}
                    placeholder="สมชาย" className={INPUT} />
                </Field>
                <Field label="นามสกุล (ภาษาไทย)">
                  <input value={form.lastNameTh} onChange={e => set("lastNameTh", e.target.value)}
                    placeholder="วรรณสุข" className={INPUT} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nickname">
                  <input value={form.nickname} onChange={e => set("nickname", e.target.value)}
                    placeholder="Chai" className={INPUT} />
                </Field>
                <Field label="Gender">
                  <select value={form.gender} onChange={e => set("gender", e.target.value as EmpForm["gender"])} className={SELECT}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other / Prefer not to say</option>
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Date of Birth">
                  <input type="date" value={form.dob} onChange={e => set("dob", e.target.value)} className={INPUT} />
                </Field>
                <Field label="National ID / Passport">
                  <input value={form.nationalId} onChange={e => set("nationalId", e.target.value)}
                    placeholder="1-XXXX-XXXXX-XX-X" className={INPUT} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Phone">
                  <input value={form.phone} onChange={e => set("phone", e.target.value)}
                    placeholder="08X-XXX-XXXX" className={INPUT} />
                </Field>
                <Field label="Personal Email">
                  <input type="email" value={form.personalEmail} onChange={e => set("personalEmail", e.target.value)}
                    placeholder="name@gmail.com" className={INPUT} />
                </Field>
              </div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider pt-2 border-t border-slate-100">Emergency Contact</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Contact Name">
                  <input value={form.emergencyName} onChange={e => set("emergencyName", e.target.value)}
                    placeholder="Full name" className={INPUT} />
                </Field>
                <Field label="Relationship">
                  <input value={form.emergencyRelation} onChange={e => set("emergencyRelation", e.target.value)}
                    placeholder="Spouse, Parent, Sibling…" className={INPUT} />
                </Field>
              </div>
              <Field label="Emergency Phone">
                <input value={form.emergencyPhone} onChange={e => set("emergencyPhone", e.target.value)}
                  placeholder="08X-XXX-XXXX" className={INPUT} />
              </Field>
            </>
          )}

          {/* ── Step 2: Employment ───────────────────────── */}
          {step === 2 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Department" required>
                  <select value={form.department} onChange={e => set("department", e.target.value)} className={SELECT}>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </Field>
                <Field label="Employment Type" required>
                  <select value={form.employmentType} onChange={e => set("employmentType", e.target.value as EmploymentType)} className={SELECT}>
                    {EMPLOYMENT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Job Title / Position" required>
                <input value={form.position} onChange={e => set("position", e.target.value)}
                  placeholder="e.g. Senior Engineer" className={INPUT} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Branch">
                  <select value={form.branchId} onChange={e => set("branchId", e.target.value)} className={SELECT}>
                    <option value="">— Select branch —</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
                  </select>
                </Field>
                <Field label="Reporting Manager">
                  <select value={form.managerId} onChange={e => set("managerId", e.target.value)} className={SELECT}>
                    <option value="">— None —</option>
                    {allEmployees.filter(e => !initial || e.id !== initial.id).map(e => (
                      <option key={e.id} value={e.id}>{e.name} — {e.position}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Hire Date" required>
                  <input type="date" value={form.hireDate} onChange={e => set("hireDate", e.target.value)} className={INPUT} />
                </Field>
                <Field label="Probation End Date">
                  <input type="date" value={form.probationEndDate} onChange={e => set("probationEndDate", e.target.value)} className={INPUT} />
                </Field>
              </div>
              <Field label="Work Email">
                <input type="email" value={form.workEmail} onChange={e => set("workEmail", e.target.value)}
                  placeholder="name@ddk.co.th" className={INPUT} />
              </Field>
              <Field label="Status">
                <div className="flex gap-2">
                  {(Object.entries(STATUS_CFG) as [EmployeeStatus, { label: string; cls: string }][]).map(([key, { label, cls }]) => (
                    <button key={key} type="button" onClick={() => set("status", key)}
                      className={cn("flex-1 py-2 text-sm font-medium rounded-lg border-2 transition-all",
                        form.status === key ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-500 hover:border-slate-300")}>
                      {label}
                    </button>
                  ))}
                </div>
              </Field>
            </>
          )}

          {/* ── Step 3: Compensation ─────────────────────── */}
          {step === 3 && (
            <>
              <Field label="Base Salary (THB/month)">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">฿</span>
                  <input type="number" min={0} value={form.salary}
                    onChange={e => set("salary", e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="0" className={cn(INPUT, "pl-7")} />
                </div>
              </Field>

              {/* ── Social Security Fund ── */}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Social Security Fund — ประกันสังคม
                </p>
                <div className="space-y-3">
                  {/* Status toggle */}
                  <Field label="SSF Status">
                    <div className="flex gap-2">
                      {([
                        { id: "active",       label: "Active",       cls: "bg-emerald-50 border-emerald-400 text-emerald-700" },
                        { id: "inactive",     label: "Inactive",     cls: "bg-slate-50 border-slate-300 text-slate-500"     },
                        { id: "not-enrolled", label: "Not Enrolled", cls: "bg-amber-50 border-amber-400 text-amber-700"     },
                      ] as { id: SsfStatus; label: string; cls: string }[]).map(s => (
                        <button key={s.id} type="button" onClick={() => set("ssfStatus", s.id)}
                          className={cn("flex-1 py-1.5 text-xs font-medium rounded-lg border-2 transition-all",
                            form.ssfStatus === s.id ? s.cls : "border-slate-200 text-slate-400 hover:border-slate-300")}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </Field>

                  {/* Fund type */}
                  <Field label="Fund Type (มาตรา)">
                    <div className="space-y-2">
                      {SSF_FUND_TYPES.map(ft => (
                        <label key={ft.id}
                          className={cn("flex items-start gap-3 p-2.5 rounded-lg border-2 cursor-pointer transition-all",
                            form.ssfFundType === ft.id
                              ? "border-blue-500 bg-blue-50"
                              : "border-slate-200 hover:border-slate-300")}>
                          <input type="radio" name="ssfFundType" value={ft.id}
                            checked={form.ssfFundType === ft.id}
                            onChange={() => set("ssfFundType", ft.id)}
                            className="mt-0.5 accent-blue-600" />
                          <div>
                            <p className={cn("text-sm font-semibold", form.ssfFundType === ft.id ? "text-blue-700" : "text-slate-700")}>
                              {ft.label}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">{ft.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </Field>

                  {/* SSN + Enrollment Date */}
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="SSN / เลขที่ผู้ประกันตน">
                      <input value={form.ssn} onChange={e => set("ssn", e.target.value)}
                        placeholder="13-digit number" className={INPUT} />
                    </Field>
                    <Field label="Enrollment Date">
                      <input type="date" value={form.ssfEnrollmentDate}
                        onChange={e => set("ssfEnrollmentDate", e.target.value)} className={INPUT} />
                    </Field>
                  </div>

                  {/* Hospital */}
                  <Field label="Selected Hospital (โรงพยาบาลที่เลือก)">
                    <select value={form.ssfHospital} onChange={e => set("ssfHospital", e.target.value)} className={SELECT}>
                      <option value="">— Select hospital —</option>
                      {SSF_HOSPITALS.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </Field>

                  {/* Contribution summary */}
                  {form.ssfFundType === "33" && form.salary !== "" && (
                    <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <div className="space-y-1">
                        <p className="text-slate-400 font-medium">Employee contribution</p>
                        <p className="text-slate-800 font-bold text-sm">
                          ฿{Math.min(Math.round(Number(form.salary) * 0.05), 750).toLocaleString()}/mo
                        </p>
                        <p className="text-slate-400">5% of salary, max ฿750</p>
                      </div>
                      <div className="space-y-1 border-l border-slate-200 pl-2">
                        <p className="text-slate-400 font-medium">Employer contribution</p>
                        <p className="text-slate-800 font-bold text-sm">
                          ฿{Math.min(Math.round(Number(form.salary) * 0.05), 750).toLocaleString()}/mo
                        </p>
                        <p className="text-slate-400">5% of salary, max ฿750</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Bank accounts ── */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Bank Accounts for Payroll
                  </p>
                  <button type="button" onClick={addBankAccount}
                    className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors">
                    <Plus size={12} /> Add Account
                  </button>
                </div>

                <div className="space-y-3">
                  {form.bankAccounts.map((acct, idx) => (
                    <div key={acct.id}
                      className={cn("rounded-xl border-2 p-3 space-y-2.5 transition-colors",
                        acct.isMain ? "border-blue-400 bg-blue-50/40" : "border-slate-200 bg-white")}>
                      {/* Card header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-500">
                            Account {idx + 1}
                          </span>
                          {acct.isMain && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                              <Star size={9} fill="currentColor" /> Main
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {!acct.isMain && (
                            <button type="button" onClick={() => setMain(acct.id)}
                              className="text-xs text-slate-500 hover:text-blue-600 font-medium px-2 py-0.5 rounded hover:bg-blue-50 transition-colors">
                              Set as main
                            </button>
                          )}
                          {form.bankAccounts.length > 1 && (
                            <button type="button" onClick={() => removeBankAccount(acct.id)}
                              className="text-slate-300 hover:text-red-500 transition-colors">
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Bank + Branch */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] text-slate-500 mb-1">Bank</label>
                          <select value={acct.bankName}
                            onChange={e => updateBankAccount(acct.id, { bankName: e.target.value })}
                            className={cn(SELECT, "text-xs py-1.5")}>
                            {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-500 mb-1">Branch</label>
                          <input value={acct.branch}
                            onChange={e => updateBankAccount(acct.id, { branch: e.target.value })}
                            placeholder="e.g. Silom" className={cn(INPUT, "text-xs py-1.5")} />
                        </div>
                      </div>

                      {/* Account number + name */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] text-slate-500 mb-1">Account Number</label>
                          <input value={acct.accountNumber}
                            onChange={e => updateBankAccount(acct.id, { accountNumber: e.target.value })}
                            placeholder="XXX-X-XXXXX-X" className={cn(INPUT, "text-xs py-1.5")} />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-500 mb-1">Account Name</label>
                          <input value={acct.accountName}
                            onChange={e => updateBankAccount(acct.id, { accountName: e.target.value })}
                            placeholder="Name as on bank book" className={cn(INPUT, "text-xs py-1.5")} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-700 flex items-start gap-2">
                <CreditCard size={13} className="mt-0.5 shrink-0" />
                Salary is transferred to the <strong>main</strong> account each payroll run. Account names must match the bank book exactly.
              </div>
            </>
          )}

          {/* ── Step 4: Documents ────────────────────────── */}
          {step === 4 && (
            <>
              {/* Profile photo */}
              <Field label="Profile Photo">
                <input ref={photoRef} type="file" accept="image/*" className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) set("photo", f.name);
                    e.target.value = "";
                  }} />
                <div
                  onClick={() => photoRef.current?.click()}
                  className="flex items-center gap-4 p-4 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                  <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xl font-bold shrink-0">
                    {form.firstName ? form.firstName[0].toUpperCase() : <User size={24} />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{form.photo || "Click to upload profile photo"}</p>
                    <p className="text-xs text-slate-400 mt-0.5">JPG, PNG — max 5 MB</p>
                  </div>
                  {form.photo && (
                    <button onClick={e => { e.stopPropagation(); set("photo", ""); }}
                      className="ml-auto text-slate-300 hover:text-red-500">
                      <X size={14} />
                    </button>
                  )}
                </div>
              </Field>

              {/* Supporting documents */}
              <Field label="Supporting Documents">
                <input ref={docRef} type="file" multiple
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  className="hidden"
                  onChange={e => {
                    const files = Array.from(e.target.files ?? []);
                    if (files.length) set("documents", [...form.documents, ...files.map(f => f.name)]);
                    e.target.value = "";
                  }} />
                <button type="button" onClick={() => docRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                  <Upload size={15} /> Upload ID card, contract, certificates…
                </button>
              </Field>

              {form.documents.length > 0 && (
                <div className="space-y-1.5">
                  {form.documents.map((name, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
                      <FileText size={13} className="text-blue-500 shrink-0" />
                      <span className="text-xs text-slate-700 flex-1 truncate">{name}</span>
                      <button onClick={() => set("documents", form.documents.filter((_, j) => j !== i))}
                        className="text-slate-300 hover:text-red-500 transition-colors">
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-slate-400">PDF, JPG, PNG, DOC — multiple files allowed</p>

              {/* Review summary */}
              <div className="mt-2 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs text-slate-600">
                <p className="font-semibold text-slate-700 text-sm">Summary</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <span className="text-slate-400">Name</span>
                  <span className="font-medium text-slate-800">{form.firstName} {form.lastName}</span>
                  <span className="text-slate-400">Department</span>
                  <span>{form.department} — {form.position || "—"}</span>
                  <span className="text-slate-400">Type</span>
                  <span>{EMP_TYPE_LABEL[form.employmentType]}</span>
                  <span className="text-slate-400">Hire Date</span>
                  <span>{form.hireDate || "—"}</span>
                  <span className="text-slate-400">Salary</span>
                  <span>{form.salary ? formatCurrency(Number(form.salary)) : "—"}/mo</span>
                  <span className="text-slate-400">Main Bank</span>
                  <span>{(() => { const m = form.bankAccounts.find(a => a.isMain); return m ? `${m.bankName} ${m.accountNumber || "—"}` : "—"; })()}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
          <button onClick={step === 1 ? onClose : () => setStep(s => (s - 1) as Step)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
            {step === 1 ? "Cancel" : <><ChevronLeft size={14} /> Back</>}
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Step {step} of 4</span>
            {step < 4 ? (
              <button
                disabled={step === 1 ? !canNext1 : step === 2 ? !canNext2 : !canNext3}
                onClick={() => setStep(s => (s + 1) as Step)}
                className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40">
                Next <ChevronRight size={14} />
              </button>
            ) : (
              <button disabled={!canSave} onClick={handleSave}
                className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-40">
                <Check size={14} /> {isEdit ? "Save Changes" : "Add Employee"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Detail Modal ───────────────────────────────────────────────────────

function DetailModal({ emp, allEmployees, onClose, onEdit, onDelete }: {
  emp: Employee; allEmployees: Employee[];
  onClose: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const manager  = allEmployees.find(e => e.id === emp.managerId);
  const branch   = branches.find(b => b.id === emp.branchId);
  const initials = emp.firstName[0] + (emp.lastName[0] ?? "");

  const InfoRow = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string }) =>
    value ? (
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
          <Icon size={13} className="text-slate-500" />
        </div>
        <div>
          <p className="text-xs text-slate-400">{label}</p>
          <p className="text-sm text-slate-800 font-medium">{value}</p>
        </div>
      </div>
    ) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        {/* Hero */}
        <div className="relative bg-gradient-to-br from-blue-600 to-blue-700 px-6 pt-6 pb-16 rounded-t-2xl">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white"><X size={16} /></button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-white text-2xl font-bold">
              {initials}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{emp.name}</h2>
              {emp.firstNameTh && <p className="text-blue-100 text-sm">{emp.firstNameTh} {emp.lastNameTh}</p>}
              <p className="text-blue-200 text-xs mt-0.5">{emp.position} · {emp.department}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full", STATUS_CFG[emp.status].cls)}>
              {STATUS_CFG[emp.status].label}
            </span>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/20 text-white">
              {EMP_TYPE_LABEL[emp.employmentType]}
            </span>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/20 text-white font-mono">
              {emp.id}
            </span>
          </div>
        </div>

        {/* Actions (float over hero) */}
        <div className="flex gap-2 px-6 -mt-8 mb-4">
          <button onClick={onEdit}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm text-slate-700">
            <Pencil size={13} /> Edit
          </button>
          <button onClick={onDelete}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-white border border-red-200 rounded-lg hover:bg-red-50 shadow-sm text-red-600">
            <Trash2 size={13} /> Delete
          </button>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {/* Personal */}
          <section className="space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Personal</p>
            <InfoRow icon={User}     label="Nickname"      value={emp.nickname} />
            <InfoRow icon={Calendar} label="Date of Birth" value={emp.dob} />
            <InfoRow icon={FileText} label="National ID"   value={emp.nationalId} />
            <InfoRow icon={Phone}    label="Phone"         value={emp.phone} />
            <InfoRow icon={Mail}     label="Personal Email"value={emp.personalEmail} />
          </section>

          {/* Employment */}
          <section className="space-y-3 border-t border-slate-100 pt-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Employment</p>
            <InfoRow icon={Building2} label="Branch"         value={branch ? `${branch.name} (${branch.code})` : undefined} />
            <InfoRow icon={User}      label="Reports To"     value={manager?.name} />
            <InfoRow icon={Calendar}  label="Hire Date"      value={emp.hireDate} />
            <InfoRow icon={Calendar}  label="Probation End"  value={emp.probationEndDate} />
            <InfoRow icon={Mail}      label="Work Email"     value={emp.workEmail} />
          </section>

          {/* Compensation */}
          <section className="space-y-3 border-t border-slate-100 pt-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Compensation</p>
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <span className="text-sm text-slate-600">Monthly Salary</span>
              <span className="text-lg font-bold text-emerald-700">{formatCurrency(emp.salary)}</span>
            </div>
            {/* Social Security */}
            {(emp.ssn || emp.ssfStatus) && (
              <div className={cn("p-3 rounded-xl border space-y-2",
                emp.ssfStatus === "active"       ? "bg-emerald-50 border-emerald-200" :
                emp.ssfStatus === "inactive"     ? "bg-slate-50 border-slate-200" :
                                                   "bg-amber-50 border-amber-200")}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-600">Social Security Fund</p>
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full capitalize",
                    emp.ssfStatus === "active"       ? "bg-emerald-100 text-emerald-700" :
                    emp.ssfStatus === "inactive"     ? "bg-slate-100 text-slate-500" :
                                                       "bg-amber-100 text-amber-700")}>
                    {emp.ssfStatus?.replace("-", " ") ?? "—"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  {emp.ssfFundType && <>
                    <span className="text-slate-400">Fund Type</span>
                    <span className="font-medium text-slate-700">มาตรา {emp.ssfFundType}</span>
                  </>}
                  {emp.ssn && <>
                    <span className="text-slate-400">SSN</span>
                    <span className="font-mono text-slate-700">{emp.ssn}</span>
                  </>}
                  {emp.ssfEnrollmentDate && <>
                    <span className="text-slate-400">Enrolled</span>
                    <span className="text-slate-700">{emp.ssfEnrollmentDate}</span>
                  </>}
                  {emp.ssfHospital && <>
                    <span className="text-slate-400">Hospital</span>
                    <span className="text-slate-700">{emp.ssfHospital}</span>
                  </>}
                  {emp.ssfFundType === "33" && <>
                    <span className="text-slate-400">Contribution</span>
                    <span className="text-slate-700">฿{Math.min(Math.round(emp.salary * 0.05), 750).toLocaleString()}/mo each</span>
                  </>}
                </div>
              </div>
            )}
            {emp.bankAccounts && emp.bankAccounts.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-slate-400 font-medium">Bank Accounts</p>
                {emp.bankAccounts.map(acct => (
                  <div key={acct.id}
                    className={cn("flex items-start gap-3 p-3 rounded-xl border",
                      acct.isMain ? "bg-blue-50 border-blue-200" : "bg-slate-50 border-slate-200")}>
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                      acct.isMain ? "bg-blue-100" : "bg-slate-100")}>
                      <CreditCard size={13} className={acct.isMain ? "text-blue-600" : "text-slate-500"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-800">{acct.bankName}</span>
                        {acct.branch && <span className="text-xs text-slate-400">· {acct.branch}</span>}
                        {acct.isMain && (
                          <span className="flex items-center gap-0.5 text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full">
                            <Star size={8} fill="currentColor" /> Main
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 font-mono mt-0.5">{acct.accountNumber || "—"}</p>
                      <p className="text-xs text-slate-400">{acct.accountName}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Emergency */}
          {emp.emergencyName && (
            <section className="space-y-3 border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Emergency Contact</p>
              <InfoRow icon={User}  label="Name"         value={`${emp.emergencyName} (${emp.emergencyRelation})`} />
              <InfoRow icon={Phone} label="Phone"        value={emp.emergencyPhone} />
            </section>
          )}

          {/* Documents */}
          {(emp.photo || (emp.documents && emp.documents.length > 0)) && (
            <section className="space-y-2 border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Documents</p>
              {emp.photo && (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
                  <User size={13} className="text-blue-500" />
                  <span className="text-xs text-slate-700 flex-1">{emp.photo}</span>
                  <span className="text-[10px] text-blue-500 font-medium">PHOTO</span>
                </div>
              )}
              {emp.documents?.map((d, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
                  <FileText size={13} className="text-blue-500" />
                  <span className="text-xs text-slate-700 flex-1 truncate">{d}</span>
                </div>
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────

export default function EmployeesPage() {
  const [list,       setList]       = useState<Employee[]>(initialEmployees);
  const [showAdd,    setShowAdd]    = useState(false);
  const [editEmp,    setEditEmp]    = useState<Employee | undefined>(undefined);
  const [viewEmp,    setViewEmp]    = useState<Employee | undefined>(undefined);
  const [deleteId,   setDeleteId]   = useState<string | null>(null);
  const [search,     setSearch]     = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<"all" | EmployeeStatus>("all");

  const nextId = `EMP-${String(list.length + 1).padStart(3, "0")}`;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return list.filter(e => {
      if (deptFilter !== "All" && e.department !== deptFilter) return false;
      if (statusFilter !== "all" && e.status !== statusFilter)  return false;
      if (q && !e.name.toLowerCase().includes(q) &&
               !e.position.toLowerCase().includes(q) &&
               !e.id.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [list, search, deptFilter, statusFilter]);

  const totalSalary = list.reduce((s, e) => s + e.salary, 0);
  const active      = list.filter(e => e.status === "active").length;
  const onLeave     = list.filter(e => e.status === "on-leave").length;
  const depts       = Array.from(new Set(list.map(e => e.department))).sort();

  const handleSave = (emp: Employee) => {
    setList(prev => {
      const idx = prev.findIndex(e => e.id === emp.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = emp; return n; }
      return [...prev, emp];
    });
    setShowAdd(false);
    setEditEmp(undefined);
    setViewEmp(undefined);
  };

  const handleDelete = (id: string) => {
    setList(prev => prev.filter(e => e.id !== id));
    setDeleteId(null);
    setViewEmp(undefined);
  };

  return (
    <div>
      <Header
        title="Employees"
        subtitle={`${list.length} employees · ${formatCurrency(totalSalary)}/month total payroll`}
        actions={
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
            <Plus size={16} /> Add Employee
          </button>
        }
      />

      <div className="p-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Staff",     value: list.length, icon: Users,     color: "blue"    },
            { label: "Active",          value: active,      icon: TrendingUp, color: "emerald" },
            { label: "On Leave",        value: onLeave,     icon: Clock,      color: "amber"   },
            { label: "Inactive",        value: list.length - active - onLeave, icon: UserX, color: "slate" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center",
                color === "blue"    && "bg-blue-100 text-blue-600",
                color === "emerald" && "bg-emerald-100 text-emerald-600",
                color === "amber"   && "bg-amber-100 text-amber-600",
                color === "slate"   && "bg-slate-100 text-slate-500",
              )}>
                <Icon size={18} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-52">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, position, ID…"
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="All">All Departments</option>
            {depts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            {(["all", "active", "on-leave", "inactive"] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={cn("px-3 py-1 text-xs font-medium rounded-md transition-colors capitalize",
                  statusFilter === s ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
                {s === "all" ? "All" : STATUS_CFG[s as EmployeeStatus].label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">
              Employee Directory
              <span className="ml-2 text-xs font-normal text-slate-400">{filtered.length} shown</span>
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Employee</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Dept · Position</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Hire Date</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Salary</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-400">No employees match the current filters.</td></tr>
                )}
                {filtered.map(emp => (
                  <tr key={emp.id}
                    onClick={() => setViewEmp(emp)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-bold shrink-0">
                          {emp.firstName[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{emp.name}</p>
                          <p className="text-xs text-slate-400 font-mono">{emp.id}{emp.nickname ? ` · ${emp.nickname}` : ""}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-800 text-sm">{emp.department}</p>
                      <p className="text-xs text-slate-400">{emp.position}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium capitalize">
                        {EMP_TYPE_LABEL[emp.employmentType]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{emp.hireDate}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatCurrency(emp.salary)}</td>
                    <td className="px-4 py-3">
                      <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium", STATUS_CFG[emp.status].cls)}>
                        {STATUS_CFG[emp.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => setViewEmp(emp)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600" title="View">
                          <Eye size={14} />
                        </button>
                        <button onClick={() => { setEditEmp(emp); setShowAdd(true); }}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600" title="Edit">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleteId(emp.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t border-slate-200">
                  <td colSpan={4} className="px-5 py-3 text-sm font-semibold text-slate-700">Total Monthly Payroll</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">{formatCurrency(totalSalary)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Add / Edit modal */}
      {showAdd && (
        <EmployeeModal
          initial={editEmp}
          allEmployees={list}
          nextId={nextId}
          onClose={() => { setShowAdd(false); setEditEmp(undefined); }}
          onSave={handleSave}
        />
      )}

      {/* Detail modal */}
      {viewEmp && !showAdd && (
        <DetailModal
          emp={viewEmp}
          allEmployees={list}
          onClose={() => setViewEmp(undefined)}
          onEdit={() => { setEditEmp(viewEmp); setViewEmp(undefined); setShowAdd(true); }}
          onDelete={() => setDeleteId(viewEmp.id)}
        />
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-600" />
            </div>
            <h2 className="text-base font-semibold text-slate-900 mb-1">Delete Employee</h2>
            <p className="text-sm text-slate-500 mb-6">
              This will permanently remove <strong>{list.find(e => e.id === deleteId)?.name}</strong> and cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
              <button onClick={() => handleDelete(deleteId!)} className="flex-1 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
