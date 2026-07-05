"use client";

import { Bell, Search, ChevronDown, MapPin } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useBranch } from "@/context/BranchContext";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  const { activeBranch, setActiveBranch, branches } = useBranch();
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
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-3">
          {actions}

          {/* Branch selector */}
          <div className="relative" ref={ref}>
            <button
              onClick={() => setOpen((o) => !o)}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <MapPin size={14} className="text-blue-600 shrink-0" />
              <span className="font-medium text-slate-700 max-w-[140px] truncate">
                {activeBranch?.name ?? "No Branch"}
              </span>
              {activeBranch && (
                <span className="text-xs text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded">
                  {activeBranch.code}
                </span>
              )}
              <ChevronDown size={14} className={cn("text-slate-400 transition-transform", open && "rotate-180")} />
            </button>

            {open && (
              <div className="absolute right-0 mt-1.5 w-72 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50">
                <p className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Select Branch
                </p>
                {branches.length === 0 && (
                  <p className="px-3 py-3 text-sm text-slate-400 text-center">No branches configured</p>
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
                      "mt-0.5 w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold shrink-0",
                      activeBranch?.id === branch.id
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600"
                    )}>
                      {branch.code.slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-sm font-medium",
                          activeBranch?.id === branch.id ? "text-blue-700" : "text-slate-800"
                        )}>
                          {branch.name}
                        </span>
                        {branch.isHeadOffice && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">HQ</span>
                        )}
                        {branch.status === "inactive" && (
                          <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">Inactive</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{branch.address}</p>
                    </div>
                  </button>
                ))}
                <div className="border-t border-slate-100 mt-1 pt-1">
                  <a
                    href="/settings/branches"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                    onClick={() => setOpen(false)}
                  >
                    Manage branches →
                  </a>
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg w-48 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <Bell size={18} className="text-slate-600" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </div>
    </header>
  );
}
