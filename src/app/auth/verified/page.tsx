"use client";

import Link from "next/link";
import { CheckCircle2, LayoutDashboard } from "lucide-react";

export default function VerifiedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-violet-600 rounded-2xl mb-4 shadow-lg shadow-violet-500/30">
            <LayoutDashboard size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Trakulheng</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-2xl mb-5">
            <CheckCircle2 size={32} className="text-emerald-600" />
          </div>

          <h2 className="text-xl font-bold text-slate-900 mb-2">Email verified!</h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-8">
            Your account is active. You&apos;re signed in and ready to use Trakulheng.
          </p>

          <Link
            href="/"
            className="inline-flex items-center justify-center w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
          >
            Go to Dashboard →
          </Link>
        </div>
      </div>
    </div>
  );
}
