import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { createBackupSnapshot, pruneOldBackups, getBackupRetentionDays } from "@/lib/backup";
import { hasModulePermission } from "@/lib/permissions-server";

export async function GET() {
  const user = await getSessionUser();
  if (!user || !(await hasModulePermission(user, "set_backup", "view"))) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const snapshots = await prisma.backupSnapshot.findMany({
    select: { id: true, label: true, sizeBytes: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(snapshots);
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || !(await hasModulePermission(user, "set_backup", "create"))) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { label } = await req.json().catch(() => ({}));
  const snapshotLabel = label ?? `Manual · ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}`;

  const snapshot = await createBackupSnapshot(snapshotLabel);
  const retentionDays = await getBackupRetentionDays();
  await pruneOldBackups(retentionDays);

  return NextResponse.json({ id: snapshot.id, label: snapshot.label, sizeBytes: snapshot.sizeBytes, createdAt: snapshot.createdAt });
}
