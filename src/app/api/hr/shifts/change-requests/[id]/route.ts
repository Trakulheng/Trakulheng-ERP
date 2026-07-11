import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

function parseTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function shiftMinutes(start: string, end: string) {
  let diff = parseTime(end) - parseTime(start);
  if (diff < 0) diff += 1440; // overnight
  return diff;
}

/** ISO date string → Monday of that week (YYYY-MM-DD) */
function getMondayStr(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const dow = d.getDay(); // 0=Sun
  const offset = dow === 0 ? -6 : 1 - dow;
  const mon = new Date(d.getTime() + offset * 86400000);
  return mon.toISOString().slice(0, 10);
}

function addDaysStr(dateStr: string, n: number) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (!["admin", "manager"].includes(user.role))
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { status, managerNote } = await req.json();
  if (!["approved", "rejected"].includes(status))
    return NextResponse.json({ error: "status must be approved or rejected." }, { status: 400 });

  const existing = await prisma.shiftChangeRequest.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const record = await prisma.shiftChangeRequest.update({
    where: { id: params.id },
    data: {
      status,
      resolvedBy:  user.employeeRecordId ?? user.id,
      resolvedAt:  new Date(),
      managerNote: managerNote || null,
    },
  });

  // Compute 40-hour weekly warning when approving
  let weeklyHoursTotal: number | null = null;
  let weeklyHoursWarning = false;

  if (status === "approved") {
    try {
      const monday = getMondayStr(existing.date);
      const sunday = addDaysStr(monday, 6);

      // All shift assignments for this employee this week
      const assignments = await prisma.shiftAssignment.findMany({
        where: {
          employeeId: existing.employeeId,
          date: { gte: monday, lte: sunday },
        },
        select: { date: true, shiftId: true },
      });

      // Collect all shift template IDs involved (existing + the new one)
      const shiftIds = Array.from(new Set([
        ...assignments.map((a) => a.shiftId).filter(Boolean) as string[],
        ...(existing.requestedShiftId ? [existing.requestedShiftId] : []),
      ]));

      const templates = shiftIds.length > 0
        ? await prisma.shiftTemplate.findMany({
            where: { id: { in: shiftIds } },
            select: { id: true, startTime: true, endTime: true, breakMinutes: true },
          })
        : [];

      const tplMap = Object.fromEntries(templates.map((t) => [t.id, t]));

      // Build effective assignments: override the changed date with the new shift
      const effectiveMap: Record<string, string | null> = {};
      for (const a of assignments) {
        effectiveMap[a.date] = a.shiftId;
      }
      // Apply the approved change
      effectiveMap[existing.date] = existing.requestedShiftId ?? null;

      let totalMinutes = 0;
      for (const [, shiftId] of Object.entries(effectiveMap)) {
        if (!shiftId) continue;
        const tpl = tplMap[shiftId];
        if (!tpl) continue;
        const worked = shiftMinutes(tpl.startTime, tpl.endTime) - (tpl.breakMinutes ?? 0);
        if (worked > 0) totalMinutes += worked;
      }

      weeklyHoursTotal = Math.round((totalMinutes / 60) * 10) / 10;
      weeklyHoursWarning = weeklyHoursTotal > 40;
    } catch { /* non-blocking — just omit warning */ }
  }

  return NextResponse.json({
    id:                record.id,
    employeeId:        record.employeeId,
    date:              record.date,
    currentShiftId:    record.currentShiftId,
    requestedShiftId:  record.requestedShiftId ?? null,
    reason:            record.reason,
    status:            record.status,
    resolvedBy:        record.resolvedBy ?? undefined,
    resolvedAt:        record.resolvedAt?.toISOString() ?? undefined,
    managerNote:       record.managerNote ?? undefined,
    createdAt:         record.createdAt.toISOString(),
    weeklyHoursTotal,
    weeklyHoursWarning,
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
