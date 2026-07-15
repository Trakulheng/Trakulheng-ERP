import { prisma } from "@/lib/db";

interface SessionUserLike {
  role: string;
  branchIds?: unknown;
  employeeRecordId?: string | null;
}

/**
 * Employees whose leave requests this user may see and review.
 * - admin  → null (no restriction, sees all)
 * - manager → employees of the branches in the manager's Branch Access
 *   (branch membership comes from the branch's assignedEmployees list or
 *   employee.branchId). Leave requests route to branch managers by default.
 * - everyone else → [] (own requests only, resolved separately)
 */
export async function getManagedEmployeeIds(user: SessionUserLike): Promise<string[] | null> {
  if (user.role === "admin") return null;
  if (user.role !== "manager") return [];

  const branchIds = Array.isArray(user.branchIds) ? (user.branchIds as string[]) : [];
  if (branchIds.length === 0) return [];

  const branches = await prisma.branch.findMany({ where: { id: { in: branchIds } } });
  const assignedCodes = new Set<string>();
  for (const b of branches) {
    const assigned = (b.assignedEmployees as { id: string }[] | null) ?? [];
    for (const a of assigned) assignedCodes.add(a.id);
  }

  const members = await prisma.employee.findMany({
    where: {
      OR: [
        { branchId: { in: branchIds } },
        { employeeId: { in: [...assignedCodes] } },
      ],
    },
    select: { id: true },
  });
  return members.map((m) => m.id);
}

/** Resolve the user's own employee cuid (employeeRecordId may be the EMP-xxx code). */
export async function getOwnEmployeeId(user: SessionUserLike): Promise<string | null> {
  if (!user.employeeRecordId) return null;
  const emp = await prisma.employee.findFirst({
    where: { OR: [{ id: user.employeeRecordId }, { employeeId: user.employeeRecordId }] },
    select: { id: true },
  });
  return emp?.id ?? null;
}
