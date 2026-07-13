"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { usePermissions } from "@/lib/use-permissions";
import { crmCustomers, getTier, tierColors } from "@/lib/mock-data";
import { cn, formatCurrency } from "@/lib/utils";
import {
  Plus, Search, Eye, Pencil, Trash2, X, User, Building2,
  Phone, Mail, MapPin, Calendar, Tag, CreditCard, FileText,
  XCircle, Star, Receipt, Gift, QrCode, Download, Copy, CheckCheck,
} from "lucide-react";

// ── Explicit types (avoids Extract<> returning never on inferred union) ─

interface BaseProfile {
  id: string;
  phone: string;
  email: string;
  address: string;
  totalSpend: number;
  status: "active" | "inactive";
  joinDate: string;
  notes: string;
  tags: string[];
}

interface IndividualProfile extends BaseProfile {
  customerType: "individual";
  firstName: string;
  lastName: string;
  gender: "male" | "female" | "other";
  dob: string;
  nationalId: string;
}

interface CorporateProfile extends BaseProfile {
  customerType: "corporate";
  companyName: string;
  taxId: string;
  registrationNo: string;
  contactPerson: string;
  contactTitle: string;
  businessType: string;
  website: string;
}

type Profile = IndividualProfile | CorporateProfile;

// ── Constants ─────────────────────────────────────────────────────────

const FALLBACK_BUSINESS_TYPES = [
  "Manufacturing","Trading","Construction","Technology","Retail",
  "Logistics","Services","Healthcare","Education","Food & Beverage","Other",
];

// ── Helpers ───────────────────────────────────────────────────────────

function displayName(p: Profile): string {
  return p.customerType === "individual"
    ? `${p.firstName} ${p.lastName}`
    : p.companyName;
}

function displayInitial(p: Profile): string {
  if (p.customerType === "individual") return p.firstName[0] + p.lastName[0];
  return p.companyName[0];
}

function TagBadge({ tag }: { tag: string }) {
  const colors: Record<string, string> = {
    vip:        "bg-amber-100 text-amber-700",
    enterprise: "bg-blue-100 text-blue-700",
    priority:   "bg-violet-100 text-violet-700",
    sme:        "bg-slate-100 text-slate-600",
    repeat:     "bg-emerald-100 text-emerald-700",
    startup:    "bg-pink-100 text-pink-700",
    discount:   "bg-orange-100 text-orange-700",
    inactive:   "bg-red-100 text-red-700",
    english:    "bg-sky-100 text-sky-700",
    net30:      "bg-teal-100 text-teal-700",
    prospect:   "bg-purple-100 text-purple-700",
    regular:    "bg-slate-100 text-slate-500",
  };
  return (
    <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-medium", colors[tag] ?? "bg-slate-100 text-slate-500")}>
      #{tag}
    </span>
  );
}

// ── Add/Edit Modal ────────────────────────────────────────────────────

interface CustomerModalProps {
  initial?: Profile;
  nextId: string;
  businessTypes: string[];
  onClose: () => void;
  onSave: (p: Profile) => void;
}

