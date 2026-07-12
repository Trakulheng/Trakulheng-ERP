"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { useT } from "@/context/LanguageContext";
import { companySettings } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Save,
  Building2,
  Clock,
  FileText,
  Share2,
  Sliders,
  Image,
  Upload,
  X,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Settings = typeof companySettings;

interface BusinessHour {
  open: boolean;
  start: string;
  end: string;
}

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

const DAY_LABELS: Record<DayKey, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

const DAYS: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

// ─── Initial mock values for new sections ─────────────────────────────────────

const initialHours: Record<DayKey, BusinessHour> = {
  mon: { open: true,  start: "08:00", end: "17:00" },
  tue: { open: true,  start: "08:00", end: "17:00" },
  wed: { open: true,  start: "08:00", end: "17:00" },
  thu: { open: true,  start: "08:00", end: "17:00" },
  fri: { open: true,  start: "08:00", end: "17:00" },
  sat: { open: true,  start: "08:00", end: "13:00" },
  sun: { open: false, start: "08:00", end: "17:00" },
};

const initialInvoice = {
  prefix: "INV",
  nextNumber: 1042,
  paymentTermsDays: 30,
  vatRate: 7,
  vatInclusive: false,
  footerText: "Thank you for your business. Please pay within the due date.",
};

const initialSocial = {
  facebook: "facebook.com/DDKEnterprise",
  instagram: "@ddkenterprise",
  lineOA: "@ddkenterprise",
  tiktok: "@ddk.enterprise",
  youtube: "",
};

// ─── Helper components ────────────────────────────────────────────────────────

function Toggle({
  on,
  onChange,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={cn(
        "relative inline-flex w-10 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 shrink-0",
        on ? "bg-blue-600" : "bg-slate-200"
      )}
    >
      <span
        className={cn(
          "absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200",
          on ? "translate-x-4" : "translate-x-0"
        )}
      />
    </button>
  );
}

