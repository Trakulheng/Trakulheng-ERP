import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";

// POST /api/auth/webauthn/authenticate
// Body: { credentialId } — matches a registered user, creates a session.
export async function POST(req: NextRequest) {
  const { credentialId } = await req.json();
  if (!credentialId) return NextResponse.json({ error: "credentialId required." }, { status: 400 });

  const user = await prisma.user.findFirst({ where: { webauthnCredId: credentialId } });
  if (!user) return NextResponse.json({ error: "Biometric credential not registered." }, { status: 401 });

  const token = await createSession(user.id);

  const res = NextResponse.json({ ok: true });
  res.cookies.set("session", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
  return res;
}
