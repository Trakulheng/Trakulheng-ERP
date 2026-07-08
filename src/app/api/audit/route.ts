import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (!["admin", "manager"].includes(user.role)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const entity  = searchParams.get("entity") || undefined;
  const action  = searchParams.get("action") || undefined;
  const userId  = searchParams.get("userId") || undefined;
  const limit   = Math.min(parseInt(searchParams.get("limit") ?? "100"), 500);
  const offset  = parseInt(searchParams.get("offset") ?? "0");

  const logs = await prisma.auditLog.findMany({
    where: {
      ...(entity  && { entity }),
      ...(action  && { action }),
      ...(userId  && { userId }),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });

  const total = await prisma.auditLog.count({
    where: {
      ...(entity  && { entity }),
      ...(action  && { action }),
      ...(userId  && { userId }),
    },
  });

  return NextResponse.json({ logs, total });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();

  const body = await req.json();
  const { action, entity, entityId, details } = body;
  if (!action || !entity) return NextResponse.json({ error: "action and entity are required." }, { status: 400 });

  const log = await prisma.auditLog.create({
    data: {
      userId:   user?.id     ?? null,
      userName: user?.name   ?? null,
      userRole: user?.role   ?? null,
      action,
      entity,
      entityId: entityId ?? null,
      details:  details  ?? null,
    },
  });

  return NextResponse.json(log, { status: 201 });
}
