import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// POST /api/hr/shifts/assignments/send
// Body: { branchId, from?, to? } — promotes all draft assignments in scope to "pending"
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (!["admin", "manager"].includes(user.role))
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { branchId, from, to, ids } = await req.json();
  if (!branchId) return NextResponse.json({ error: "branchId required." }, { status: 400 });

  const where: any = {
    branchId,
    confirmStatus: "draft",
    ...(from && to ? { date: { gte: from, lte: to } } : {}),
    ...(ids?.length ? { id: { in: ids } } : {}),
  };

  const result = await prisma.shiftAssignment.updateMany({
    where,
    data: { confirmStatus: "pending" },
  });

  // Return the updated assignments so the client can refresh
  const updated = await prisma.shiftAssignment.findMany({
    where: { branchId, ...(from && to ? { date: { gte: from, lte: to } } : {}) },
    orderBy: { date: "asc" },
  });

  return NextResponse.json({ sent: result.count, assignments: updated });
}
