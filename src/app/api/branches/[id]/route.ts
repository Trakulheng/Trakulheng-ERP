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
    businessHours:        b.businessHours ?? null,
  };
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const data = await req.json();

  const branch = await prisma.branch.update({
    where: { id: params.id },
    data: {
      ...(data.code       !== undefined && { code:               String(data.code).toUpperCase() }),
      ...(data.name       !== undefined && { name:               String(data.name) }),
      ...(data.brand      !== undefined && { brand:              data.brand || null }),
      ...(data.status     !== undefined && { status:             data.status }),
      ...(data.isHeadOffice !== undefined && { isHeadOffice:     data.isHeadOffice }),
      ...(data.address    !== undefined && { address:            data.address || null }),
      ...(data.googleMapsUrl !== undefined && { googleMapsUrl:   data.googleMapsUrl || null }),
      ...(data.location   !== undefined && { location:           data.location || null }),
      ...(data.floor      !== undefined && { floor:              data.floor || null }),
      ...(data.sizeSqm    !== undefined && { sizeSqm:            typeof data.sizeSqm === "number" ? data.sizeSqm : null }),
      ...(data.phone      !== undefined && { phone:              data.phone || null }),
      ...(data.email      !== undefined && { email:              data.email || null }),
      ...(data.lineId     !== undefined && { lineId:             data.lineId || null }),
      ...(data.managerId  !== undefined && { managerId:          data.managerId || null }),
      ...(data.manager    !== undefined && { manager:            data.manager || null }),
      ...(data.startDate  !== undefined && { startDate:          data.startDate || null }),
      ...(data.assignedEmployees !== undefined && { assignedEmployees: data.assignedEmployees }),
      ...(data.lat        !== undefined && { lat:                typeof data.lat === "number" ? data.lat : (parseFloat(String(data.lat ?? "")) || 0) }),
      ...(data.lng        !== undefined && { lng:                typeof data.lng === "number" ? data.lng : (parseFloat(String(data.lng ?? "")) || 0) }),
      ...(data.radiusMeters !== undefined && { radiusMeters:     data.radiusMeters }),
      ...(data.rentFrom   !== undefined && { rentFrom:           data.rentFrom || null }),
      ...(data.rentTo     !== undefined && { rentTo:             data.rentTo || null }),
      ...(data.rentMonthly !== undefined && { rentMonthly:       typeof data.rentMonthly === "number" ? data.rentMonthly : null }),
      ...(data.lessorName !== undefined && { lessorName:         data.lessorName || null }),
      ...(data.lessorContactFirst !== undefined && { lessorContactFirst: data.lessorContactFirst || null }),
      ...(data.lessorContactLast  !== undefined && { lessorContactLast:  data.lessorContactLast || null }),
      ...(data.lessorContactTel   !== undefined && { lessorContactTel:   data.lessorContactTel || null }),
      ...(data.lessorContactEmail !== undefined && { lessorContactEmail: data.lessorContactEmail || null }),
      ...(data.lessorContactLineId !== undefined && { lessorContactLineId: data.lessorContactLineId || null }),
      ...(data.rentalDocs !== undefined && { rentalDocs:         data.rentalDocs }),
      ...(data.businessHours !== undefined && { businessHours:   data.businessHours }),
    },
  });

  return NextResponse.json(mapBranch(branch));
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  await prisma.branch.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
