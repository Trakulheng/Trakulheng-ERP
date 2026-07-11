import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { branchId, employeeId, date, clockOutTime, lat, lng } = await req.json();
  if (!branchId || !employeeId || !date || !clockOutTime) {
    return NextResponse.json({ error: "branchId, employeeId, date, and clockOutTime are required." }, { status: 400 });
  }

  const existing = await prisma.attendanceRecord.findUnique({
    where: { employeeId_date: { employeeId, date } },
  });
  if (!existing) {
    return NextResponse.json({ error: "No clock-in record found for this employee today." }, { status: 404 });
  }

  const branch = await prisma.branch.findUnique({ where: { id: branchId } });
  if (!branch) return NextResponse.json({ error: "Branch not found." }, { status: 404 });

  const distance = (lat != null && lng != null)
    ? Math.round(haversineMeters(lat, lng, branch.lat, branch.lng))
    : null;

  // Enforce: cannot clock out before shift end time
  if (existing.shiftId) {
    const shift = await prisma.shiftTemplate.findUnique({ where: { id: existing.shiftId } });
    if (shift) {
      const shiftEnd  = timeToMinutes(shift.endTime);
      const clockMin  = timeToMinutes(clockOutTime);
      if (clockMin < shiftEnd) {
        return NextResponse.json(
          { error: `Cannot clock out before shift ends at ${shift.endTime}.` },
          { status: 403 }
        );
      }
    }
  }

  // Calculate total worked minutes
  let totalMinutes: number | null = null;
  let overtimeMinutes: number | null = null;
  if (existing.clockInTime) {
    const inMin  = timeToMinutes(existing.clockInTime);
    const outMin = timeToMinutes(clockOutTime);
    totalMinutes = outMin >= inMin ? outMin - inMin : 24 * 60 - inMin + outMin;

    // Subtract break if shift is known
    if (existing.shiftId) {
      const shift = await prisma.shiftTemplate.findUnique({ where: { id: existing.shiftId } });
      if (shift) {
        const scheduledMinutes = timeToMinutes(shift.endTime) - timeToMinutes(shift.startTime);
        const netWorked = totalMinutes - (shift.breakMinutes ?? 0);
        if (netWorked > scheduledMinutes) overtimeMinutes = netWorked - scheduledMinutes;
      }
    }
  }

  const record = await prisma.attendanceRecord.update({
    where: { employeeId_date: { employeeId, date } },
    data: {
      clockOutTime,
      clockOutLat:      lat ?? null,
      clockOutLng:      lng ?? null,
      clockOutDistance: distance,
      status:           "completed",
      totalMinutes,
      overtimeMinutes,
    },
  });

  return NextResponse.json({
    id:               record.id,
    employeeId:       record.employeeId,
    date:             record.date,
    clockInTime:      record.clockInTime,
    clockOutTime:     record.clockOutTime,
    totalMinutes:     record.totalMinutes,
    overtimeMinutes:  record.overtimeMinutes,
    lateMinutes:      record.lateMinutes ?? null,
    status:           record.status,
  });
}
