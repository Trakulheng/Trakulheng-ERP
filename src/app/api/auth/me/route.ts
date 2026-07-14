import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  let employeePrismaId: string | null = null;
  let employeeName: string | null = null;

  let employmentType: string | null = null;

  if (user.employeeRecordId) {
    // Primary: user account is explicitly linked to an employee record.
    // employeeRecordId may hold either the cuid or the EMP-xxx code.
    const emp = await prisma.employee.findFirst({
      where: { OR: [{ id: user.employeeRecordId }, { employeeId: user.employeeRecordId }] },
      select: { id: true, name: true, employmentType: true },
    });
    if (emp) { employeePrismaId = emp.id; employeeName = emp.name; employmentType = emp.employmentType; }
  }

  if (!employeePrismaId && user.email) {
    // Fallback 1: find employee whose work or personal email matches the login email
    const emp = await prisma.employee.findFirst({
      where: { OR: [{ workEmail: user.email }, { personalEmail: user.email }] },
      select: { id: true, name: true, employmentType: true },
    });
    if (emp) { employeePrismaId = emp.id; employeeName = emp.name; employmentType = emp.employmentType; }
  }

  if (!employeePrismaId && user.name) {
    // Fallback 2: match by display name (only when unique — avoids ambiguity)
    const matches = await prisma.employee.findMany({
      where: { name: user.name },
      select: { id: true, name: true, employmentType: true },
      take: 2,
    });
    if (matches.length === 1) { employeePrismaId = matches[0].id; employeeName = matches[0].name; employmentType = matches[0].employmentType; }
  }

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    employeePrismaId,
    employeeName,
    employmentType,
  });
}
