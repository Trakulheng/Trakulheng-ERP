import Link from "next/link";
import { LayoutDashboard } from "lucide-react";

export const metadata = { title: "Privacy Policy — Trakulheng" };

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-bold text-slate-900 mt-10 mb-3 pb-2 border-b border-slate-100">
      {children}
    </h2>
  );
}
function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold text-slate-800 mt-5 mb-2">{children}</h3>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-slate-600 leading-7 mb-3">{children}</p>;
}
function UL({ items }: { items: string[] }) {
  return (
    <ul className="list-disc list-outside pl-5 space-y-1.5 mb-3">
      {items.map((item) => (
        <li key={item} className="text-sm text-slate-600 leading-6">
          {item}
        </li>
      ))}
    </ul>
  );
}

const TABLE_BASES = [
  ["Account creation and authentication", "Contract performance / Consent"],
  ["Sending verification and security emails", "Contract performance"],
  ["Session management and security", "Legitimate interest — fraud prevention"],
  ["Audit logging of user actions", "Legitimate interest — security and compliance"],
  ["Compliance with Thai law and court orders", "Legal obligation"],
];

const PROCESSORS = [
  ["Resend Inc.", "Transactional email delivery", "USA", "Standard Contractual Clauses"],
  ["Cloudflare Inc.", "CDN, DNS, DDoS protection", "USA / Global", "SCCs + adequacy decision"],
  ["Neon Technologies Inc.", "PostgreSQL database hosting", "USA", "Standard Contractual Clauses"],
];

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
              <LayoutDashboard size={16} className="text-white" />
            </div>
            <span className="font-bold text-slate-800">Trakulheng</span>
          </Link>
          <Link href="/consent" className="text-sm text-violet-600 hover:underline">
            ← Back to consent
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-8">
          <p className="text-xs font-semibold text-violet-600 uppercase tracking-widest mb-2">Legal</p>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-slate-500">
            Effective date: <strong>5 July 2026</strong> · Last updated: <strong>5 July 2026</strong>
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-8">
          <p className="text-sm text-amber-800 leading-relaxed">
            <strong>Bilingual notice (ประกาศสองภาษา):</strong> This policy is provided in English.
            Key rights under Thai PDPA are summarised in Thai where required. For a Thai-language
            version, contact <strong>privacy@trakulheng.co.th</strong>.
          </p>
        </div>

        <H2>1. Who We Are (Data Controller)</H2>
        <P>
          Trakulheng Co., Ltd. (
          <strong>บริษัท ตระกูลเฮง จำกัด</strong>), registered in Thailand (Tax ID:
          0105562001234), 88 Silom Rd, Bang Rak, Bangkok 10500, is the data controller responsible
          for your personal data processed through the Trakulheng system.
        </P>
        <P>
          Contact for privacy matters: <strong>privacy@trakulheng.co.th</strong> · Telephone: 02-100-1000
        </P>

        <H2>2. Scope</H2>
        <P>
          This policy applies to all users of the Trakulheng web application, including employees,
          contractors, and administrators who create accounts or are granted access. It covers data
          processed in connection with account registration, authentication, and use of all modules
          within the system.
        </P>

        <H2>3. Personal Data We Collect</H2>
        <H3>3.1 Account data</H3>
        <UL
          items={[
            "Full name",
            "Work email address",
            "Password (stored as a one-way bcrypt hash — we cannot read it)",
            "User role assigned by an administrator",
            "Consent acceptance timestamp and policy version",
          ]}
        />
        <H3>3.2 Usage and technical data</H3>
        <UL
          items={[
            "IP address and browser user-agent at login",
            "Session token identifiers (HTTP-only cookies, not readable by JavaScript)",
            "Actions performed within the ERP (audit log: which records were created, edited, or deleted, by whom, and when)",
            "Timestamps of login, logout, and failed authentication attempts",
          ]}
        />
        <H3>3.3 Business data you enter</H3>
        <P>
          When using modules such as HR, Finance, or Sales, you or your organisation may enter
          personal data about third parties (employees, customers, suppliers). That data is processed
          on behalf of your organisation acting as data controller; your organisation is responsible
          for ensuring it has appropriate lawful bases for that processing.
        </P>

        <H2>4. Legal Bases for Processing</H2>
        <P>We rely on the following lawful bases under Thai PDPA (มาตรา 24) and GDPR (Article 6):</P>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-2.5 font-semibold text-slate-700 border-b border-slate-200 w-1/2">
                  Purpose
                </th>
                <th className="text-left px-4 py-2.5 font-semibold text-slate-700 border-b border-slate-200">
                  Legal basis (PDPA / GDPR)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {TABLE_BASES.map(([purpose, basis]) => (
                <tr key={purpose}>
                  <td className="px-4 py-2.5 text-slate-700">{purpose}</td>
                  <td className="px-4 py-2.5 text-slate-600">{basis}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <H2>5. Your Rights Under Thai PDPA (สิทธิของเจ้าของข้อมูลส่วนบุคคล)</H2>
        <P>
          Under the Personal Data Protection Act B.E. 2562 (2019), you have the following rights:
        </P>
        <UL
          items={[
            "Right to be informed (มาตรา 23) — to know what data is collected and how it is used (this policy fulfils that obligation).",
            "Right of access (มาตรา 30) — to request a copy of your personal data we hold.",
            "Right to data portability (มาตรา 31) — to receive your data in a structured, machine-readable format.",
            "Right to object (มาตรา 32) — to object to processing based on legitimate interest.",
            "Right to erasure (มาตรา 33) — to request deletion of your personal data unless retention is required by law.",
            "Right to restriction (มาตรา 34) — to request that we limit processing of your data in certain circumstances.",
            "Right to correction (มาตรา 36) — to request correction of inaccurate or incomplete data.",
            "Right to withdraw consent (มาตรา 19) — to withdraw consent at any time; withdrawal does not affect the lawfulness of prior processing.",
          ]}
        />
        <P>
          To exercise any right, email <strong>privacy@trakulheng.co.th</strong> with your name and account
          email. We will respond within <strong>30 days</strong> as required by PDPA. If you believe
          your rights have been violated, you may file a complaint with the{" "}
          <strong>Personal Data Protection Committee (PDPC)</strong>.
        </P>

        <H2>6. Your Rights Under EU GDPR (for EEA users)</H2>
        <P>
          If you are located in the European Economic Area, you have additional rights under GDPR
          Articles 15–22:
        </P>
        <UL
          items={[
            "Right of access (Article 15) — to obtain a copy of your personal data and supplementary information.",
            "Right to rectification (Article 16) — to have inaccurate data corrected without undue delay.",
            "Right to erasure / 'right to be forgotten' (Article 17) — to request deletion subject to legal retention obligations.",
            "Right to restriction of processing (Article 18).",
            "Right to data portability (Article 20) — in a structured, commonly used, machine-readable format.",
            "Right to object (Article 21) — to processing based on legitimate interests or for direct marketing.",
            "Rights related to automated decision-making (Article 22) — we do not make solely automated decisions with legal or similarly significant effects.",
          ]}
        />
        <P>
          You may also lodge a complaint with your national data protection authority. In Thailand,
          the supervisory authority is the PDPC. For EEA users, the competent supervisory authority
          is determined by your country of residence.
        </P>

        <H2>7. Data Retention</H2>
        <UL
          items={[
            "Account and profile data: retained for the duration of your account, plus 3 years after closure for legal and audit purposes.",
            "Session tokens: automatically expire after 30 days; deleted on logout.",
            "Email verification tokens: expire after 24 hours.",
            "Audit logs: retained for 5 years in accordance with Thai accounting and corporate law requirements.",
            "Consent records: retained permanently as evidence of consent.",
          ]}
        />

        <H2>8. Data Security</H2>
        <P>We implement appropriate technical and organisational measures including:</P>
        <UL
          items={[
            "Passwords hashed with bcrypt (cost factor 12) — never stored in plain text.",
            "All data in transit encrypted via TLS 1.2+.",
            "Session cookies set as HttpOnly, Secure, and SameSite=Lax.",
            "Access controls: role-based permissions limit what each user can view or modify.",
            "Regular security reviews and dependency audits.",
          ]}
        />
        <P>
          In the event of a personal data breach that is likely to result in a risk to your rights
          and freedoms, we will notify you and the PDPC within <strong>72 hours</strong> of becoming
          aware, as required by PDPA Section 37 and GDPR Article 33.
        </P>

        <H2>9. Third-Party Processors</H2>
        <P>We use the following sub-processors who may process your personal data on our behalf:</P>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-slate-50">
              <tr>
                {["Processor", "Purpose", "Location", "Safeguard"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-2.5 font-semibold text-slate-700 border-b border-slate-200"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {PROCESSORS.map((row) => (
                <tr key={row[0]}>
                  {row.map((cell, i) => (
                    <td key={i} className="px-4 py-2.5 text-slate-600">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <H2>10. International Data Transfers</H2>
        <P>
          Your data may be transferred to and processed in countries outside Thailand and the EEA,
          including the United States. Where such transfers occur, we ensure appropriate safeguards
          are in place — including Standard Contractual Clauses approved by the European Commission,
          and equivalent measures recognised under Thai PDPA Chapter 7 (มาตรา 28–29).
        </P>

        <H2>11. Cookies</H2>
        <P>We use only strictly necessary cookies:</P>
        <UL
          items={[
            "session — HttpOnly, Secure; stores your login session token. Expires after 30 days or on logout. Required to use the application.",
            "consented — records that you have accepted this policy. Expires after 365 days.",
          ]}
        />
        <P>We do not use tracking, advertising, or analytics cookies.</P>

        <H2>12. Children</H2>
        <P>
          This system is intended for business use by persons aged 18 or over. We do not knowingly
          collect personal data from persons under 18. If you become aware that a minor has created
          an account, please contact us immediately at privacy@trakulheng.co.th.
        </P>

        <H2>13. Changes to This Policy</H2>
        <P>
          We may update this policy from time to time. When we do, we will update the &ldquo;Last
          updated&rdquo; date above and, for material changes, notify you by email and require
          re-acceptance upon next login. The policy version is identified by its effective date. Your
          continued use after re-acceptance constitutes agreement to the updated policy.
        </P>

        <H2>14. Contact Us</H2>
        <P>For any privacy-related questions, requests, or complaints:</P>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-1 text-sm text-slate-600">
          <p>
            <strong className="text-slate-800">Data Controller:</strong> Trakulheng Co., Ltd.
          </p>
          <p>
            <strong className="text-slate-800">Address:</strong> 88 Silom Rd, Bang Rak, Bangkok
            10500, Thailand
          </p>
          <p>
            <strong className="text-slate-800">Privacy email:</strong> privacy@trakulheng.co.th
          </p>
          <p>
            <strong className="text-slate-800">Phone:</strong> 02-100-1000
          </p>
          <p>
            <strong className="text-slate-800">Response time:</strong> Within 30 days (PDPA) / 1
            month (GDPR)
          </p>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-200 text-xs text-slate-400 flex items-center justify-between flex-wrap gap-3">
          <span>© 2026 Trakulheng Co., Ltd. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-slate-600">
              Terms of Service
            </Link>
            <Link href="/consent" className="hover:text-slate-600">
              Back to consent
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
