import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const rows = await prisma.rolePermission.findMany();
  const result: Record<string, unknown> = {};
  for (const row of rows) {
    result[row.role] = row.permissions;
  }
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  // Accepts: { roleId: string, permissions: PermMatrix }
  // or: { roles: Record<string, PermMatrix> } for bulk save
  const body = await req.json();

  if (body.roles && typeof body.roles === "object") {
    // Bulk upsert all roles at once
    const ops = Object.entries(body.roles).map(([role, permissions]) =>
      prisma.rolePermission.upsert({
        where:  { role },
        update: { permissions: permissions as any },
        create: { role, permissions: permissions as any },
      })
    );
    await Promise.all(ops);
    return NextResponse.json({ ok: true });
  }

  // Single role upsert
  const { roleId, permissions } = body;
  if (!roleId || !permissions) {
    return NextResponse.json({ error: "roleId and permissions required." }, { status: 400 });
  }
  await prisma.rolePermission.upsert({
    where:  { role: roleId },
    update: { permissions },
    create: { role: roleId, permissions },
  });
  return NextResponse.json({ ok: true });
}
