import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

function mapBranch(b: any) {
  const assigned = (b.assignedEmployees as any[]) ?? [];
  return {
    id:                   b.id,
    code:                 b.code,
    name:                 b.name,
    brand:                b.brand ?? "",
    status:               b.status as "active" | "inactive",
    isHeadOffice:         b.isHeadOffice,
    address:              b.address ?? "",
    googleMapsUrl:        b.googleMapsUrl ?? "",
    location:             b.location ?? "",
    floor:                b.floor ?? "",
    sizeSqm:              b.sizeSqm ?? 0,
    phone:                b.phone ?? "",
    email:                b.email ?? "",
    lineId:               b.lineId ?? "",
    managerId:            b.managerId ?? "",
    manager:              b.manager ?? "",
    startDate:            b.startDate ?? "",
    assignedEmployees:    assigned,
    assignedEmployeeIds:  assigned.map((e: any) => e.id),
    employees:            assigned.length,
    lat:                  b.lat ?? 0,
    lng:                  b.lng ?? 0,
    radiusMeters:         b.radiusMeters ?? 200,
    rentFrom:             b.rentFrom ?? "",
    rentTo:               b.rentTo ?? "",
    rentMonthly:          b.rentMonthly ?? "",
    lessorName:           b.lessorName ?? "",
    lessorContactFirst:   b.lessorContactFirst ?? "",
    lessorContactLast:    b.lessorContactLast ?? "",
    lessorContactTel:     b.lessorContactTel ?? "",
    lessorContactEmail:   b.lessorContactEmail ?? "",
    lessorContactLineId:  b.lessorContactLineId ?? "",
    rentalDocs:           (b.rentalDocs as string[]) ?? [],
  };
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const branches = await prisma.branch.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(branches.map(mapBranch));
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const data = await req.json();

  const branch = await prisma.branch.create({
    data: {
      code:               String(data.code ?? "").toUpperCase(),
      name:               String(data.name ?? ""),
      brand:              data.brand || null,
      status:             data.status || "active",
      isHeadOffice:       data.isHeadOffice ?? false,
      address:            data.address || null,
      googleMapsUrl:      data.googleMapsUrl || null,
      location:           data.location || null,
      floor:              data.floor || null,
      sizeSqm:            typeof data.sizeSqm === "number" ? data.sizeSqm : null,
      phone:              data.phone || null,
      email:              data.email || null,
      lineId:             data.lineId || null,
      managerId:          data.managerId || null,
      manager:            data.manager || null,
      startDate:          data.startDate || null,
      assignedEmployees:  data.assignedEmployees ?? [],
      lat:                data.lat ?? 0,
      lng:                data.lng ?? 0,
      radiusMeters:       data.radiusMeters ?? 200,
      rentFrom:           data.rentFrom || null,
      rentTo:             data.rentTo || null,
      rentMonthly:        typeof data.rentMonthly === "number" ? data.rentMonthly : null,
      lessorName:         data.lessorName || null,
      lessorContactFirst: data.lessorContactFirst || null,
      lessorContactLast:  data.lessorContactLast || null,
      lessorContactTel:   data.lessorContactTel || null,
      lessorContactEmail: data.lessorContactEmail || null,
      lessorContactLineId:data.lessorContactLineId || null,
      rentalDocs:         data.rentalDocs ?? [],
    },
  });

  return NextResponse.json(mapBranch(branch), { status: 201 });
}
