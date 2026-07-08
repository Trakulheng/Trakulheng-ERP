"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { User, Building2, CheckCircle2, ChevronRight } from "lucide-react";

const BUSINESS_TYPES = [
  "Manufacturing","Trading","Construction","Technology","Retail",
  "Logistics","Services","Healthcare","Education","Food & Beverage","Other",
];

function RegisterForm() {
  const params   = useSearchParams();
  const branchId = params.get("branch") ?? undefined;
  const branchName = params.get("name") ?? undefined;

  const [type,          setType]          = useState<"individual" | "corporate">("individual");
  const [firstName,     setFirstName]     = useState("");
  const [lastName,      setLastName]      = useState("");
  const [gender,        setGender]        = useState("male");
  const [dob,           setDob]           = useState("");
  const [nationalId,    setNationalId]    = useState("");
  const [companyName,   setCompanyName]   = useState("");
  const [taxId,         setTaxId]         = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [businessType,  setBusinessType]  = useState(BUSINESS_TYPES[0]);
  const [phone,         setPhone]         = useState("");
  const [email,         setEmail]         = useState("");
  const [address,       setAddress]       = useState("");
  const [submitting,    setSubmitting]    = useState(false);
  const [done,          setDone]          = useState(false);
  const [error,         setError]         = useState("");

  const canSubmit = type === "individual"
    ? (firstName.trim() && lastName.trim() && phone.trim())
    : (companyName.trim() && phone.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/public/customer-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerType: type,
          firstName:    type === "individual" ? firstName.trim()   : undefined,
          lastName:     type === "individual" ? lastName.trim()    : undefined,
          gender:       type === "individual" ? gender             : undefined,
          dob:          type === "individual" && dob ? dob         : undefined,
          nationalId:   type === "individual" && nationalId ? nationalId : undefined,
          companyName:  type === "corporate"  ? companyName.trim() : undefined,
          taxId:        type === "corporate"  && taxId ? taxId     : undefined,
          contactPerson: type === "corporate" && contactPerson ? contactPerson : undefined,
          businessType: type === "corporate"  ? businessType       : undefined,
          phone:        phone.trim(),
          email:        email.trim() || undefined,
          address:      address.trim() || undefined,
          branchId:     branchId ?? undefined,
          source:       "qr_scan",
        }),
      });
      if (!res.ok) {
        const j = await res.json();
        setError(j.error ?? "Something went wrong. Please try again.");
      } else {
        setDone(true);
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">You're registered!</h1>
          <p className="text-sm text-slate-500 mb-6">
            {type === "individual" ? `Welcome, ${firstName}!` : `Welcome, ${companyName}!`}
            {" "}Your information has been saved. You can now enjoy our services.
          </p>
          {branchName && (
            <p className="text-xs text-slate-400">Registered at <strong>{branchName}</strong></p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 text-white">
          <h1 className="text-lg font-bold">Customer Registration</h1>
          {branchName && <p className="text-xs text-blue-200 mt-0.5">{branchName}</p>}
          <p className="text-xs text-blue-200 mt-2">Fill in your details below. This takes about 1 minute.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Type selector */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">I am registering as</p>
            <div className="grid grid-cols-2 gap-2">
              {(["individual", "corporate"] as const).map((v) => (
                <button key={v} type="button" onClick={() => setType(v)}
                  className={cn("flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 transition-all",
                    type === v ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300")}>
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                    type === v ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-400")}>
                    {v === "individual" ? <User size={14} /> : <Building2 size={14} />}
                  </div>
                  <div className="text-left">
                    <p className={cn("text-xs font-semibold", type === v ? "text-blue-700" : "text-slate-700")}>
                      {v === "individual" ? "Individual" : "Corporate"}
                    </p>
                    <p className="text-xs text-slate-400">{v === "individual" ? "Person" : "Company"}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Individual fields */}
          {type === "individual" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">First Name *</label>
                  <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="e.g. Somchai" required
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Last Name *</label>
                  <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="e.g. Jaidee" required
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Gender</label>
                  <select value={gender} onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Date of Birth</label>
                  <input type="date" value={dob} onChange={(e) => setDob(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">National ID / Passport</label>
                <input value={nationalId} onChange={(e) => setNationalId(e.target.value)} placeholder="13-digit Thai ID or passport"
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          )}

          {/* Corporate fields */}
          {type === "corporate" && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Company Name *</label>
                <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g. Acme Co., Ltd." required
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Tax ID</label>
                  <input value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="0000000000000"
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Business Type</label>
                  <select value={businessType} onChange={(e) => setBusinessType(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {BUSINESS_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Contact Person</label>
                <input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="Contact person name"
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          )}

          {/* Shared contact */}
          <div className="space-y-3 pt-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</p>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Phone Number *</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08X-XXX-XXXX" required
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com"
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Address</label>
              <textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)}
                placeholder="Street, Subdistrict, District, Province, Postcode"
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
          )}

          <p className="text-xs text-slate-400">
            By submitting this form you consent to your information being stored and used to improve your customer experience.
          </p>

          <button type="submit" disabled={!canSubmit || submitting}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-colors">
            {submitting ? "Submitting…" : "Complete Registration"}
            {!submitting && <ChevronRight size={16} />}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function CustomerRegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
