import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const empId = user.employeeRecordId;
  if (!empId) {
    return NextResponse.json({ error: "No employee record linked to this account." }, { status: 404 });
  }

  const today = new Date().toISOString().split("T")[0];

  // Fetch employee, shift assignment, attendance record in parallel
  const [employee, assignment, record, settings] = await Promise.all([
    prisma.employee.findFirst({ where: { employeeId: empId } }),
    prisma.shiftAssignment.findUnique({ where: { employeeId_date: { employeeId: empId, date: today } } }),
    prisma.attendanceRecord.findUnique({ where: { employeeId_date: { employeeId: empId, date: today } } }),
    prisma.generalSetting.findUnique({ where: { id: "singleton" } }),
  ]);

  if (!employee) {
    return NextResponse.json({ error: "Employee record not found." }, { status: 404 });
  }

  // Get branch for GPS data
  const branch = employee.branchId
    ? await prisma.branch.findUnique({ where: { id: employee.branchId } })
    : null;

  // Pull attendance config from general settings
  const settingsData = (settings?.data as any) ?? {};
  const lateWarningMinutes: number = settingsData?.attendance?.lateWarningMinutes ?? 15;
  const clockGpsRadiusMeters: number = branch?.radiusMeters ?? settingsData?.attendance?.clockGpsRadiusMeters ?? 200;

  // Resolve shift template
  let shift = null;
  if (assignment?.shiftId) {
    shift = await prisma.shiftTemplate.findUnique({ where: { id: assignment.shiftId } });
  }

  return NextResponse.json({
    employee: {
      id:         employee.employeeId,
      name:       employee.name,
      department: employee.department,
      position:   employee.position,
      branchId:   employee.branchId ?? null,
    },
    branch: branch ? {
      id:           branch.id,
      name:         branch.name,
      lat:          branch.lat,
      lng:          branch.lng,
      radiusMeters: clockGpsRadiusMeters,
    } : null,
    shift: shift ? {
      id:           shift.id,
      name:         shift.name,
      startTime:    shift.startTime,
      endTime:      shift.endTime,
      breakMinutes: shift.breakMinutes,
      color:        shift.color,
    } : null,
    assignment: assignment ? {
      shiftId:       assignment.shiftId ?? null,
      confirmStatus: assignment.confirmStatus,
    } : null,
    record: record ? {
      id:              record.id,
      clockInTime:     record.clockInTime ?? null,
      clockOutTime:    record.clockOutTime ?? null,
      clockInDistance: record.clockInDistance ?? null,
      gpsValid:        record.gpsValid,
      status:          record.status,
      totalMinutes:    record.totalMinutes ?? null,
      overtimeMinutes: record.overtimeMinutes ?? null,
      lateMinutes:     record.lateMinutes ?? null,
    } : null,
    settings: {
      lateWarningMinutes,
      clockGpsRadiusMeters,
    },
    date: today,
  });
}
