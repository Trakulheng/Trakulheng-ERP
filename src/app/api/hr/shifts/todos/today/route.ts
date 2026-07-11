import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// GET /api/hr/shifts/todos/today?date=YYYY-MM-DD[&shiftId=SH-xxx]
// Returns todos for the employee's assigned shift today (or the given shiftId).
// When shiftId is omitted, resolves it from the employee's ShiftAssignment for the given date.
export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
  let shiftId = searchParams.get("shiftId");

  // Auto-resolve: find this employee's shift assignment for the given date
  if (!shiftId && user.employeeRecordId) {
    const assignment = await prisma.shiftAssignment.findFirst({
      where: {
        employeeId: user.employeeRecordId,
        date,
        shiftId: { not: null },
      },
      select: { shiftId: true },
    });
    if (assignment?.shiftId) shiftId = assignment.shiftId;
  }

  // Still no shift — return empty list rather than all todos across all shifts
  if (!shiftId) return NextResponse.json([]);

  const todos = await prisma.shiftTodo.findMany({
    where: { shiftId },
    orderBy: { sequence: "asc" },
    include: {
      logs: {
        where: {
          date,
          ...(user.employeeRecordId ? { employeeId: user.employeeRecordId } : {}),
        },
      },
    },
  });

  return NextResponse.json(todos);
}
