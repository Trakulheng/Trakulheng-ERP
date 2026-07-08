"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import { Shield, Lock, Fingerprint, Eye, EyeOff, Check, X, KeyRound, Trash2, AlertCircle } from "lucide-react";

interface SecurityStatus {
  pinSet: boolean;
  pinSetAt: string | null;
  biometricSet: boolean;
}

export default function SecurityPage() {
  const [status,      setStatus]      = useState<SecurityStatus | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [section,     setSection]     = useState<"pin" | "biometric" | null>(null);

  // PIN state
  const [pin,         setPin]         = useState("");
  const [confirmPin,  setConfirmPin]  = useState("");
  const [showPin,     setShowPin]     = useState(false);
  const [pinSaving,   setPinSaving]   = useState(false);
  const [pinMsg,      setPinMsg]      = useState<{ ok: boolean; text: string } | null>(null);

  // Biometric state
  const [bioSupported, setBioSupported] = useState(false);
  const [bioSaving,    setBioSaving]    = useState(false);
  const [bioMsg,       setBioMsg]       = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/user/security")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setStatus(d); })
      .catch(() => {})
      .finally(() => setLoading(false));

    setBioSupported(
      typeof window !== "undefined" &&
      typeof window.PublicKeyCredential !== "undefined"
    );
  }, []);

  const handleSetPin = async () => {
    setPinMsg(null);
    if (!/^\d{4,6}$/.test(pin)) { setPinMsg({ ok: false, text: "PIN must be 4–6 digits." }); return; }
    if (pin !== confirmPin)       { setPinMsg({ ok: false, text: "PINs do not match." }); return; }
    setPinSaving(true);
    try {
      const r = await fetch("/api/user/security", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setPin", pin }),
      });
      if (r.ok) {
        setPinMsg({ ok: true, text: "PIN set successfully." });
        setPin(""); setConfirmPin("");
        setStatus((s) => s ? { ...s, pinSet: true, pinSetAt: new Date().toISOString() } : s);
        setSection(null);
      } else {
        const d = await r.json();
        setPinMsg({ ok: false, text: d.error ?? "Failed to set PIN." });
      }
    } finally { setPinSaving(false); }
  };

  const handleClearPin = async () => {
    setPinSaving(true);
    try {
      const r = await fetch("/api/user/security", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clearPin" }),
      });
      if (r.ok) {
        setStatus((s) => s ? { ...s, pinSet: false, pinSetAt: null } : s);
        setPinMsg({ ok: true, text: "PIN removed." });
      }
    } finally { setPinSaving(false); }
  };

  const handleRegisterBiometric = async () => {
    setBioMsg(null);
    setBioSaving(true);
    try {
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: "DDK ERP", id: window.location.hostname },
          user: { id: challenge, name: "erp-user", displayName: "ERP User" },
          pubKeyCredParams: [{ alg: -7, type: "public-key" }, { alg: -257, type: "public-key" }],
          authenticatorSelection: { userVerification: "preferred", residentKey: "discouraged" },
          timeout: 60000,
        },
      }) as PublicKeyCredential | null;

      if (!credential) { setBioMsg({ ok: false, text: "Registration cancelled." }); return; }

      const credId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
      const response = credential.response as AuthenticatorAttestationResponse;
      const pubKey   = btoa(String.fromCharCode(...new Uint8Array(response.getPublicKey?.() ?? new ArrayBuffer(0))));

      const r = await fetch("/api/user/security", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "registerBiometric", credId, pubKey }),
      });

      if (r.ok) {
        setBioMsg({ ok: true, text: "Biometric registered successfully." });
        setStatus((s) => s ? { ...s, biometricSet: true } : s);
        setSection(null);
      } else {
        setBioMsg({ ok: false, text: "Failed to save biometric credential." });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Biometric registration failed.";
      setBioMsg({ ok: false, text: msg });
    } finally { setBioSaving(false); }
  };

  const handleClearBiometric = async () => {
    setBioSaving(true);
    try {
      const r = await fetch("/api/user/security", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clearBiometric" }),
      });
      if (r.ok) {
        setStatus((s) => s ? { ...s, biometricSet: false } : s);
        setBioMsg({ ok: true, text: "Biometric removed." });
      }
    } finally { setBioSaving(false); }
  };

  if (loading) return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header title="Security" subtitle="Manage PIN and biometric access" />
      <div className="flex items-center justify-center flex-1 text-slate-400">Loading…</div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header title="Security" subtitle="Set up PIN or biometric access for quick login" />

      <div className="p-6 max-w-xl space-y-4">
        {/* PIN Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                <KeyRound size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">PIN Access</p>
                <p className="text-xs text-slate-400">
                  {status?.pinSet ? `Set on ${new Date(status.pinSetAt!).toLocaleDateString()}` : "Not configured"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {status?.pinSet && (
                <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                  <Check size={11} /> Active
                </span>
              )}
              <button onClick={() => setSection(section === "pin" ? null : "pin")}
                className="px-3 py-1.5 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-50">
                {status?.pinSet ? "Change" : "Set Up"}
              </button>
              {status?.pinSet && (
                <button onClick={handleClearPin} disabled={pinSaving}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50">
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </div>

          {section === "pin" && (
            <div className="p-5 space-y-4 bg-slate-50/50">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">New PIN (4–6 digits)</label>
                <div className="relative">
                  <input
                    type={showPin ? "text" : "password"}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="• • • •"
                    className="w-full px-3 py-2 pr-10 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 tracking-widest text-center font-mono"
                  />
                  <button onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPin ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Confirm PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="• • • •"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 tracking-widest text-center font-mono"
                />
              </div>
              {pinMsg && (
                <p className={cn("text-xs px-3 py-2 rounded-lg flex items-center gap-2",
                  pinMsg.ok ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100")}>
                  {pinMsg.ok ? <Check size={12} /> : <X size={12} />} {pinMsg.text}
                </p>
              )}
              <div className="flex gap-2">
                <button onClick={() => setSection(null)} className="flex-1 px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-100">
                  Cancel
                </button>
                <button onClick={handleSetPin} disabled={pinSaving || pin.length < 4}
                  className="flex-1 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40">
                  {pinSaving ? "Saving…" : "Save PIN"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Biometric Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center">
                <Fingerprint size={18} className="text-violet-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Biometric / Passkey</p>
                <p className="text-xs text-slate-400">
                  {status?.biometricSet ? "Registered" : "Not configured"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {status?.biometricSet && (
                <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                  <Check size={11} /> Active
                </span>
              )}
              {bioSupported ? (
                <button onClick={() => setSection(section === "biometric" ? null : "biometric")}
                  className="px-3 py-1.5 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-50">
                  {status?.biometricSet ? "Re-register" : "Set Up"}
                </button>
              ) : (
                <span className="text-xs text-slate-400">Not supported on this device</span>
              )}
              {status?.biometricSet && (
                <button onClick={handleClearBiometric} disabled={bioSaving}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50">
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </div>

          {section === "biometric" && (
            <div className="p-5 space-y-4 bg-slate-50/50">
              <p className="text-sm text-slate-600 leading-relaxed">
                Register your device's biometric (Face ID, Touch ID, Windows Hello, or security key) as a passkey for this account.
              </p>
              {bioMsg && (
                <p className={cn("text-xs px-3 py-2 rounded-lg flex items-center gap-2",
                  bioMsg.ok ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100")}>
                  {bioMsg.ok ? <Check size={12} /> : <X size={12} />} {bioMsg.text}
                </p>
              )}
              <div className="flex gap-2">
                <button onClick={() => setSection(null)} className="flex-1 px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-100">
                  Cancel
                </button>
                <button onClick={handleRegisterBiometric} disabled={bioSaving}
                  className="flex-1 px-4 py-2 text-sm font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-40 flex items-center justify-center gap-2">
                  <Fingerprint size={15} /> {bioSaving ? "Registering…" : "Register Biometric"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 text-sm text-blue-700">
          <Shield size={15} className="shrink-0 mt-0.5 text-blue-500" />
          <p>PIN and biometric are additional authentication methods. Your password remains your primary login credential. Biometric registration requires HTTPS and a compatible device.</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-sm text-amber-700">
          <AlertCircle size={15} className="shrink-0 mt-0.5 text-amber-500" />
          <p>Only users with a password-based account can set up PIN or biometric access. SSO/OAuth accounts use their provider's authentication.</p>
        </div>
      </div>
    </div>
  );
}
