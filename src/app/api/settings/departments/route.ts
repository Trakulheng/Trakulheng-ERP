import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const departments = await prisma.department.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(departments);
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { name, description, status } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name is required." }, { status: 400 });

  const existing = await prisma.department.findUnique({ where: { name: name.trim() } });
  if (existing) return NextResponse.json({ error: "A department with this name already exists." }, { status: 409 });

  const dept = await prisma.department.create({
    data: { name: name.trim(), description: description?.trim() || null, status: status ?? "active" },
  });
  return NextResponse.json(dept, { status: 201 });
}
