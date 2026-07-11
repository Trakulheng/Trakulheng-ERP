import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get("branchId");
  const employeeId = searchParams.get("employeeId");

  const requests = await prisma.shiftChangeRequest.findMany({
    where: {
      ...(branchId ? { branchId } : {}),
      ...(employeeId ? { employeeId } : {}),
    },
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

  // Read monthly limit from settings (default 2)
  let maxPerMonth = 2;
  try {
    const setting = await prisma.generalSetting.findUnique({ where: { id: "singleton" } });
    const data = setting?.data as Record<string, unknown> | null;
    const shifts = data?.shifts as Record<string, unknown> | null;
    if (typeof shifts?.maxChangeRequestsPerMonth === "number") {
      maxPerMonth = shifts.maxChangeRequestsPerMonth;
    }
  } catch { /* keep default */ }

  // Count this employee's requests this calendar month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const thisMonthCount = await prisma.shiftChangeRequest.count({
    where: {
      employeeId,
      status: { in: ["pending", "approved"] },
      createdAt: { gte: monthStart, lte: monthEnd },
    },
  });

  if (thisMonthCount >= maxPerMonth) {
    return NextResponse.json(
      { error: `Monthly limit reached. You may only submit ${maxPerMonth} change request${maxPerMonth !== 1 ? "s" : ""} per month.`, limitReached: true },
      { status: 429 }
    );
  }

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
    remaining:        maxPerMonth - thisMonthCount - 1,
  }, { status: 201 });
}
