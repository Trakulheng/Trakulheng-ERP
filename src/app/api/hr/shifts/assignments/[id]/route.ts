import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { shiftId, note, confirmStatus } = await req.json();

  const assignment = await prisma.shiftAssignment.update({
    where: { id: params.id },
    data: {
      ...(shiftId !== undefined ? { shiftId: shiftId ?? null } : {}),
      ...(note !== undefined ? { note: note ?? null } : {}),
      ...(confirmStatus !== undefined ? { confirmStatus } : {}),
    },
  });

  return NextResponse.json({
    id:            assignment.id,
    branchId:      assignment.branchId,
    employeeId:    assignment.employeeId,
    shiftId:       assignment.shiftId ?? null,
    date:          assignment.date,
    note:          assignment.note ?? undefined,
    confirmStatus: assignment.confirmStatus,
    createdAt:     assignment.createdAt.toISOString(),
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  await prisma.shiftAssignment.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
