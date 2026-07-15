import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

const TAX_RATE = 0.10;
const SSO_RATE = 0.05;
const SSO_MAX  = 750;

function effectiveSalary(e: { salary: number; hourlyRate?: number | null }) {
  if (e.salary > 0) return e.salary;
  if (e.hourlyRate && e.hourlyRate > 0) return e.hourlyRate * 160;
  return 0;
}

function calcPayslip(salary: number) {
  const tax = Math.round(salary * TAX_RATE);
  const sso = Math.min(Math.round(salary * SSO_RATE), SSO_MAX);
  return { tax, sso, net: salary - tax - sso };
}

function mapRun(r: any) {
  return {
    id:          r.id,
    period:      r.period,
    employees:   r.employees,
    grossPay:    r.grossPay,
    deductions:  r.deductions,
    netPay:      r.netPay,
    status:      r.status,
    date:        r.processedAt instanceof Date
                   ? r.processedAt.toISOString().slice(0, 10)
                   : String(r.processedAt).slice(0, 10),
  };
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const runs = await prisma.payrollRun.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(runs.map(mapRun));
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (!["admin", "manager"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const now  = new Date();
  const period = body.period
    ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const empList = await prisma.employee.findMany({
    where: { status: "active" },
    select: { id: true, salary: true, hourlyRate: true },
  });

  // Unpaid leave approved within the pay period reduces pay (daily rate = salary / 30)
  const [py, pm] = period.split("-").map(Number);
  const monthStart = new Date(Date.UTC(py, pm - 1, 1));
  const monthEnd   = new Date(Date.UTC(py, pm, 0, 23, 59, 59));
  const unpaidTypes = (await prisma.leaveType.findMany({ where: { isPaid: false }, select: { name: true } }))
    .map((t) => t.name);
  const unpaidLeaves = unpaidTypes.length > 0
    ? await prisma.leaveRequest.findMany({
        where: {
          status: "approved",
          type: { in: unpaidTypes },
          fromDate: { lte: monthEnd },
          toDate:   { gte: monthStart },
        },
        select: { employeeId: true, fromDate: true, toDate: true },
      })
    : [];
  const unpaidDaysByEmp: Record<string, number> = {};
  for (const l of unpaidLeaves) {
    const from = l.fromDate < monthStart ? monthStart : l.fromDate;
    const to   = l.toDate   > monthEnd   ? monthEnd   : l.toDate;
    const days = Math.floor((to.getTime() - from.getTime()) / 86400000) + 1;
    unpaidDaysByEmp[l.employeeId] = (unpaidDaysByEmp[l.employeeId] ?? 0) + Math.max(days, 0);
  }

  let gross = 0, tax = 0, sso = 0, unpaidLeaveDeduction = 0;
  for (const e of empList) {
    const sal  = effectiveSalary(e);
    const slip = calcPayslip(sal);
    gross += sal;
    tax   += slip.tax;
    sso   += slip.sso;
    const unpaidDays = unpaidDaysByEmp[e.id] ?? 0;
    if (unpaidDays > 0 && sal > 0) {
      unpaidLeaveDeduction += Math.min(Math.round((sal / 30) * unpaidDays), sal);
    }
  }
  const deductions = tax + sso + unpaidLeaveDeduction;
  const net        = gross - deductions;

  const run = await prisma.payrollRun.create({
    data: {
      period,
      employees:   empList.length,
      grossPay:    gross,
      deductions,
      netPay:      net,
      status:      "draft",
      processedAt: now,
    },
  });

  return NextResponse.json(mapRun(run), { status: 201 });
}
