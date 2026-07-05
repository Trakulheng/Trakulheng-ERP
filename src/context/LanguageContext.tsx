"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { getTranslation, type Language } from "@/lib/i18n";

interface LanguageContextValue {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  setLang: () => {},
  t: (k) => k,
});

const COOKIE = "ddk-lang";
const LS_KEY = "ddk-lang";

function readLang(): Language {
  if (typeof window === "undefined") return "en";
  try {
    const ls = localStorage.getItem(LS_KEY);
    if (ls === "th" || ls === "en") return ls;
    const cookie = document.cookie.split(";").find((c) => c.trim().startsWith(COOKIE + "="));
    const val = cookie?.split("=")[1]?.trim();
    if (val === "th" || val === "en") return val;
  } catch {}
  return "en";
}

function writeLang(l: Language) {
  try {
    localStorage.setItem(LS_KEY, l);
    document.cookie = `${COOKIE}=${l};path=/;max-age=31536000;samesite=lax`;
  } catch {}
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");

  useEffect(() => {
    setLangState(readLang());
  }, []);

  const setLang = useCallback((l: Language) => {
    setLangState(l);
    writeLang(l);
    // Update <html lang> attribute
    document.documentElement.lang = l === "th" ? "th" : "en";
  }, []);

  const t = useCallback((key: string) => getTranslation(lang, key), [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

// Convenience: just the translator
export function useT() {
  return useContext(LanguageContext).t;
}
