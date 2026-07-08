"use client";

import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/layout/Header";
import {
  User, Camera, Trash2, Lock, Eye, EyeOff, Save, CheckCircle2, AlertCircle,
  Mail, Shield, Building2, X,
} from "lucide-react";

interface Profile {
  id: string;
  name: string | null;
  email: string;
  role: string;
  avatarBase64: string | null;
  employeeRecordId: string | null;
}

const ROLE_BADGE: Record<string, string> = {
  admin:   "bg-red-100 text-red-700",
  manager: "bg-amber-100 text-amber-700",
  staff:   "bg-blue-100 text-blue-700",
  viewer:  "bg-slate-100 text-slate-600",
};

function Toast({ msg, ok, onClose }: { msg: string; ok: boolean; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
      ${ok ? "bg-emerald-50 border border-emerald-200 text-emerald-800" : "bg-red-50 border border-red-200 text-red-800"}`}>
      {ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
      {msg}
      <button onClick={onClose} className="ml-1 opacity-60 hover:opacity-100"><X size={14} /></button>
    </div>
  );
}

export default function AccountPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Profile | null) => {
        if (!data) return;
        setProfile(data);
        setName(data.name ?? "");
        setAvatar(data.avatarBase64 ?? null);
      });
  }, []);

  function notify(msg: string, ok = true) {
    setToast({ msg, ok });
  }

  function handlePhotoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function handleSaveProfile() {
    if (!name.trim()) return;
    setSavingProfile(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), avatarBase64: avatar }),
      });
      const data = await res.json();
      if (!res.ok) { notify(data.error ?? "Failed to save.", false); return; }
      setProfile((p) => p ? { ...p, name: data.name, avatarBase64: data.avatarBase64 } : p);
      notify("Profile updated successfully.");
      // Trigger sidebar avatar refresh
      window.dispatchEvent(new Event("profile-updated"));
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword() {
    if (!curPw || !newPw || !confirmPw) { notify("All password fields are required.", false); return; }
    if (newPw !== confirmPw) { notify("New passwords do not match.", false); return; }
    if (newPw.length < 8) { notify("New password must be at least 8 characters.", false); return; }
    setSavingPw(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "changePassword", currentPassword: curPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) { notify(data.error ?? "Failed to change password.", false); return; }
      setCurPw(""); setNewPw(""); setConfirmPw("");
      notify("Password changed successfully.");
    } finally {
      setSavingPw(false);
    }
  }

  const avatarDisplay = avatar ?? profile?.avatarBase64 ?? null;
  const initials = (() => {
    const n = profile?.name ?? profile?.email ?? "";
    const parts = n.trim().split(" ");
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : n.slice(0, 2).toUpperCase();
  })();

  const pwValid = curPw && newPw.length >= 8 && newPw === confirmPw;

  return (
    <div>
      <Header title="My Account" subtitle="Manage your profile, photo and password." />

      <div className="p-6 max-w-2xl space-y-6">

        {/* Profile card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900">Profile Information</h2>
            <p className="text-sm text-slate-500 mt-0.5">Update your display name and profile photo.</p>
          </div>

          <div className="px-6 py-6 space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-5">
              <div className="relative group">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-blue-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                  {avatarDisplay ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarDisplay} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    initials || <User size={32} />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">Profile Photo</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Camera size={14} />
                    Upload photo
                  </button>
                  {avatarDisplay && (
                    <button
                      onClick={() => setAvatar(null)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-400">JPG, PNG or GIF · max 2 MB</p>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoFile} />
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Display Name <span className="text-red-500">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your full name"
              />
            </div>

            {/* Read-only info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Mail size={13} className="text-slate-400" /> Email
                </label>
                <div className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-500">
                  {profile?.email ?? "—"}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Shield size={13} className="text-slate-400" /> Role
                </label>
                <div className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg">
                  {profile?.role ? (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${ROLE_BADGE[profile.role] ?? "bg-slate-100 text-slate-600"}`}>
                      {profile.role}
                    </span>
                  ) : "—"}
                </div>
              </div>
            </div>

            {profile?.employeeRecordId && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Building2 size={13} className="text-slate-400" /> Employee ID
                </label>
                <div className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-500">
                  {profile.employeeRecordId}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleSaveProfile}
                disabled={savingProfile || !name.trim()}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors"
              >
                <Save size={14} />
                {savingProfile ? "Saving…" : "Save Profile"}
              </button>
            </div>
          </div>
        </div>

        {/* Change password */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Lock size={16} className="text-slate-400" />
              Change Password
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">Choose a strong password of at least 8 characters.</p>
          </div>

          <div className="px-6 py-6 space-y-4">
            {/* Current password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Current Password</label>
              <div className="relative">
                <input
                  type={showCur ? "text" : "password"}
                  value={curPw}
                  onChange={(e) => setCurPw(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCur((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showCur ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* New password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {newPw && newPw.length < 8 && (
                <p className="text-xs text-red-500 mt-1">Must be at least 8 characters</p>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                  placeholder="Repeat new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {confirmPw && newPw !== confirmPw && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={handleChangePassword}
                disabled={savingPw || !pwValid}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors"
              >
                <Lock size={14} />
                {savingPw ? "Saving…" : "Change Password"}
              </button>
            </div>
          </div>
        </div>

      </div>

      {toast && <Toast msg={toast.msg} ok={toast.ok} onClose={() => setToast(null)} />}
    </div>
  );
}
