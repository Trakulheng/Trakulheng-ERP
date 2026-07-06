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

  const { branchId, employeeId, date, clockInTime, lat, lng, shiftId } = await req.json();
  if (!branchId || !employeeId || !date || !clockInTime) {
    return NextResponse.json({ error: "branchId, employeeId, date, and clockInTime are required." }, { status: 400 });
  }

  const branch = await prisma.branch.findUnique({ where: { id: branchId } });
  if (!branch) return NextResponse.json({ error: "Branch not found." }, { status: 404 });

  const distance = (lat != null && lng != null)
    ? Math.round(haversineMeters(lat, lng, branch.lat, branch.lng))
    : null;
  const gpsValid = distance !== null && distance <= branch.radiusMeters;

  // Determine late status from shift template
  let status: string = "clocked-in";
  let lateMinutes: number | null = null;
  if (shiftId) {
    const shift = await prisma.shiftTemplate.findUnique({ where: { id: shiftId } });
    if (shift) {
      const shiftStart = timeToMinutes(shift.startTime);
      const clockMin   = timeToMinutes(clockInTime);
      const late = clockMin - shiftStart;
      if (late > 15) {
        status = "late";
        lateMinutes = late;
      }
    }
  }

  const record = await prisma.attendanceRecord.upsert({
    where: { employeeId_date: { employeeId, date } },
    create: {
      branchId,
      employeeId,
      date,
      shiftId:         shiftId ?? null,
      clockInTime,
      clockInLat:      lat ?? null,
      clockInLng:      lng ?? null,
      clockInDistance: distance,
      gpsValid,
      status,
      lateMinutes,
    },
    update: {
      shiftId:         shiftId ?? null,
      clockInTime,
      clockInLat:      lat ?? null,
      clockInLng:      lng ?? null,
      clockInDistance: distance,
      gpsValid,
      status,
      lateMinutes,
    },
  });

  return NextResponse.json({
    id:              record.id,
    branchId:        record.branchId,
    employeeId:      record.employeeId,
    date:            record.date,
    shiftId:         record.shiftId ?? null,
    clockInTime:     record.clockInTime,
    clockInDistance: record.clockInDistance,
    gpsValid:        record.gpsValid,
    status:          record.status,
    lateMinutes:     record.lateMinutes ?? null,
  }, { status: 201 });
}
