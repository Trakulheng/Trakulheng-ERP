"use client";

import { Header } from "@/components/layout/Header";
import { useTheme, AccentColor, SidebarStyle, RadiusSize, FontSize, ColorMode } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";
import { Check, Moon, Sun, Monitor, Palette, Layers, Type, SquareStack } from "lucide-react";

// ── Accent swatches ────────────────────────────────────────────────────

const ACCENTS: { id: AccentColor; label: string; bg: string; ring: string }[] = [
  { id: "blue",    label: "Blue",    bg: "bg-blue-600",    ring: "ring-blue-600"    },
  { id: "purple",  label: "Purple",  bg: "bg-purple-600",  ring: "ring-purple-600"  },
  { id: "emerald", label: "Emerald", bg: "bg-emerald-600", ring: "ring-emerald-600" },
  { id: "orange",  label: "Orange",  bg: "bg-orange-600",  ring: "ring-orange-600"  },
  { id: "rose",    label: "Rose",    bg: "bg-rose-600",    ring: "ring-rose-600"    },
  { id: "teal",    label: "Teal",    bg: "bg-teal-600",    ring: "ring-teal-600"    },
];

// ── Sidebar previews ───────────────────────────────────────────────────

const SIDEBAR_STYLES: { id: SidebarStyle; label: string; desc: string; bg: string; text: string; border: string }[] = [
  { id: "dark",     label: "Dark",     desc: "Slate-900 sidebar",   bg: "bg-slate-900",   text: "text-white",      border: "border-slate-700" },
  { id: "light",    label: "Light",    desc: "White sidebar",       bg: "bg-white",        text: "text-slate-800",  border: "border-slate-200" },
  { id: "midnight", label: "Midnight", desc: "Deep navy sidebar",   bg: "bg-[#0d1b2a]",   text: "text-white",      border: "border-[#1a2f45]" },
];

// ── Radius options ─────────────────────────────────────────────────────

const RADIUS_OPTIONS: { id: RadiusSize; label: string; desc: string; cls: string }[] = [
  { id: "sharp",   label: "Sharp",   desc: "Minimal rounding",  cls: "rounded-sm"  },
  { id: "default", label: "Default", desc: "Balanced rounding", cls: "rounded-lg"  },
  { id: "rounded", label: "Rounded", desc: "Soft, pill-like",   cls: "rounded-2xl" },
];

// ── Font size options ──────────────────────────────────────────────────

const FONT_OPTIONS: { id: FontSize; label: string; desc: string; size: string }[] = [
  { id: "sm",      label: "Compact",  desc: "13px base", size: "text-xs" },
  { id: "default", label: "Default",  desc: "14px base", size: "text-sm" },
  { id: "lg",      label: "Spacious", desc: "16px base", size: "text-base" },
];

// ── Mini sidebar preview ───────────────────────────────────────────────

function SidebarPreview({ style }: { style: typeof SIDEBAR_STYLES[number] }) {
  return (
    <div className={cn("w-full h-24 rounded-lg border overflow-hidden flex", style.bg, style.border)}>
      <div className={cn("w-14 flex flex-col gap-1 p-2 border-r", style.border)}>
        <div className={cn("w-8 h-1.5 rounded-full opacity-80", style.text === "text-white" ? "bg-white" : "bg-slate-800")} />
        <div className={cn("w-6 h-1 rounded-full opacity-40 mt-1", style.text === "text-white" ? "bg-white" : "bg-slate-400")} />
        <div className={cn("w-6 h-1 rounded-full opacity-40", style.text === "text-white" ? "bg-white" : "bg-slate-400")} />
        <div className={cn("w-6 h-1 rounded-full opacity-40", style.text === "text-white" ? "bg-white" : "bg-slate-400")} />
      </div>
      <div className="flex-1 bg-slate-50 p-2 flex flex-col gap-1">
        <div className="h-2 w-3/4 bg-slate-200 rounded" />
        <div className="h-2 w-1/2 bg-slate-200 rounded" />
        <div className="h-2 w-2/3 bg-slate-200 rounded" />
      </div>
    </div>
  );
}

// ── Section wrapper ────────────────────────────────────────────────────

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
          <Icon size={14} className="text-blue-600" />
        </div>
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────

