import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await req.json();
    const task = await prisma.task.update({
      where: { id: params.id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.dueDate !== undefined ? { dueDate: data.dueDate } : {}),
        ...(data.dueTime !== undefined ? { dueTime: data.dueTime } : {}),
        ...(data.priority !== undefined ? { priority: data.priority } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.assigneeName !== undefined ? { assigneeName: data.assigneeName } : {}),
        ...(data.shiftLabel !== undefined ? { shiftLabel: data.shiftLabel } : {}),
        ...(data.taskListId !== undefined ? { taskListId: data.taskListId || null } : {}),
      },
    });
    return NextResponse.json(task);
  } catch (err) {
    console.error("[tasks PATCH]", err);
    return NextResponse.json({ error: "Failed to update task." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.task.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[tasks DELETE]", err);
    return NextResponse.json({ error: "Failed to delete task." }, { status: 500 });
  }
}
