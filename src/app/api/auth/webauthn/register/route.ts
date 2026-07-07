import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, createSession } from "@/lib/auth";

// POST /api/auth/webauthn/register
// Stores the credential ID from a successful WebAuthn creation ceremony.
// The client has already verified biometric locally; we just record the credential.
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { credentialId, publicKey } = await req.json();
  if (!credentialId) return NextResponse.json({ error: "credentialId required." }, { status: 400 });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      webauthnCredId:   credentialId,
      webauthnPubKey:   publicKey ?? null,
      webauthnCounter:  0,
    },
  });

  return NextResponse.json({ ok: true });
}
