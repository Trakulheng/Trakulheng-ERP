"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  Fingerprint, MapPin, CheckCircle2, AlertTriangle,
  LogIn, LogOut, Loader2, Clock,
} from "lucide-react";
import Link from "next/link";

interface BranchInfo { id: string; name: string; lat: number; lng: number; radiusMeters: number }

interface MeData {
  employee: { id: string; name: string; position: string };
  branch: BranchInfo | null;
  branches?: BranchInfo[];
  shift: { id: string; name: string; startTime: string; endTime: string; color: string } | null;
  date: string;
  record: {
    clockInTime: string | null;
    clockOutTime: string | null;
    clockInDistance: number | null;
    gpsValid: boolean;
    status: string;
    totalMinutes: number | null;
    lateMinutes: number | null;
  } | null;
  settings: { lateWarningMinutes: number; clockGpsRadiusMeters: number };
}

interface GpsCoords { lat: number; lng: number }

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fmtDist(m: number) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}

function fmtWorkHours(min: number) {
  const h = Math.floor(min / 60), m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function timeToMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function ClockInOutWidget() {
  const [me, setMe] = useState<MeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [gps, setGps] = useState<GpsCoords | null>(null);
  const [gpsStatus, setGpsStatus] = useState<"idle" | "fetching" | "ready" | "denied">("idle");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const watchId = useRef<number | null>(null);

  async function fetchMe() {
    try {
      const res = await fetch("/api/hr/attendance/me");
      if (!res.ok) { setError("Unable to load attendance info."); return; }
      const data = await res.json();
      setMe(data);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMe();
    return () => { if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current); };
  }, []);

  function startGps() {
    if (!navigator.geolocation) { setGpsStatus("denied"); return; }
    setGpsStatus("fetching");
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsStatus("ready");
      },
      () => setGpsStatus("denied"),
      { enableHighAccuracy: true }
    );
  }

  // Pick the branch the employee is actually at: nearest of their assigned
  // branches. Branches without GPS coordinates allow clock-in from anywhere.
  const branches: BranchInfo[] = me?.branches?.length ? me.branches : (me?.branch ? [me.branch] : []);
  const branchHasGps = (b: BranchInfo) => b.lat !== 0 || b.lng !== 0;
  let activeBranch: BranchInfo | null = branches[0] ?? null;
  let dist: number | null = null;
  if (gps && branches.length > 0) {
    const noGpsBranch = branches.find((b) => !branchHasGps(b));
    let nearest: BranchInfo | null = null;
    let nearestDist = Infinity;
    for (const b of branches) {
      if (!branchHasGps(b)) continue;
      const d = haversineMeters(gps.lat, gps.lng, b.lat, b.lng);
      if (d < nearestDist) { nearest = b; nearestDist = d; }
    }
    if (nearest && nearestDist <= nearest.radiusMeters) {
      activeBranch = nearest;
      dist = nearestDist;
    } else if (noGpsBranch) {
      activeBranch = noGpsBranch;
      dist = null;
    } else if (nearest) {
      activeBranch = nearest;
      dist = nearestDist;
    }
  }
  const radius = activeBranch?.radiusMeters ?? me?.settings.clockGpsRadiusMeters ?? 200;
  const gpsRequired = activeBranch ? branchHasGps(activeBranch) : false;
  const withinRadius = !gpsRequired || (dist !== null && dist <= radius);

  const record = me?.record;
  // Derive from the recorded times — status can also be "late", which still
  // means the employee is clocked in.
  const clocked_in  = !!(record?.clockInTime && !record?.clockOutTime);
  const completed   = !!(record?.clockInTime && record?.clockOutTime);

  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  const isLate = me?.shift ? nowMin > timeToMin(me.shift.startTime) + (me.settings.lateWarningMinutes ?? 15) : false;

  const tooEarlyToClockOut = !!(me?.shift && clocked_in
    && nowMin < timeToMin(me.shift.endTime));

  function fmtHHMM(d: Date) {
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  async function clockIn() {
    if (!gps || !me) return;
    setActionLoading(true); setActionError("");
    try {
      const res = await fetch("/api/hr/attendance/clock-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId:    activeBranch?.id ?? me.branch?.id ?? "",
          employeeId:  me.employee.id,
          date:        me.date,
          clockInTime: fmtHHMM(new Date()),
          shiftId:     me.shift?.id ?? null,
          lat: gps.lat,
          lng: gps.lng,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setActionError(data.error ?? "Clock-in failed."); return; }
      await fetchMe();
      window.dispatchEvent(new Event("pull-refresh"));
    } catch { setActionError("Network error."); }
    finally { setActionLoading(false); }
  }

  async function clockOut() {
    if (!gps || !me) return;
    setActionLoading(true); setActionError("");
    try {
      const res = await fetch("/api/hr/attendance/clock-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId:     activeBranch?.id ?? me.branch?.id ?? "",
          employeeId:   me.employee.id,
          date:         me.date,
          clockOutTime: fmtHHMM(new Date()),
          lat: gps.lat,
          lng: gps.lng,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setActionError(data.error ?? "Clock-out failed."); return; }
      await fetchMe();
      window.dispatchEvent(new Event("pull-refresh"));
    } catch { setActionError("Network error."); }
    finally { setActionLoading(false); }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Fingerprint size={16} className="text-blue-500" />
          <h3 className="text-base font-semibold text-slate-900">Clock In / Out</h3>
        </div>
        <Link href="/hr/clock" className="text-xs text-blue-600 hover:underline">Full page</Link>
      </div>

      {loading ? (
        <div className="px-5 py-6 flex items-center justify-center gap-2 text-sm text-slate-400">
          <Loader2 size={14} className="animate-spin" /> Loading…
        </div>
      ) : error ? (
        <div className="px-5 py-6 text-center text-sm text-slate-400">{error}</div>
      ) : (
        <div className="px-5 py-4 space-y-3">

          {/* Shift info */}
          {me?.shift ? (
            <div className={cn(
              "flex items-center justify-between rounded-lg px-3 py-2 border text-sm",
              "bg-blue-50 border-blue-200 text-blue-700"
            )}>
              <div className="flex items-center gap-2 font-medium">
                <Clock size={13} />
                {me.shift.name}
              </div>
              <span className="text-xs opacity-80">{me.shift.startTime} – {me.shift.endTime}</span>
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-1">No shift assigned today</p>
          )}

          {/* Completed state */}
          {completed && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-center">
              <CheckCircle2 size={20} className="mx-auto text-emerald-500 mb-1" />
              <p className="text-sm font-semibold text-emerald-700">Shift Complete</p>
              <div className="flex items-center justify-center gap-4 mt-1 text-xs text-emerald-600">
                <span>In: {record?.clockInTime}</span>
                <span>Out: {record?.clockOutTime}</span>
                {record?.totalMinutes != null && <span>{fmtWorkHours(record.totalMinutes)} worked</span>}
              </div>
              {record?.lateMinutes != null && record.lateMinutes > 0 && (
                <p className="text-xs text-amber-600 mt-1">Late by {record.lateMinutes} min</p>
              )}
            </div>
          )}

          {/* Clocked-in state */}
          {clocked_in && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 flex items-center justify-between text-sm text-blue-700">
              <span className="font-medium">Clocked in at {record?.clockInTime}</span>
              {record?.lateMinutes != null && record.lateMinutes > 0 && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                  +{record.lateMinutes}m late
                </span>
              )}
            </div>
          )}

          {/* GPS section — shown when not completed and shift is assigned */}
          {!completed && !me?.shift && !clocked_in && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-xs text-amber-700">
              <AlertTriangle size={13} className="shrink-0" />
              No shift assigned for today — clock-in is not available.
            </div>
          )}

          {!completed && (me?.shift || clocked_in) && (
            <>
              {gpsStatus === "idle" && (
                <button
                  onClick={startGps}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  <MapPin size={14} />
                  Enable GPS to clock {clocked_in ? "out" : "in"}
                </button>
              )}

              {gpsStatus === "fetching" && (
                <div className="flex items-center justify-center gap-2 py-2 text-sm text-slate-400">
                  <Loader2 size={14} className="animate-spin" /> Getting location…
                </div>
              )}

              {gpsStatus === "denied" && (
                <p className="text-xs text-red-500 text-center">
                  Location access denied — enable GPS in your browser to clock in.
                </p>
              )}

              {gpsStatus === "ready" && branches.length === 0 && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
                  <AlertTriangle size={13} className="shrink-0" />
                  No branch assigned to you — ask your manager to add you to a branch.
                </div>
              )}

              {gpsStatus === "ready" && activeBranch && !gpsRequired && (
                <div className="flex items-center gap-1.5 rounded-lg px-3 py-2 border text-xs bg-emerald-50 border-emerald-200 text-emerald-700 font-medium">
                  <CheckCircle2 size={13} />
                  {activeBranch.name} — clock-in allowed from any location
                </div>
              )}

              {gpsStatus === "ready" && gpsRequired && dist !== null && (
                <div className={cn(
                  "flex items-center justify-between rounded-lg px-3 py-2 border text-xs",
                  withinRadius
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-red-50 border-red-200 text-red-600"
                )}>
                  <span className="flex items-center gap-1.5 font-medium">
                    {withinRadius ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                    {withinRadius ? `At ${activeBranch?.name}` : `Outside ${activeBranch?.name} radius`}
                  </span>
                  <span>{fmtDist(dist)} / {fmtDist(radius)}</span>
                </div>
              )}

              {/* Too early to clock out */}
              {tooEarlyToClockOut && me?.shift && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
                  <AlertTriangle size={13} className="shrink-0" />
                  Clock-out available from {me.shift.endTime}.
                </div>
              )}

              {/* Late warning */}
              {!clocked_in && isLate && gpsStatus === "ready" && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
                  <AlertTriangle size={13} />
                  You are late — clocking in will be marked late.
                </div>
              )}

              {actionError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{actionError}</p>
              )}

              {/* Action buttons */}
              {gpsStatus === "ready" && (
                !clocked_in ? (
                  <button
                    onClick={clockIn}
                    disabled={actionLoading || !withinRadius}
                    className={cn(
                      "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors",
                      isLate
                        ? "bg-amber-500 hover:bg-amber-600 disabled:opacity-40"
                        : "bg-blue-600 hover:bg-blue-700 disabled:opacity-40"
                    )}
                  >
                    {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} />}
                    {actionLoading ? "Clocking in…" : isLate ? "Clock In (Late)" : "Clock In"}
                  </button>
                ) : (
                  <button
                    onClick={clockOut}
                    disabled={actionLoading || !withinRadius || tooEarlyToClockOut}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-40 transition-colors"
                  >
                    {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
                    {actionLoading ? "Clocking out…" : "Clock Out"}
                  </button>
                )
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
