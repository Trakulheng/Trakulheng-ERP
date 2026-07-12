import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

const shiftSelect = { id: true, name: true, code: true, startTime: true, endTime: true, color: true };

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (user.role === "staff") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  try {
    const { name, color, order, shiftId } = await req.json();
    const list = await prisma.taskList.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(color !== undefined ? { color } : {}),
        ...(order !== undefined ? { order } : {}),
        ...(shiftId !== undefined ? { shiftId: shiftId || null } : {}),
      },
      include: { shift: { select: shiftSelect } },
    });
    return NextResponse.json(list);
  } catch (err) {
    console.error("[task-lists PATCH]", err);
    return NextResponse.json({ error: "Failed to update task list." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (user.role === "staff") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  try {
    await prisma.taskList.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[task-lists DELETE]", err);
    return NextResponse.json({ error: "Failed to delete task list." }, { status: 500 });
  }
}
