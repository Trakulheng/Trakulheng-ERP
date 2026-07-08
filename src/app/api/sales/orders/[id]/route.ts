import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

const STAGE_PROB: Record<string, number> = {
  prospect: 20, quoted: 40, negotiation: 60, confirmed: 85, invoiced: 95, delivered: 100,
};

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const data = await req.json();

  const order = await prisma.salesOrder.findFirst({
    where: { OR: [{ number: params.id }, { id: params.id }] },
  });
  if (!order) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const updated = await prisma.salesOrder.update({
    where: { id: order.id },
    data: {
      ...(data.stage       !== undefined && { stage: data.stage, probability: STAGE_PROB[data.stage] ?? order.probability }),
      ...(data.deliveryDate !== undefined && { deliveryDate: data.deliveryDate }),
      ...(data.notes       !== undefined && { notes: data.notes }),
    },
    include: { customer: true, lines: true },
  });

  return NextResponse.json({
    id:          updated.number,
    _cuid:       updated.id,
    customerId:  updated.customerId,
    customer:    updated.customer?.name ?? "",
    date:        updated.date,
    deliveryDate: updated.deliveryDate ?? "TBD",
    items:       updated.items,
    amount:      updated.amount,
    stage:       updated.stage,
    probability: updated.probability,
    notes:       updated.notes ?? "",
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const order = await prisma.salesOrder.findFirst({
    where: { OR: [{ number: params.id }, { id: params.id }] },
  });
  if (!order) return NextResponse.json({ error: "Not found." }, { status: 404 });

  await prisma.salesOrder.delete({ where: { id: order.id } });
  return NextResponse.json({ ok: true });
}
