import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (!["admin", "manager"].includes(user.role)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { name, daysPerYear, isPaid, carryOver, maxCarryOver, requireDoc, color, thaiLawRef, isActive } = await req.json();
  if (name !== undefined && !name?.trim()) return NextResponse.json({ error: "Name is required." }, { status: 400 });

  if (name) {
    const conflict = await prisma.leaveType.findFirst({ where: { name: name.trim(), NOT: { id: params.id } } });
    if (conflict) return NextResponse.json({ error: "Leave type name already exists." }, { status: 409 });
  }

  const lt = await prisma.leaveType.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined      ? { name: name.trim() }                     : {}),
      ...(daysPerYear !== undefined ? { daysPerYear }                         : {}),
      ...(isPaid !== undefined    ? { isPaid }                                : {}),
      ...(carryOver !== undefined ? { carryOver }                             : {}),
      ...(maxCarryOver !== undefined ? { maxCarryOver }                       : {}),
      ...(requireDoc !== undefined ? { requireDoc }                           : {}),
      ...(color !== undefined     ? { color }                                 : {}),
      ...(thaiLawRef !== undefined ? { thaiLawRef: thaiLawRef?.trim() || null } : {}),
      ...(isActive !== undefined  ? { isActive }                              : {}),
    },
  });
  return NextResponse.json(lt);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (!["admin", "manager"].includes(user.role)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  await prisma.leaveType.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
