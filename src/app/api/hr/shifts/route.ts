import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get("branchId");

  const shifts = await prisma.shiftTemplate.findMany({
    where: branchId ? { branchId } : {},
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(shifts);
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (!["admin", "manager"].includes(user.role))
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { name, code, startTime, endTime, breakMinutes, color, branchId } = await req.json();
  if (!name?.trim() || !code?.trim())
    return NextResponse.json({ error: "Name and code are required." }, { status: 400 });

  const existing = await prisma.shiftTemplate.findFirst({
    where: { code: code.trim().toUpperCase(), branchId: branchId || null },
  });
  if (existing) return NextResponse.json({ error: "A shift with this code already exists." }, { status: 409 });

  const shift = await prisma.shiftTemplate.create({
    data: {
      name: name.trim(),
      code: code.trim().toUpperCase().slice(0, 4),
      startTime,
      endTime,
      breakMinutes: breakMinutes ?? 60,
      color: color ?? "blue",
      branchId: branchId || null,
    },
  });
  return NextResponse.json(shift, { status: 201 });
}
