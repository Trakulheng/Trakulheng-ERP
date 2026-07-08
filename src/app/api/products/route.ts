import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
    select: { id: true, sku: true, name: true, category: true, stock: true, unitPrice: true },
  });

  return NextResponse.json(products);
}