export default function AppearancePage() {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <Header
        title="Appearance"
        subtitle="Personalise the look and feel of your ERP"
      />

      <div className="p-6 space-y-6 max-w-3xl">

        {/* Color Mode */}
        <Section icon={Sun} title="Color Mode">
          <div className="grid grid-cols-3 gap-3">
            {([
              { id: "light", label: "Light", icon: Sun,     desc: "Bright, clean interface" },
              { id: "dark",  label: "Dark",  icon: Moon,    desc: "Easy on the eyes" },
            ] as { id: ColorMode; label: string; icon: React.ElementType; desc: string }[]).map(({ id, label, icon: Icon, desc }) => (
              <button
                key={id}
                onClick={() => setTheme({ colorMode: id })}
                className={cn(
                  "relative flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all",
                  theme.colorMode === id
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                )}
              >
                {theme.colorMode === id && (
                  <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                    <Check size={11} className="text-white" />
                  </span>
                )}
                {/* Mini preview */}
                <div className={cn(
                  "w-full h-16 rounded-lg border flex overflow-hidden",
                  id === "dark" ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200"
                )}>
                  <div className={cn("w-10 border-r flex flex-col gap-1 p-1.5", id === "dark" ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200")}>
                    <div className={cn("w-full h-1 rounded-full", id === "dark" ? "bg-slate-600" : "bg-slate-300")} />
                    <div className={cn("w-3/4 h-1 rounded-full", id === "dark" ? "bg-slate-700" : "bg-slate-200")} />
                    <div className={cn("w-3/4 h-1 rounded-full", id === "dark" ? "bg-slate-700" : "bg-slate-200")} />
                  </div>
                  <div className="flex-1 p-1.5 flex flex-col gap-1">
                    <div className={cn("w-3/4 h-1.5 rounded-full", id === "dark" ? "bg-slate-700" : "bg-slate-200")} />
                    <div className={cn("w-full h-7 rounded", id === "dark" ? "bg-slate-800" : "bg-white border border-slate-200")} />
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Icon size={14} className={theme.colorMode === id ? "text-blue-600" : "text-slate-500"} />
                  <span className={cn("text-sm font-medium", theme.colorMode === id ? "text-blue-700" : "text-slate-700")}>{label}</span>
                </div>
                <p className="text-xs text-slate-400 text-center">{desc}</p>
              </button>
            ))}
          </div>
        </Section>

        {/* Accent Color */}
        <Section icon={Palette} title="Accent Color">
          <div className="flex flex-wrap gap-3">
            {ACCENTS.map((a) => (
              <button
                key={a.id}
                onClick={() => setTheme({ accent: a.id })}
                title={a.label}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all w-20",
                  theme.accent === a.id ? "border-slate-700" : "border-transparent hover:border-slate-200"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-transform",
                  a.bg,
                  theme.accent === a.id && "ring-2 ring-offset-2 " + a.ring
                )}>
                  {theme.accent === a.id && <Check size={16} className="text-white" />}
                </div>
                <span className="text-xs text-slate-600 font-medium">{a.label}</span>
              </button>
            ))}
          </div>
        </Section>

        {/* Sidebar Style */}
        <Section icon={Layers} title="Sidebar Style">
          <div className="grid grid-cols-3 gap-4">
            {SIDEBAR_STYLES.map((s) => (
              <button
                key={s.id}
                onClick={() => setTheme({ sidebar: s.id })}
                className={cn(
                  "flex flex-col gap-2 p-3 rounded-xl border-2 transition-all",
                  theme.sidebar === s.id ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"
                )}
              >
                <SidebarPreview style={s} />
                <div className="flex items-center justify-between px-0.5">
                  <div>
                    <p className={cn("text-sm font-medium", theme.sidebar === s.id ? "text-blue-700" : "text-slate-700")}>{s.label}</p>
                    <p className="text-xs text-slate-400">{s.desc}</p>
                  </div>
                  {theme.sidebar === s.id && (
                    <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                      <Check size={11} className="text-white" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </Section>

        {/* Border Radius */}
        <Section icon={SquareStack} title="Corner Radius">
          <div className="grid grid-cols-3 gap-3">
            {RADIUS_OPTIONS.map((r) => (
              <button
                key={r.id}
                onClick={() => setTheme({ radius: r.id })}
                className={cn(
                  "flex flex-col items-center gap-3 p-4 border-2 rounded-xl transition-all",
                  theme.radius === r.id ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"
                )}
              >
                <div className={cn(
                  "w-12 h-12 border-2 bg-slate-100",
                  r.cls,
                  theme.radius === r.id ? "border-blue-500" : "border-slate-300"
                )} />
                <div className="text-center">
                  <p className={cn("text-sm font-medium", theme.radius === r.id ? "text-blue-700" : "text-slate-700")}>{r.label}</p>
                  <p className="text-xs text-slate-400">{r.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </Section>

        {/* Font Size */}
        <Section icon={Type} title="Font Size">
          <div className="grid grid-cols-3 gap-3">
            {FONT_OPTIONS.map((f) => (
              <button
                key={f.id}
                onClick={() => setTheme({ fontSize: f.id })}
                className={cn(
                  "flex flex-col items-center gap-3 p-4 border-2 rounded-xl transition-all",
                  theme.fontSize === f.id ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"
                )}
              >
                <span className={cn("font-semibold text-slate-700", f.size)}>Aa</span>
                <div className="text-center">
                  <p className={cn("text-sm font-medium", theme.fontSize === f.id ? "text-blue-700" : "text-slate-700")}>{f.label}</p>
                  <p className="text-xs text-slate-400">{f.desc}</p>
                </div>
                {theme.fontSize === f.id && (
                  <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                    <Check size={11} className="text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </Section>

        {/* Reset */}
        <div className="flex justify-end">
          <button
            onClick={() => setTheme({ colorMode: "light", accent: "blue", sidebar: "dark", radius: "default", fontSize: "default" })}
            className="px-4 py-2 text-sm text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Reset to defaults
          </button>
        </div>
      </div>
    </div>
  );
}
