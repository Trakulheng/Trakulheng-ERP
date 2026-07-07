import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (!["admin", "manager"].includes(user.role)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.label !== undefined) data.label = body.label.trim();
  if (body.isActive !== undefined) data.isActive = body.isActive;
  if (body.order !== undefined) data.order = body.order;

  if (data.label === "") return NextResponse.json({ error: "Label cannot be empty." }, { status: 400 });

  const row = await prisma.lookupValue.update({ where: { id: params.id }, data });
  return NextResponse.json(row);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (!["admin", "manager"].includes(user.role)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  await prisma.lookupValue.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
