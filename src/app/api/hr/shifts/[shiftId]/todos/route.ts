import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: { shiftId: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const todos = await prisma.shiftTodo.findMany({
    where: { shiftId: params.shiftId },
    orderBy: { sequence: "asc" },
  });
  return NextResponse.json(todos);
}

export async function POST(req: Request, { params }: { params: { shiftId: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (!["admin", "manager"].includes(user.role))
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { name, expectedMinutes } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name is required." }, { status: 400 });

  const last = await prisma.shiftTodo.findFirst({
    where: { shiftId: params.shiftId },
    orderBy: { sequence: "desc" },
  });

  const todo = await prisma.shiftTodo.create({
    data: {
      shiftId: params.shiftId,
      name: name.trim(),
      sequence: last ? last.sequence + 1 : 1,
      expectedMinutes: expectedMinutes ?? 30,
    },
  });
  return NextResponse.json(todo, { status: 201 });
}
