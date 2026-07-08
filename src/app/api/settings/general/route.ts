import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

const DEFAULTS = {
  branding: {
    appName: "Trakulheng",
    appSubtitle: "Enterprise System",
    logoBase64: null as string | null,
  },
  company: {
    name: "บริษัท ตระกูลเฮง จำกัด",
    nameEn: "Trakulheng Co., Ltd.",
    taxId: "0105562001234",
    address: "88 Silom Rd, Bang Rak, Bangkok 10500",
    phone: "02-100-1000",
    email: "info@trakulheng.co.th",
    website: "www.trakulheng.co.th",
    lineId: "@trakulheng",
  },
  hours: {
    mon: { open: true,  start: "08:00", end: "17:00" },
    tue: { open: true,  start: "08:00", end: "17:00" },
    wed: { open: true,  start: "08:00", end: "17:00" },
    thu: { open: true,  start: "08:00", end: "17:00" },
    fri: { open: true,  start: "08:00", end: "17:00" },
    sat: { open: true,  start: "08:00", end: "13:00" },
    sun: { open: false, start: "08:00", end: "17:00" },
  },
  invoice: {
    prefix: "INV",
    nextNumber: 1042,
    paymentTermsDays: 30,
    vatRate: 7,
    vatInclusive: false,
    footerText: "Thank you for your business. Please pay within the due date.",
  },
  system: {
    currency: "THB",
    timezone: "Asia/Bangkok",
    language: "th",
    fiscalYearStart: "January",
  },
  social: {
    facebook: "facebook.com/DDKEnterprise",
    instagram: "@ddkenterprise",
    lineOA: "@ddkenterprise",
    tiktok: "@ddk.enterprise",
    youtube: "",
  },
};

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const row = await prisma.generalSetting.findUnique({ where: { id: "singleton" } });
  return NextResponse.json(row?.data ?? DEFAULTS);
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const data = await req.json();
  const row = await prisma.generalSetting.upsert({
    where:  { id: "singleton" },
    update: { data },
    create: { id: "singleton", data },
  });
  return NextResponse.json(row.data);
}
