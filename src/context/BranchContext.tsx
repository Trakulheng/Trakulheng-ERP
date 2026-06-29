"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { branches } from "@/lib/mock-data";

export type Branch = (typeof branches)[number];

interface BranchContextValue {
  activeBranch: Branch;
  setActiveBranch: (branch: Branch) => void;
  branches: Branch[];
}

const BranchContext = createContext<BranchContextValue | null>(null);

export function BranchProvider({ children }: { children: ReactNode }) {
  const [activeBranch, setActiveBranch] = useState<Branch>(branches[0]);
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
