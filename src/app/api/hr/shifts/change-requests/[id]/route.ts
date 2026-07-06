import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (!["admin", "manager"].includes(user.role))
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { status, managerNote } = await req.json();
  if (!["approved", "rejected"].includes(status))
    return NextResponse.json({ error: "status must be approved or rejected." }, { status: 400 });

  const record = await prisma.shiftChangeRequest.update({
    where: { id: params.id },
    data: {
      status,
      resolvedBy:  user.employeeRecordId ?? user.id,
      resolvedAt:  new Date(),
      managerNote: managerNote || null,
    },
  });

  return NextResponse.json({
    id:               record.id,
    employeeId:       record.employeeId,
    date:             record.date,
    currentShiftId:   record.currentShiftId,
    requestedShiftId: record.requestedShiftId ?? null,
    reason:           record.reason,
    status:           record.status,
    resolvedBy:       record.resolvedBy ?? undefined,
    resolvedAt:       record.resolvedAt?.toISOString() ?? undefined,
    managerNote:      record.managerNote ?? undefined,
    createdAt:        record.createdAt.toISOString(),
  });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (!["admin", "manager"].includes(user.role))
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  await prisma.shiftChangeRequest.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
