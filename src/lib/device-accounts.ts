"use client";

/**
 * Accounts that have successfully signed in on this device (browser).
 * The account switcher only offers these — never the full user directory.
 */
export interface DeviceAccount {
  email: string;
  name: string | null;
  role: string;
  hasPIN: boolean;
}

const KEY = "ddk-device-accounts";

export function getDeviceAccounts(): DeviceAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter((a) => a && typeof a.email === "string") : [];
  } catch {
    return [];
  }
}

export function rememberDeviceAccount(account: DeviceAccount) {
  if (typeof window === "undefined") return;
  const accounts = getDeviceAccounts().filter(
    (a) => a.email.toLowerCase() !== account.email.toLowerCase()
  );
  accounts.push(account);
  try {
    localStorage.setItem(KEY, JSON.stringify(accounts));
  } catch {
    // localStorage full or unavailable — switcher just won't remember this account
  }
}

export function forgetDeviceAccount(email: string) {
  if (typeof window === "undefined") return;
  const accounts = getDeviceAccounts().filter(
    (a) => a.email.toLowerCase() !== email.toLowerCase()
  );
  try {
    localStorage.setItem(KEY, JSON.stringify(accounts));
  } catch {}
}
