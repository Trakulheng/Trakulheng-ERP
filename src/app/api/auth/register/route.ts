import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, createVerificationToken } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";
import { CONSENT_VERSION } from "@/lib/consent";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, consentAccepted } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }
    if (!consentAccepted) {
      return NextResponse.json({ error: "You must accept the Privacy Policy and Terms of Service." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashed,
        consentAcceptedAt: new Date(),
        consentVersion: CONSENT_VERSION,
      },
    });

    const token = await createVerificationToken(user.id);
    await sendVerificationEmail(user.email, user.name ?? "", token);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
