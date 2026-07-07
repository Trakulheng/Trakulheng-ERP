"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Loader2, CheckCircle2, Lock, Fingerprint } from "lucide-react";

export default function SetPinPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [bioLoading, setBioLoading] = useState(false);
  const [bioStatus, setBioStatus] = useState<"idle" | "registered" | "unsupported">("idle");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function handlePinInput(setter: (v: string) => void) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.replace(/\D/g, "").slice(0, 6);
      setter(val);
    };
  }

  async function handleEnrollBiometric() {
    setBioLoading(true);
    try {
      if (!window.PublicKeyCredential) { setBioStatus("unsupported"); return; }
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!available) { setBioStatus("unsupported"); return; }

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rp: { name: "Trakulheng ERP", id: window.location.hostname },
          user: { id: crypto.getRandomValues(new Uint8Array(16)), name: "user", displayName: "User" },
          pubKeyCredParams: [{ alg: -7, type: "public-key" }, { alg: -257, type: "public-key" }],
          authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
          timeout: 60000,
        },
      }) as PublicKeyCredential;

      const credId = btoa(Array.from(new Uint8Array(credential.rawId), (b) => String.fromCharCode(b)).join(""));
      localStorage.setItem("webauthn_cred_id", credId);

      await fetch("/api/auth/webauthn/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credentialId: credId }),
      });
      setBioStatus("registered");
    } catch (err: any) {
      if (err?.name !== "NotAllowedError") setBioStatus("unsupported");
    } finally {
      setBioLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pin.length !== 6) { setError("PIN must be exactly 6 digits."); return; }
    if (pin !== confirm) { setError("PINs do not match."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/set-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setDone(true);
      setTimeout(() => router.push("/"), 2000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-violet-600 rounded-2xl mb-4 shadow-lg shadow-violet-500/30">
            <LayoutDashboard size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Trakulheng</h1>
          <p className="text-slate-400 text-sm mt-1">Set up your PIN</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {done ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-100 rounded-2xl mb-4">
                <CheckCircle2 size={28} className="text-emerald-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">PIN set!</h2>
              <p className="text-slate-500 text-sm">Taking you to the dashboard…</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Lock size={18} className="text-violet-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">6-digit PIN</p>
                  <p className="text-xs text-slate-500">Use this to log in quickly instead of your password.</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Choose a 6-digit PIN</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    required
                    autoFocus
                    value={pin}
                    onChange={handlePinInput(setPin)}
                    placeholder="••••••"
                    maxLength={6}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder:text-slate-300 tracking-[0.5em] text-center font-mono text-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm PIN</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={confirm}
                    onChange={handlePinInput(setConfirm)}
                    placeholder="••••••"
                    maxLength={6}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder:text-slate-300 tracking-[0.5em] text-center font-mono text-lg"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || pin.length !== 6 || confirm.length !== 6}
                  className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
                >
                  {loading && <Loader2 size={15} className="animate-spin" />}
                  {loading ? "Saving…" : "Set PIN"}
                </button>

                <p className="text-center text-sm">
                  <Link href="/" className="text-slate-400 hover:text-slate-600">
                    Skip for now
                  </Link>
                </p>
              </form>

              {/* Biometric enrollment */}
              <div className="mt-6 pt-6 border-t border-slate-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Fingerprint size={16} className="text-violet-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Biometric Login</p>
                    <p className="text-xs text-slate-500">Enable fingerprint or face ID for quick login.</p>
                  </div>
                </div>
                {bioStatus === "registered" ? (
                  <p className="text-sm text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2 flex items-center gap-2">
                    <CheckCircle2 size={14} /> Biometric login enabled!
                  </p>
                ) : bioStatus === "unsupported" ? (
                  <p className="text-xs text-slate-400 bg-slate-50 rounded-lg px-3 py-2">
                    Biometric authentication is not available on this device/browser.
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleEnrollBiometric}
                    disabled={bioLoading}
                    className="w-full flex items-center justify-center gap-2 border border-violet-300 text-violet-700 hover:bg-violet-50 disabled:opacity-50 py-2.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    {bioLoading ? <Loader2 size={14} className="animate-spin" /> : <Fingerprint size={14} />}
                    {bioLoading ? "Registering…" : "Enable Biometric Login"}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
