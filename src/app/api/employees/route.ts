import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

function mapEmployee(e: any) {
  return {
    prismaId:           e.id,
    id:                 e.employeeId,
    firstName:          e.firstName ?? "",
    lastName:           e.lastName ?? "",
    firstNameTh:        e.firstNameTh ?? undefined,
    lastNameTh:         e.lastNameTh ?? undefined,
    nickname:           e.nickname ?? undefined,
    name:               e.name,
    gender:             e.gender ?? "male",
    dob:                e.dob ?? undefined,
    nationalId:         e.nationalId ?? undefined,
    phone:              e.phone ?? undefined,
    personalEmail:      e.personalEmail ?? undefined,
    workEmail:          e.workEmail ?? undefined,
    department:         e.department,
    position:           e.position,
    employmentType:     e.employmentType ?? "full-time",
    branchId:           e.branchId ?? undefined,
    hireDate:           e.hireDate ?? "",
    probationEndDate:   e.probationEndDate ?? undefined,
    managerId:          e.managerId ?? undefined,
    salary:             e.salary,
    hourlyRate:         e.hourlyRate ?? undefined,
    bankAccounts:       e.bankAccounts ?? undefined,
    ssn:                e.ssn ?? undefined,
    ssfFundType:        e.ssfFundType ?? undefined,
    ssfEnrollmentDate:  e.ssfEnrollmentDate ?? undefined,
    ssfHospital:        e.ssfHospital ?? undefined,
    ssfStatus:          e.ssfStatus ?? undefined,
    emergencyName:      e.emergencyName ?? undefined,
    emergencyRelation:  e.emergencyRelation ?? undefined,
    emergencyPhone:     e.emergencyPhone ?? undefined,
    photo:              e.photo ?? undefined,
    documents:          e.documents ?? undefined,
    status:             e.status ?? "active",
    verified:           e.verified ?? false,
    verifiedDate:       e.verifiedDate ?? undefined,
  };
}

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get("branchId");
  const status   = searchParams.get("status");

  const employees = await prisma.employee.findMany({
    where: {
      ...(branchId ? { branchId } : {}),
      ...(status   ? { status }   : {}),
    },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(employees.map(mapEmployee));
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const data = await req.json();

  // Generate employeeId server-side if not provided or use the one from frontend
  const count = await prisma.employee.count();
  const employeeId = (data.id && /^EMP-\d+$/.test(data.id))
    ? data.id
    : `EMP-${String(count + 1).padStart(3, "0")}`;

  // Check uniqueness — if duplicate, auto-increment
  let finalId = employeeId;
  const existing = await prisma.employee.findUnique({ where: { employeeId } });
  if (existing) {
    const allIds = await prisma.employee.findMany({ select: { employeeId: true } });
    const nums = allIds.map((e: { employeeId: string }) => parseInt(e.employeeId.replace("EMP-", ""), 10)).filter(Boolean);
    const next = Math.max(0, ...nums) + 1;
    finalId = `EMP-${String(next).padStart(3, "0")}`;
  }

  const employee = await prisma.employee.create({
    data: {
      employeeId:        finalId,
      name:              data.name ?? `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim(),
      firstName:         data.firstName || null,
      lastName:          data.lastName || null,
      firstNameTh:       data.firstNameTh || null,
      lastNameTh:        data.lastNameTh || null,
      nickname:          data.nickname || null,
      gender:            data.gender || "male",
      dob:               data.dob || null,
      nationalId:        data.nationalId || null,
      phone:             data.phone || null,
      personalEmail:     data.personalEmail || null,
      workEmail:         data.workEmail || null,
      department:        data.department || "",
      position:          data.position || "",
      employmentType:    data.employmentType || "full-time",
      branchId:          data.branchId || null,
      hireDate:          data.hireDate || null,
      probationEndDate:  data.probationEndDate || null,
      managerId:         data.managerId || null,
      salary:            typeof data.salary === "number" ? data.salary : 0,
      hourlyRate:        typeof data.hourlyRate === "number" ? data.hourlyRate : null,
      bankAccounts:      data.bankAccounts ?? [],
      ssn:               data.ssn || null,
      ssfFundType:       data.ssfFundType || null,
      ssfEnrollmentDate: data.ssfEnrollmentDate || null,
      ssfHospital:       data.ssfHospital || null,
      ssfStatus:         data.ssfStatus || null,
      emergencyName:     data.emergencyName || null,
      emergencyRelation: data.emergencyRelation || null,
      emergencyPhone:    data.emergencyPhone || null,
      photo:             data.photo || null,
      documents:         data.documents ?? [],
      status:            data.status || "active",
      verified:          data.verified ?? false,
      verifiedDate:      data.verifiedDate || null,
    },
  });

  return NextResponse.json(mapEmployee(employee), { status: 201 });
}
