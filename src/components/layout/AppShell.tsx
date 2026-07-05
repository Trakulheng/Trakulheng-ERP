"use client";

import { BranchProvider } from "@/context/BranchContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { SidebarProvider } from "@/context/SidebarContext";
import { Sidebar } from "./Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <ThemeProvider>
        <BranchProvider>
          <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <div className="flex-1 lg:ml-64 flex flex-col min-h-screen min-w-0">
              <main className="flex-1 min-w-0">{children}</main>
            </div>
          </div>
        </BranchProvider>
      </ThemeProvider>
    </SidebarProvider>
  );
}
