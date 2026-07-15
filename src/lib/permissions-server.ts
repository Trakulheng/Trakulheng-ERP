import { prisma } from "@/lib/db";

/**
 * Server-side check against the Role Permissions matrix.
 * Admin always passes; other roles need the module action granted.
 */
export async function hasModulePermission(
  user: { role: string },
  moduleId: string,
  action: "view" | "edit" | "create"
): Promise<boolean> {
  if (user.role === "admin") return true;
  const rp = await prisma.rolePermission.findUnique({ where: { role: user.role } });
  const m = (rp?.permissions as Record<string, Record<string, boolean>> | null)?.[moduleId];
  return !!m?.[action];
}
