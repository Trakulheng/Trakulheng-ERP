import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { CONSENT_VERSION } from "@/lib/consent";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  const email = req.nextUrl.searchParams.get("email");

  if (!secret || secret !== process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!email) {
    return NextResponse.json({ error: "Email required." }, { status: 400 });
  }

  const adminCount = await prisma.user.count({ where: { role: "admin" } });
  if (adminCount > 0) {
    return NextResponse.json({ error: "Admin already exists. Use the app to manage roles." }, { status: 409 });
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    return NextResponse.json({ error: `No account found for ${email}. Please register first.` }, { status: 404 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      role: "admin",
      emailVerified: true,
      consentAcceptedAt: user.consentAcceptedAt ?? new Date(),
      consentVersion: user.consentVersion ?? CONSENT_VERSION,
    },
  });

  return NextResponse.json({
    ok: true,
    message: `${email} is now verified and has admin role. You can now log in.`,
  });
}
