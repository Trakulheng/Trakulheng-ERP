import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { name, description, status } = await req.json();
  if (name !== undefined) {
    const conflict = await prisma.department.findFirst({
      where: { name: name.trim(), NOT: { id: params.id } },
    });
    if (conflict) return NextResponse.json({ error: "Name already in use." }, { status: 409 });
  }

  const dept = await prisma.department.update({
    where: { id: params.id },
    data: {
      ...(name        !== undefined ? { name: name.trim() }                        : {}),
      ...(description !== undefined ? { description: description?.trim() || null } : {}),
      ...(status      !== undefined ? { status }                                   : {}),
    },
  });
  return NextResponse.json(dept);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  await prisma.department.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
