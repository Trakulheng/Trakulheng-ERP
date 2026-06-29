"use client";

import { BranchProvider } from "@/context/BranchContext";
import { Sidebar } from "./Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <BranchProvider>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 ml-64 flex flex-col min-h-screen">
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </BranchProvider>
  );
}
