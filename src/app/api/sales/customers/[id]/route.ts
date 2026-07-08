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
    joinDate:      p.joinDate ?? "",
    totalSpend:    p.totalSpend,
  };
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const data = await req.json();
  const p = await prisma.customerProfile.update({
    where: { id: params.id },
    data: {
      ...(data.customerType  !== undefined && { customerType:  data.customerType }),
      ...(data.firstName     !== undefined && { firstName:     data.firstName  ?? null }),
      ...(data.lastName      !== undefined && { lastName:      data.lastName   ?? null }),
      ...(data.companyName   !== undefined && { companyName:   data.companyName ?? null }),
      ...(data.gender        !== undefined && { gender:        data.gender     ?? null }),
      ...(data.dob           !== undefined && { dob:           data.dob        ?? null }),
      ...(data.nationalId    !== undefined && { nationalId:    data.nationalId  ?? null }),
      ...(data.taxId         !== undefined && { taxId:         data.taxId      ?? null }),
      ...(data.registrationNo !== undefined && { registrationNo: data.registrationNo ?? null }),
      ...(data.contactPerson !== undefined && { contactPerson: data.contactPerson ?? null }),
      ...(data.contactTitle  !== undefined && { contactTitle:  data.contactTitle ?? null }),
      ...(data.businessType  !== undefined && { businessType:  data.businessType ?? null }),
      ...(data.website       !== undefined && { website:       data.website    ?? null }),
      ...(data.phone         !== undefined && { phone:         data.phone }),
      ...(data.email         !== undefined && { email:         data.email      ?? null }),
      ...(data.address       !== undefined && { address:       data.address    ?? null }),
      ...(data.notes         !== undefined && { notes:         data.notes      ?? null }),
      ...(data.tags          !== undefined && { tags:          data.tags }),
      ...(data.status        !== undefined && { status:        data.status }),
    },
  });
  return NextResponse.json(mapProfile(p));
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  await prisma.customerProfile.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
