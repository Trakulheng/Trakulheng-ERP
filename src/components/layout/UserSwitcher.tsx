"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { X, Loader2, Eye, EyeOff, ChevronLeft, CheckCircle2, UserCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SwitchUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  hasPIN: boolean;
  isCurrent: boolean;
}

const ROLE_STYLE: Record<string, string> = {
  admin:   "bg-blue-100 text-blue-700",
  manager: "bg-violet-100 text-violet-700",
  staff:   "bg-emerald-100 text-emerald-700",
  viewer:  "bg-slate-100 text-slate-500",
};

const AVATAR_COLOR: Record<string, string> = {
  admin:   "bg-blue-600",
  manager: "bg-violet-600",
  staff:   "bg-emerald-600",
  viewer:  "bg-slate-500",
};

function initials(name: string | null, email: string) {
  if (name) {
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

type Step = "list" | "auth" | "success";

interface Props {
  onClose: () => void;
}

export function UserSwitcher({ onClose }: Props) {
  const router = useRouter();
  const [users, setUsers] = useState<SwitchUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>("list");
  const [selected, setSelected] = useState<SwitchUser | null>(null);
  const [authTab, setAuthTab] = useState<"password" | "pin">("password");
  const [credential, setCredential] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => { setUsers(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const selectUser = (user: SwitchUser) => {
    setSelected(user);
    setCredential("");
    setError("");
    setShowPw(false);
    setAuthTab(user.hasPIN ? "pin" : "password");
    setStep("auth");
  };

  const handleSwitch = async () => {
    if (!selected) return;
    if (!credential) { setError("Please enter your " + (authTab === "pin" ? "PIN." : "password.")); return; }
    if (authTab === "pin" && !/^\d{6}$/.test(credential)) { setError("PIN must be 6 digits."); return; }

    setSubmitting(true);
    setError("");

    const endpoint = authTab === "pin" ? "/api/auth/pin-login" : "/api/auth/login";
    const body = authTab === "pin"
      ? { email: selected.email, pin: credential }
      : { email: selected.email, password: credential };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Authentication failed. Check your credentials.");
        return;
      }

      setStep("success");
      setTimeout(() => {
        router.push("/");
        router.refresh();
        onClose();
      }, 1200);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />

      <div
        className="relative w-full sm:max-w-sm bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 flex-shrink-0">
          {step === "auth" && (
            <button
              onClick={() => { setStep("list"); setSelected(null); setError(""); }}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 -ml-1"
            >
              <ChevronLeft size={18} />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-slate-900">
              {step === "list" ? "Switch User" : step === "auth" ? selected?.name ?? selected?.email : "Switching…"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {step === "list"
                ? "Select an account to switch to"
                : step === "auth"
                ? selected?.email
                : "Signing you in"}
            </p>
          </div>
          {step !== "success" && (
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Step: list ── */}
          {step === "list" && (
            <div className="py-2">
              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 size={22} className="animate-spin text-slate-400" />
                </div>
              ) : users.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-10">No other accounts found.</p>
              ) : (
                users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => !user.isCurrent && selectUser(user)}
                    disabled={user.isCurrent}
                    className={cn(
                      "w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors",
                      user.isCurrent ? "opacity-50 cursor-default" : "hover:bg-slate-50 active:bg-slate-100"
                    )}
                  >
                    {/* Avatar */}
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0",
                      AVATAR_COLOR[user.role] ?? "bg-slate-500"
                    )}>
                      {initials(user.name, user.email)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-slate-900 truncate">
                          {user.name ?? user.email}
                        </span>
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wide flex-shrink-0", ROLE_STYLE[user.role])}>
                          {user.role}
                        </span>
                        {user.isCurrent && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold uppercase tracking-wide flex-shrink-0">
                            current
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{user.email}</p>
                    </div>

                    {!user.isCurrent && (
                      <ChevronLeft size={16} className="text-slate-300 rotate-180 flex-shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          )}

          {/* ── Step: auth ── */}
          {step === "auth" && selected && (
            <div className="p-5 space-y-4">
              {/* Auth tabs — only show if user has PIN */}
              {selected.hasPIN && (
                <div className="flex rounded-lg bg-slate-100 p-1 gap-1">
                  {(["password", "pin"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => { setAuthTab(t); setCredential(""); setError(""); }}
                      className={cn(
                        "flex-1 py-1.5 text-sm font-medium rounded-md transition-colors",
                        authTab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      {t === "password" ? "Password" : "6-digit PIN"}
                    </button>
                  ))}
                </div>
              )}

              {authTab === "password" ? (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-slate-700">Password</label>
                    <Link href="/auth/forgot-password" onClick={onClose} className="text-xs text-blue-600 hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      autoFocus
                      value={credential}
                      onChange={(e) => setCredential(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSwitch()}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 pr-10 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    autoFocus
                    value={credential}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setCredential(v);
                      if (v.length === 6) setTimeout(handleSwitch, 100);
                    }}
                    placeholder="••••••"
                    maxLength={6}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 tracking-[0.5em] text-center font-mono text-lg"
                  />
                  <p className="text-xs text-slate-400 mt-1.5 text-center">Auto-submits when 6 digits entered</p>
                </div>
              )}

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5">{error}</p>
              )}

              <button
                onClick={handleSwitch}
                disabled={submitting || !credential}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
              >
                {submitting && <Loader2 size={14} className="animate-spin" />}
                {submitting ? "Switching…" : "Switch Account"}
              </button>
            </div>
          )}

          {/* ── Step: success ── */}
          {step === "success" && (
            <div className="flex flex-col items-center justify-center py-12 px-5 text-center">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 size={28} className="text-emerald-600" />
              </div>
              <p className="text-base font-semibold text-slate-900">
                Switched to {selected?.name ?? selected?.email}
              </p>
              <p className="text-sm text-slate-500 mt-1">Reloading…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
