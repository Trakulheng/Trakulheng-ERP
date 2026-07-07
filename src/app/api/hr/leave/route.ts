import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get("branchId");

  const rows = await prisma.leaveRequest.findMany({
    include: { employee: { select: { id: true, employeeId: true, name: true } } },
    where: branchId
      ? { employee: { branchId } }
      : {},
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    rows.map((r) => ({
      id:         r.id,
      employeeId: r.employeeId,
      empCode:    r.employee.employeeId,
      empName:    r.employee.name,
      type:       r.type,
      fromDate:   r.fromDate.toISOString().slice(0, 10),
      toDate:     r.toDate.toISOString().slice(0, 10),
      days:       r.days,
      status:     r.status,
      createdAt:  r.createdAt.toISOString(),
    }))
  );
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { employeeId, type, fromDate, toDate, days } = await req.json();
  if (!employeeId || !type || !fromDate || !toDate) {
    return NextResponse.json({ error: "employeeId, type, fromDate, and toDate are required." }, { status: 400 });
  }

  const request = await prisma.leaveRequest.create({
    data: {
      employeeId,
      type,
      fromDate: new Date(fromDate),
      toDate:   new Date(toDate),
      days:     days ?? 1,
      status:   "pending",
    },
    include: { employee: { select: { employeeId: true, name: true } } },
  });

  return NextResponse.json({
    id:         request.id,
    employeeId: request.employeeId,
    empCode:    request.employee.employeeId,
    empName:    request.employee.name,
    type:       request.type,
    fromDate:   request.fromDate.toISOString().slice(0, 10),
    toDate:     request.toDate.toISOString().slice(0, 10),
    days:       request.days,
    status:     request.status,
    createdAt:  request.createdAt.toISOString(),
  }, { status: 201 });
}
