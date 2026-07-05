import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const data = await req.json();
  const update: Record<string, unknown> = {};
  if (data.name !== undefined)        update.name        = data.name;
  if (data.code !== undefined)        update.code        = data.code.toUpperCase();
  if (data.description !== undefined) update.description = data.description || null;
  if (data.status !== undefined)      update.status      = data.status;

  const brand = await prisma.brand.update({ where: { id: params.id }, data: update });
  return NextResponse.json(brand);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  await prisma.brand.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
