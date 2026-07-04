"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type ColorMode   = "light" | "dark";
export type AccentColor = "blue" | "purple" | "emerald" | "orange" | "rose" | "teal";
export type SidebarStyle = "dark" | "light" | "midnight";
export type RadiusSize  = "sharp" | "default" | "rounded";
export type FontSize    = "sm" | "default" | "lg";

export interface Theme {
  colorMode:  ColorMode;
  accent:     AccentColor;
  sidebar:    SidebarStyle;
  radius:     RadiusSize;
  fontSize:   FontSize;
}

export const DEFAULT_THEME: Theme = {
  colorMode: "light",
  accent:    "blue",
  sidebar:   "dark",
  radius:    "default",
  fontSize:  "default",
};

const FONT_SIZE_MAP: Record<FontSize, string> = {
  sm:      "13px",
  default: "14px",
  lg:      "16px",
};

interface ThemeContextValue {
  theme:    Theme;
  setTheme: (patch: Partial<Theme>) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme:    DEFAULT_THEME,
  setTheme: () => {},
});

export function applyThemeToDoc(t: Theme) {
  const html = document.documentElement;
  if (t.colorMode === "dark") html.classList.add("dark");
  else html.classList.remove("dark");
  html.dataset.accent  = t.accent;
  html.dataset.radius  = t.radius;
  html.dataset.sidebar = t.sidebar;
  html.style.fontSize  = FONT_SIZE_MAP[t.fontSize];
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);
  const [mounted, setMounted]  = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ddk-theme");
      if (saved) {
        const parsed = JSON.parse(saved) as Theme;
        setThemeState(parsed);
        applyThemeToDoc(parsed);
      }
    } catch {}
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    applyThemeToDoc(theme);
    localStorage.setItem("ddk-theme", JSON.stringify(theme));
  }, [theme, mounted]);

  const setTheme = (patch: Partial<Theme>) =>
    setThemeState((prev) => ({ ...prev, ...patch }));

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
