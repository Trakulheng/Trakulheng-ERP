import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const empPrismaId = searchParams.get("employeeId"); // CUID
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()), 10);

  if (!empPrismaId) return NextResponse.json({ error: "employeeId required." }, { status: 400 });

  const [leaveTypes, approvedRequests] = await Promise.all([
    prisma.leaveType.findMany({ where: { isActive: true }, orderBy: [{ order: "asc" }, { name: "asc" }] }),
    prisma.leaveRequest.findMany({
      where: {
        employeeId: empPrismaId,
        status: "approved",
        fromDate: { gte: new Date(`${year}-01-01`), lte: new Date(`${year}-12-31`) },
      },
      select: { type: true, days: true },
    }),
  ]);

  const usedByType: Record<string, number> = {};
  for (const r of approvedRequests) {
    usedByType[r.type] = (usedByType[r.type] ?? 0) + r.days;
  }

  const balance = leaveTypes.map((lt) => ({
    id:          lt.id,
    name:        lt.name,
    color:       lt.color,
    daysPerYear: lt.daysPerYear,
    isPaid:      lt.isPaid,
    carryOver:   lt.carryOver,
    requireDoc:  lt.requireDoc,
    used:        usedByType[lt.name] ?? 0,
    remaining:   lt.daysPerYear === 0 ? null : Math.max(0, lt.daysPerYear - (usedByType[lt.name] ?? 0)),
  }));

  return NextResponse.json(balance);
}
