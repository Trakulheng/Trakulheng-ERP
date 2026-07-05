import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPin, createSession } from "@/lib/auth";
import { CONSENT_COOKIE, CONSENT_VERSION } from "@/lib/consent";

export async function POST(req: NextRequest) {
  try {
    const { email, pin } = await req.json();
    if (!email || !pin) return NextResponse.json({ error: "Email and PIN are required." }, { status: 400 });
    if (!/^\d{6}$/.test(pin)) return NextResponse.json({ error: "Invalid PIN format." }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !user.pin) {
      return NextResponse.json({ error: "Invalid email or PIN." }, { status: 401 });
    }

    if (!user.emailVerified) {
      return NextResponse.json({ error: "Please verify your email first.", code: "unverified" }, { status: 403 });
    }

    const valid = await verifyPin(pin, user.pin);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or PIN." }, { status: 401 });
    }

    const token = await createSession(user.id);
    const hasConsent = !!user.consentAcceptedAt;

    const res = NextResponse.json({
      ok: true,
      needsConsent: !hasConsent,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });

    res.cookies.set("session", token, {
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
  } catch (err) {
    console.error("[pin-login]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
