"use client";

import { usePathname } from "next/navigation";
import { BranchProvider } from "@/context/BranchContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { SidebarProvider } from "@/context/SidebarContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { Sidebar } from "./Sidebar";
import { PullToRefresh } from "@/components/ui/PullToRefresh";

const PUBLIC_PREFIXES = ["/auth", "/consent", "/privacy", "/terms"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublic = PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

  // Public pages (login, register, consent, …) render standalone —
  // mounting the Sidebar here triggers authenticated fetches that 401
  // and redirect back to /auth/login, causing an infinite reload loop.
  if (isPublic) {
    return (
      <ThemeProvider>
        <LanguageProvider>{children}</LanguageProvider>
      </ThemeProvider>
    );
  }

  return (
    <SidebarProvider>
      <ThemeProvider>
        <LanguageProvider>
        <BranchProvider>
          <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <div className="flex-1 lg:ml-64 flex flex-col min-h-screen min-w-0">
              <PullToRefresh>
                <main className="flex-1 min-w-0">{children}</main>
              </PullToRefresh>
            </div>
          </div>
        </BranchProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SidebarProvider>
  );
}
