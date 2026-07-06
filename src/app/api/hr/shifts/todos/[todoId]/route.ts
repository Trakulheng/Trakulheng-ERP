import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: { todoId: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (!["admin", "manager"].includes(user.role))
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { name, sequence, expectedMinutes, photoRequired } = await req.json();
  const todo = await prisma.shiftTodo.update({
    where: { id: params.todoId },
    data: {
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(sequence !== undefined ? { sequence } : {}),
      ...(expectedMinutes !== undefined ? { expectedMinutes } : {}),
      ...(photoRequired !== undefined ? { photoRequired } : {}),
    },
  });
  return NextResponse.json(todo);
}

export async function DELETE(_req: Request, { params }: { params: { todoId: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (!["admin", "manager"].includes(user.role))
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  await prisma.shiftTodo.delete({ where: { id: params.todoId } });
  return NextResponse.json({ ok: true });
}
