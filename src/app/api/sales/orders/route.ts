import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

function mapOrder(o: any) {
  return {
    id:          o.number,
    _cuid:       o.id,
    customerId:  o.customerId,
    customer:    o.customer?.name ?? "",
    date:        o.date,
    deliveryDate: o.deliveryDate ?? "TBD",
    items:       o.items,
    amount:      o.amount,
    stage:       o.stage,
    probability: o.probability,
    notes:       o.notes ?? "",
    lines:       (o.lines ?? []).map((l: any) => ({
      id:          l.id,
      soId:        o.number,
      productId:   l.productId,
      productName: l.productName,
      qty:         l.qty,
      unitPrice:   l.unitPrice,
      total:       l.total,
    })),
  };
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const orders = await prisma.salesOrder.findMany({
    include: { customer: true, lines: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders.map(mapOrder));
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const data = await req.json();
  const count = await prisma.salesOrder.count();
  const number = `SO-${String(count + 1).padStart(3, "0")}`;

  const order = await prisma.salesOrder.create({
    data: {
      number,
      customerId:   data.customerId,
      date:         data.date,
      deliveryDate: data.deliveryDate ?? null,
      items:        (data.lines ?? []).length,
      amount:       (data.lines ?? []).reduce((s: number, l: any) => s + l.qty * l.unitPrice, 0),
      stage:        data.stage ?? "prospect",
      probability:  data.probability ?? 20,
      notes:        data.notes ?? null,
      lines: {
        create: (data.lines ?? []).map((l: any) => ({
          productId:   l.productId,
          productName: l.productName,
          productSku:  l.productSku ?? null,
          qty:         l.qty,
          unitPrice:   l.unitPrice,
          total:       l.qty * l.unitPrice,
        })),
      },
    },
    include: { customer: true, lines: true },
  });

  return NextResponse.json(mapOrder(order), { status: 201 });
}
