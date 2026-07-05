import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, hashPin } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { token, password, pin } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const vt = await prisma.verificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!vt || vt.type !== "invite") {
      return NextResponse.json({ error: "This invite link is invalid or has already been used." }, { status: 400 });
    }

    if (vt.expiresAt < new Date()) {
      return NextResponse.json({ error: "This invite link has expired. Please ask your administrator to resend the invitation." }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      password:      await hashPassword(password),
      emailVerified: true,
    };

    if (pin && /^\d{6}$/.test(pin)) {
      updateData.pin      = await hashPin(pin);
      updateData.pinSetAt = new Date();
    }

    await prisma.user.update({
      where: { id: vt.userId },
      data:  updateData,
    });

    await prisma.verificationToken.delete({ where: { id: vt.id } });

    return NextResponse.json({ ok: true, hasPinSet: !!updateData.pin });
  } catch (err) {
    console.error("[accept-invite]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
