import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  let menuOrder: string[] | null = null;
  try {
    const rolePerm = await prisma.rolePermission.findUnique({ where: { role: user.role } });
    if (Array.isArray(rolePerm?.menuOrder)) menuOrder = rolePerm.menuOrder as string[];
  } catch {}

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    hasPIN: !!user.pinSetAt,
    menuOrder,
  });
}
