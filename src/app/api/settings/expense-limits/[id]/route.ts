import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const data = await req.json();
  const updated = await prisma.expenseLimit.update({
    where: { id: params.id },
    data: {
      ...(data.amountLimit  !== undefined && { amountLimit:  data.amountLimit  ?? null }),
      ...(data.dailyLimit   !== undefined && { dailyLimit:   data.dailyLimit   ?? null }),
      ...(data.monthlyLimit !== undefined && { monthlyLimit: data.monthlyLimit ?? null }),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  await prisma.expenseLimit.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
