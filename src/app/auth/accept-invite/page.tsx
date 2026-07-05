"use client";

import { useState, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LayoutDashboard, Loader2, Eye, EyeOff, CheckCircle2, Lock, KeyRound, ArrowRight } from "lucide-react";

// ── 6-digit PIN input ──────────────────────────────────────────────────

function PinInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const char = e.target.value.replace(/\D/g, "").slice(-1);
    const next = value.split("");
    next[i] = char;
    const str = next.slice(0, 6).join("");
    onChange(str);
    if (char && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace") {
      if (value[i]) {
        const next = value.split("");
        next[i] = "";
        onChange(next.join(""));
      } else if (i > 0) {
        inputs.current[i - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(digits);
    const idx = Math.min(digits.length, 5);
    inputs.current[idx]?.focus();
  };

  return (
    <div className="flex gap-3 justify-center">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <input
          key={i}
          ref={(el) => { inputs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ""}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className="w-12 h-14 text-center text-xl font-bold rounded-xl border-2 focus:outline-none transition-colors text-slate-800"
          style={{ borderColor: value[i] ? "#7c3aed" : "#e2e8f0", background: value[i] ? "#f5f3ff" : "#fff" }}
        />
      ))}
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────────────────

function AcceptInviteForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [step,     setStep]     = useState<"password" | "pin" | "done">("password");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [pin,      setPin]      = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  if (!token) {
    return (
      <div className="text-center py-4 space-y-3">
        <p className="text-red-600 text-sm font-medium">Invalid or missing invitation link.</p>
        <p className="text-slate-500 text-sm">Please contact your administrator to resend the invitation.</p>
      </div>
    );
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setError("");
    setStep("pin");
  }

  async function handleFinish(skipPin = false) {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/accept-invite", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token, password, pin: skipPin ? "" : pin }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setStep("password"); return; }
      setStep("done");
      setTimeout(() => router.push("/auth/login?invited=1"), 2500);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (step === "done") {
    return (
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-2xl mb-2">
          <CheckCircle2 size={32} className="text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Account ready!</h2>
        <p className="text-slate-500 text-sm">Your account is set up. Redirecting to sign in…</p>
      </div>
    );
  }

  if (step === "pin") {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-violet-100 rounded-xl mb-3">
            <KeyRound size={22} className="text-violet-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Set your 6-digit PIN</h2>
          <p className="text-slate-500 text-sm mt-1">Used for quick access. You can change it later in Settings.</p>
        </div>

        <PinInput value={pin} onChange={setPin} />

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5 text-center">{error}</p>
        )}

        <div className="space-y-2">
          <button
            disabled={pin.length !== 6 || loading}
            onClick={() => handleFinish(false)}
            className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {loading ? "Setting up…" : "Set PIN & Finish"}
            {!loading && <ArrowRight size={15} />}
          </button>
          <button
            disabled={loading}
            onClick={() => handleFinish(true)}
            className="w-full py-2.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            Skip for now — I'll set it later
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handlePasswordSubmit} className="space-y-5">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mb-3">
          <Lock size={22} className="text-blue-600" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Create your password</h2>
        <p className="text-slate-500 text-sm mt-1">Choose a secure password for your account.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">New password</label>
        <div className="relative">
          <input
            type={showPw ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className="w-full px-3.5 py-2.5 pr-10 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder:text-slate-300"
          />
          <button type="button" onClick={() => setShowPw((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-1">Minimum 8 characters</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm password</label>
        <input
          type={showPw ? "text" : "password"}
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Repeat password"
          className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder:text-slate-300"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5">{error}</p>
      )}

      <button
        type="submit"
        className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
      >
        Continue — Set up PIN
        <ArrowRight size={15} />
      </button>

      <div className="flex items-center gap-3 mt-1">
        <div className="flex-1 h-px bg-slate-100" />
        <span className="text-xs text-slate-400">Step 1 of 2</span>
        <div className="flex-1 h-px bg-slate-100" />
      </div>
    </form>
  );
}

export default function AcceptInvitePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-violet-600 rounded-2xl mb-4 shadow-lg shadow-violet-500/30">
            <LayoutDashboard size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Trakulheng ERP</h1>
          <p className="text-slate-400 text-sm mt-1">Set up your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <Suspense fallback={<div className="text-center text-slate-400 text-sm py-4">Loading…</div>}>
            <AcceptInviteForm />
          </Suspense>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-violet-400 hover:text-white transition-colors">Sign in →</Link>
        </p>
      </div>
    </div>
  );
}
