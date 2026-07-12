"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, LayoutDashboard, Fingerprint } from "lucide-react";
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

  const [tab, setTab] = useState<"password" | "pin" | "biometric">("password");
  const [form, setForm] = useState({ email: "", password: "", pin: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bioLoading, setBioLoading] = useState(false);
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

  async function handleBiometric() {
    setError("");
    setBioLoading(true);
    try {
      if (!window.PublicKeyCredential) {
        setError("Biometric authentication is not supported on this device/browser.");
        return;
      }
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!available) {
        setError("No biometric authenticator found on this device.");
        return;
      }

      // Retrieve stored credential ID from localStorage
      const storedCredId = localStorage.getItem("webauthn_cred_id");
      if (!storedCredId) {
        setError("No biometric credential registered. Please log in with your password or PIN first, then enable biometric in your account settings.");
        return;
      }

      const credIdBytes = Uint8Array.from(atob(storedCredId), (c) => c.charCodeAt(0));
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          allowCredentials: [{ id: credIdBytes, type: "public-key" }],
          userVerification: "required",
          timeout: 60000,
        },
      }) as PublicKeyCredential;

      const credId = btoa(Array.from(new Uint8Array(assertion.rawId), (b) => String.fromCharCode(b)).join(""));
      const res = await fetch("/api/auth/webauthn/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credentialId: credId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Biometric authentication failed."); return; }
      router.push("/");
      router.refresh();
    } catch (err: any) {
      if (err?.name === "NotAllowedError") {
        setError("Biometric verification was cancelled or timed out.");
      } else {
        setError("Biometric authentication failed. Please try another method.");
      }
    } finally {
      setBioLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8">
      {resetSuccess && (
        <div className="mb-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3.5 py-2.5">
          Password updated successfully. Sign in with your new password.
        </div>
      )}

      {/* Tabs */}
      <div className="flex rounded-lg bg-slate-100 p-1 mb-6 gap-1">
        {(["password", "pin", "biometric"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => { setTab(t); setError(""); }}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1 ${
              tab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t === "biometric" && <Fingerprint size={12} />}
            {t === "password" ? "Password" : t === "pin" ? "6-digit PIN" : "Biometric"}
          </button>
        ))}
      </div>

      {tab === "biometric" ? (
        <div className="space-y-4">
          <div className="flex flex-col items-center py-4 text-center">
            <div className="w-20 h-20 rounded-2xl bg-violet-100 flex items-center justify-center mb-4">
              <Fingerprint size={40} className="text-violet-600" />
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Use your device&apos;s fingerprint or face recognition to sign in instantly.
            </p>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleBiometric}
            disabled={bioLoading}
            className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
          >
            {bioLoading ? <Loader2 size={15} className="animate-spin" /> : <Fingerprint size={15} />}
            {bioLoading ? "Verifying…" : "Use Biometric"}
          </button>
        </div>
      ) : (
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
                type="password"
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
      )}

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
  const [branding, setBranding] = useState({
    appName: "Trakulheng",
    appSubtitle: "Enterprise System",
    logoBase64: null as string | null,
  });

  useEffect(() => {
    fetch("/api/public/branding")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setBranding(d); })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-violet-600 rounded-2xl mb-4 shadow-lg shadow-violet-500/30 overflow-hidden">
            {branding.logoBase64 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={branding.logoBase64} alt="logo" className="w-full h-full object-contain" />
            ) : (
              <LayoutDashboard size={26} className="text-white" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{branding.appName}</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to your account</p>
        </div>
        <Suspense fallback={<div className="bg-white rounded-2xl shadow-2xl p-8 text-center text-slate-400 text-sm">Loading…</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
