import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPin, getSessionUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

    const { pin } = await req.json();
    if (!pin || !/^\d{6}$/.test(pin)) {
      return NextResponse.json({ error: "PIN must be exactly 6 digits." }, { status: 400 });
    }

    const hashed = await hashPin(pin);
    await prisma.user.update({
      where: { id: user.id },
      data: { pin: hashed, pinSetAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[set-pin]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
