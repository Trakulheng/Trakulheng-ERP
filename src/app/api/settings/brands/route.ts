import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const brands = await prisma.brand.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(brands);
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const data = await req.json();
  if (!data.name || !data.code) return NextResponse.json({ error: "Name and code are required." }, { status: 400 });

  const existing = await prisma.brand.findUnique({ where: { code: data.code.toUpperCase() } });
  if (existing) return NextResponse.json({ error: "Brand code already exists." }, { status: 409 });

  const brand = await prisma.brand.create({
    data: {
      name:        data.name,
      code:        data.code.toUpperCase(),
      description: data.description || null,
      status:      data.status || "active",
    },
  });

  return NextResponse.json(brand, { status: 201 });
}
