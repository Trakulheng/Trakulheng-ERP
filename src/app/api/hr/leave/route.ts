import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const branchId   = searchParams.get("branchId");
  const empPrismaId = searchParams.get("employeeId"); // CUID filter for "my leave"

  // Branch filter: employees are assigned to branches via the branch's
  // assignedEmployees list (employee.branchId is often unset), so resolve
  // the branch's member employee cuids first.
  let branchEmployeeIds: string[] | null = null;
  if (branchId && !empPrismaId) {
    const branch = await prisma.branch.findUnique({ where: { id: branchId } });
    const assignedCodes = ((branch?.assignedEmployees as { id: string }[] | null) ?? []).map((a) => a.id);
    const members = await prisma.employee.findMany({
      where: { OR: [{ branchId }, { employeeId: { in: assignedCodes } }] },
      select: { id: true },
    });
    branchEmployeeIds = members.map((m) => m.id);
  }

  const rows = await prisma.leaveRequest.findMany({
    include: { employee: { select: { id: true, employeeId: true, name: true } } },
    where: {
      ...(empPrismaId ? { employeeId: empPrismaId } : {}),
      ...(branchEmployeeIds ? { employeeId: { in: branchEmployeeIds } } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    rows.map((r) => ({
      id:          r.id,
      employeeId:  r.employeeId,
      empCode:     r.employee.employeeId,
      empName:     r.employee.name,
      type:        r.type,
      fromDate:    r.fromDate.toISOString().slice(0, 10),
      toDate:      r.toDate.toISOString().slice(0, 10),
      days:        r.days,
      status:      r.status,
      note:        r.note ?? null,
      reviewNote:  r.reviewNote ?? null,
      createdAt:   r.createdAt.toISOString(),
    }))
  );
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { employeeId, type, fromDate, toDate, days, note } = await req.json();
  if (!type || !fromDate || !toDate) {
    return NextResponse.json({ error: "type, fromDate, and toDate are required." }, { status: 400 });
  }

  // Resolve employee: body → session link → email match → name match (unique only)
  let rawId: string | null = employeeId || user.employeeRecordId || null;
  if (!rawId && user.email) {
    const emp = await prisma.employee.findFirst({
      where: { OR: [{ workEmail: user.email }, { personalEmail: user.email }] },
      select: { id: true },
    });
    if (emp) rawId = emp.id;
  }
  if (!rawId && user.name) {
    const matches = await prisma.employee.findMany({
      where: { name: user.name },
      select: { id: true },
      take: 2,
    });
    if (matches.length === 1) rawId = matches[0].id;
  }
  if (!rawId) {
    return NextResponse.json({ error: "No employee record found for your account. Contact HR to link your profile." }, { status: 400 });
  }

  // Resolve to prisma CUID: accept cuid directly, EMP-xxx code, or any string that needs lookup
  let empPrismaId = rawId;
  if (rawId.startsWith("EMP-") || !rawId.match(/^c[a-z0-9]{24,}$/i)) {
    const found = await prisma.employee.findFirst({
      where: { OR: [{ id: rawId }, { employeeId: rawId }] },
      select: { id: true },
    });
    if (!found) return NextResponse.json({ error: "Employee not found." }, { status: 404 });
    empPrismaId = found.id;
  }

  const request = await prisma.leaveRequest.create({
    data: {
      employeeId: empPrismaId,
      type,
      fromDate: new Date(fromDate),
      toDate:   new Date(toDate),
      days:     days ?? 1,
      status:   "pending",
      note:     note?.trim() || null,
    },
    include: { employee: { select: { employeeId: true, name: true } } },
  });

  return NextResponse.json({
    id:          request.id,
    employeeId:  request.employeeId,
    empCode:     request.employee.employeeId,
    empName:     request.employee.name,
    type:        request.type,
    fromDate:    request.fromDate.toISOString().slice(0, 10),
    toDate:      request.toDate.toISOString().slice(0, 10),
    days:        request.days,
    status:      request.status,
    note:        request.note ?? null,
    reviewNote:  null,
    createdAt:   request.createdAt.toISOString(),
  }, { status: 201 });
}
