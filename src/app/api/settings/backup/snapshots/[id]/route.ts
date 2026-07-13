import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { id } = await params;
  const snapshot = await prisma.backupSnapshot.findUnique({ where: { id } });
  if (!snapshot) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const filename = `ddk-backup-${snapshot.label.replace(/[^a-zA-Z0-9]/g, "-").replace(/-+/g, "-")}.json`;

  return new NextResponse(JSON.stringify(snapshot.data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { id } = await params;
  await prisma.backupSnapshot.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
