import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (user.role === "staff") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  try {
    const { ids } = await req.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids array required" }, { status: 400 });
    }
    await prisma.$transaction(
      ids.map((id: string, i: number) =>
        prisma.task.update({ where: { id }, data: { order: i + 1 } })
      )
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[tasks/reorder POST]", err);
    return NextResponse.json({ error: "Failed to reorder tasks." }, { status: 500 });
  }
}
