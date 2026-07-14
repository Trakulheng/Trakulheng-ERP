import { NextRequest, NextResponse } from "next/server";
import { CONSENT_COOKIE, CONSENT_VERSION } from "@/lib/consent";

const PUBLIC_PREFIXES = [
  "/auth/",
  "/api/auth/",
  "/api/admin/",
  "/api/public/",
  "/consent",
  "/privacy",
  "/terms",
  "/_next/",
  "/favicon",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return;

  const session = req.cookies.get("session")?.value;
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  const consented = req.cookies.get(CONSENT_COOKIE)?.value;
  if (consented !== CONSENT_VERSION) {
    const url = req.nextUrl.clone();
    url.pathname = "/consent";
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
