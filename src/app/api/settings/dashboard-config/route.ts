import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { DEFAULT_WIDGETS, type WidgetConfig } from "@/lib/dashboard-widgets";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role") ?? user.role;

  const config = await prisma.dashboardConfig.findUnique({ where: { role } });
  if (!config) {
    return NextResponse.json({ role, widgets: DEFAULT_WIDGETS[role] ?? DEFAULT_WIDGETS.staff });
  }

  return NextResponse.json({ role, widgets: config.widgets });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (!["admin", "manager"].includes(user.role)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { role, widgets } = await req.json() as { role: string; widgets: WidgetConfig[] };
  if (!role || !Array.isArray(widgets)) {
    return NextResponse.json({ error: "role and widgets required." }, { status: 400 });
  }

  const config = await prisma.dashboardConfig.upsert({
    where:  { role },
    update: { widgets },
    create: { role, widgets },
  });

  return NextResponse.json(config);
}
