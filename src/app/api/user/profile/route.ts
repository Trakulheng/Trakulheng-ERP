import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { createHash } from "crypto";

function hashPassword(pw: string) {
  return createHash("sha256").update(pw + "ddk-erp-salt").digest("hex");
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, name: true, email: true, role: true, avatarBase64: true, employeeRecordId: true },
  });

  return NextResponse.json(record);
}

export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json();

  // Change password
  if (body.action === "changePassword") {
    const { currentPassword, newPassword } = body;
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "currentPassword and newPassword required." }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
    }
    const record = await prisma.user.findUnique({ where: { id: user.id }, select: { password: true } });
    if (!record?.password || record.password !== hashPassword(currentPassword)) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashPassword(newPassword) },
    });
    return NextResponse.json({ ok: true });
  }

  // Update profile (name + avatar)
  const data: { name?: string; avatarBase64?: string | null } = {};
  if (typeof body.name === "string") {
    const trimmed = body.name.trim();
    if (!trimmed) return NextResponse.json({ error: "Name cannot be empty." }, { status: 400 });
    data.name = trimmed;
  }
  if ("avatarBase64" in body) {
    data.avatarBase64 = body.avatarBase64 ?? null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data,
    select: { id: true, name: true, email: true, role: true, avatarBase64: true },
  });

  return NextResponse.json(updated);
}
