import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Public route — no auth required (customer self-registration via QR)
export async function POST(req: NextRequest) {
  const data = await req.json();

  if (!data.phone || data.phone.trim() === "") {
    return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
  }

  const profile = await prisma.customerProfile.create({
    data: {
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
      businessType:  data.businessType  ?? null,
      phone:         data.phone.trim(),
      email:         data.email         ?? null,
      address:       data.address       ?? null,
      branchId:      data.branchId      ?? null,
      source:        "qr_scan",
      status:        "active",
      joinDate:      new Date().toISOString().split("T")[0],
      totalSpend:    0,
      tags:          [],
    },
  });

  return NextResponse.json({ ok: true, id: profile.id }, { status: 201 });
}
