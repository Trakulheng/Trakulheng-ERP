import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// GET /api/tasks/shift-tasks/history?date=YYYY-MM-DD&branchId=xxx
// Returns task completion summary for all employees on a given date.
// Accessible to managers/admins; staff get only their own record.
export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? new Date().toISOString().split("T")[0];
  const branchId = searchParams.get("branchId");

  const isManager = user.role === "admin" || user.role === "manager";

  // Find all shift assignments for this date (filtered by branch if provided)
  const assignments = await prisma.shiftAssignment.findMany({
    where: {
      date,
      ...(branchId ? { branchId } : {}),
      ...(!isManager && user.employeeRecordId ? { employeeId: user.employeeRecordId } : {}),
      shiftId: { not: null },
    },
  });

  if (assignments.length === 0) return NextResponse.json({ rows: [], date });

  const employeeIds = [...new Set(assignments.map((a) => a.employeeId))];
  const shiftIds = [...new Set(assignments.map((a) => a.shiftId!))];

  // Fetch employee names, shift templates, task lists, tasks, and status logs in parallel
  const [employees, shifts, taskLists] = await Promise.all([
    prisma.employee.findMany({
      where: { id: { in: employeeIds } },
      select: { id: true, name: true, employeeId: true },
    }),
    prisma.shiftTemplate.findMany({
      where: { id: { in: shiftIds } },
      select: { id: true, name: true, code: true, color: true },
    }),
    prisma.taskList.findMany({
      where: { shiftId: { in: shiftIds } },
      orderBy: { order: "asc" },
      include: {
        tasks: {
          orderBy: { order: "asc" },
          select: { id: true, title: true, priority: true, order: true },
        },
      },
    }),
  ]);

  const allTaskIds = taskLists.flatMap((l) => l.tasks.map((t) => t.id));
  const logs = allTaskIds.length > 0
    ? await prisma.taskStatusLog.findMany({
        where: { date, employeeId: { in: employeeIds }, taskId: { in: allTaskIds } },
        select: { taskId: true, employeeId: true, status: true },
      })
    : [];

  // Build per-employee rows
  const rows = assignments.map((a) => {
    const emp = employees.find((e) => e.id === a.employeeId);
    const shift = shifts.find((s) => s.id === a.shiftId);
    const lists = taskLists.filter((l) => l.shiftId === a.shiftId);
    const tasks = lists.flatMap((l) =>
      l.tasks.map((t) => {
        const log = logs.find((lg) => lg.taskId === t.id && lg.employeeId === a.employeeId);
        return {
          id:       t.id,
          title:    t.title,
          priority: t.priority,
          listName: l.name,
          listColor: l.color,
          status:   log?.status ?? "pending",
        };
      })
    );
    const done = tasks.filter((t) => t.status === "done").length;
    return {
      employeeId:   a.employeeId,
      employeeName: emp?.name ?? "Unknown",
      employeeNo:   emp?.employeeId ?? "",
      shiftName:    shift?.name ?? "—",
      shiftCode:    shift?.code ?? "—",
      shiftColor:   shift?.color ?? "blue",
      tasks,
      doneCount:    done,
      totalCount:   tasks.length,
    };
  });

  return NextResponse.json({ rows, date });
}
