import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

const VALID_STATUSES = ["draft", "processed", "paid"] as const;

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (!["admin", "manager"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { status } = await req.json();
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const run = await prisma.payrollRun.update({
    where: { id: params.id },
    data:  { status },
  });

  return NextResponse.json({
    id:         run.id,
    period:     run.period,
    employees:  run.employees,
    grossPay:   run.grossPay,
    deductions: run.deductions,
    netPay:     run.netPay,
    status:     run.status,
    date:       run.processedAt instanceof Date
                  ? run.processedAt.toISOString().slice(0, 10)
                  : String(run.processedAt).slice(0, 10),
  });
}
