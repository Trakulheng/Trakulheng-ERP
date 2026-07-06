import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// GET /api/hr/shifts/todos/today?date=YYYY-MM-DD&shiftId=SH-xxx
// Returns todos for a shift with this user's completion log for the given date
export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
  const shiftId = searchParams.get("shiftId");

  const todos = await prisma.shiftTodo.findMany({
    where: shiftId ? { shiftId } : {},
    orderBy: [{ shiftId: "asc" }, { sequence: "asc" }],
    include: {
      logs: {
        where: { date, employeeId: user.employeeRecordId ?? "__none__" },
      },
    },
  });

  return NextResponse.json(todos);
}
