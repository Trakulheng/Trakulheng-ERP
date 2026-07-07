import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

const THAI_LAW_DEFAULTS = [
  { name: "Annual Leave",     daysPerYear: 6,  isPaid: true,  carryOver: true,  maxCarryOver: 6,  color: "blue",    thaiLawRef: "Labour Protection Act s.30", order: 0 },
  { name: "Sick Leave",       daysPerYear: 30, isPaid: true,  carryOver: false, maxCarryOver: 0,  color: "red",     thaiLawRef: "Labour Protection Act s.32", order: 1 },
  { name: "Personal Leave",   daysPerYear: 3,  isPaid: false, carryOver: false, maxCarryOver: 0,  color: "violet",  thaiLawRef: "Labour Protection Act s.34", order: 2 },
  { name: "Maternity Leave",  daysPerYear: 98, isPaid: true,  carryOver: false, maxCarryOver: 0,  color: "pink",    thaiLawRef: "Labour Protection Act s.41 (98 days; 45 paid by employer)", order: 3 },
  { name: "Paternity Leave",  daysPerYear: 15, isPaid: false, carryOver: false, maxCarryOver: 0,  color: "indigo",  thaiLawRef: "Company policy (5 days paid common practice)", order: 4 },
  { name: "Military Leave",   daysPerYear: 60, isPaid: true,  carryOver: false, maxCarryOver: 0,  color: "slate",   thaiLawRef: "Labour Protection Act s.35", order: 5 },
  { name: "Sterilisation Leave", daysPerYear: 30, isPaid: true, carryOver: false, maxCarryOver: 0, color: "emerald", thaiLawRef: "Labour Protection Act s.33", order: 6 },
  { name: "Unpaid Leave",     daysPerYear: 0,  isPaid: false, carryOver: false, maxCarryOver: 0,  color: "amber",   thaiLawRef: "By mutual agreement", order: 7 },
];

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const types = await prisma.leaveType.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] });
  return NextResponse.json(types);
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (!["admin", "manager"].includes(user.role)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const body = await req.json();

  // Seed Thai law defaults
  if (body.seedDefaults) {
    const existing = await prisma.leaveType.findMany({ select: { name: true } });
    const existingNames = new Set(existing.map((e) => e.name));
    const toCreate = THAI_LAW_DEFAULTS.filter((d) => !existingNames.has(d.name));
    if (toCreate.length > 0) {
      await prisma.leaveType.createMany({ data: toCreate });
    }
    return NextResponse.json({ seeded: toCreate.length });
  }

  const { name, daysPerYear, isPaid, carryOver, maxCarryOver, requireDoc, color, thaiLawRef } = body;
  if (!name?.trim()) return NextResponse.json({ error: "Name is required." }, { status: 400 });

  const conflict = await prisma.leaveType.findUnique({ where: { name: name.trim() } });
  if (conflict) return NextResponse.json({ error: "Leave type already exists." }, { status: 409 });

  const count = await prisma.leaveType.count();
  const lt = await prisma.leaveType.create({
    data: {
      name: name.trim(),
      daysPerYear: daysPerYear ?? 0,
      isPaid: isPaid ?? true,
      carryOver: carryOver ?? false,
      maxCarryOver: maxCarryOver ?? 0,
      requireDoc: requireDoc ?? false,
      color: color ?? "blue",
      thaiLawRef: thaiLawRef?.trim() || null,
      order: count,
    },
  });
  return NextResponse.json(lt, { status: 201 });
}
