import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";
import { CONSENT_COOKIE, CONSENT_VERSION } from "@/lib/consent";

function setSessionCookies(res: NextResponse, sessionToken: string, hasConsent: boolean) {
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
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    if (!user.emailVerified) {
      return NextResponse.json({ error: "Please verify your email before logging in.", code: "unverified" }, { status: 403 });
    }

    const token = await createSession(user.id);
    const hasConsent = !!user.consentAcceptedAt;

    const res = NextResponse.json({
      ok: true,
      needsConsent: !hasConsent,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
    setSessionCookies(res, token, hasConsent);
    return res;
  } catch (err) {
    console.error("[login]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
