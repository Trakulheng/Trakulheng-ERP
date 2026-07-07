import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (user.role !== "admin" && user.role !== "manager") return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { name, description } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name is required." }, { status: 400 });

  const conflict = await prisma.productCategory.findFirst({ where: { name: name.trim(), NOT: { id: params.id } } });
  if (conflict) return NextResponse.json({ error: "Category name already exists." }, { status: 409 });

  const cat = await prisma.productCategory.update({
    where: { id: params.id },
    data: { name: name.trim(), description: description?.trim() || null },
  });
  return NextResponse.json(cat);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (user.role !== "admin" && user.role !== "manager") return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  await prisma.productCategory.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
