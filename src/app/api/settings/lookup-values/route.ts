import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

const SEED_DEFAULTS: Record<string, string[]> = {
  business_type: [
    "Manufacturing", "Trading", "Construction", "Technology", "Retail",
    "Logistics", "Services", "Healthcare", "Education", "Food & Beverage", "Other",
  ],
  payment_term: ["COD", "Net 15", "Net 30", "Net 45", "Net 60"],
};

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  if (!type) return NextResponse.json({ error: "type is required." }, { status: 400 });

  const rows = await prisma.lookupValue.findMany({
    where: { type },
    orderBy: [{ order: "asc" }, { label: "asc" }],
  });

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (!["admin", "manager"].includes(user.role)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const body = await req.json();

  if (body.seedDefaults && body.type && SEED_DEFAULTS[body.type]) {
    const defaults = SEED_DEFAULTS[body.type];
    await prisma.lookupValue.createMany({
      data: defaults.map((label, i) => ({ type: body.type, label, order: i })),
      skipDuplicates: true,
    });
    const rows = await prisma.lookupValue.findMany({
      where: { type: body.type },
      orderBy: [{ order: "asc" }, { label: "asc" }],
    });
    return NextResponse.json(rows);
  }

  const { type, label } = body;
  if (!type || !label?.trim()) return NextResponse.json({ error: "type and label are required." }, { status: 400 });

  const existing = await prisma.lookupValue.count({ where: { type } });
  const row = await prisma.lookupValue.create({
    data: { type, label: label.trim(), order: existing },
  });
  return NextResponse.json(row, { status: 201 });
}
