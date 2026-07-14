import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const current = await getSessionUser();
  if (!current) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  // The full user directory is sensitive — admins only. The account switcher
  // uses device-local accounts (src/lib/device-accounts.ts) instead.
  if (current.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const users = await prisma.user.findMany({
    where: { emailVerified: true, employeeRecordId: { not: null } },
    select: { id: true, name: true, email: true, role: true, pinSetAt: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(
    users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      hasPIN: !!u.pinSetAt,
      isCurrent: u.id === current.id,
    }))
  );
}
