"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, LayoutDashboard } from "lucide-react";

export default function VerifyEmailPage() {
  const params = useSearchParams();
  const email = params.get("email") ?? "your email";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-violet-600 rounded-2xl mb-4 shadow-lg shadow-violet-500/30">
            <LayoutDashboard size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Trakulheng</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-violet-100 rounded-2xl mb-5">
            <Mail size={28} className="text-violet-600" />
          </div>

          <h2 className="text-xl font-bold text-slate-900 mb-2">Check your inbox</h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            We sent a verification link to{" "}
            <span className="font-semibold text-slate-700">{email}</span>.
            Click the link to activate your account.
          </p>

          <div className="bg-slate-50 rounded-xl p-4 text-left space-y-2 mb-6">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">What to do next</p>
            {[
              "Open the email from Trakulheng",
              'Click "Verify email address"',
              "You'll be signed in automatically",
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-slate-600">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                {step}
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-400">
            Didn&apos;t receive it? Check your spam folder, or{" "}
            <Link href="/auth/register" className="text-violet-600 hover:underline">
              try again with a different email
            </Link>
            .
          </p>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          <Link href="/auth/login" className="hover:text-white transition-colors">
            ← Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
