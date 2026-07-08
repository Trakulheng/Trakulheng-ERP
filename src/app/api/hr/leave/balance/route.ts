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

  const [leaveTypes, allRequests] = await Promise.all([
    prisma.leaveType.findMany({ where: { isActive: true }, orderBy: [{ order: "asc" }, { name: "asc" }] }),
    prisma.leaveRequest.findMany({
      where: {
        employeeId: empPrismaId,
        status: { in: ["approved", "pending"] },
        fromDate: { gte: new Date(`${year}-01-01`), lte: new Date(`${year}-12-31`) },
      },
      select: { type: true, days: true, status: true },
    }),
  ]);

  const approvedByType: Record<string, number> = {};
  const pendingByType: Record<string, number> = {};
  for (const r of allRequests) {
    if (r.status === "approved") {
      approvedByType[r.type] = (approvedByType[r.type] ?? 0) + r.days;
    } else {
      pendingByType[r.type] = (pendingByType[r.type] ?? 0) + r.days;
    }
  }

  const balance = leaveTypes.map((lt) => {
    const approved = approvedByType[lt.name] ?? 0;
    const pending  = pendingByType[lt.name] ?? 0;
    const totalUsed = approved + pending;
    return {
      id:          lt.id,
      name:        lt.name,
      color:       lt.color,
      daysPerYear: lt.daysPerYear,
      isPaid:      lt.isPaid,
      carryOver:   lt.carryOver,
      requireDoc:  lt.requireDoc,
      used:        approved,
      pending:     pending,
      remaining:   lt.daysPerYear === 0 ? null : Math.max(0, lt.daysPerYear - totalUsed),
    };
  });

  return NextResponse.json(balance);
}
