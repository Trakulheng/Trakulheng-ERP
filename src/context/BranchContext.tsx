"use client";

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import type { Branch } from "@/lib/mock-data";

export type { Branch };

interface BranchContextValue {
  activeBranch: Branch | null;
  setActiveBranch: (branch: Branch) => void;
  branches: Branch[];
  refetch: () => Promise<void>;
  loading: boolean;
}

const BranchContext = createContext<BranchContextValue | null>(null);

export function BranchProvider({ children }: { children: ReactNode }) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [activeBranch, setActiveBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBranches = useCallback(async () => {
    try {
      const res = await fetch("/api/branches");
      if (res.ok) {
        const data: Branch[] = await res.json();
        setBranches(data);
        setActiveBranch((prev) =>
          prev
            ? (data.find((b) => b.id === prev.id) ?? data[0] ?? null)
            : (data[0] ?? null)
        );
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  return (
    <BranchContext.Provider
      value={{ activeBranch, setActiveBranch, branches, refetch: fetchBranches, loading }}
    >
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error("useBranch must be used inside BranchProvider");
  return ctx;
}
