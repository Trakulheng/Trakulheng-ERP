import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const cats = await prisma.supplierCategory.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] });
  return NextResponse.json(cats);
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (user.role !== "admin" && user.role !== "manager") return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { name, description } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name is required." }, { status: 400 });

  const existing = await prisma.supplierCategory.findUnique({ where: { name: name.trim() } });
  if (existing) return NextResponse.json({ error: "Category already exists." }, { status: 409 });

  const count = await prisma.supplierCategory.count();
  const cat = await prisma.supplierCategory.create({
    data: { name: name.trim(), description: description?.trim() || null, order: count },
  });
  return NextResponse.json(cat, { status: 201 });
}
