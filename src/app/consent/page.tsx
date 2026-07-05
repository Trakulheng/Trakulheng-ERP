"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, FileText, ChevronDown, ChevronUp, Loader2, LayoutDashboard, AlertCircle } from "lucide-react";

const SECTIONS = [
  {
    title: "What data we collect",
    body: "We collect your name, work email address, hashed password, IP address at login, and activity logs within the ERP system. We do not collect sensitive personal data such as health, racial, political, or financial information unless you explicitly enter it into the system.",
  },
  {
    title: "How we use your data",
    body: "Your data is used solely to operate this ERP system: authenticating your identity, recording business transactions you perform, and sending service emails (verification, security alerts). We do not sell, rent, or share your data with third parties for marketing purposes.",
  },
  {
    title: "Your rights under Thai PDPA (พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562)",
    body: "You have the right to access, correct, delete, restrict processing of, and receive a portable copy of your personal data. You may withdraw consent at any time without affecting the lawfulness of prior processing. To exercise these rights contact privacy@trakulheng.co.th.",
  },
  {
    title: "Your rights under EU GDPR (Regulation 2016/679)",
    body: "If you are in the European Economic Area you have additional rights: to object to processing based on legitimate interests, not to be subject to solely automated decisions with legal effect, and to lodge a complaint with your local supervisory authority.",
  },
  {
    title: "Data retention",
    body: "Account data is retained for the duration of your account plus 3 years after deletion for legal and audit purposes. Session tokens expire after 30 days. Email verification tokens expire after 24 hours.",
  },
  {
    title: "Security",
    body: "Passwords are hashed with bcrypt (cost factor 12). All communication is encrypted via TLS. Sessions use HTTP-only cookies. We conduct periodic security reviews and notify affected users within 72 hours of a confirmed data breach.",
  },
];

function Accordion({ title, body }: { title: string; body: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-slate-50 transition-colors"
      >
        <span className="text-sm font-medium text-slate-800">{title}</span>
        {open ? <ChevronUp size={15} className="text-slate-400 shrink-0" /> : <ChevronDown size={15} className="text-slate-400 shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
          {body}
        </div>
      )}
    </div>
  );
}

export default function ConsentPage() {
  const router = useRouter();
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canAccept = privacyChecked && termsChecked;

  async function handleAccept() {
    if (!canAccept) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/accept-consent", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Could not save your consent. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-violet-600 rounded-2xl mb-3 shadow-lg shadow-violet-500/30">
            <LayoutDashboard size={22} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Trakulheng</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-600 to-violet-700 px-6 py-5">
            <div className="flex items-center gap-3 mb-1">
              <Shield size={20} className="text-violet-200" />
              <h2 className="text-lg font-bold text-white">Privacy &amp; Terms</h2>
            </div>
            <p className="text-violet-200 text-sm leading-relaxed">
              Before using Trakulheng, please review and accept our Privacy Policy and Terms of Service. This system processes personal data subject to Thai PDPA and EU GDPR.
            </p>
          </div>

          <div className="p-6 space-y-4">
            {/* Summary accordions */}
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Key points — click to expand</p>
            <div className="space-y-2">
              {SECTIONS.map((s) => (
                <Accordion key={s.title} title={s.title} body={s.body} />
              ))}
            </div>

            {/* Full document links */}
            <div className="flex gap-3 pt-1">
              <Link
                href="/privacy"
                target="_blank"
                className="flex items-center gap-1.5 text-xs text-violet-600 hover:underline font-medium"
              >
                <FileText size={13} />
                Full Privacy Policy
              </Link>
              <span className="text-slate-300">·</span>
              <Link
                href="/terms"
                target="_blank"
                className="flex items-center gap-1.5 text-xs text-violet-600 hover:underline font-medium"
              >
                <FileText size={13} />
                Full Terms of Service
              </Link>
            </div>

            {/* Consent checkboxes */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacyChecked}
                  onChange={(e) => setPrivacyChecked(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-violet-600 shrink-0"
                />
                <span className="text-sm text-slate-700 leading-relaxed">
                  I have read and agree to the{" "}
                  <Link href="/privacy" target="_blank" className="text-violet-600 hover:underline font-medium">Privacy Policy</Link>
                  {" "}and I consent to the collection and processing of my personal data as described therein, including under Thai PDPA (พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562) and EU GDPR (Regulation 2016/679).
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsChecked}
                  onChange={(e) => setTermsChecked(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-violet-600 shrink-0"
                />
                <span className="text-sm text-slate-700 leading-relaxed">
                  I have read and agree to the{" "}
                  <Link href="/terms" target="_blank" className="text-violet-600 hover:underline font-medium">Terms of Service</Link>
                  {" "}and confirm that I am authorised to use this system on behalf of my organisation.
                </span>
              </label>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5">
                <AlertCircle size={15} className="shrink-0" />
                {error}
              </div>
            )}

            {!canAccept && (
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <AlertCircle size={12} />
                Both checkboxes must be ticked to continue.
              </p>
            )}

            <button
              onClick={handleAccept}
              disabled={!canAccept || loading}
              className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? "Saving…" : "Accept and continue to Trakulheng"}
            </button>

            <p className="text-center text-xs text-slate-400">
              Version dated 5 July 2026 · Effective immediately upon acceptance
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
