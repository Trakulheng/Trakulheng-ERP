import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json();
  const { status, reviewNote } = body;

  if (status && !["approved", "rejected", "pending"].includes(status))
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });

  if (status && status !== "pending" && !["admin", "manager"].includes(user.role))
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const updated = await prisma.leaveRequest.update({
    where: { id: params.id },
    data: {
      ...(status ? { status } : {}),
      ...(reviewNote !== undefined ? { reviewNote: reviewNote?.trim() || null } : {}),
      ...(status && status !== "pending" ? { reviewedBy: user.email, reviewedAt: new Date() } : {}),
    },
    include: { employee: { select: { employeeId: true, name: true } } },
  });

  return NextResponse.json({
    id:          updated.id,
    employeeId:  updated.employeeId,
    empCode:     updated.employee.employeeId,
    empName:     updated.employee.name,
    type:        updated.type,
    fromDate:    updated.fromDate.toISOString().slice(0, 10),
    toDate:      updated.toDate.toISOString().slice(0, 10),
    days:        updated.days,
    status:      updated.status,
    note:        updated.note ?? null,
    reviewNote:  updated.reviewNote ?? null,
  });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  await prisma.leaveRequest.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
