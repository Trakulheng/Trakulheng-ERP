import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: { todoId: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { date, employeeId, photoUrl, notes } = await req.json();
  if (!date || !employeeId)
    return NextResponse.json({ error: "date and employeeId are required." }, { status: 400 });

  // Check photoRequired setting on the todo
  const todo = await prisma.shiftTodo.findUnique({ where: { id: params.todoId } });
  if (todo?.photoRequired && !photoUrl)
    return NextResponse.json({ error: "Photo is required to complete this to-do." }, { status: 400 });

  const log = await prisma.shiftTodoLog.upsert({
    where: { todoId_date_employeeId: { todoId: params.todoId, date, employeeId } },
    update: { completedAt: new Date(), photoUrl, notes: notes || null },
    create: {
      todoId: params.todoId,
      date,
      employeeId,
      completedAt: new Date(),
      photoUrl,
      notes: notes || null,
    },
  });
  return NextResponse.json(log);
}

export async function DELETE(req: Request, { params }: { params: { todoId: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { date, employeeId } = await req.json();
  if (!date || !employeeId)
    return NextResponse.json({ error: "date and employeeId are required." }, { status: 400 });

  await prisma.shiftTodoLog.deleteMany({
    where: { todoId: params.todoId, date, employeeId },
  });
  return NextResponse.json({ ok: true });
}
