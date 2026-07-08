import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

function mapExpense(e: any, employeeName = "") {
  return {
    id:                  e.number,
    _cuid:               e.id,
    category:            e.category,
    description:         e.description,
    date:                e.date,
    amount:              e.amount,
    status:              e.status,
    employeeId:          e.employeeId,
    employeeName,
    branchId:            e.branchId ?? "",
    requestItems:        (e.items as any[]) ?? [],
    attachments:         (e.attachments as any[]) ?? [],
    notes:               e.notes ?? "",
    approvedBy:          e.approvedBy ?? null,
    approvedAt:          e.approvedAt ?? null,
    reimbursedInPayroll: e.reimbursedInPayroll ?? null,
  };
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const data = await req.json();
  const { id } = params; // this is the number (EXP-001) or cuid

  const exp = await prisma.expense.findFirst({
    where: { OR: [{ number: id }, { id }] },
  });
  if (!exp) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const updated = await prisma.expense.update({
    where: { id: exp.id },
    data: {
      ...(data.status !== undefined && { status: data.status }),
      ...(data.approvedBy !== undefined && { approvedBy: data.approvedBy }),
      ...(data.approvedAt !== undefined && { approvedAt: data.approvedAt }),
      ...(data.reimbursedInPayroll !== undefined && { reimbursedInPayroll: data.reimbursedInPayroll }),
    },
  });

  const emp = await prisma.employee.findUnique({ where: { id: updated.employeeId }, select: { name: true } });
  return NextResponse.json(mapExpense(updated, emp?.name ?? ""));
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const exp = await prisma.expense.findFirst({
    where: { OR: [{ number: params.id }, { id: params.id }] },
  });
  if (!exp) return NextResponse.json({ error: "Not found." }, { status: 404 });

  await prisma.expense.delete({ where: { id: exp.id } });
  return NextResponse.json({ ok: true });
}
