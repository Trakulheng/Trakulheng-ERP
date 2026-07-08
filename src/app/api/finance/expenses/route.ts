import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

function mapExpense(e: any) {
  return {
    id:                  e.number,
    _cuid:               e.id,
    category:            e.category,
    description:         e.description,
    date:                e.date,
    amount:              e.amount,
    status:              e.status,
    employeeId:          e.employeeId,
    employeeName:        e.employeeName ?? "",
    branchId:            e.branchId ?? "",
    requestItems:        (e.items as any[]) ?? [],
    attachments:         (e.attachments as any[]) ?? [],
    notes:               e.notes ?? "",
    approvedBy:          e.approvedBy ?? null,
    approvedAt:          e.approvedAt ?? null,
    reimbursedInPayroll: e.reimbursedInPayroll ?? null,
    createdAt:           e.createdAt,
  };
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get("employeeId");
  const branchId   = searchParams.get("branchId");
  const status     = searchParams.get("status");

  const rows = await prisma.expense.findMany({
    where: {
      ...(employeeId && { employeeId }),
      ...(branchId   && { branchId }),
      ...(status     && { status }),
    },
    orderBy: { createdAt: "desc" },
  });

  // Enrich with employee name
  const empIds = [...new Set(rows.map((r) => r.employeeId))];
  const emps = await prisma.employee.findMany({
    where: { id: { in: empIds } },
    select: { id: true, name: true },
  });
  const empMap = Object.fromEntries(emps.map((e) => [e.id, e.name]));

  return NextResponse.json(rows.map((e) => mapExpense({ ...e, employeeName: empMap[e.employeeId] ?? "" })));
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const data = await req.json();

  const count = await prisma.expense.count();
  const number = `EXP-${String(count + 1).padStart(3, "0")}`;

  const exp = await prisma.expense.create({
    data: {
      number,
      employeeId:  data.employeeId,
      branchId:    data.branchId ?? null,
      category:    data.category,
      description: data.description,
      date:        data.date,
      amount:      data.amount,
      status:      "pending",
      items:       data.items ?? [],
      attachments: data.attachments ?? [],
      notes:       data.notes ?? null,
    },
  });

  const emp = await prisma.employee.findUnique({ where: { id: exp.employeeId }, select: { name: true } });
  return NextResponse.json(mapExpense({ ...exp, employeeName: emp?.name ?? "" }), { status: 201 });
}
