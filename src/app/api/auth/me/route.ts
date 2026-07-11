import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  let employeePrismaId: string | null = null;
  let employeeName: string | null = null;

  if (user.employeeRecordId) {
    // Primary: user account is explicitly linked to an employee record
    const emp = await prisma.employee.findUnique({
      where: { id: user.employeeRecordId },
      select: { id: true, name: true },
    });
    if (emp) { employeePrismaId = emp.id; employeeName = emp.name; }
  }

  if (!employeePrismaId && user.email) {
    // Fallback 1: find employee whose work or personal email matches the login email
    const emp = await prisma.employee.findFirst({
      where: { OR: [{ workEmail: user.email }, { personalEmail: user.email }] },
      select: { id: true, name: true },
    });
    if (emp) { employeePrismaId = emp.id; employeeName = emp.name; }
  }

  if (!employeePrismaId && user.name) {
    // Fallback 2: match by display name (only when unique — avoids ambiguity)
    const matches = await prisma.employee.findMany({
      where: { name: user.name },
      select: { id: true, name: true },
      take: 2,
    });
    if (matches.length === 1) { employeePrismaId = matches[0].id; employeeName = matches[0].name; }
  }

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    employeePrismaId,
    employeeName,
  });
}
