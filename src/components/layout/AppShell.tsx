"use client";

import { BranchProvider } from "@/context/BranchContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { SidebarProvider } from "@/context/SidebarContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { Sidebar } from "./Sidebar";
import { PullToRefresh } from "@/components/ui/PullToRefresh";

export function AppShell({ children }: { children: React.ReactNode }) {
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
