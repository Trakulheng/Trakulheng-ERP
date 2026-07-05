"use client";

import Link from "next/link";
import { CheckCircle2, LayoutDashboard, Lock } from "lucide-react";

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
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            Your account is active. Set up a 6-digit PIN for quick sign-in, or go straight to the dashboard.
          </p>

          <div className="space-y-3">
            <Link
              href="/auth/set-pin"
              className="inline-flex items-center justify-center gap-2 w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
            >
              <Lock size={15} />
              Set up 6-digit PIN
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-lg text-sm transition-colors"
            >
              Go to Dashboard →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
