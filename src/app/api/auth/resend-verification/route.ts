import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createVerificationToken } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email is required." }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return NextResponse.json({ ok: true }); // don't reveal if account exists

    if (user.emailVerified) return NextResponse.json({ ok: true });

    await prisma.verificationToken.deleteMany({ where: { userId: user.id, type: "email" } });
    const token = await createVerificationToken(user.id);
    await sendVerificationEmail(user.email, user.name ?? "", token);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[resend-verification]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
