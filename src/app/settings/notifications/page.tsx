"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { notificationSettings as initialSettings } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { CheckCircle2, Save } from "lucide-react";

type Channel = "email" | "sms" | "inApp";
type EventKey =
  | "newOrder"
  | "orderStatusChange"
  | "lowStock"
  | "payrollProcessed"
  | "leaveRequest"
  | "pointsEarned"
  | "redemption"
  | "campaignAlert";

type NotifState = {
  email: Record<EventKey, boolean>;
  sms: Record<EventKey, boolean>;
  inApp: Record<EventKey, boolean>;
};

const EVENT_LABELS: Record<EventKey, string> = {
  newOrder: "New Order",
  orderStatusChange: "Order Status Change",
  lowStock: "Low Stock Alert",
  payrollProcessed: "Payroll Processed",
  leaveRequest: "Leave Request",
  pointsEarned: "Points Earned",
  redemption: "Reward Redeemed",
  campaignAlert: "Campaign Alert",
};

const GROUPS: { label: string; events: EventKey[] }[] = [
  { label: "Orders", events: ["newOrder", "orderStatusChange"] },
  { label: "Inventory", events: ["lowStock"] },
  { label: "HR", events: ["payrollProcessed", "leaveRequest"] },
  { label: "CRM", events: ["pointsEarned", "redemption", "campaignAlert"] },
];

const CHANNELS: { key: Channel; label: string }[] = [
  { key: "email", label: "Email" },
  { key: "sms", label: "SMS" },
  { key: "inApp", label: "In-App" },
];

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={cn(
        "relative inline-flex w-10 h-6 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
        on ? "bg-blue-600" : "bg-slate-200"
      )}
    >
      <span
        className={cn(
          "absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ease-in-out",
          on ? "translate-x-4" : "translate-x-0"
        )}
      />
    </button>
  );
}

export default function NotificationsPage() {
  const [settings, setSettings] = useState<NotifState>({
    email: { ...initialSettings.email } as Record<EventKey, boolean>,
    sms: { ...initialSettings.sms } as Record<EventKey, boolean>,
    inApp: { ...initialSettings.inApp } as Record<EventKey, boolean>,
  });
  const [saved, setSaved] = useState(false);

  function toggle(channel: Channel, event: EventKey) {
    setSettings((prev) => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [event]: !prev[channel][event],
      },
    }));
  }

  function handleSave() {
    setSaved(true);
  }

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 3000);
    return () => clearTimeout(t);
  }, [saved]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header
        title="Notification Settings"
        actions={
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Save size={15} />
            Save Changes
          </button>
        }
      />

      {saved && (
        <div className="mx-6 mt-4 flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium px-4 py-3 rounded-xl">
          <CheckCircle2 size={16} className="shrink-0" />
          Settings saved successfully
        </div>
      )}

      <div className="p-6">
        <p className="text-sm text-slate-500 mb-6">
          Choose which events trigger notifications and through which channels.
        </p>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto_auto] text-xs font-semibold text-slate-400 uppercase tracking-wide border-b border-slate-100 bg-slate-50 px-5 py-3 gap-6">
            <span>Event</span>
            {CHANNELS.map((ch) => (
              <span key={ch.key} className="w-16 text-center">{ch.label}</span>
            ))}
          </div>

          {GROUPS.map((group, gi) => (
            <div key={group.label}>
              <div className="px-5 py-2 bg-slate-50 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {group.label}
                </span>
              </div>
              {group.events.map((event, ei) => (
                <div
                  key={event}
                  className={cn(
                    "grid grid-cols-[1fr_auto_auto_auto] items-center px-5 py-3.5 gap-6 hover:bg-slate-50 transition-colors",
                    ei < group.events.length - 1 && "border-b border-slate-50"
                  )}
                >
                  <span className="text-sm text-slate-700">{EVENT_LABELS[event]}</span>
                  {CHANNELS.map((ch) => (
                    <div key={ch.key} className="w-16 flex justify-center">
                      <Toggle
                        on={settings[ch.key][event]}
                        onChange={() => toggle(ch.key, event)}
                      />
                    </div>
                  ))}
                </div>
              ))}
              {gi < GROUPS.length - 1 && <div className="border-b border-slate-100" />}
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-start gap-2 text-xs text-slate-400 bg-slate-100 rounded-lg px-4 py-3">
          <span className="mt-0.5 shrink-0">ℹ</span>
          <span>
            SMS notifications may incur additional charges depending on your messaging provider plan.
            In-App notifications appear in the bell icon in the top navigation bar.
          </span>
        </div>
      </div>
    </div>
  );
}
