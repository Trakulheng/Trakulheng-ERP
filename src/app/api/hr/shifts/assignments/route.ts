import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

function mapAssignment(a: any) {
  return {
    id:            a.id,
    branchId:      a.branchId,
    employeeId:    a.employeeId,
    shiftId:       a.shiftId ?? null,
    date:          a.date,
    note:          a.note ?? undefined,
    confirmStatus: a.confirmStatus,
    createdAt:     a.createdAt.toISOString(),
  };
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get("branchId");
  const from     = searchParams.get("from");
  const to       = searchParams.get("to");

  if (!branchId) return NextResponse.json({ error: "branchId required." }, { status: 400 });

  const assignments = await prisma.shiftAssignment.findMany({
    where: {
      branchId,
      ...(from && to ? { date: { gte: from, lte: to } } : {}),
    },
    orderBy: { date: "asc" },
  });

  return NextResponse.json(assignments.map(mapAssignment));
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { branchId, employeeId, shiftId, date, note } = await req.json();
  if (!branchId || !employeeId || !date) {
    return NextResponse.json({ error: "branchId, employeeId, and date are required." }, { status: 400 });
  }

  const assignment = await prisma.shiftAssignment.upsert({
    where: { employeeId_date: { employeeId, date } },
    create: {
      branchId,
      employeeId,
      shiftId:       shiftId ?? null,
      date,
      note:          note ?? null,
      confirmStatus: "pending",
    },
    update: {
      branchId,
      shiftId:       shiftId ?? null,
      note:          note ?? null,
      confirmStatus: "pending",
    },
  });

  return NextResponse.json(mapAssignment(assignment), { status: 201 });
}
