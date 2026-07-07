import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  let menuOrder: string[] | null = null;
  try {
    const rolePerm = await prisma.rolePermission.findUnique({ where: { role: user.role } });
    if (Array.isArray(rolePerm?.menuOrder)) menuOrder = rolePerm.menuOrder as string[];
  } catch {}

  // Resolve linked employee record
  let employeeRecord: { id: string; employeeId: string; name: string; branchId: string | null } | null = null;
  try {
    if (user.employeeRecordId) {
      employeeRecord = await prisma.employee.findUnique({
        where: { id: user.employeeRecordId },
        select: { id: true, employeeId: true, name: true, branchId: true },
      });
    }
    if (!employeeRecord) {
      employeeRecord = await prisma.employee.findFirst({
        where: { OR: [{ workEmail: user.email }, { personalEmail: user.email }] },
        select: { id: true, employeeId: true, name: true, branchId: true },
      });
    }
  } catch {}

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    hasPIN: !!user.pinSetAt,
    menuOrder,
    employeePrismaId: employeeRecord?.id ?? null,
    employeeCode:     employeeRecord?.employeeId ?? null,
    employeeName:     employeeRecord?.name ?? null,
    employeeBranchId: employeeRecord?.branchId ?? null,
  });
}