function SectionCard({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
          <Icon size={16} className="text-blue-600" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
  span,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  span?: "2";
}) {
  return (
    <div className={span === "2" ? "lg:col-span-2" : undefined}>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GeneralSettingsPage() {
  const t = useT();
  const [settings, setSettings] = useState<Settings>({ ...companySettings });
  const [hours, setHours] = useState(initialHours);
  const [invoice, setInvoice] = useState(initialInvoice);
  const [social, setSocial] = useState(initialSocial);
  const [attendance, setAttendance] = useState({ lateWarningMinutes: 15, clockGpsRadiusMeters: 200 });
  const [shifts, setShifts] = useState({ maxChangeRequestsPerMonth: 2 });
  const [branding, setBranding] = useState({ appName: "Trakulheng", appSubtitle: "Enterprise System", logoBase64: null as string | null });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings/general")
      .then((r) => {
        if (r.status === 401) { window.location.href = "/auth/login"; return null; }
        return r.ok ? r.json() : null;
      })
      .then((d) => {
        if (!d) return;
        if (d.company)    setSettings((s) => ({ ...s, ...d.company }));
        if (d.hours)      setHours(d.hours);
        if (d.invoice)    setInvoice(d.invoice);
        if (d.system)     setSettings((s) => ({ ...s, ...d.system }));
        if (d.social)     setSocial(d.social);
        if (d.attendance) setAttendance((a) => ({ ...a, ...d.attendance }));
        if (d.shifts)     setShifts((s) => ({ ...s, ...d.shifts }));
        if (d.branding)   setBranding((b) => ({ ...b, ...d.branding }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function setField<K extends keyof Settings>(k: K, v: Settings[K]) {
    setSettings((s) => ({ ...s, [k]: v }));
  }

  function setHour(day: DayKey, field: keyof BusinessHour, value: boolean | string) {
    setHours((h) => ({
      ...h,
      [day]: { ...h[day], [field]: value },
    }));
  }

  function setAllWeekdays(field: "start" | "end", value: string) {
    setHours((h) => {
      const next = { ...h };
      (["mon", "tue", "wed", "thu", "fri"] as DayKey[]).forEach((d) => {
        next[d] = { ...next[d], [field]: value };
      });
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setSaveError("");
    try {
      const payload = {
        branding,
        company: {
          name: settings.name, nameEn: settings.nameEn, taxId: settings.taxId,
          address: settings.address, phone: settings.phone, email: settings.email,
          website: settings.website, lineId: settings.lineId,
        },
        hours,
        invoice,
        system: {
          currency: settings.currency, timezone: settings.timezone,
          language: settings.language, fiscalYearStart: settings.fiscalYearStart,
        },
        social,
        attendance,
        shifts,
      };
      const res = await fetch("/api/settings/general", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        if (res.status === 401) { window.location.href = "/auth/login"; return; }
        const d = await res.json();
        setSaveError(d.error ?? "Failed to save.");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setSaveError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {}, [saved]);

  const invoicePreview = `${invoice.prefix}-${String(invoice.nextNumber).padStart(5, "0")}`;
  const openDays = DAYS.filter((d) => hours[d].open).length;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header
        title={t("General Settings")}
        subtitle={t("Company profile, business hours, and system preferences")}
        actions={
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save size={15} className={saving ? "animate-pulse" : ""} />
            {saving ? t("Saving…") : t("Save Changes")}
          </button>
        }
      />

      {saved && (
        <div className="mx-6 mt-4 flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium px-4 py-3 rounded-xl">
          <CheckCircle2 size={16} className="shrink-0" />
          {t("Settings saved successfully")}
        </div>
      )}
      {saveError && (
        <div className="mx-6 mt-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
          {saveError}
        </div>
      )}

      <div className="p-6 space-y-6 max-w-4xl">
        {/* ── Branding ── */}
        <SectionCard
          icon={Image}
          title={t("Branding")}
          subtitle={t("Logo and app name displayed in the sidebar")}
        >
          <div className="flex flex-col gap-5">
            {/* Logo upload */}
            <div className="flex items-start gap-5">
              <div className="shrink-0">
                <p className="text-sm font-medium text-slate-700 mb-2">{t("App Logo")}</p>
                <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden relative group">
                  {branding.logoBase64 ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={branding.logoBase64} alt="logo" className="w-full h-full object-contain" />
                      <button
                        type="button"
                        onClick={() => setBranding((b) => ({ ...b, logoBase64: null }))}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={18} className="text-white" />
                      </button>
                    </>
                  ) : (
                    <Upload size={20} className="text-slate-400" />
                  )}
                </div>
              </div>
              <div className="flex-1 pt-6">
                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                  <Upload size={14} />
                  {t("Upload Image")}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const result = ev.target?.result as string;
                        setBranding((b) => ({ ...b, logoBase64: result }));
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
                <p className="text-xs text-slate-400 mt-2">{t("PNG, JPG, SVG · max 200 KB · displayed at 40×40 px")}</p>
              </div>
            </div>

            {/* App name + subtitle */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <Field label={t("App Name")} hint={t("Shown as the main sidebar title")}>
                <input
                  type="text"
                  value={branding.appName}
                  onChange={(e) => setBranding((b) => ({ ...b, appName: e.target.value }))}
                  className={inputCls}
                />
              </Field>
              <Field label={t("App Subtitle")} hint={t("Small text under the app name")}>
                <input
                  type="text"
                  value={branding.appSubtitle}
                  onChange={(e) => setBranding((b) => ({ ...b, appSubtitle: e.target.value }))}
                  className={inputCls}
                />
              </Field>
            </div>
          </div>
        </SectionCard>

        {/* ── Company Information ── */}
        <SectionCard
          icon={Building2}
          title={t("Company Information")}
          subtitle={t("Legal and contact details used on documents and invoices")}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Field label={t("Company Name (Thai)")}>
              <input
                type="text"
                value={settings.name}
                onChange={(e) => setField("name", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label={t("Company Name (English)")}>
              <input
                type="text"
                value={settings.nameEn}
                onChange={(e) => setField("nameEn", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label={t("Tax ID / เลขที่ผู้เสียภาษี")} span="2">
              <input
                type="text"
                value={settings.taxId}
                onChange={(e) => setField("taxId", e.target.value)}
                className={inputCls}
                placeholder="0105562001234"
              />
            </Field>
            <Field label={t("Address")} span="2">
              <textarea
                value={settings.address}
                onChange={(e) => setField("address", e.target.value)}
                rows={2}
                className={cn(inputCls, "resize-none")}
              />
            </Field>
            <Field label={t("Phone")}>
              <input
                type="text"
                value={settings.phone}
                onChange={(e) => setField("phone", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label={t("Email")}>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setField("email", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label={t("Website")}>
              <input
                type="text"
                value={settings.website}
                onChange={(e) => setField("website", e.target.value)}
                className={inputCls}
                placeholder="www.example.com"
              />
            </Field>
            <Field label={t("LINE ID")}>
              <input
                type="text"
                value={settings.lineId}
                onChange={(e) => setField("lineId", e.target.value)}
                className={inputCls}
                placeholder="@yourlineid"
              />
            </Field>
          </div>
        </SectionCard>

        {/* ── Business Hours ── */}
        <SectionCard
          icon={Clock}
          title={t("Business Hours")}
          subtitle={`${openDays} ${openDays !== 1 ? t("days") : t("day")} / ${t("week")}`}
        >
          {/* Weekday bulk set */}
          <div className="flex items-center gap-4 mb-4 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {t("Set weekdays (Mon–Fri)")}
            </span>
            <div className="flex items-center gap-2">
              <input
                type="time"
                defaultValue="08:00"
                onChange={(e) => setAllWeekdays("start", e.target.value)}
                className="border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-slate-400 text-xs">to</span>
              <input
                type="time"
                defaultValue="17:00"
                onChange={(e) => setAllWeekdays("end", e.target.value)}
                className="border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <span className="text-xs text-slate-400 ml-auto">{t("Apply to all weekdays at once")}</span>
          </div>

          <div className="space-y-2">
            {DAYS.map((day) => {
              const h = hours[day];
              const isWeekend = day === "sat" || day === "sun";
              return (
                <div
                  key={day}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3 rounded-xl border transition-colors",
                    h.open
                      ? "border-slate-200 bg-white"
                      : "border-slate-100 bg-slate-50 opacity-60"
                  )}
                >
                  <Toggle on={h.open} onChange={(v) => setHour(day, "open", v)} />

                  <span
                    className={cn(
                      "text-sm font-medium w-24 shrink-0",
                      h.open ? "text-slate-800" : "text-slate-400"
                    )}
                  >
                    {t(DAY_LABELS[day])}
                    {isWeekend && (
                      <span className="ml-1.5 text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                        WE
                      </span>
                    )}
                  </span>

                  {h.open ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="time"
                        value={h.start}
                        onChange={(e) => setHour(day, "start", e.target.value)}
                        className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-slate-400 text-sm">–</span>
                      <input
                        type="time"
                        value={h.end}
                        onChange={(e) => setHour(day, "end", e.target.value)}
                        className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {(() => {
                        const [sh, sm] = h.start.split(":").map(Number);
                        const [eh, em] = h.end.split(":").map(Number);
                        const mins = (eh * 60 + em) - (sh * 60 + sm);
                        if (mins <= 0) return null;
                        const hr = Math.floor(mins / 60);
                        const mn = mins % 60;
                        return (
                          <span className="text-xs text-slate-400 ml-2">
                            {hr > 0 && `${hr}h`}{mn > 0 && ` ${mn}m`}
                          </span>
                        );
                      })()}
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400 italic">{t("Closed")}</span>
                  )}
                </div>
              );
            })}
          </div>
        </SectionCard>

        {/* ── Invoice & Financial Settings ── */}
        <SectionCard
          icon={FileText}
          title={t("Invoice & Financial Settings")}
          subtitle={t("Controls document numbering, VAT, and payment terms")}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Field
              label={t("Invoice Prefix")}
              hint={t("Appears before the invoice number, e.g. INV, TAX, SO")}
            >
              <input
                type="text"
                value={invoice.prefix}
                onChange={(e) =>
                  setInvoice((v) => ({ ...v, prefix: e.target.value.toUpperCase().slice(0, 6) }))
                }
                className={cn(inputCls, "uppercase")}
                placeholder="INV"
                maxLength={6}
              />
            </Field>

            <Field
              label={t("Next Invoice Number")}
              hint={`Preview: ${invoicePreview}`}
            >
              <input
                type="number"
                min={1}
                value={invoice.nextNumber}
                onChange={(e) =>
                  setInvoice((v) => ({ ...v, nextNumber: Number(e.target.value) }))
                }
                className={inputCls}
              />
            </Field>

            <Field
              label={t("VAT Rate (%)")}
              hint={t("Applied to all taxable items on invoices")}
            >
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={30}
                  step={0.5}
                  value={invoice.vatRate}
                  onChange={(e) =>
                    setInvoice((v) => ({ ...v, vatRate: Number(e.target.value) }))
                  }
                  className={cn(inputCls, "pr-8")}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                  %
                </span>
              </div>
            </Field>

            <Field
              label={t("Default Payment Terms (days)")}
              hint={t("How many days customers have to pay")}
            >
              <select
                value={invoice.paymentTermsDays}
                onChange={(e) =>
                  setInvoice((v) => ({ ...v, paymentTermsDays: Number(e.target.value) }))
                }
                className={inputCls}
              >
                {[7, 14, 15, 30, 45, 60, 90].map((d) => (
                  <option key={d} value={d}>
                    {d} {t("days")} (Net {d})
                  </option>
                ))}
              </select>
            </Field>

            <div className="lg:col-span-2">
              <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                <Toggle
                  on={invoice.vatInclusive}
                  onChange={(v) => setInvoice((i) => ({ ...i, vatInclusive: v }))}
                />
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {t("VAT-inclusive pricing")}
                  </p>
                  <p className="text-xs text-slate-400">
                    {t("When enabled, prices displayed already include VAT (ราคารวม VAT)")}
                  </p>
                </div>
              </label>
            </div>

            <Field
              label={t("Invoice Footer Text")}
              hint={t("Printed at the bottom of every invoice")}
              span="2"
            >
              <textarea
                value={invoice.footerText}
                onChange={(e) =>
                  setInvoice((v) => ({ ...v, footerText: e.target.value }))
                }
                rows={2}
                className={cn(inputCls, "resize-none")}
                placeholder="Thank you for your business…"
              />
            </Field>

            {/* Live preview card */}
            <div className="lg:col-span-2 bg-slate-50 rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                {t("Invoice Preview")}
              </p>
              <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <div>
                    <p className="font-bold text-slate-900">{settings.nameEn}</p>
                    <p className="text-xs text-slate-500">{settings.address}</p>
                    <p className="text-xs text-slate-500">Tax ID: {settings.taxId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-blue-600">{invoicePreview}</p>
                    <p className="text-xs text-slate-400">
                      {t("Payment due: Net")} {invoice.paymentTermsDays}
                    </p>
                    <p className="text-xs text-slate-400">
                      {t("VAT")} {invoice.vatRate}%{invoice.vatInclusive ? ` (${t("inclusive")})` : ` (${t("exclusive")})`}
                    </p>
                  </div>
                </div>
                <div className="border-t border-dashed border-slate-200 pt-2">
                  <p className="text-xs text-slate-400 italic">{invoice.footerText}</p>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ── System Preferences ── */}
        <SectionCard
          icon={Sliders}
          title={t("System Preferences")}
          subtitle={t("Currency, language, timezone, and fiscal year")}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <Field label={t("Currency")}>
              <select
                value={settings.currency}
                onChange={(e) => setField("currency", e.target.value)}
                className={inputCls}
              >
                <option value="THB">THB — Thai Baht</option>
                <option value="USD">USD — US Dollar</option>
                <option value="EUR">EUR — Euro</option>
                <option value="SGD">SGD — Singapore Dollar</option>
                <option value="JPY">JPY — Japanese Yen</option>
              </select>
            </Field>
            <Field label={t("Timezone")}>
              <select
                value={settings.timezone}
                onChange={(e) => setField("timezone", e.target.value)}
                className={inputCls}
              >
                <option value="Asia/Bangkok">Asia/Bangkok (UTC+7)</option>
                <option value="UTC">UTC</option>
                <option value="Asia/Singapore">Asia/Singapore (UTC+8)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
                <option value="Europe/London">Europe/London</option>
                <option value="America/New_York">America/New_York</option>
              </select>
            </Field>
            <Field label={t("Language")}>
              <select
                value={settings.language}
                onChange={(e) => setField("language", e.target.value)}
                className={inputCls}
              >
                <option value="th">ไทย (Thai)</option>
                <option value="en">English</option>
              </select>
            </Field>
            <Field label={t("Fiscal Year Start")}>
              <select
                value={settings.fiscalYearStart}
                onChange={(e) => setField("fiscalYearStart", e.target.value)}
                className={inputCls}
              >
                {[
                  "January", "February", "March", "April", "May", "June",
                  "July", "August", "September", "October", "November", "December",
                ].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </SectionCard>

        {/* ── Social Media & Online Presence ── */}
        <SectionCard
          icon={Share2}
          title={t("Social Media & Online Presence")}
          subtitle={t("Shown in email footers, receipts, and the customer portal")}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {(
              [
                { key: "facebook",  label: "Facebook Page",        placeholder: "facebook.com/YourPage",   prefix: "fb" },
                { key: "instagram", label: "Instagram",             placeholder: "@yourhandle",              prefix: "ig" },
                { key: "lineOA",    label: "LINE Official Account", placeholder: "@yourline",               prefix: "line" },
                { key: "tiktok",    label: "TikTok",                placeholder: "@yourtiktok",              prefix: "tt" },
                { key: "youtube",   label: "YouTube Channel",       placeholder: "youtube.com/@yourchannel", prefix: "yt" },
              ] as { key: keyof typeof initialSocial; label: string; placeholder: string; prefix: string }[]
            ).map(({ key, label, placeholder, prefix }) => {
              const prefixColors: Record<string, string> = {
                fb: "bg-blue-100 text-blue-700",
                ig: "bg-pink-100 text-pink-700",
                line: "bg-emerald-100 text-emerald-700",
                tt: "bg-slate-900 text-white",
                yt: "bg-red-100 text-red-700",
              };
              return (
                <div key={key}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t(label)}
                  </label>
                  <div className="flex items-center gap-0">
                    <span
                      className={cn(
                        "flex items-center justify-center px-3 h-9 rounded-l-lg border border-r-0 border-slate-200 text-xs font-bold uppercase",
                        prefixColors[prefix]
                      )}
                    >
                      {prefix}
                    </span>
                    <input
                      type="text"
                      value={social[key]}
                      onChange={(e) =>
                        setSocial((s) => ({ ...s, [key]: e.target.value }))
                      }
                      className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:z-10 h-9"
                      placeholder={placeholder}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>

        {/* ── Attendance & Clock-In Settings ── */}
        <SectionCard
          icon={Clock}
          title={t("Attendance & Clock-In")}
          subtitle={t("GPS radius and late-arrival grace period for employee clock-in")}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Field
              label={t("Late Warning Grace Period (minutes)")}
              hint={t("Employees clocking in after shift start + this value are marked late")}
            >
              <input
                type="number" min={0} max={120}
                value={attendance.lateWarningMinutes}
                onChange={(e) => setAttendance((a) => ({ ...a, lateWarningMinutes: Math.max(0, parseInt(e.target.value) || 0) }))}
                className={inputCls}
              />
            </Field>
            <Field
              label={t("Clock-In GPS Radius (meters)")}
              hint={t("Default max distance from store for clock-in. Can be overridden per branch")}
            >
              <input
                type="number" min={50} max={5000}
                value={attendance.clockGpsRadiusMeters}
                onChange={(e) => setAttendance((a) => ({ ...a, clockGpsRadiusMeters: Math.max(50, parseInt(e.target.value) || 200) }))}
                className={inputCls}
              />
            </Field>
          </div>
        </SectionCard>

        {/* ── Shift Management Settings ── */}
        <SectionCard
          icon={Sliders}
          title={t("Shift Management")}
          subtitle={t("Controls for employee shift change requests")}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Field
              label={t("Max Shift Change Requests per Month")}
              hint={t("How many shift change requests each employee can submit per calendar month")}
            >
              <input
                type="number" min={0} max={20}
                value={shifts.maxChangeRequestsPerMonth}
                onChange={(e) => setShifts((s) => ({ ...s, maxChangeRequestsPerMonth: Math.max(0, parseInt(e.target.value) || 0) }))}
                className={inputCls}
              />
            </Field>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
