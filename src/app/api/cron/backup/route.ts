import { NextRequest, NextResponse } from "next/server";
import { createBackupSnapshot, pruneOldBackups, getBackupRetentionDays } from "@/lib/backup";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const retentionDays = await getBackupRetentionDays();
    const label = `Auto · ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`;
    const snapshot = await createBackupSnapshot(label);
    const pruned = await pruneOldBackups(retentionDays);

    console.log(`[cron/backup] Created snapshot ${snapshot.id} (${snapshot.sizeBytes} bytes), pruned ${pruned} old snapshots`);

    return NextResponse.json({ ok: true, snapshotId: snapshot.id, sizeBytes: snapshot.sizeBytes, pruned });
  } catch (err) {
    console.error("[cron/backup]", err);
    return NextResponse.json({ error: "Backup failed" }, { status: 500 });
  }
}
