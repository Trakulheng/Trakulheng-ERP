import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get("branchId");

  const requests = await prisma.shiftChangeRequest.findMany({
    where: branchId ? { branchId } : {},
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    requests.map((r) => ({
      id:               r.id,
      employeeId:       r.employeeId,
      date:             r.date,
      currentShiftId:   r.currentShiftId,
      requestedShiftId: r.requestedShiftId ?? null,
      reason:           r.reason,
      status:           r.status,
      resolvedBy:       r.resolvedBy ?? undefined,
      resolvedAt:       r.resolvedAt?.toISOString() ?? undefined,
      managerNote:      r.managerNote ?? undefined,
      createdAt:        r.createdAt.toISOString(),
      branchId:         r.branchId ?? undefined,
    }))
  );
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { employeeId, date, currentShiftId, requestedShiftId, reason, branchId } = await req.json();
  if (!employeeId || !date || !currentShiftId || !reason?.trim())
    return NextResponse.json({ error: "employeeId, date, currentShiftId, and reason are required." }, { status: 400 });

  const record = await prisma.shiftChangeRequest.create({
    data: {
      employeeId,
      date,
      currentShiftId,
      requestedShiftId: requestedShiftId ?? null,
      reason:           reason.trim(),
      branchId:         branchId ?? null,
      status:           "pending",
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
    createdAt:        record.createdAt.toISOString(),
    branchId:         record.branchId ?? undefined,
  }, { status: 201 });
}
