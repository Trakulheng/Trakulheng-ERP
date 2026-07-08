import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const limits = await prisma.expenseLimit.findMany({
    orderBy: { createdAt: "asc" },
  });

  // Enrich with employee info
  const empIds = limits.map((l) => l.employeeId);
  const emps = await prisma.employee.findMany({
    where: { id: { in: empIds } },
    select: { id: true, employeeId: true, name: true, position: true, department: true },
  });
  const empMap = Object.fromEntries(emps.map((e) => [e.id, e]));

  return NextResponse.json(limits.map((l) => ({
    id:           l.id,
    employeeId:   l.employeeId,
    employeeCode: empMap[l.employeeId]?.employeeId ?? "",
    employeeName: empMap[l.employeeId]?.name ?? "",
    position:     empMap[l.employeeId]?.position ?? "",
    department:   empMap[l.employeeId]?.department ?? "",
    amountLimit:  l.amountLimit,
    dailyLimit:   l.dailyLimit,
    monthlyLimit: l.monthlyLimit,
  })));
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const data = await req.json();
  if (!data.employeeId) return NextResponse.json({ error: "employeeId required." }, { status: 400 });

  const limit = await prisma.expenseLimit.upsert({
    where:  { employeeId: data.employeeId },
    update: {
      amountLimit:  data.amountLimit  ?? null,
      dailyLimit:   data.dailyLimit   ?? null,
      monthlyLimit: data.monthlyLimit ?? null,
    },
    create: {
      employeeId:   data.employeeId,
      amountLimit:  data.amountLimit  ?? null,
      dailyLimit:   data.dailyLimit   ?? null,
      monthlyLimit: data.monthlyLimit ?? null,
    },
  });

  return NextResponse.json(limit, { status: 201 });
}
