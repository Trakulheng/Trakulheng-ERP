import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

const SYSTEM_ROLES = new Set(["admin", "manager", "staff", "viewer"]);

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const rows = await prisma.rolePermission.findMany();
  const permissions: Record<string, unknown> = {};
  const menuOrders: Record<string, unknown> = {};
  const roleDefs: Record<string, unknown> = {};
  for (const row of rows) {
    permissions[row.role] = row.permissions;
    if (row.menuOrder) menuOrders[row.role] = row.menuOrder;
    if (row.roleDef) {
      roleDefs[row.role] = row.roleDef;
    } else if (!SYSTEM_ROLES.has(row.role)) {
      // Custom role saved without a definition (e.g. from an older client) —
      // synthesize one from the id so the role never disappears from the UI.
      const label = row.role
        .replace(/^custom_/, "")
        .replace(/_\d+$/, "")
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      roleDefs[row.role] = { label, color: "text-violet-700", badge: "bg-violet-100 text-violet-700" };
    }
  }
  return NextResponse.json({ permissions, menuOrders, roleDefs });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const body = await req.json();
  const { roles, menuOrders, roleDefs } = body as {
    roles?:      Record<string, unknown>;
    menuOrders?: Record<string, string[]>;
    roleDefs?:   Record<string, { label: string; color: string; badge: string }>;
  };

  if (!roles || typeof roles !== "object") {
    return NextResponse.json({ error: "roles required." }, { status: 400 });
  }

  // Delete custom roles that were removed (not in the new save)
  const incomingRoles = new Set(Object.keys(roles));
  await prisma.rolePermission.deleteMany({
    where: {
      AND: [
        { role: { notIn: [...incomingRoles] } },
        { role: { notIn: [...SYSTEM_ROLES] } },
      ],
    },
  });

  const ops = Object.entries(roles).map(([role, permissions]) =>
    prisma.rolePermission.upsert({
      where:  { role },
      update: {
        permissions: permissions as any,
        ...(menuOrders?.[role] ? { menuOrder: menuOrders[role] as any } : {}),
        ...(roleDefs?.[role]   ? { roleDef:   roleDefs[role]   as any } : {}),
      },
      create: {
        role,
        permissions: permissions as any,
        menuOrder: menuOrders?.[role] ? (menuOrders[role] as any) : null,
        roleDef:   roleDefs?.[role]   ? (roleDefs[role]   as any) : null,
      },
    })
  );
  await Promise.all(ops);
  return NextResponse.json({ ok: true });
}
