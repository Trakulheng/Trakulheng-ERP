import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: { shiftId: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (!["admin", "manager"].includes(user.role))
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { name, code, startTime, endTime, breakMinutes, color } = await req.json();

  if (code) {
    const conflict = await prisma.shiftTemplate.findFirst({
      where: { code: code.trim().toUpperCase(), NOT: { id: params.shiftId } },
    });
    if (conflict) return NextResponse.json({ error: "A shift with this code already exists." }, { status: 409 });
  }

  const shift = await prisma.shiftTemplate.update({
    where: { id: params.shiftId },
    data: {
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(code !== undefined ? { code: code.trim().toUpperCase().slice(0, 4) } : {}),
      ...(startTime !== undefined ? { startTime } : {}),
      ...(endTime !== undefined ? { endTime } : {}),
      ...(breakMinutes !== undefined ? { breakMinutes } : {}),
      ...(color !== undefined ? { color } : {}),
    },
  });
  return NextResponse.json(shift);
}

export async function DELETE(_req: Request, { params }: { params: { shiftId: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (!["admin", "manager"].includes(user.role))
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  // Cascade delete todos (and their logs) for this shift
  await prisma.shiftTodo.deleteMany({ where: { shiftId: params.shiftId } });
  await prisma.shiftTemplate.delete({ where: { id: params.shiftId } });
  return NextResponse.json({ ok: true });
}
