"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, LayoutDashboard } from "lucide-react";
import { useSearchParams } from "next/navigation";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_token: "The verification link is invalid.",
  expired_token: "The verification link has expired. Please register again.",
};

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const urlError = params.get("error");
  const resetSuccess = params.get("reset");

  const [tab, setTab] = useState<"password" | "pin">("password");
  const [form, setForm] = useState({ email: "", password: "", pin: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(urlError ? (ERROR_MESSAGES[urlError] ?? "An error occurred.") : "");
  const [resendSent, setResendSent] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const setPinValue = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setForm((f) => ({ ...f, pin: val }));
  };

  async function handleResend() {
    if (!form.email || resendLoading) return;
    setResendLoading(true);
    try {
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });
      setResendSent(true);
    } finally {
      setResendLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const endpoint = tab === "pin" ? "/api/auth/pin-login" : "/api/auth/login";
      const body = tab === "pin"
        ? { email: form.email, pin: form.pin }
        : { email: form.email, password: form.password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "unverified") {
          setError("Please verify your email first. Check your inbox for the verification link.");
        } else {
          setError(data.error);
        }
        return;
      }
      if (data.needsConsent) {
        router.push("/consent");
      } else {
        router.push("/");
      }
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const showUnverifiedHelp = error.includes("verify your email");

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8">
      {resetSuccess && (
        <div className="mb-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3.5 py-2.5">
          Password updated successfully. Sign in with your new password.
        </div>
      )}

      {/* Tabs */}
      <div className="flex rounded-lg bg-slate-100 p-1 mb-6 gap-1">
        {(["password", "pin"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => { setTab(t); setError(""); }}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
              tab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t === "password" ? "Password" : "6-digit PIN"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
          <input
            type="email"
            required
            autoFocus
            value={form.email}
            onChange={set("email")}
            placeholder="you@company.com"
            className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder:text-slate-300"
          />
        </div>

        {tab === "password" ? (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <Link href="/auth/forgot-password" className="text-xs text-violet-600 hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                required
                value={form.password}
                onChange={set("password")}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 pr-10 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder:text-slate-300"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">6-digit PIN</label>
            <input
              type="text"
              inputMode="numeric"
              required
              value={form.pin}
              onChange={setPinValue}
              placeholder="••••••"
              maxLength={6}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder:text-slate-300 tracking-[0.5em] text-center font-mono text-lg"
            />
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5">
            <p>{error}</p>
            {showUnverifiedHelp && (
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading || resendSent}
                className="mt-2 text-xs font-medium text-red-700 underline disabled:no-underline disabled:opacity-60"
              >
                {resendSent ? "Verification email sent!" : resendLoading ? "Sending…" : "Resend verification email"}
              </button>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
        >
          {loading && <Loader2 size={15} className="animate-spin" />}
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/auth/register" className="text-violet-600 font-medium hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-violet-600 rounded-2xl mb-4 shadow-lg shadow-violet-500/30">
            <LayoutDashboard size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Trakulheng</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to your account</p>
        </div>
        <Suspense fallback={<div className="bg-white rounded-2xl shadow-2xl p-8 text-center text-slate-400 text-sm">Loading…</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
