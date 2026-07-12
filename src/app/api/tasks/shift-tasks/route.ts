import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// GET /api/tasks/shift-tasks?date=YYYY-MM-DD&employeeId=xxx
// Returns tasks linked to the employee's shift on the given date, with per-employee statuses.
// employeeId defaults to the session employee; managers can pass any employeeId.
export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? new Date().toISOString().split("T")[0];
  // Staff can only view their own tasks; managers/admins can pass an arbitrary employeeId
  const isManager = user.role === "admin" || user.role === "manager";
  const requestedEmpId = searchParams.get("employeeId");
  const employeeId = (isManager && requestedEmpId) ? requestedEmpId : (user.employeeRecordId ?? null);

  if (!employeeId) {
    return NextResponse.json({ tasks: [], shift: null, noEmployee: true });
  }

  // Find the shift assignment for this employee on this date
  const assignment = await prisma.shiftAssignment.findUnique({
    where: { employeeId_date: { employeeId, date } },
  });

  if (!assignment?.shiftId) {
    return NextResponse.json({ tasks: [], shift: null, noShift: true });
  }

  // Get shift template info
  const shift = await prisma.shiftTemplate.findUnique({
    where: { id: assignment.shiftId },
    select: { id: true, name: true, code: true, startTime: true, endTime: true, color: true },
  });

  // Get all task lists linked to this shift, with their tasks
  const taskLists = await prisma.taskList.findMany({
    where: { shiftId: assignment.shiftId },
    orderBy: { order: "asc" },
    include: {
      tasks: {
        orderBy: { order: "asc" },
        select: { id: true, title: true, description: true, priority: true, requiresPhoto: true, order: true },
      },
    },
  });

  const allTaskIds = taskLists.flatMap((l) => l.tasks.map((t) => t.id));

  // Fetch existing status logs for this employee/date
  const logs = allTaskIds.length > 0
    ? await prisma.taskStatusLog.findMany({
        where: { employeeId, date, taskId: { in: allTaskIds } },
        select: { taskId: true, status: true },
      })
    : [];

  const statusMap = Object.fromEntries(logs.map((l) => [l.taskId, l.status]));

  const tasks = taskLists.flatMap((list) =>
    list.tasks.map((t) => ({
      id:           t.id,
      title:        t.title,
      description:  t.description,
      priority:     t.priority,
      requiresPhoto: t.requiresPhoto,
      order:        t.order,
      listId:       list.id,
      listName:     list.name,
      listColor:    list.color,
      status:       statusMap[t.id] ?? "pending",
    }))
  );

  return NextResponse.json({ tasks, shift, noShift: false });
}

// PATCH /api/tasks/shift-tasks  body: { taskId, date, status }
// Staff update their own task status. Managers can pass employeeId to update on behalf of.
export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { taskId, date, status, employeeId: bodyEmpId } = await req.json();
  if (!taskId || !date || !status) {
    return NextResponse.json({ error: "taskId, date, and status are required." }, { status: 400 });
  }

  const isManager = user.role === "admin" || user.role === "manager";
  const employeeId = (isManager && bodyEmpId) ? bodyEmpId : (user.employeeRecordId ?? null);
  if (!employeeId) return NextResponse.json({ error: "No employee record linked to this account." }, { status: 400 });

  const log = await prisma.taskStatusLog.upsert({
    where:  { taskId_date_employeeId: { taskId, date, employeeId } },
    update: { status },
    create: { taskId, date, employeeId, status },
  });

  return NextResponse.json({ taskId: log.taskId, date: log.date, status: log.status });
}
