import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const DEFAULTS = {
  appName: "Trakulheng",
  appSubtitle: "Enterprise System",
  logoBase64: null as string | null,
};

export async function GET() {
  try {
    const row = await prisma.generalSetting.findUnique({ where: { id: "singleton" } });
    const d = row?.data as Record<string, unknown> | null;
    const b = d?.branding as Record<string, unknown> | undefined;
    if (!b) return NextResponse.json(DEFAULTS);
    return NextResponse.json({
      appName: (b.appName as string) ?? DEFAULTS.appName,
      appSubtitle: (b.appSubtitle as string) ?? DEFAULTS.appSubtitle,
      logoBase64: (b.logoBase64 as string | null) ?? null,
    });
  } catch {
    return NextResponse.json(DEFAULTS);
  }
}
