import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const rows = await prisma.rolePermission.findMany();
  const permissions: Record<string, unknown> = {};
  const menuOrders: Record<string, unknown> = {};
  for (const row of rows) {
    permissions[row.role] = row.permissions;
    if (row.menuOrder) menuOrders[row.role] = row.menuOrder;
  }
  return NextResponse.json({ permissions, menuOrders });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const body = await req.json();
  const { roles, menuOrders } = body as {
    roles?: Record<string, unknown>;
    menuOrders?: Record<string, string[]>;
  };

  if (!roles || typeof roles !== "object") {
    return NextResponse.json({ error: "roles required." }, { status: 400 });
  }

  const ops = Object.entries(roles).map(([role, permissions]) =>
    prisma.rolePermission.upsert({
      where:  { role },
      update: {
        permissions: permissions as any,
        ...(menuOrders?.[role] ? { menuOrder: menuOrders[role] as any } : {}),
      },
      create: {
        role,
        permissions: permissions as any,
        menuOrder: menuOrders?.[role] ? (menuOrders[role] as any) : null,
      },
    })
  );
  await Promise.all(ops);
  return NextResponse.json({ ok: true });
}
