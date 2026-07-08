import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { createHash } from "crypto";

function hashPin(pin: string) {
  return createHash("sha256").update(pin + "ddk-erp-salt").digest("hex");
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { pin: true, pinSetAt: true, webauthnCredId: true },
  });

  return NextResponse.json({
    pinSet:        !!record?.pin,
    pinSetAt:      record?.pinSetAt ?? null,
    biometricSet:  !!record?.webauthnCredId,
  });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json();

  if (body.action === "setPin") {
    const { pin } = body;
    if (typeof pin !== "string" || !/^\d{4,6}$/.test(pin)) {
      return NextResponse.json({ error: "PIN must be 4–6 digits." }, { status: 400 });
    }
    await prisma.user.update({
      where: { id: user.id },
      data:  { pin: hashPin(pin), pinSetAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "clearPin") {
    await prisma.user.update({
      where: { id: user.id },
      data:  { pin: null, pinSetAt: null },
    });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "registerBiometric") {
    const { credId, pubKey } = body;
    if (!credId || !pubKey) return NextResponse.json({ error: "credId and pubKey required." }, { status: 400 });
    await prisma.user.update({
      where: { id: user.id },
      data:  { webauthnCredId: credId, webauthnPubKey: pubKey, webauthnCounter: 0 },
    });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "clearBiometric") {
    await prisma.user.update({
      where: { id: user.id },
      data:  { webauthnCredId: null, webauthnPubKey: null, webauthnCounter: 0 },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
