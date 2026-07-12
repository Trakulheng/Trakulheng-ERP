"use client";

/**
 * Wraps fetch for authenticated API calls.
 * Redirects to /auth/login on 401 so stale session cookies are handled gracefully.
 */
export async function apiFetch(url: string, options?: RequestInit): Promise<Response | null> {
  try {
    const res = await fetch(url, options);
    if (res.status === 401) {
      window.location.href = "/auth/login";
      return null;
    }
    return res;
  } catch {
    return null;
  }
}
