"use client";

import { Bell, Search, ChevronDown, MapPin, Menu } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useBranch } from "@/context/BranchContext";
import { useSidebar } from "@/context/SidebarContext";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  const { activeBranch, setActiveBranch, branches } = useBranch();
  const { toggle } = useSidebar();
  const { lang, setLang, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4">
      <div className="flex items-center justify-between gap-3">
        {/* Left: hamburger + title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={toggle}
            className="lg:hidden flex-shrink-0 p-2 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Open menu"
          >
            <Menu size={20} className="text-slate-600" />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-semibold text-slate-900 truncate">{title}</h1>
            {subtitle && <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate hidden sm:block">{subtitle}</p>}
          </div>
        </div>

        {/* Right: actions + branch + search + bell */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {actions && <div className="hidden sm:flex items-center gap-2">{actions}</div>}

          {/* Branch selector */}
          <div className="relative hidden md:block" ref={ref}>
            <button
              onClick={() => setOpen((o) => !o)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <MapPin size={13} className="text-blue-600 shrink-0" />
              <span className="font-medium text-slate-700 max-w-[100px] truncate text-xs">
                {activeBranch?.name ?? t("No Branch")}
              </span>
              <ChevronDown size={12} className={cn("text-slate-400 transition-transform", open && "rotate-180")} />
            </button>

            {open && (
              <div className="absolute right-0 mt-1.5 w-72 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50">
                <p className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">{t("Select Branch")}</p>
                {branches.length === 0 && (
                  <p className="px-3 py-3 text-sm text-slate-400 text-center">{t("No branches configured")}</p>
                )}
                {branches.map((branch) => (
                  <button
                    key={branch.id}
                    onClick={() => { setActiveBranch(branch); setOpen(false); }}
                    className={cn(
                      "w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-slate-50 transition-colors",
                      activeBranch?.id === branch.id && "bg-blue-50"
                    )}
                  >
                    <div className={cn(
                      "mt-0.5 w-9 h-7 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 tracking-tight px-1",
                      activeBranch?.id === branch.id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                    )}>
                      {branch.code}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-sm font-medium", activeBranch?.id === branch.id ? "text-blue-700" : "text-slate-800")}>
                          {branch.name}
                        </span>
                        {branch.isHeadOffice && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">HQ</span>}
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{branch.address}</p>
                    </div>
                  </button>
                ))}
                <div className="border-t border-slate-100 mt-1 pt-1">
                  <a href="/settings/branches" className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors" onClick={() => setOpen(false)}>
                    {t("Manage branches →")}
                  </a>
                </div>
              </div>
            )}
          </div>

          <div className="relative hidden lg:block">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t("Search...")}
              className="pl-8 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg w-40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Language toggle */}
          <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden text-xs font-semibold">
            <button
              onClick={() => setLang("en")}
              className={cn(
                "px-2.5 py-1.5 transition-colors",
                lang === "en"
                  ? "bg-blue-600 text-white"
                  : "text-slate-500 hover:bg-slate-100"
              )}
            >
              EN
            </button>
            <button
              onClick={() => setLang("th")}
              className={cn(
                "px-2.5 py-1.5 transition-colors border-l border-slate-200",
                lang === "th"
                  ? "bg-blue-600 text-white"
                  : "text-slate-500 hover:bg-slate-100"
              )}
            >
              TH
            </button>
          </div>

          <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <Bell size={18} className="text-slate-600" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </div>

      {/* Mobile actions row */}
      {actions && (
        <div className="flex sm:hidden items-center gap-2 mt-2 pt-2 border-t border-slate-100">
          {actions}
        </div>
      )}
    </header>
  );
}
