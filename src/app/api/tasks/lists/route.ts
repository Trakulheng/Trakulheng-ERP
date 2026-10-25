import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { listShiftsInclude, withShifts, applyShiftLinks } from "@/lib/task-list-shifts";

export async function GET() {
  try {
    const lists = await prisma.taskList.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      include: listShiftsInclude,
    });
    return NextResponse.json(lists.map(withShifts));
  } catch (err) {
    console.error("[task-lists GET]", err);
    return NextResponse.json({ error: "Failed to load task lists." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (user.role === "staff") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  try {
    const { name, color, shiftIds } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    const maxOrder = await prisma.taskList.aggregate({ _max: { order: true } });
    const created = await prisma.taskList.create({
      data: {
        name: name.trim(),
        color: color || "blue",
        order: (maxOrder._max.order ?? -1) + 1,
      },
    });
    await applyShiftLinks(created.id, { shiftIds: Array.isArray(shiftIds) ? shiftIds : [] });

    const list = await prisma.taskList.findUniqueOrThrow({ where: { id: created.id }, include: listShiftsInclude });
    return NextResponse.json(withShifts(list), { status: 201 });
  } catch (err) {
    console.error("[task-lists POST]", err);
    return NextResponse.json({ error: "Failed to create task list." }, { status: 500 });
  }
}
