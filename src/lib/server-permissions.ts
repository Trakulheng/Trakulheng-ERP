import { prisma } from "@/lib/db";

type Action = "create" | "edit" | "view" | "sidebar";

export async function canDoAction(role: string, moduleId: string, action: Action): Promise<boolean> {
  if (role === "admin") return true;
  const rp = await prisma.rolePermission.findUnique({ where: { role } });
  if (!rp) return false;
  const perms = rp.permissions as Record<string, Record<string, boolean>>;
  const m = perms?.[moduleId];
  if (!m) return true; // module not in permission matrix → unrestricted
  return !!(m[action]);
}
