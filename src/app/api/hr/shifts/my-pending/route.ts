import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// GET /api/hr/shifts/my-pending
// Returns pending shift assignments for the currently logged-in employee.
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  if (!user.employeeRecordId) {
    return NextResponse.json([]);
  }

  const rows = await prisma.shiftAssignment.findMany({
    where: { employeeId: user.employeeRecordId, confirmStatus: "pending" },
    orderBy: { date: "asc" },
    take: 20,
  });

  const templateIds = Array.from(new Set(rows.map((r) => r.shiftId).filter(Boolean))) as string[];
  const templates = templateIds.length > 0
    ? await prisma.shiftTemplate.findMany({ where: { id: { in: templateIds } } })
    : [];

  return NextResponse.json(
    rows.map((row) => {
      const tpl = row.shiftId ? templates.find((t) => t.id === row.shiftId) : null;
      return {
        id:         row.id,
        date:       row.date,
        shiftCode:  tpl?.code      ?? null,
        shiftName:  tpl?.name      ?? null,
        shiftStart: tpl?.startTime ?? null,
        shiftEnd:   tpl?.endTime   ?? null,
        branchId:   row.branchId,
        note:       row.note       ?? null,
      };
    })
  );
}