function CustomerModal({ initial, nextId, businessTypes, onClose, onSave }: CustomerModalProps) {
  const [type, setType] = useState<"individual" | "corporate">(initial?.customerType ?? "individual");

  // Individual
  const [firstName,  setFirstName]  = useState(initial?.customerType === "individual" ? initial.firstName  : "");
  const [lastName,   setLastName]   = useState(initial?.customerType === "individual" ? initial.lastName   : "");
  const [gender,     setGender]     = useState<"male"|"female"|"other">(initial?.customerType === "individual" ? initial.gender : "male");
  const [dob,        setDob]        = useState(initial?.customerType === "individual" ? initial.dob        : "");
  const [nationalId, setNationalId] = useState(initial?.customerType === "individual" ? initial.nationalId : "");

  // Corporate
  const [companyName,    setCompanyName]    = useState(initial?.customerType === "corporate" ? initial.companyName    : "");
  const [taxId,          setTaxId]          = useState(initial?.customerType === "corporate" ? initial.taxId          : "");
  const [registrationNo, setRegistrationNo] = useState(initial?.customerType === "corporate" ? initial.registrationNo : "");
  const [contactPerson,  setContactPerson]  = useState(initial?.customerType === "corporate" ? initial.contactPerson  : "");
  const [contactTitle,   setContactTitle]   = useState(initial?.customerType === "corporate" ? initial.contactTitle   : "");
  const [businessType,   setBusinessType]   = useState(initial?.customerType === "corporate" ? initial.businessType   : "Manufacturing");
  const [website,        setWebsite]        = useState(initial?.customerType === "corporate" ? initial.website        : "");

  // Shared
  const [phone,    setPhone]    = useState(initial?.phone   ?? "");
  const [email,    setEmail]    = useState(initial?.email   ?? "");
  const [address,  setAddress]  = useState(initial?.address ?? "");
  const [notes,    setNotes]    = useState(initial?.notes   ?? "");
  const [status,   setStatus]   = useState<"active"|"inactive">(initial?.status ?? "active");
  const [tags,     setTags]     = useState<string[]>(initial?.tags ?? []);
  const [tagInput, setTagInput] = useState("");

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput("");
  };

  const isEdit  = !!initial;
  const canSave = type === "individual"
    ? (firstName.trim() && lastName.trim() && phone.trim())
    : (companyName.trim() && phone.trim());

  const handleSave = () => {
    const base: BaseProfile = {
      id:         initial?.id ?? nextId,
      phone, email, address, notes, status, tags,
      joinDate:   initial?.joinDate ?? new Date().toISOString().split("T")[0],
      totalSpend: initial?.totalSpend ?? 0,
    };
    if (type === "individual") {
      onSave({ ...base, customerType: "individual", firstName, lastName, gender, dob, nationalId });
    } else {
      onSave({ ...base, customerType: "corporate", companyName, taxId, registrationNo, contactPerson, contactTitle, businessType, website });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{isEdit ? "Edit Customer" : "New Customer"}</h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{initial?.id ?? nextId}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>

        {/* Type switcher (add only) */}
        {!isEdit && (
          <div className="px-6 pt-5">
            <p className="text-xs font-medium text-slate-600 mb-2">Customer Type *</p>
            <div className="grid grid-cols-2 gap-2">
              {([
                ["individual", "Individual", "Person / Consumer"],
                ["corporate",  "Corporate",  "Company / Business"],
              ] as const).map(([val, label, sub]) => (
                <button key={val} onClick={() => setType(val)}
                  className={cn("flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left",
                    type === val ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300 bg-white")}>
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    type === val ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-500")}>
                    {val === "individual" ? <User size={16} /> : <Building2 size={16} />}
                  </div>
                  <div>
                    <p className={cn("text-sm font-semibold", type === val ? "text-blue-700" : "text-slate-700")}>{label}</p>
                    <p className="text-xs text-slate-400">{sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-5">
          {/* Individual fields */}
          {type === "individual" && (
            <div className="space-y-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Personal Information</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">First Name *</label>
                  <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="e.g. Somchai"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Last Name *</label>
                  <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="e.g. Jaidee"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Gender</label>
                  <select value={gender} onChange={(e) => setGender(e.target.value as typeof gender)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other / Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Date of Birth</label>
                  <input type="date" value={dob} onChange={(e) => setDob(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">National ID / Passport No.</label>
                <input value={nationalId} onChange={(e) => setNationalId(e.target.value)}
                  placeholder="13-digit Thai ID or passport"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          )}

          {/* Corporate fields */}
          {type === "corporate" && (
            <div className="space-y-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Company Information</p>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Company Name *</label>
                <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g. Acme Corporation Co., Ltd."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Tax ID (13 digit)</label>
                  <input value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="0000000000000"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Registration No.</label>
                  <input value={registrationNo} onChange={(e) => setRegistrationNo(e.target.value)} placeholder="BC-XXXX-XXXXXX"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Business Type</label>
                <select value={businessType} onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {businessTypes.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Contact Person</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
                    <input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="Full name"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Title / Position</label>
                    <input value={contactTitle} onChange={(e) => setContactTitle(e.target.value)} placeholder="e.g. Procurement Director"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Website</label>
                <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="www.example.com"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          )}

          {/* Shared fields */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact & Location</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Phone *</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08X-XXX-XXXX"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Address</label>
              <textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)}
                placeholder="Street, Subdistrict, District, Province, Postcode"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
          </div>

          {/* Tags */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-medium text-slate-600 mb-2">Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((t) => (
                <span key={t} className="flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  #{t}
                  <button onClick={() => setTags((prev) => prev.filter((x) => x !== t))} className="text-slate-400 hover:text-red-500"><X size={10} /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                placeholder="Type tag and press Enter"
                className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button onClick={addTag} className="px-3 py-1.5 text-xs bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium">Add</button>
            </div>
          </div>

          {/* Status & Notes */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as "active" | "inactive")}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal notes..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
          <button disabled={!canSave} onClick={handleSave}
            className="px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40">
            {isEdit ? "Save Changes" : "Add Customer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Detail Modal ──────────────────────────────────────────────────────

interface DetailModalProps {
  profile: Profile;
  onClose: () => void;
  onEdit: (p: Profile) => void;
}

function DetailModal({ profile, onClose, onEdit }: DetailModalProps) {
  const isInd = profile.customerType === "individual";
  const displayedName = isInd
    ? `${(profile as IndividualProfile).firstName} ${(profile as IndividualProfile).lastName}`
    : (profile as CorporateProfile).companyName;

  const relatedOrders:   any[] = [];
  const relatedInvoices: any[] = [];

  // CRM — match by email
  const crmRecord = crmCustomers.find(
    (c) => c.email.toLowerCase() === (profile.email ?? "").toLowerCase()
  );
  const crmTier = crmRecord ? getTier(crmRecord.pointsBalance) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-lg",
              isInd ? "bg-blue-500" : "bg-violet-500")}>
              {displayInitial(profile)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900">{displayName(profile)}</h2>
                <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1",
                  isInd ? "bg-blue-100 text-blue-700" : "bg-violet-100 text-violet-700")}>
                  {isInd ? <User size={10} /> : <Building2 size={10} />}
                  {isInd ? "Individual" : "Corporate"}
                </span>
                <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                  profile.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500")}>
                  {profile.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{profile.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onEdit(profile)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50">
              <Pencil size={12} /> Edit
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Total Spend",  value: formatCurrency(profile.totalSpend), icon: <CreditCard size={16} className="text-blue-600" />,   bg: "bg-blue-50" },
              { label: "Orders",       value: String(relatedOrders.length),       icon: <FileText  size={16} className="text-violet-600" />,  bg: "bg-violet-50" },
              { label: "Invoices",     value: String(relatedInvoices.length),     icon: <Receipt   size={16} className="text-amber-600" />,   bg: "bg-amber-50" },
              { label: "CRM Points",   value: crmRecord ? crmRecord.pointsBalance.toLocaleString() : "—",
                icon: <Star size={16} className="text-emerald-600" />, bg: "bg-emerald-50" },
            ].map(({ label, value, icon, bg }) => (
              <div key={label} className={cn("rounded-xl p-3 flex items-center gap-2.5", bg)}>
                {icon}
                <div>
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="text-sm font-bold text-slate-800">{value}</p>
                </div>
              </div>
            ))}
          </div>
          {/* CRM Tier badge */}
          {crmRecord && crmTier && (
            <div className={cn("flex items-center gap-3 rounded-xl px-4 py-3 border", tierColors[crmTier].bg, tierColors[crmTier].border)}>
              <Star size={14} className={tierColors[crmTier].text} />
              <div className="flex-1">
                <p className={cn("text-xs font-bold uppercase tracking-wider", tierColors[crmTier].text)}>
                  {crmTier.charAt(0).toUpperCase() + crmTier.slice(1)} Member
                </p>
                <p className="text-xs text-slate-500">
                  {crmRecord.pointsBalance.toLocaleString()} pts balance · {crmRecord.totalPointsEarned.toLocaleString()} earned · {crmRecord.totalPointsRedeemed.toLocaleString()} redeemed
                </p>
              </div>
              <Gift size={14} className="text-slate-400" />
            </div>
          )}

          {/* Info grids */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-xl p-4 space-y-2.5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {isInd ? "Personal Info" : "Company Info"}
              </p>
              {profile.customerType === "individual" ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-400">Full Name</span><span className="font-medium">{profile.firstName} {profile.lastName}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Gender</span><span className="font-medium capitalize">{profile.gender}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Date of Birth</span><span className="font-medium">{profile.dob || "—"}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">National ID</span><span className="font-mono text-xs">{profile.nationalId || "—"}</span></div>
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-400">Company</span><span className="font-medium text-xs text-right">{profile.companyName}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Tax ID</span><span className="font-mono text-xs">{profile.taxId || "—"}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Reg. No.</span><span className="font-mono text-xs">{profile.registrationNo || "—"}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Business</span><span className="font-medium">{profile.businessType}</span></div>
                  {profile.website && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Website</span>
                      <a href={`https://${profile.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs hover:underline">{profile.website}</a>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-slate-50 rounded-xl p-4 space-y-2.5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</p>
              <div className="space-y-2 text-sm">
                {profile.customerType === "corporate" && profile.contactPerson && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <User size={13} className="text-slate-400 shrink-0" />
                    {profile.contactPerson} — {profile.contactTitle}
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate-700"><Phone size={13} className="text-slate-400 shrink-0" />{profile.phone}</div>
                {profile.email && <div className="flex items-center gap-2 text-slate-700"><Mail size={13} className="text-slate-400 shrink-0" />{profile.email}</div>}
                {profile.address && <div className="flex items-start gap-2 text-slate-600 text-xs"><MapPin size={13} className="text-slate-400 shrink-0 mt-0.5" />{profile.address}</div>}
              </div>
            </div>
          </div>

          {/* Tags */}
          {profile.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Tag size={13} className="text-slate-400" />
              {profile.tags.map((t) => <TagBadge key={t} tag={t} />)}
            </div>
          )}

          {/* Notes */}
          {profile.notes && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-700 mb-1">Notes</p>
              <p className="text-sm text-amber-800">{profile.notes}</p>
            </div>
          )}

          {/* Related orders */}
          {relatedOrders.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Sales Orders</p>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Order #</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Date</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Delivery</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500">Amount</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Stage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {relatedOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 font-mono text-blue-600 font-semibold text-xs">{o.id}</td>
                        <td className="px-4 py-2.5 text-slate-600 text-xs">{o.date}</td>
                        <td className="px-4 py-2.5 text-slate-600 text-xs">{o.deliveryDate}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-slate-900">{formatCurrency(o.amount)}</td>
                        <td className="px-4 py-2.5">
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full capitalize">{o.stage}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t border-slate-200 bg-slate-50">
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-xs font-semibold text-slate-600">Total</td>
                      <td className="px-4 py-2 text-right font-bold text-slate-800 text-sm">
                        {formatCurrency(relatedOrders.reduce((s, o) => s + o.amount, 0))}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Related invoices */}
          {relatedInvoices.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Invoices</p>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Invoice #</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Date</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Due</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500">Amount</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {relatedInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 font-mono text-violet-600 font-semibold text-xs">{inv.id}</td>
                        <td className="px-4 py-2.5 text-slate-600 text-xs">{inv.date}</td>
                        <td className="px-4 py-2.5 text-slate-600 text-xs">{inv.dueDate}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-slate-900">{formatCurrency(inv.amount)}</td>
                        <td className="px-4 py-2.5">
                          <span className={cn("text-xs px-2 py-0.5 rounded-full capitalize font-medium",
                            inv.status === "paid"     ? "bg-emerald-100 text-emerald-700" :
                            inv.status === "overdue"  ? "bg-red-100 text-red-700" :
                            inv.status === "sent"     ? "bg-blue-100 text-blue-700" :
                            "bg-slate-100 text-slate-600"
                          )}>{inv.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t border-slate-200 bg-slate-50">
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-xs font-semibold text-slate-600">Total Invoiced</td>
                      <td className="px-4 py-2 text-right font-bold text-slate-800 text-sm">
                        {formatCurrency(relatedInvoices.reduce((s, i) => s + i.amount, 0))}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────

// ── QR Code Modal ──────────────────────────────────────────────────────

function QRModal({ branchId, branchName, onClose }: { branchId?: string; branchName?: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const regUrl  = `${baseUrl}/customer-register${branchId ? `?branch=${branchId}` : ""}${branchName ? `&name=${encodeURIComponent(branchName)}` : ""}`;
  const qrSrc   = `/api/qrcode?url=${encodeURIComponent(regUrl)}`;

  const copy = () => {
    navigator.clipboard.writeText(regUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Customer QR Registration</h2>
            <p className="text-xs text-slate-400 mt-0.5">Customers scan this to self-register</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>
        <div className="p-6 flex flex-col items-center gap-4">
          {/* QR image from server-side API */}
          <div className="border-2 border-slate-100 rounded-2xl p-3 bg-white shadow-sm">
            <img src={qrSrc} alt="Customer registration QR code" className="w-48 h-48 rounded-lg" />
          </div>
          {branchName && <p className="text-xs text-slate-500 text-center">{branchName}</p>}
          <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <p className="text-xs text-slate-500 mb-1">Registration URL</p>
            <p className="text-xs text-blue-600 font-mono break-all">{regUrl}</p>
          </div>
          <div className="flex gap-2 w-full">
            <button onClick={copy}
              className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 transition-colors">
              {copied ? <CheckCheck size={14} className="text-emerald-600" /> : <Copy size={14} />}
              {copied ? "Copied!" : "Copy URL"}
            </button>
            <a href={qrSrc} download="customer-register-qr.png"
              className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Download size={14} /> Download QR
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────

export default function CustomersPage() {
  const { can } = usePermissions();
  const [profiles, setProfiles]   = useState<Profile[]>([]);
  const [tab, setTab]             = useState<"all" | "individual" | "corporate">("all");
  const [search, setSearch]       = useState("");
  const [statusF, setStatusF]     = useState<"all"|"active"|"inactive">("all");
  const [showModal, setShowModal] = useState(false);
  const [showQR,    setShowQR]    = useState(false);
  const [editProfile, setEditProfile] = useState<Profile | undefined>(undefined);
  const [viewId, setViewId]       = useState<string | null>(null);
  const [deleteId, setDeleteId]   = useState<string | null>(null);
  const [businessTypes, setBusinessTypes] = useState<string[]>(FALLBACK_BUSINESS_TYPES);
  const [loading,   setLoading]   = useState(true);

  const loadProfiles = useCallback(() => {
    fetch("/api/sales/customers")
      .then((r) => r.ok ? r.json() : [])
      .then((data: any[]) => setProfiles(data as unknown as Profile[]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadProfiles();
    fetch("/api/settings/lookup-values?type=business_type")
      .then((r) => r.ok ? r.json() : [])
      .then((data: { label: string; isActive: boolean }[]) => {
        const active = data.filter((d) => d.isActive).map((d) => d.label);
        if (active.length > 0) setBusinessTypes(active);
      })
      .catch(() => {});
  }, [loadProfiles]);

  const nextId = `CP-${String(profiles.length + 1).padStart(3, "0")}`;

  const filtered = useMemo(() => profiles.filter((p) => {
    if (tab === "individual" && p.customerType !== "individual") return false;
    if (tab === "corporate"  && p.customerType !== "corporate")  return false;
    if (statusF !== "all" && p.status !== statusF) return false;
    const q = search.toLowerCase();
    if (!q) return true;
    const name = displayName(p).toLowerCase();
    if (name.includes(q) || p.phone.includes(q) || p.email?.toLowerCase().includes(q)) return true;
    if (p.customerType === "corporate") {
      return p.companyName.toLowerCase().includes(q) || p.taxId.includes(q);
    }
    return false;
  }), [profiles, tab, search, statusF]);

  const stats = useMemo(() => ({
    total:      profiles.length,
    individual: profiles.filter((p) => p.customerType === "individual").length,
    corporate:  profiles.filter((p) => p.customerType === "corporate").length,
    totalSpend: profiles.reduce((s, p) => s + p.totalSpend, 0),
  }), [profiles]);

  const viewProfile = viewId ? profiles.find((p) => p.id === viewId) : null;

  const openAdd  = () => { setEditProfile(undefined); setShowModal(true); };
  const openEdit = (p: Profile) => { setEditProfile(p); setShowModal(true); setViewId(null); };

  const handleSave = async (p: Profile) => {
    const isExisting = profiles.some((x) => x.id === p.id);
    if (isExisting) {
      const res = await fetch(`/api/sales/customers/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p),
      });
      if (res.ok) {
        const updated = await res.json();
        setProfiles((prev) => prev.map((x) => x.id === p.id ? updated as unknown as Profile : x));
      }
    } else {
      const res = await fetch("/api/sales/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p),
      });
      if (res.ok) {
        const created = await res.json();
        setProfiles((prev) => [created as unknown as Profile, ...prev]);
      }
    }
    setShowModal(false);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/sales/customers/${id}`, { method: "DELETE" });
    setProfiles((prev) => prev.filter((p) => p.id !== id));
    setDeleteId(null);
    if (viewId === id) setViewId(null);
  };

  return (
    <div>
      <Header
        title="Customers"
        subtitle={`${stats.total} customers · ${formatCurrency(stats.totalSpend)} total spend`}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => setShowQR(true)}
              className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 text-sm px-4 py-2 rounded-lg hover:bg-slate-50 font-medium">
              <QrCode size={16} /> QR Register
            </button>
            {can("sales_customers", "create") && (
              <button onClick={openAdd}
                className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                <Plus size={16} /> Add Customer
              </button>
            )}
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label:"Total Customers", value: String(stats.total),             icon:<User size={18} />,      color:"blue" },
            { label:"Individual",      value: String(stats.individual),         icon:<User size={18} />,      color:"sky" },
            { label:"Corporate",       value: String(stats.corporate),          icon:<Building2 size={18} />, color:"violet" },
            { label:"Total Spend",     value: formatCurrency(stats.totalSpend), icon:<CreditCard size={18}/>, color:"emerald" },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-500 font-medium">{label}</p>
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center",
                  color === "blue"    && "bg-blue-100 text-blue-600",
                  color === "sky"     && "bg-sky-100 text-sky-600",
                  color === "violet"  && "bg-violet-100 text-violet-600",
                  color === "emerald" && "bg-emerald-100 text-emerald-600")}>
                  {icon}
                </div>
              </div>
              <p className="text-xl font-bold text-slate-900">{value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            {([["all","All"], ["individual","Individual"], ["corporate","Corporate"]] as const).map(([v, l]) => (
              <button key={v} onClick={() => setTab(v)}
                className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                  tab === v ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
                {l}
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone, email, tax ID..."
              className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={statusF} onChange={(e) => setStatusF(e.target.value as typeof statusF)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading && <div className="py-16 text-center text-sm text-slate-400">Loading…</div>}
          {!loading && <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Customer</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Contact</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tags</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Spend</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0",
                          p.customerType === "individual" ? "bg-blue-500" : "bg-violet-500")}>
                          {displayInitial(p)}
                        </div>
                        <div className="min-w-0">
                          <button onClick={() => setViewId(p.id)}
                            className="font-semibold text-slate-800 hover:text-blue-600 truncate block text-left">
                            {displayName(p)}
                          </button>
                          <p className="text-xs text-slate-400 font-mono">{p.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={cn("flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium w-fit",
                        p.customerType === "individual" ? "bg-blue-100 text-blue-700" : "bg-violet-100 text-violet-700")}>
                        {p.customerType === "individual" ? <User size={10} /> : <Building2 size={10} />}
                        {p.customerType === "individual" ? "Individual" : (p as CorporateProfile).businessType}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="text-xs text-slate-600">{p.phone}</div>
                      {p.customerType === "corporate" && p.contactPerson && (
                        <div className="text-xs text-slate-400">{p.contactPerson}</div>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {p.tags.slice(0, 2).map((t) => <TagBadge key={t} tag={t} />)}
                        {p.tags.length > 2 && <span className="text-xs text-slate-400">+{p.tags.length - 2}</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-900">{formatCurrency(p.totalSpend)}</td>
                    <td className="px-5 py-3">
                      <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium",
                        p.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500")}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setViewId(p.id)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600"><Eye size={14} /></button>
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"><Pencil size={14} /></button>
                        <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>}
          {!loading && filtered.length === 0 && (
            <div className="py-16 text-center">
              <User size={32} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm text-slate-400">No customers match your filter.</p>
            </div>
          )}
        </div>
      </div>

      {showQR && <QRModal onClose={() => setShowQR(false)} />}

      {showModal && (
        <CustomerModal
          initial={editProfile}
          nextId={nextId}
          businessTypes={businessTypes}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
      {viewProfile && (
        <DetailModal
          profile={profiles.find((p) => p.id === viewProfile.id)!}
          onClose={() => setViewId(null)}
          onEdit={openEdit}
        />
      )}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><XCircle size={22} className="text-red-600" /></div>
            <h2 className="text-base font-semibold text-slate-900 mb-1">Delete Customer</h2>
            <p className="text-sm text-slate-500 mb-6">
              Remove <strong>{displayName(profiles.find((p) => p.id === deleteId)!)}</strong>? This cannot be undone.
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
