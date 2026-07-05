"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { branches, Branch } from "@/lib/mock-data";

export type { Branch };

interface BranchContextValue {
  activeBranch: Branch | null;
  setActiveBranch: (branch: Branch) => void;
  branches: Branch[];
}

const BranchContext = createContext<BranchContextValue | null>(null);

export function BranchProvider({ children }: { children: ReactNode }) {
  const [activeBranch, setActiveBranch] = useState<Branch | null>(branches[0] ?? null);
  return (
    <BranchContext.Provider value={{ activeBranch, setActiveBranch, branches }}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error("useBranch must be used inside BranchProvider");
  return ctx;
}
