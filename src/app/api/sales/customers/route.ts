import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

function mapProfile(p: any) {
  return {
    id:            p.id,
    customerId:    p.customerId,
    customerType:  p.customerType,
    firstName:     p.firstName ?? "",
    lastName:      p.lastName  ?? "",
    companyName:   p.companyName ?? "",
    gender:        p.gender ?? "male",
    dob:           p.dob ?? "",
    nationalId:    p.nationalId ?? "",
    taxId:         p.taxId ?? "",
    registrationNo: p.registrationNo ?? "",
    contactPerson: p.contactPerson ?? "",
    contactTitle:  p.contactTitle ?? "",
    businessType:  p.businessType ?? "Other",
    website:       p.website ?? "",
    phone:         p.phone,
    email:         p.email ?? "",
    address:       p.address ?? "",
    notes:         p.notes ?? "",
    tags:          (p.tags as string[]) ?? [],
    branchId:      p.branchId ?? null,
    source:        p.source ?? "manual",
    status:        p.status,
    joinDate:      p.joinDate ?? p.createdAt?.toISOString().split("T")[0] ?? "",
    totalSpend:    p.totalSpend,
    createdAt:     p.createdAt,
  };
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const profiles = await prisma.customerProfile.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(profiles.map(mapProfile));
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const data = await req.json();

  const profile = await prisma.customerProfile.create({
    data: {
      customerId:    data.customerId    ?? null,
      customerType:  data.customerType  ?? "individual",
      firstName:     data.firstName     ?? null,
      lastName:      data.lastName      ?? null,
      companyName:   data.companyName   ?? null,
      gender:        data.gender        ?? null,
      dob:           data.dob           ?? null,
      nationalId:    data.nationalId    ?? null,
      taxId:         data.taxId         ?? null,
      registrationNo: data.registrationNo ?? null,
      contactPerson: data.contactPerson ?? null,
      contactTitle:  data.contactTitle  ?? null,
      businessType:  data.businessType  ?? null,
      website:       data.website       ?? null,
      phone:         data.phone,
      email:         data.email         ?? null,
      address:       data.address       ?? null,
      notes:         data.notes         ?? null,
      tags:          data.tags          ?? [],
      branchId:      data.branchId      ?? null,
      source:        data.source        ?? "manual",
      status:        data.status        ?? "active",
      joinDate:      data.joinDate      ?? new Date().toISOString().split("T")[0],
      totalSpend:    data.totalSpend    ?? 0,
    },
  });
  return NextResponse.json(mapProfile(profile), { status: 201 });
}
