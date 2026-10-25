import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { listShiftsInclude, withShifts, applyShiftLinks } from "@/lib/task-list-shifts";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (user.role === "staff") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  try {
    const { name, color, order, shiftIds, addShiftId, removeShiftId } = await req.json();
    await prisma.taskList.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(color !== undefined ? { color } : {}),
        ...(order !== undefined ? { order } : {}),
      },
    });
    await applyShiftLinks(params.id, { shiftIds, addShiftId, removeShiftId });

    const list = await prisma.taskList.findUniqueOrThrow({ where: { id: params.id }, include: listShiftsInclude });
    return NextResponse.json(withShifts(list));
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
