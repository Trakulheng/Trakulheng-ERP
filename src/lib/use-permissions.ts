"use client";

import { useState, useEffect } from "react";

type Action = "create" | "edit" | "view" | "sidebar";
type ModulePerms = { create: boolean; edit: boolean; view: boolean; sidebar?: boolean };
type PermMatrix = Record<string, ModulePerms>;

// Module-level promise cache — shared across all hook instances on the same page
let _promise: Promise<{ role: string; perms: PermMatrix }> | null = null;
let _cache: { role: string; perms: PermMatrix } | null = null;

function loadPermissions(): Promise<{ role: string; perms: PermMatrix }> {
  if (_cache) return Promise.resolve(_cache);
  if (_promise) return _promise;

  _promise = Promise.all([
    fetch("/api/auth/me").then((r) => (r.ok ? r.json() : null)),
    fetch("/api/settings/role-permissions").then((r) => (r.ok ? r.json() : null)),
  ])
    .then(([me, data]) => {
      const role: string = me?.role ?? "staff";
      const perms: PermMatrix = data?.permissions?.[role] ?? {};
      _cache = { role, perms };
      return _cache;
    })
    .catch(() => {
      _promise = null;
      return { role: "staff", perms: {} };
    });

  return _promise;
}

export function invalidatePermissionsCache() {
  _cache = null;
  _promise = null;
}

export function usePermissions() {
  const [state, setState] = useState<{ role: string; perms: PermMatrix; loaded: boolean }>({
    role: "",
    perms: {},
    loaded: false,
  });

  useEffect(() => {
    let cancelled = false;

    loadPermissions().then((result) => {
      if (!cancelled) setState({ ...result, loaded: true });
    });

    const onUpdate = () => {
      invalidatePermissionsCache();
      loadPermissions().then((result) => {
        if (!cancelled) setState({ ...result, loaded: true });
      });
    };
    window.addEventListener("permissions-updated", onUpdate);
    return () => {
      cancelled = true;
      window.removeEventListener("permissions-updated", onUpdate);
    };
  }, []);

  function can(moduleId: string, action: Action): boolean {
    if (state.role === "admin") return true;
    // While loading, be permissive so buttons don't flicker away for admins
    if (!state.loaded) return true;
    const m = state.perms[moduleId];
    if (!m) return true; // module not in matrix → unrestricted
    return !!(m[action]);
  }

  return { can, role: state.role, loaded: state.loaded };
}
