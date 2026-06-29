"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { useBranch } from "@/context/BranchContext";
import {
  employees,
  employeeShifts as initialEmployeeShifts,
  shifts as initialShifts,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Plus, Pencil, X, Clock } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ShiftColor = "blue" | "amber" | "violet" | "emerald";

interface Shift {
  id: string;
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  color: ShiftColor;
}

interface EmployeeShift {
  id: string;
  employeeId: string;
  shiftId: string;
  branchId: string;
  daysOfWeek: number[];
  effectiveFrom: string;
}

interface ShiftModalState {
  mode: "add" | "edit";
  data?: Shift;
}

interface AssignModalState {
  employeeShiftId?: string;
  employeeId: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COLOR_OPTIONS: ShiftColor[] = ["blue", "amber", "violet", "emerald"];
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const shiftColorMap: Record<ShiftColor, { badge: string; dot: string }> = {
  blue:    { badge: "bg-blue-100 text-blue-700",     dot: "bg-blue-500"    },
  amber:   { badge: "bg-amber-100 text-amber-700",   dot: "bg-amber-500"   },
  violet:  { badge: "bg-violet-100 text-violet-700", dot: "bg-violet-500"  },
  emerald: { badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcWorkHours(startTime: string, endTime: string, breakMinutes: number): string {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const startMin = sh * 60 + sm;
  const endMin   = eh * 60 + em;
  const totalMin = (endMin >= startMin ? endMin - startMin : 24 * 60 - startMin + endMin) - breakMinutes;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

// ─── Shift card ───────────────────────────────────────────────────────────────

function ShiftCard({
  shift,
  onEdit,
}: {
  shift: Shift;
  onEdit: (s: Shift) => void;
}) {
  const colors = shiftColorMap[shift.color];
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("w-3 h-3 rounded-full shrink-0", colors.dot)} />
          <div>
            <p className="font-semibold text-slate-900">{shift.name}</p>
            <p className="text-xs text-slate-400">{shift.code}</p>
          </div>
        </div>
        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", colors.badge)}>
          {shift.color}
        </span>
      </div>
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Clock size={14} className="text-slate-400" />
        <span className="font-mono font-medium text-slate-800">{shift.startTime} – {shift.endTime}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
        <div className="bg-slate-50 rounded-lg px-3 py-2">
          <p className="text-slate-400">Break</p>
          <p className="font-medium text-slate-700">{shift.breakMinutes} min</p>
        </div>
        <div className="bg-slate-50 rounded-lg px-3 py-2">
          <p className="text-slate-400">Working</p>
          <p className="font-medium text-slate-700">{calcWorkHours(shift.startTime, shift.endTime, shift.breakMinutes)}</p>
        </div>
      </div>
      <button
        onClick={() => onEdit(shift)}
        className="flex items-center justify-center gap-1.5 w-full py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
      >
        <Pencil size={12} /> Edit
      </button>
    </div>
  );
}

// ─── Shift Modal ──────────────────────────────────────────────────────────────

function ShiftModal({
  state,
  onClose,
  onSave,
}: {
  state: ShiftModalState;
  onClose: () => void;
  onSave: (shift: Shift) => void;
}) {
  const blank: Shift = { id: "", name: "", code: "", startTime: "08:00", endTime: "17:00", breakMinutes: 60, color: "blue" };
  const [form, setForm] = useState<Shift>(state.data ?? blank);

  const set = <K extends keyof Shift>(k: K, v: Shift[K]) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = () => {
    if (!form.name.trim() || !form.code.trim()) return;
    onSave({
      ...form,
      id: form.id || `SH-${Date.now()}`,
      code: form.code.toUpperCase().slice(0, 3),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-900">
            {state.mode === "add" ? "Add Shift" : "Edit Shift"}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={16} className="text-slate-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
              <input
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Morning Shift"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Code (3 chars)</label>
              <input
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.code}
                maxLength={3}
                onChange={(e) => set("code", e.target.value.toUpperCase())}
                placeholder="MOR"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Start Time</label>
              <input
                type="time"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.startTime}
                onChange={(e) => set("startTime", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">End Time</label>
              <input
                type="time"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.endTime}
                onChange={(e) => set("endTime", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Break (minutes)</label>
            <input
              type="number"
              min={0}
              max={240}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.breakMinutes}
              onChange={(e) => set("breakMinutes", Number(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Color</label>
            <div className="flex gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => set("color", c)}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                    shiftColorMap[c].badge,
                    form.color === c ? "ring-2 ring-offset-1 ring-blue-500 border-transparent" : "border-slate-200"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
            {state.mode === "add" ? "Add Shift" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Assign Modal ─────────────────────────────────────────────────────────────

function AssignModal({
  state,
  shiftList,
  onClose,
  onSave,
}: {
  state: AssignModalState;
  shiftList: Shift[];
  onClose: () => void;
  onSave: (updated: EmployeeShift) => void;
}) {
  const emp = employees.find((e) => e.id === state.employeeId)!;
  const [selectedShiftId, setSelectedShiftId] = useState(shiftList[0]?.id ?? "");
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [effectiveFrom, setEffectiveFrom] = useState("2026-06-29");

  const toggleDay = (d: number) =>
    setSelectedDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort());

  const handleSave = () => {
    const updated: EmployeeShift = {
      id: state.employeeShiftId ?? `ES-${Date.now()}`,
      employeeId: state.employeeId,
      shiftId: selectedShiftId,
      branchId: "",
      daysOfWeek: selectedDays,
      effectiveFrom,
    };
    onSave(updated);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Reassign Shift</h3>
            <p className="text-xs text-slate-500 mt-0.5">{emp.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={16} className="text-slate-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Shift selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Select Shift</label>
            <div className="space-y-2">
              {shiftList.map((s) => {
                const colors = shiftColorMap[s.color];
                return (
                  <label key={s.id} className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors",
                    selectedShiftId === s.id ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:bg-slate-50"
                  )}>
                    <input
                      type="radio"
                      name="shift"
                      value={s.id}
                      checked={selectedShiftId === s.id}
                      onChange={() => setSelectedShiftId(s.id)}
                      className="sr-only"
                    />
                    <span className={cn("w-3 h-3 rounded-full shrink-0", colors.dot)} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">{s.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{s.startTime} – {s.endTime}</p>
                    </div>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", colors.badge)}>{s.code}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Days selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Working Days</label>
            <div className="flex gap-2 flex-wrap">
              {DAY_LABELS.map((label, i) => (
                <button
                  key={i}
                  onClick={() => toggleDay(i)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                    selectedDays.includes(i)
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Effective from */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Effective From</label>
            <input
              type="date"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
            Save Assignment
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ShiftsPage() {
  const { activeBranch } = useBranch();

  const [shiftList, setShiftList] = useState<Shift[]>([...initialShifts]);
  const [assignments, setAssignments] = useState<EmployeeShift[]>([...initialEmployeeShifts]);
  const [shiftModal, setShiftModal] = useState<ShiftModalState | null>(null);
  const [assignModal, setAssignModal] = useState<AssignModalState | null>(null);

  const handleSaveShift = (shift: Shift) => {
    setShiftList((prev) => {
      const idx = prev.findIndex((s) => s.id === shift.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = shift;
        return next;
      }
      return [...prev, shift];
    });
    setShiftModal(null);
  };

  const handleSaveAssignment = (updated: EmployeeShift) => {
    setAssignments((prev) => {
      const idx = prev.findIndex((a) => a.id === updated.id);
      const withBranch = { ...updated, branchId: activeBranch.id };
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = withBranch;
        return next;
      }
      return [...prev, withBranch];
    });
    setAssignModal(null);
  };

  // Assignments for activeBranch
  const branchAssignments = assignments.filter((a) => a.branchId === activeBranch.id);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header
        title="Shift Management"
        subtitle="Configure shifts and assign to employees"
        actions={
          <button
            onClick={() => setShiftModal({ mode: "add" })}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={15} /> Add Shift
          </button>
        }
      />

      <main className="flex-1 p-6 space-y-8">
        {/* Section 1: Shift Templates */}
        <section>
          <h2 className="text-sm font-semibold text-slate-800 mb-4">Shift Templates</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {shiftList.map((s) => (
              <ShiftCard key={s.id} shift={s} onEdit={(sh) => setShiftModal({ mode: "edit", data: sh })} />
            ))}
            <button
              onClick={() => setShiftModal({ mode: "add" })}
              className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-xl p-5 text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors min-h-[160px]"
            >
              <Plus size={20} />
              <span className="text-sm font-medium">Add Shift</span>
            </button>
          </div>
        </section>

        {/* Section 2: Employee Shift Assignments */}
        <section>
          <h2 className="text-sm font-semibold text-slate-800 mb-4">
            Assignments — {activeBranch.name}
          </h2>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {["Employee", "Department", "Current Shift", "Days", "Effective From", ""].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {branchAssignments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                        No assignments for {activeBranch.name}. Switch branch or add assignments.
                      </td>
                    </tr>
                  )}
                  {branchAssignments.map((a) => {
                    const emp = employees.find((e) => e.id === a.employeeId);
                    const shift = shiftList.find((s) => s.id === a.shiftId);
                    if (!emp || !shift) return null;
                    const colors = shiftColorMap[shift.color];
                    return (
                      <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">{emp.name}</td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{emp.department}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", colors.badge)}>
                            <span className={cn("w-2 h-2 rounded-full", colors.dot)} />
                            {shift.name}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex gap-1">
                            {DAY_LABELS.map((label, i) => (
                              <span
                                key={i}
                                className={cn(
                                  "w-7 h-7 rounded-md flex items-center justify-center text-xs font-medium",
                                  a.daysOfWeek.includes(i)
                                    ? cn(colors.badge)
                                    : "bg-slate-100 text-slate-300"
                                )}
                              >
                                {label.slice(0, 1)}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap font-mono text-xs">{a.effectiveFrom}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button
                            onClick={() => setAssignModal({ employeeShiftId: a.id, employeeId: a.employeeId })}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                          >
                            <Pencil size={11} /> Reassign
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      {/* Shift Modal */}
      {shiftModal && (
        <ShiftModal
          state={shiftModal}
          onClose={() => setShiftModal(null)}
          onSave={handleSaveShift}
        />
      )}

      {/* Assign Modal */}
      {assignModal && (
        <AssignModal
          state={assignModal}
          shiftList={shiftList}
          onClose={() => setAssignModal(null)}
          onSave={handleSaveAssignment}
        />
      )}
    </div>
  );
}
