"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import {
  MapPin, Loader2, CheckCircle2, AlertTriangle, Clock,
  LogIn, LogOut, RefreshCw, User, Briefcase,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MeData {
  employee: { id: string; name: string; department: string; position: string; branchId: string | null };
  branch: { id: string; name: string; lat: number; lng: number; radiusMeters: number } | null;
  shift: { id: string; name: string; startTime: string; endTime: string; breakMinutes: number; color: string } | null;
  assignment: { shiftId: string | null; confirmStatus: string } | null;
  record: {
    id: string; clockInTime: string | null; clockOutTime: string | null;
    clockInDistance: number | null; gpsValid: boolean; status: string;
    totalMinutes: number | null; overtimeMinutes: number | null; lateMinutes: number | null;
  } | null;
  settings: { lateWarningMinutes: number; clockGpsRadiusMeters: number };
  date: string;
}

type GpsStatus = "idle" | "fetching" | "ready" | "denied";
interface GpsCoords { lat: number; lng: number; accuracy: number; isDemo?: boolean }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
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

function fmtHHMM(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function fmtWorkHours(min: number) {
  const h = Math.floor(min / 60), m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function timeToMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

const shiftColor: Record<string, { bg: string; text: string; border: string }> = {
  blue:   { bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200" },
  amber:  { bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200" },
  violet: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200" },
  emerald:{ bg: "bg-emerald-50",text: "text-emerald-700",border: "border-emerald-200" },
  red:    { bg: "bg-red-50",    text: "text-red-700",    border: "border-red-200" },
  teal:   { bg: "bg-teal-50",   text: "text-teal-700",   border: "border-teal-200" },
};

// ─── GPS badge ────────────────────────────────────────────────────────────────

function GpsBadge({ dist, radius, isDemo }: { dist: number; radius: number; isDemo?: boolean }) {
  const ok = dist <= radius;
  return (
    <div className={cn(
      "flex items-center justify-between rounded-xl px-4 py-3 border text-sm",
      ok ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-600"
    )}>
      <span className="flex items-center gap-2 font-medium">
        {ok ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
        {ok ? "Within store radius" : "Outside store radius"}
        {isDemo && <span className="text-xs font-normal opacity-70">(demo)</span>}
      </span>
      <span className="font-mono font-semibold">
        {fmtDist(dist)}
        <span className="font-normal text-xs ml-1 opacity-70">/ {radius}m</span>
      </span>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ClockPage() {
  const [me, setMe]               = useState<MeData | null>(null);
  const [meError, setMeError]     = useState("");
  const [meLoading, setMeLoading] = useState(true);

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const [gpsStatus, setGpsStatus] = useState<GpsStatus>("idle");
  const [gps, setGps]             = useState<GpsCoords | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch current user's attendance data
  const fetchMe = useCallback(async () => {
    setMeLoading(true);
    setMeError("");
    try {
      const res = await fetch("/api/hr/attendance/me");
      if (res.status === 404) {
        const d = await res.json();
        setMeError(d.error ?? "No employee record linked.");
        return;
      }
      if (!res.ok) throw new Error("Failed to load.");
      setMe(await res.json());
    } catch {
      setMeError("Could not load attendance data.");
    } finally {
      setMeLoading(false);
    }
  }, []);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  // Start acquiring GPS as soon as page loads
  useEffect(() => {
    if (!navigator.geolocation) return;
    setGpsStatus("fetching");
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
        setGpsStatus("ready");
      },
      () => setGpsStatus("denied"),
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const branchGpsSet = !!(me?.branch && (me.branch.lat !== 0 || me.branch.lng !== 0));
  const dist = (gps && me?.branch && branchGpsSet)
    ? Math.round(haversineMeters(gps.lat, gps.lng, me.branch.lat, me.branch.lng))
    : null;

  // ── Clock action ─────────────────────────────────────────────────────────────

  const [clockError, setClockError] = useState("");

  const handleClock = async (action: "in" | "out") => {
    if (!me || submitting) return;
    setSubmitting(true);
    setClockError("");
    try {
      const endpoint = action === "in" ? "/api/hr/attendance/clock-in" : "/api/hr/attendance/clock-out";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId:   me.branch?.id ?? "",
          employeeId: me.employee.id,
          date:       me.date,
          shiftId:    me.assignment?.shiftId ?? null,
          ...(action === "in" ? { clockInTime: fmtHHMM(now) } : { clockOutTime: fmtHHMM(now) }),
          lat: gps?.lat ?? null,
          lng: gps?.lng ?? null,
        }),
      });
      if (res.ok) {
        await fetchMe();
      } else {
        const d = await res.json();
        setClockError(d.error ?? "Action failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Derived state ─────────────────────────────────────────────────────────────

  const record    = me?.record ?? null;
  const shift     = me?.shift ?? null;
  const branch    = me?.branch ?? null;
  const grace     = me?.settings.lateWarningMinutes ?? 15;
  const radius    = branch?.radiusMeters ?? me?.settings.clockGpsRadiusMeters ?? 200;
  const withinRadius = dist !== null && dist <= radius;

  const nowMin = now.getHours() * 60 + now.getMinutes();

  const clockedIn  = record?.clockInTime != null && record?.clockOutTime == null;
  const completed  = record?.status === "completed";
  const shiftClr   = shiftColor[shift?.color ?? "blue"] ?? shiftColor.blue;

  // Compute live late indicator for clock-in button
  const isCurrentlyLate = shift
    ? nowMin > timeToMin(shift.startTime) + grace
    : false;

  // Too early to clock in (before shift start minus 5 min)
  const tooEarlyToClockIn = !!(shift && !clockedIn && !completed
    && nowMin < timeToMin(shift.startTime) - 5);

  // Too early to clock out (before shift end)
  const tooEarlyToClockOut = !!(shift && clockedIn
    && nowMin < timeToMin(shift.endTime));

  function fmtMinAsTime(m: number) {
    return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  }

  // ─── Loading / error states ──────────────────────────────────────────────────

  if (meLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50">
        <Header title="Clock In / Out" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-slate-400" />
        </div>
      </div>
    );
  }

  if (meError) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50">
        <Header title="Clock In / Out" />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-sm w-full text-center space-y-3">
            <AlertTriangle size={32} className="mx-auto text-amber-400" />
            <p className="text-sm font-semibold text-slate-800">{meError}</p>
            <p className="text-xs text-slate-400">Ask your manager to link your user account to an employee record in HR → Settings → Users.</p>
            <button onClick={fetchMe} className="mt-2 px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!me) return null;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header
        title="Clock In / Out"
        subtitle={me.employee.name}
        actions={
          <button onClick={fetchMe} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
            <RefreshCw size={15} className={meLoading ? "animate-spin" : ""} />
          </button>
        }
      />

      <main className="flex-1 flex items-start justify-center p-6">
        <div className="w-full max-w-md space-y-4">

          {/* Live clock */}
          <div className="bg-white border border-slate-200 rounded-2xl px-6 py-5 text-center">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">
              {now.toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
            </p>
            <p className="text-5xl font-mono font-bold text-slate-900 tabular-nums tracking-tight">
              {String(now.getHours()).padStart(2, "0")}:{String(now.getMinutes()).padStart(2, "0")}
              <span className="text-2xl text-slate-300 ml-1">:{String(now.getSeconds()).padStart(2, "0")}</span>
            </p>
          </div>

          {/* Employee card */}
          <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <User size={18} className="text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{me.employee.name}</p>
              <p className="text-xs text-slate-400 truncate">{me.employee.position} · {me.employee.department}</p>
            </div>
            {branch && (
              <div className="text-right shrink-0">
                <p className="text-xs text-slate-400">Branch</p>
                <p className="text-xs font-medium text-slate-700">{branch.name}</p>
              </div>
            )}
          </div>

          {/* Shift card */}
          {shift ? (
            <div className={cn("border rounded-2xl px-5 py-4 flex items-center justify-between", shiftClr.bg, shiftClr.border)}>
              <div className="flex items-center gap-3">
                <Briefcase size={16} className={shiftClr.text} />
                <div>
                  <p className={cn("text-sm font-semibold", shiftClr.text)}>{shift.name}</p>
                  <p className={cn("text-xs opacity-70", shiftClr.text)}>
                    {shift.startTime} – {shift.endTime}
                    {shift.breakMinutes > 0 && ` · ${shift.breakMinutes}m break`}
                  </p>
                </div>
              </div>
              {isCurrentlyLate && !record?.clockInTime && (
                <span className="flex items-center gap-1 bg-red-100 text-red-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                  <AlertTriangle size={11} />
                  Late
                </span>
              )}
              {record?.clockInTime && !record?.clockOutTime && !record?.lateMinutes && (
                <span className="flex items-center gap-1 bg-emerald-100 text-emerald-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                  <CheckCircle2 size={11} />
                  On time
                </span>
              )}
              {record?.lateMinutes ? (
                <span className="flex items-center gap-1 bg-red-100 text-red-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                  <AlertTriangle size={11} />
                  {record.lateMinutes}m late
                </span>
              ) : null}
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-center text-sm text-slate-400">
              No shift assigned for today
            </div>
          )}

          {/* GPS status */}
          <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <MapPin size={12} className="text-blue-500" />
                GPS Location
              </span>
              {gpsStatus === "fetching" && (
                <span className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Loader2 size={12} className="animate-spin" /> Locating…
                </span>
              )}
              {gpsStatus === "denied" && (
                <span className="text-xs text-red-600 font-medium">Location access denied</span>
              )}
              {gpsStatus === "ready" && gps && (
                <span className="text-xs text-slate-400 font-mono">
                  {gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}
                </span>
              )}
            </div>

            {!branchGpsSet ? (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-500">
                <MapPin size={15} className="text-slate-400 shrink-0" />
                Branch GPS not configured — clock-in allowed from any location
              </div>
            ) : dist !== null ? (
              <GpsBadge dist={dist} radius={radius} />
            ) : gpsStatus === "denied" ? (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                <AlertTriangle size={15} className="shrink-0" />
                Location access denied. Enable GPS in your browser to clock in.
              </div>
            ) : (
              <div className="h-10 bg-slate-50 rounded-xl animate-pulse" />
            )}

            {branchGpsSet && branch && (
              <p className="text-xs text-slate-400 text-center">
                Store: {branch.lat.toFixed(4)}°N, {branch.lng.toFixed(4)}°E · Allowed radius: {radius}m
              </p>
            )}
          </div>

          {/* Clock result (after clock-in) */}
          {record?.clockInTime && (
            <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Today&apos;s Record</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-xl px-4 py-3">
                  <p className="text-xs text-blue-400 mb-0.5">Clock In</p>
                  <p className="text-xl font-mono font-bold text-blue-700">{record.clockInTime}</p>
                  {record.clockInDistance !== null && (
                    <p className="text-xs text-blue-400 mt-0.5">{fmtDist(record.clockInDistance)} from store</p>
                  )}
                </div>
                {record.clockOutTime ? (
                  <div className="bg-emerald-50 rounded-xl px-4 py-3">
                    <p className="text-xs text-emerald-400 mb-0.5">Clock Out</p>
                    <p className="text-xl font-mono font-bold text-emerald-700">{record.clockOutTime}</p>
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-xl px-4 py-3 flex items-center justify-center">
                    <p className="text-xs text-slate-400">Not yet</p>
                  </div>
                )}
              </div>
              {record.totalMinutes != null && (
                <div className="bg-slate-50 rounded-xl px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-slate-600">Total hours worked</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {fmtWorkHours(record.totalMinutes)}
                    {record.overtimeMinutes ? (
                      <span className="ml-2 text-xs text-violet-600">+{fmtWorkHours(record.overtimeMinutes)} OT</span>
                    ) : null}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Too early to clock in */}
          {tooEarlyToClockIn && shift && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 text-sm text-amber-700">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Too early to clock in</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  Your shift starts at {shift.startTime}. Clock-in opens at {fmtMinAsTime(timeToMin(shift.startTime) - 5)}.
                </p>
              </div>
            </div>
          )}

          {/* Late warning banner (before clocking in) */}
          {!record?.clockInTime && isCurrentlyLate && shift && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-sm text-red-700">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">You are late</p>
                <p className="text-xs text-red-500 mt-0.5">
                  Your shift started at {shift.startTime}. Grace period is {grace} minutes.
                  Clocking in now will mark you as late.
                </p>
              </div>
            </div>
          )}

          {/* Too early to clock out */}
          {tooEarlyToClockOut && shift && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 text-sm text-amber-700">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Shift not finished yet</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  Clock-out is available from {shift.endTime}.
                </p>
              </div>
            </div>
          )}

          {/* Action buttons */}
          {clockError && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-sm text-red-700">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              {clockError}
            </div>
          )}

          {completed ? (
            <div className="flex items-center justify-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-6">
              <CheckCircle2 size={24} className="text-emerald-500" />
              <div>
                <p className="text-sm font-semibold text-emerald-700">Shift complete</p>
                <p className="text-xs text-emerald-500">
                  {record?.clockInTime} – {record?.clockOutTime}
                  {record?.totalMinutes != null && ` · ${fmtWorkHours(record.totalMinutes)}`}
                </p>
              </div>
            </div>
          ) : clockedIn ? (
            <button
              onClick={() => handleClock("out")}
              disabled={submitting || gpsStatus === "fetching" || tooEarlyToClockOut}
              className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl bg-red-500 hover:bg-red-600 active:bg-red-700 disabled:opacity-50 text-white font-bold text-lg transition-colors shadow-lg shadow-red-100"
            >
              {submitting ? <Loader2 size={22} className="animate-spin" /> : <LogOut size={22} />}
              {submitting ? "Saving…" : "Clock Out"}
            </button>
          ) : (
            <>
              <button
                onClick={() => handleClock("in")}
                disabled={submitting || gpsStatus === "fetching" || tooEarlyToClockIn || (branchGpsSet && (gpsStatus !== "ready" || !withinRadius))}
                className={cn(
                  "w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-bold text-lg transition-colors shadow-lg disabled:opacity-40 text-white",
                  isCurrentlyLate
                    ? "bg-amber-500 hover:bg-amber-600 active:bg-amber-700 shadow-amber-100"
                    : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-blue-100"
                )}
              >
                {submitting ? <Loader2 size={22} className="animate-spin" /> : <LogIn size={22} />}
                {submitting ? "Saving…" : isCurrentlyLate ? "Clock In (Late)" : "Clock In"}
              </button>
              {branchGpsSet && gpsStatus === "ready" && !withinRadius && dist !== null && (
                <p className="text-center text-xs text-red-500 font-medium">
                  You are {fmtDist(dist)} from the store — must be within {radius}m to clock in.
                </p>
              )}
              {branchGpsSet && gpsStatus === "denied" && (
                <p className="text-center text-xs text-red-500 font-medium">
                  Enable location access to clock in.
                </p>
              )}
            </>
          )}

        </div>
      </main>
    </div>
  );
}
