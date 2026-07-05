import Link from "next/link";
import { LayoutDashboard } from "lucide-react";

export const metadata = { title: "Terms of Service — DDK ERP" };

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-bold text-slate-900 mt-10 mb-3 pb-2 border-b border-slate-100">
      {children}
    </h2>
  );
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

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
              <LayoutDashboard size={16} className="text-white" />
            </div>
            <span className="font-bold text-slate-800">DDK ERP</span>
          </Link>
          <Link href="/consent" className="text-sm text-violet-600 hover:underline">
            ← Back to consent
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-8">
          <p className="text-xs font-semibold text-violet-600 uppercase tracking-widest mb-2">Legal</p>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Terms of Service</h1>
          <p className="text-sm text-slate-500">
            Effective date: <strong>5 July 2026</strong> · Governing law: Kingdom of Thailand
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 mb-8">
          <p className="text-sm text-blue-800 leading-relaxed">
            Please read these Terms carefully before using the DDK ERP system. By accepting these
            Terms, you form a binding agreement with DDK Enterprise Co., Ltd. under Thai law.
          </p>
        </div>

        <H2>1. Parties and Agreement</H2>
        <P>
          These Terms of Service (&ldquo;Terms&rdquo;) govern access to and use of the DDK ERP
          web-based enterprise resource planning system (&ldquo;the System&rdquo;) operated by{" "}
          <strong>DDK Enterprise Co., Ltd.</strong> (&ldquo;Company&rdquo;, &ldquo;we&rdquo;,
          &ldquo;us&rdquo;), a company registered under the laws of Thailand.
        </P>
        <P>
          &ldquo;User&rdquo; or &ldquo;you&rdquo; means any individual who creates an account or
          accesses the System, including employees and contractors of the organisation that has
          licensed access (&ldquo;Subscriber Organisation&rdquo;).
        </P>
        <P>
          By clicking &ldquo;Accept and continue&rdquo;, creating an account, or using the System,
          you agree to be bound by these Terms. If you do not agree, you may not use the System.
        </P>

        <H2>2. Eligibility and Authorised Use</H2>
        <UL
          items={[
            "You must be at least 18 years old and have legal capacity to enter into a binding agreement under Thai law.",
            "You must be authorised by your Subscriber Organisation to access the System on its behalf.",
            "Your account is personal and non-transferable. You must not share your credentials.",
            "You are responsible for all actions taken under your account.",
          ]}
        />

        <H2>3. Account Registration and Security</H2>
        <P>
          You agree to provide accurate, current, and complete information during registration and to
          update it when it changes. You are responsible for maintaining the confidentiality of your
          password and for all activity that occurs under your account. You must notify us immediately
          at <strong>support@ddk.co.th</strong> if you suspect unauthorised access.
        </P>
        <P>
          We reserve the right to suspend or terminate accounts that we reasonably believe have been
          compromised, used fraudulently, or used in violation of these Terms.
        </P>

        <H2>4. Acceptable Use</H2>
        <P>You agree to use the System only for lawful business purposes and in accordance with these Terms. You must not:</P>
        <UL
          items={[
            "Use the System to process unlawful transactions or data that you do not have the right to process.",
            "Attempt to gain unauthorised access to any part of the System or its infrastructure.",
            "Introduce viruses, malware, or any other harmful code.",
            "Scrape, reverse-engineer, or decompile any portion of the System.",
            "Use the System to infringe any third party's intellectual property, privacy, or other rights.",
            "Share access with persons not authorised by your Subscriber Organisation.",
            "Use the System in a way that could disable, damage, or impair its performance.",
          ]}
        />

        <H2>5. Intellectual Property</H2>
        <P>
          All software, content, interfaces, trademarks, and documentation comprising the System are
          owned by or licensed to the Company and are protected by Thai and international intellectual
          property laws. Nothing in these Terms grants you any ownership rights in the System.
        </P>
        <P>
          Data and content you input into the System (&ldquo;Your Data&rdquo;) remain your property
          or the property of your Subscriber Organisation. You grant the Company a limited,
          non-exclusive licence to process Your Data solely to provide and improve the System.
        </P>

        <H2>6. Data and Privacy</H2>
        <P>
          Your use of the System involves the processing of personal data. Such processing is governed
          by our{" "}
          <Link href="/privacy" className="text-violet-600 hover:underline font-medium">
            Privacy Policy
          </Link>
          , which forms part of these Terms and complies with the Personal Data Protection Act B.E.
          2562 (2019) and, where applicable, EU GDPR Regulation 2016/679.
        </P>
        <P>
          If your Subscriber Organisation enters personal data of its employees, customers, or
          suppliers into the System, the Subscriber Organisation acts as data controller for that
          data and is responsible for compliance with applicable data protection laws.
        </P>

        <H2>7. Availability and Maintenance</H2>
        <P>
          We aim to maintain high availability of the System but do not guarantee uninterrupted
          access. We may perform maintenance, updates, or emergency repairs that temporarily reduce
          availability. We will endeavour to provide advance notice of planned downtime where
          practicable.
        </P>

        <H2>8. Disclaimer of Warranties</H2>
        <P>
          To the maximum extent permitted by Thai law, the System is provided &ldquo;as is&rdquo;
          and &ldquo;as available&rdquo; without warranties of any kind, express or implied,
          including but not limited to warranties of merchantability, fitness for a particular
          purpose, or non-infringement. We do not warrant that the System will be error-free or that
          defects will be corrected.
        </P>

        <H2>9. Limitation of Liability</H2>
        <P>
          To the maximum extent permitted by applicable law, the Company shall not be liable for any
          indirect, incidental, special, consequential, or punitive damages, including loss of profits,
          data, or goodwill, arising from your use of or inability to use the System, even if advised
          of the possibility of such damages.
        </P>
        <P>
          The Company&rsquo;s total cumulative liability to you for any claim arising under these
          Terms shall not exceed the amount paid by your Subscriber Organisation for access to the
          System in the twelve (12) months preceding the claim.
        </P>

        <H2>10. Indemnification</H2>
        <P>
          You agree to indemnify, defend, and hold harmless the Company and its officers, directors,
          employees, and agents from and against any claims, damages, losses, and expenses (including
          reasonable legal fees) arising from your violation of these Terms or applicable law, or
          your processing of data you did not have the right to process.
        </P>

        <H2>11. Termination</H2>
        <P>
          Either party may terminate access to the System at any time. The Company may immediately
          suspend or terminate your account if you breach these Terms or if required by law. Upon
          termination, your right to access the System ceases immediately. Provisions of these Terms
          that by their nature should survive termination will do so, including intellectual property,
          disclaimer, limitation of liability, and governing law sections.
        </P>

        <H2>12. Modifications to Terms</H2>
        <P>
          We may update these Terms from time to time. When we do, we will update the effective date
          above and, for material changes, notify you by email and require re-acceptance upon next
          login. Continued use after re-acceptance constitutes agreement to the updated Terms.
        </P>

        <H2>13. Governing Law and Dispute Resolution</H2>
        <P>
          These Terms are governed by and construed in accordance with the laws of the Kingdom of
          Thailand, without regard to its conflict of law provisions. Any dispute arising from or
          relating to these Terms shall first be subject to good-faith negotiation between the
          parties. If not resolved within 30 days, the dispute shall be submitted to the exclusive
          jurisdiction of the courts of Bangkok, Thailand.
        </P>

        <H2>14. General Provisions</H2>
        <UL
          items={[
            "Entire agreement: These Terms together with the Privacy Policy constitute the entire agreement between you and the Company regarding the System.",
            "Severability: If any provision of these Terms is found unenforceable, the remaining provisions will continue in full force.",
            "No waiver: Failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.",
            "Assignment: You may not assign your rights under these Terms without our prior written consent. We may assign our rights to an affiliate or in connection with a merger or acquisition.",
            "Language: These Terms are written in English. In the event of any inconsistency between an English version and a translated version, the English version shall prevail.",
          ]}
        />

        <H2>15. Contact</H2>
        <P>For questions about these Terms:</P>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-1 text-sm text-slate-600">
          <p>
            <strong className="text-slate-800">DDK Enterprise Co., Ltd.</strong>
          </p>
          <p>88 Silom Rd, Bang Rak, Bangkok 10500, Thailand</p>
          <p>
            <strong className="text-slate-800">Legal:</strong> legal@ddk.co.th
          </p>
          <p>
            <strong className="text-slate-800">Support:</strong> support@ddk.co.th
          </p>
          <p>
            <strong className="text-slate-800">Phone:</strong> 02-100-1000
          </p>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-200 text-xs text-slate-400 flex items-center justify-between flex-wrap gap-3">
          <span>© 2026 DDK Enterprise Co., Ltd. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-slate-600">
              Privacy Policy
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
