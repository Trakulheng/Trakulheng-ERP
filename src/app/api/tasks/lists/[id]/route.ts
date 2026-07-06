import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { name, color, order } = await req.json();
    const list = await prisma.taskList.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(color !== undefined ? { color } : {}),
        ...(order !== undefined ? { order } : {}),
      },
    });
    return NextResponse.json(list);
  } catch (err) {
    console.error("[task-lists PATCH]", err);
    return NextResponse.json({ error: "Failed to update task list." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Tasks with this listId become unassigned (SetNull in schema)
    await prisma.taskList.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[task-lists DELETE]", err);
    return NextResponse.json({ error: "Failed to delete task list." }, { status: 500 });
  }
}
