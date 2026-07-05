import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { CONSENT_COOKIE, CONSENT_VERSION } from "@/lib/consent";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

    await prisma.user.update({
      where: { id: user.id },
      data: { consentAcceptedAt: new Date(), consentVersion: CONSENT_VERSION },
    });

    const res = NextResponse.json({ ok: true });
    res.cookies.set(CONSENT_COOKIE, CONSENT_VERSION, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 365 * 24 * 60 * 60,
      path: "/",
    });
    return res;
  } catch (err) {
    console.error("[accept-consent]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
