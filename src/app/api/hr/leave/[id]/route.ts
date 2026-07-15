import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getManagedEmployeeIds, getOwnEmployeeId } from "@/lib/leave-scope";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json();
  const { status, reviewNote } = body;

  if (status && !["approved", "rejected", "pending"].includes(status))
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });

  if (status && status !== "pending") {
    if (!["admin", "manager"].includes(user.role))
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });

    // Branch managers may only review requests from their branches' employees
    const managed = await getManagedEmployeeIds(user);
    if (managed !== null) {
      const existing = await prisma.leaveRequest.findUnique({
        where: { id: params.id },
        select: { employeeId: true },
      });
      if (!existing) return NextResponse.json({ error: "Request not found." }, { status: 404 });
      if (!managed.includes(existing.employeeId))
        return NextResponse.json(
          { error: "You can only review leave requests from employees in your branches." },
          { status: 403 }
        );
    }
  }

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

  const existing = await prisma.leaveRequest.findUnique({
    where: { id: params.id },
    select: { employeeId: true, status: true },
  });
  if (!existing) return NextResponse.json({ error: "Request not found." }, { status: 404 });

  if (user.role !== "admin") {
    const managed = await getManagedEmployeeIds(user);
    const own = await getOwnEmployeeId(user);
    const isOwnPending = own === existing.employeeId && existing.status === "pending";
    const isManaged = managed !== null && managed.includes(existing.employeeId);
    if (!isOwnPending && !isManaged)
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  await prisma.leaveRequest.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
