"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import {
  expenses as initialExpenses, employees, branches,
  ExpenseStatus, EXPENSE_CATEGORIES,
  ExpenseRequestItem, ExpenseAttachment,
} from "@/lib/mock-data";
import { cn, formatCurrency } from "@/lib/utils";
import {
  Plus, Search, Eye, Trash2, X, Receipt, CheckCircle2, Clock,
  XCircle, ThumbsUp, ThumbsDown, Upload, Paperclip, AlertCircle,
  DollarSign, User, Banknote, Building2, Shield,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────

type Expense = (typeof initialExpenses)[number];
type UserRole = "admin" | "manager" | "staff" | "viewer";

const CAN_APPROVE: UserRole[] = ["admin", "manager"];

const statusConfig: Record<ExpenseStatus, { label: string; color: string; dot: string }> = {
  draft:       { label:"Draft",        color:"bg-slate-100 text-slate-500",    dot:"bg-slate-400" },
  pending:     { label:"Pending",      color:"bg-amber-100 text-amber-700",    dot:"bg-amber-500" },
  approved:    { label:"Approved",     color:"bg-emerald-100 text-emerald-700",dot:"bg-emerald-500" },
  rejected:    { label:"Rejected",     color:"bg-red-100 text-red-700",        dot:"bg-red-500" },
  reimbursed:  { label:"Reimbursed",   color:"bg-blue-100 text-blue-700",      dot:"bg-blue-500" },
};

// ── File upload mock ──────────────────────────────────────────────────

function FileUploadZone({ label, accept, required, files, onAdd, onRemove }:
  { label: string; accept: string; required?: boolean; files: string[]; onAdd: (name: string) => void; onRemove: (name: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div
        onClick={() => ref.current?.click()}
        className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-xl p-4 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all">
        <Upload size={16} className="text-slate-400" />
        <span className="text-sm text-slate-400">Click to upload or drag &amp; drop</span>
        <input ref={ref} type="file" accept={accept} className="hidden" onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) { onAdd(f.name); e.target.value = ""; }
        }} />
      </div>
      {files.length > 0 && (
        <div className="mt-2 space-y-1">
          {files.map((f) => (
            <div key={f} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
              <Paperclip size={12} className="text-slate-400 shrink-0" />
              <span className="text-xs text-slate-700 flex-1 truncate">{f}</span>
              <button onClick={(e) => { e.stopPropagation(); onRemove(f); }} className="text-slate-300 hover:text-red-500"><X size={12} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Add Expense Modal ─────────────────────────────────────────────────

interface AddExpenseModalProps {
  nextId: string;
  onClose: () => void;
  onSave: (exp: Expense) => void;
}

function AddExpenseModal({ nextId, onClose, onSave }: AddExpenseModalProps) {
  const [category,   setCategory]   = useState<string>(EXPENSE_CATEGORIES[0]);
  const [desc,       setDesc]       = useState("");
  const [date,       setDate]       = useState(new Date().toISOString().split("T")[0]);
  const [employeeId, setEmployeeId] = useState(employees[0].id);
  const [branchId,   setBranchId]   = useState(branches[0].id);
  const [notes,      setNotes]      = useState("");

  // Request items
  const [items, setItems] = useState<ExpenseRequestItem[]>([]);
  const [iName, setIName] = useState("");
  const [iQty,  setIQty]  = useState(1);
  const [iPrice,setIPrice]= useState(0);

  // Attachments
  const [receiptFiles,  setReceiptFiles]  = useState<string[]>([]);
  const [invoiceFiles,  setInvoiceFiles]  = useState<string[]>([]);

  const addItem = () => {
    if (!iName.trim() || iQty < 1 || iPrice <= 0) return;
    setItems((p) => [...p, { name: iName, qty: iQty, unitPrice: iPrice }]);
    setIName(""); setIQty(1); setIPrice(0);
  };

  const total = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const emp   = employees.find((e) => e.id === employeeId)!;

  const isValid = desc.trim() && items.length > 0 && (receiptFiles.length > 0 || invoiceFiles.length > 0);

  const handleSave = () => {
    const attachments: ExpenseAttachment[] = [
      ...receiptFiles.map((f) => ({ name: f, type: "receipt" as const, url: "" })),
      ...invoiceFiles.map((f) => ({ name: f, type: "invoice" as const, url: "" })),
    ];
    const newExp: Expense = {
      id: nextId, category, description: desc, date, amount: total,
      status: "pending" as ExpenseStatus,
      employeeId, employeeName: emp.name, branchId,
      requestItems: items, attachments,
      notes, approvedBy: null, approvedAt: null, reimbursedInPayroll: null,
    };
    onSave(newExp);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Add Expense</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              <span className="font-mono font-medium text-blue-600">{nextId}</span>
              {" · "}Requires manager approval before reimbursement
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Who & where */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Employee *</label>
              <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                {employees.map((e) => <option key={e.id} value={e.id}>{e.name} — {e.position}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Branch *</label>
              <select value={branchId} onChange={(e) => setBranchId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
              </select>
            </div>
          </div>

          {/* Category + Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Category *</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Expense Date *</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Description *</label>
            <input value={desc} onChange={(e) => setDesc(e.target.value)}
              placeholder="Brief description of the expense..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* Request items */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">
              Request Items <span className="text-red-500">*</span>
              <span className="text-slate-400 font-normal ml-1">(itemised breakdown required)</span>
            </label>
            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-5">
                  <label className="block text-xs text-slate-500 mb-1">Item Name</label>
                  <input value={iName} onChange={(e) => setIName(e.target.value)} placeholder="e.g. Taxi fare"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-slate-500 mb-1">Qty</label>
                  <input type="number" min="1" value={iQty} onChange={(e) => setIQty(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs text-slate-500 mb-1">Unit Price (฿)</label>
                  <input type="number" min="0" value={iPrice || ""} onChange={(e) => setIPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="col-span-2">
                  <button onClick={addItem} disabled={!iName.trim() || iQty < 1 || iPrice <= 0}
                    className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 font-medium">
                    + Add
                  </button>
                </div>
              </div>

              {items.length > 0 && (
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="text-left px-3 py-2 font-semibold text-slate-500">Item</th>
                        <th className="text-right px-3 py-2 font-semibold text-slate-500">Qty</th>
                        <th className="text-right px-3 py-2 font-semibold text-slate-500">Unit</th>
                        <th className="text-right px-3 py-2 font-semibold text-slate-500">Total</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2 font-medium text-slate-800">{item.name}</td>
                          <td className="px-3 py-2 text-right text-slate-600">{item.qty}</td>
                          <td className="px-3 py-2 text-right text-slate-600">{formatCurrency(item.unitPrice)}</td>
                          <td className="px-3 py-2 text-right font-semibold text-slate-900">{formatCurrency(item.qty * item.unitPrice)}</td>
                          <td className="px-3 py-2 text-center">
                            <button onClick={() => setItems((p) => p.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-red-500"><X size={12} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-blue-50 border-t border-slate-200">
                        <td colSpan={3} className="px-3 py-2 font-bold text-slate-700">Total Amount</td>
                        <td className="px-3 py-2 text-right font-bold text-blue-700">{formatCurrency(total)}</td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
              {items.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-2">Add at least one item to continue.</p>
              )}
            </div>
          </div>

          {/* Attachments */}
          <div className="grid grid-cols-2 gap-4">
            <FileUploadZone
              label="Receipt(s)"
              accept="image/*,.pdf"
              required
              files={receiptFiles}
              onAdd={(f) => setReceiptFiles((p) => [...p, f])}
              onRemove={(f) => setReceiptFiles((p) => p.filter((x) => x !== f))}
            />
            <FileUploadZone
              label="Tax Invoice / Documents"
              accept=".pdf,image/*"
              required
              files={invoiceFiles}
              onAdd={(f) => setInvoiceFiles((p) => [...p, f])}
              onRemove={(f) => setInvoiceFiles((p) => p.filter((x) => x !== f))}
            />
          </div>

          {/* Reimbursement note */}
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
            <Banknote size={16} className="text-blue-500 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-700">
              <p className="font-semibold">Reimbursement Policy</p>
              <p className="mt-0.5 text-blue-600">Once approved by your branch manager, the expense will be included in your next salary payment (payroll reimbursement).</p>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Additional Notes</label>
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Context, justification, or special circumstances..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          {!isValid && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
              <AlertCircle size={13} className="shrink-0" />
              Description, at least one line item, and at least one attachment are required.
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 sticky bottom-0 bg-white">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
          <button onClick={handleSave} disabled={!isValid}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40">
            <Receipt size={14} /> Submit for Approval
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Detail Modal ──────────────────────────────────────────────────────

interface DetailModalProps {
  exp: Expense;
  currentRole: UserRole;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

function DetailModal({ exp, currentRole, onClose, onApprove, onReject }: DetailModalProps) {
  const canApprove = CAN_APPROVE.includes(currentRole);
  const cfg        = statusConfig[exp.status];
  const branch     = branches.find((b) => b.id === exp.branchId);
  const approver   = employees.find((e) => e.id === exp.approvedBy);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><Receipt size={20} className="text-blue-600" /></div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900">{exp.id}</h2>
                <span className={cn("flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium", cfg.color)}>
                  <div className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />{cfg.label}
                </span>
              </div>
              <p className="text-xs text-slate-400">{exp.category} · {exp.employeeName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Approval panel */}
          {exp.status === "pending" && (
            <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-amber-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Awaiting Manager Approval</p>
                  <p className="text-xs text-slate-500 mt-0.5">Once approved, expense will be reimbursed at next salary payment.</p>
                </div>
              </div>
              {canApprove ? (
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => onReject(exp.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50">
                    <ThumbsDown size={12} /> Reject
                  </button>
                  <button onClick={() => onApprove(exp.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                    <ThumbsUp size={12} /> Approve
                  </button>
                </div>
              ) : (
                <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0"><Shield size={11} /> Manager only</span>
              )}
            </div>
          )}

          {exp.status === "approved" && (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">Approved — Pending Payroll Reimbursement</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Approved by <strong>{approver?.name ?? "—"}</strong>{exp.approvedAt ? ` on ${exp.approvedAt}` : ""}.
                  Will be reimbursed in next salary payment.
                </p>
              </div>
            </div>
          )}

          {exp.status === "reimbursed" && (
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <Banknote size={16} className="text-blue-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-800">Reimbursed via Payroll</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Included in payroll run <strong>{exp.reimbursedInPayroll ?? "—"}</strong>.
                  Approved by <strong>{approver?.name ?? "—"}</strong>.
                </p>
              </div>
            </div>
          )}

          {exp.status === "rejected" && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
              <XCircle size={16} className="text-red-500 shrink-0" />
              <p className="text-sm text-red-700 font-medium">Rejected by branch manager. Please revise and resubmit.</p>
            </div>
          )}

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1"><User size={11} /> Employee</p>
              <p className="font-semibold text-slate-800">{exp.employeeName}</p>
              <p className="text-slate-500">{employees.find((e) => e.id === exp.employeeId)?.position}</p>
              <p className="text-slate-500 flex items-center gap-1"><Building2 size={11} /> {branch?.name ?? "—"}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Expense Info</p>
              <div className="flex justify-between"><span className="text-slate-500">Category</span><span className="font-medium">{exp.category}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Date</span><span className="font-medium">{exp.date}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Total</span><span className="font-bold text-blue-700">{formatCurrency(exp.amount)}</span></div>
            </div>
          </div>

          {exp.notes && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-700 mb-1">Notes</p>
              <p className="text-sm text-amber-800">{exp.notes}</p>
            </div>
          )}

          {/* Request items */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Request Items</p>
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Item</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500">Qty</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500">Unit Price</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {exp.requestItems.map((item, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2.5 font-medium text-slate-800">{item.name}</td>
                      <td className="px-4 py-2.5 text-right text-slate-600">{item.qty}</td>
                      <td className="px-4 py-2.5 text-right text-slate-600">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-4 py-2.5 text-right font-semibold">{formatCurrency(item.qty * item.unitPrice)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-blue-50 border-t border-slate-200">
                    <td colSpan={3} className="px-4 py-2.5 font-bold text-slate-700">Total</td>
                    <td className="px-4 py-2.5 text-right font-bold text-blue-700">{formatCurrency(exp.amount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Attachments */}
          {exp.attachments.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Attachments</p>
              <div className="space-y-1.5">
                {exp.attachments.map((a, i) => (
                  <div key={i} className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                    <Paperclip size={13} className="text-slate-400 shrink-0" />
                    <span className="text-sm text-slate-700 flex-1">{a.name}</span>
                    <span className={cn("text-xs px-1.5 py-0.5 rounded font-medium",
                      a.type === "receipt" ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600")}>
                      {a.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────

export default function ExpensesPage() {
  const [list,        setList]        = useState<Expense[]>(initialExpenses as Expense[]);
  const [search,      setSearch]      = useState("");
  const [statusF,     setStatusF]     = useState<"all" | ExpenseStatus>("all");
  const [categoryF,   setCategoryF]   = useState("all");
  const [currentRole, setCurrentRole] = useState<UserRole>("staff");

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.ok ? r.json() : null).then((me) => {
      if (me?.role) setCurrentRole(me.role as UserRole);
    }).catch(() => {});
  }, []);
  const [showNew,     setShowNew]     = useState(false);
  const [viewId,      setViewId]      = useState<string | null>(null);
  const [deleteId,    setDeleteId]    = useState<string | null>(null);

  const nextId = `EXP-${String(list.length + 1).padStart(3, "0")}`;

  const pendingCount = list.filter((e) => e.status === "pending").length;

  const filtered = useMemo(() => list.filter((exp) => {
    const q      = search.toLowerCase();
    const matchQ = !q || exp.id.toLowerCase().includes(q) || exp.description.toLowerCase().includes(q) || exp.employeeName.toLowerCase().includes(q);
    const matchS = statusF === "all" || exp.status === statusF;
    const matchC = categoryF === "all" || exp.category === categoryF;
    return matchQ && matchS && matchC;
  }), [list, search, statusF, categoryF]);

  const totals = useMemo(() => ({
    total:      list.reduce((s, e) => s + e.amount, 0),
    pending:    list.filter((e) => e.status === "pending").reduce((s, e) => s + e.amount, 0),
    approved:   list.filter((e) => e.status === "approved").reduce((s, e) => s + e.amount, 0),
    reimbursed: list.filter((e) => e.status === "reimbursed").reduce((s, e) => s + e.amount, 0),
  }), [list]);

  const handleSave = (exp: Expense) => {
    setList((p) => [exp, ...p]);
    setShowNew(false);
  };

  const handleApprove = (id: string) => {
    const today = new Date().toISOString().split("T")[0];
    setList((p) => p.map((e) => e.id === id
      ? { ...e, status: "approved" as ExpenseStatus, approvedBy: "", approvedAt: today }
      : e));
    setViewId(null);
  };

  const handleReject = (id: string) => {
    setList((p) => p.map((e) => e.id === id ? { ...e, status: "rejected" as ExpenseStatus } : e));
    setViewId(null);
  };

  const viewExp = viewId ? list.find((e) => e.id === viewId) : null;
  const allCategories = ["all", ...Array.from(new Set(list.map((e) => e.category)))];

  return (
    <div>
      <Header
        title="Expenses"
        subtitle={`${list.length} records · Total ${formatCurrency(totals.total)}`}
        actions={
          <button onClick={() => setShowNew(true)}
            className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 font-medium">
            <Plus size={16} /> Add Expense
          </button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Pending banner */}
        {pendingCount > 0 && CAN_APPROVE.includes(currentRole) && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <Clock size={16} className="text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">{pendingCount} expense{pendingCount > 1 ? "s" : ""} awaiting your approval</p>
              <p className="text-xs text-slate-500">Approved expenses will be queued for payroll reimbursement.</p>
            </div>
            <button onClick={() => setStatusF("pending")} className="ml-auto text-xs font-medium text-blue-600 hover:underline shrink-0">View pending →</button>
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label:"Total Expenses",  value:totals.total,      color:"blue",    icon:<DollarSign size={18} /> },
            { label:"Pending Approval",value:totals.pending,    color:"amber",   icon:<Clock size={18} /> },
            { label:"Approved",        value:totals.approved,   color:"emerald", icon:<CheckCircle2 size={18} /> },
            { label:"Reimbursed",      value:totals.reimbursed, color:"blue",    icon:<Banknote size={18} /> },
          ].map(({ label, value, color, icon }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-500 font-medium">{label}</p>
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center",
                  color === "blue"    && "bg-blue-100 text-blue-600",
                  color === "amber"   && "bg-amber-100 text-amber-600",
                  color === "emerald" && "bg-emerald-100 text-emerald-600")}>
                  {icon}
                </div>
              </div>
              <p className="text-xl font-bold text-slate-900">{formatCurrency(value)}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search expense or employee..."
              className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={categoryF} onChange={(e) => setCategoryF(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">All Categories</option>
            {allCategories.filter((c) => c !== "all").map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            {(["all","pending","approved","reimbursed","rejected","draft"] as const).map((s) => (
              <button key={s} onClick={() => setStatusF(s)}
                className={cn("px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap",
                  statusF === s ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
                {s === "all" ? "All" : statusConfig[s].label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">ID</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Employee</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Description</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Docs</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((exp) => {
                  const cfg = statusConfig[exp.status];
                  return (
                    <tr key={exp.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-5 py-3 font-mono text-xs text-blue-600 font-semibold">{exp.id}</td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-slate-800 text-xs">{exp.employeeName}</p>
                        <p className="text-xs text-slate-400">{branches.find((b) => b.id === exp.branchId)?.code}</p>
                      </td>
                      <td className="px-5 py-3 text-slate-600 text-xs">{exp.category}</td>
                      <td className="px-5 py-3 text-slate-700 max-w-[180px] truncate">{exp.description}</td>
                      <td className="px-5 py-3 text-slate-500 text-xs">{exp.date}</td>
                      <td className="px-5 py-3 text-right font-semibold text-slate-900">{formatCurrency(exp.amount)}</td>
                      <td className="px-5 py-3">
                        <span className={cn("flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium w-fit", cfg.color)}>
                          <div className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />{cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        {exp.attachments.length > 0
                          ? <span className="inline-flex items-center gap-1 text-xs text-slate-600"><Paperclip size={11} />{exp.attachments.length}</span>
                          : <span className="text-xs text-red-400 flex items-center gap-1 justify-center"><AlertCircle size={11} /> None</span>}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setViewId(exp.id)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600"><Eye size={14} /></button>
                          {exp.status === "pending" && CAN_APPROVE.includes(currentRole) && (
                            <>
                              <button onClick={() => handleApprove(exp.id)} className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600"><ThumbsUp size={14} /></button>
                              <button onClick={() => handleReject(exp.id)}  className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"><ThumbsDown size={14} /></button>
                            </>
                          )}
                          <button onClick={() => setDeleteId(exp.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-12 text-center"><Receipt size={28} className="mx-auto text-slate-300 mb-2" /><p className="text-sm text-slate-400">No expenses found.</p></div>
          )}
        </div>
      </div>

      {showNew && <AddExpenseModal nextId={nextId} onClose={() => setShowNew(false)} onSave={handleSave} />}

      {viewExp && (
        <DetailModal exp={viewExp} currentRole={currentRole}
          onClose={() => setViewId(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><Trash2 size={22} className="text-red-600" /></div>
            <h2 className="text-base font-semibold text-slate-900 mb-1">Delete Expense</h2>
            <p className="text-sm text-slate-500 mb-6">Remove <strong>{deleteId}</strong>? This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
              <button onClick={() => { setList((p) => p.filter((e) => e.id !== deleteId)); setDeleteId(null); }}
                className="flex-1 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
