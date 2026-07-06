import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

function mapRecord(r: any) {
  return {
    id:               r.id,
    branchId:         r.branchId,
    employeeId:       r.employeeId,
    date:             r.date,
    shiftId:          r.shiftId ?? null,
    clockInTime:      r.clockInTime ?? null,
    clockOutTime:     r.clockOutTime ?? null,
    clockInLat:       r.clockInLat ?? null,
    clockInLng:       r.clockInLng ?? null,
    clockInDistance:  r.clockInDistance ?? null,
    clockOutLat:      r.clockOutLat ?? null,
    clockOutLng:      r.clockOutLng ?? null,
    clockOutDistance: r.clockOutDistance ?? null,
    gpsValid:         r.gpsValid,
    status:           r.status,
    totalMinutes:     r.totalMinutes ?? null,
    overtimeMinutes:  r.overtimeMinutes ?? null,
    lateMinutes:      r.lateMinutes ?? null,
    createdAt:        r.createdAt.toISOString(),
    updatedAt:        r.updatedAt.toISOString(),
  };
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get("branchId");
  const date     = searchParams.get("date");
  const from     = searchParams.get("from");
  const to       = searchParams.get("to");

  if (!branchId) return NextResponse.json({ error: "branchId required." }, { status: 400 });

  const records = await prisma.attendanceRecord.findMany({
    where: {
      branchId,
      ...(date ? { date } : {}),
      ...(from && to ? { date: { gte: from, lte: to } } : {}),
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(records.map(mapRecord));
}
