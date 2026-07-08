import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  let employeePrismaId: string | null = null;
  let employeeName: string | null = null;

  if (user.employeeRecordId) {
    const emp = await prisma.employee.findUnique({
      where: { id: user.employeeRecordId },
      select: { id: true, name: true },
    });
    if (emp) {
      employeePrismaId = emp.id;
      employeeName = emp.name;
    }
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
