import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { CONSENT_COOKIE, CONSENT_VERSION } from "@/lib/consent";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.redirect(new URL("/auth/login?error=invalid_token", req.url));

  const record = await prisma.verificationToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!record || record.expiresAt < new Date()) {
    return NextResponse.redirect(new URL("/auth/login?error=expired_token", req.url));
  }

  await prisma.user.update({
    where: { id: record.userId },
    data: { emailVerified: true },
  });
  await prisma.verificationToken.delete({ where: { token } });

  const sessionToken = await createSession(record.userId);
  const hasConsent = !!record.user.consentAcceptedAt;

  const dest = hasConsent ? "/auth/verified" : "/consent";
  const res = NextResponse.redirect(new URL(dest, req.url));

  res.cookies.set("session", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });

  if (hasConsent) {
    res.cookies.set(CONSENT_COOKIE, CONSENT_VERSION, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 365 * 24 * 60 * 60,
      path: "/",
    });
  }

  return res;
}
