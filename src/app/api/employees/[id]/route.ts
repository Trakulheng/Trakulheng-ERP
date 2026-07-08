import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

function mapEmployee(e: any) {
  return {
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

// [id] is the employeeId (EMP-001 format)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const data = await req.json();

  const employee = await prisma.employee.update({
    where: { employeeId: params.id },
    data: {
      ...(data.name             !== undefined && { name:              data.name }),
      ...(data.firstName        !== undefined && { firstName:         data.firstName || null }),
      ...(data.lastName         !== undefined && { lastName:          data.lastName || null }),
      ...(data.firstNameTh      !== undefined && { firstNameTh:       data.firstNameTh || null }),
      ...(data.lastNameTh       !== undefined && { lastNameTh:        data.lastNameTh || null }),
      ...(data.nickname         !== undefined && { nickname:          data.nickname || null }),
      ...(data.gender           !== undefined && { gender:            data.gender }),
      ...(data.dob              !== undefined && { dob:               data.dob || null }),
      ...(data.nationalId       !== undefined && { nationalId:        data.nationalId || null }),
      ...(data.phone            !== undefined && { phone:             data.phone || null }),
      ...(data.personalEmail    !== undefined && { personalEmail:     data.personalEmail || null }),
      ...(data.workEmail        !== undefined && { workEmail:         data.workEmail || null }),
      ...(data.department       !== undefined && { department:        data.department }),
      ...(data.position         !== undefined && { position:          data.position }),
      ...(data.employmentType   !== undefined && { employmentType:    data.employmentType }),
      ...(data.branchId         !== undefined && { branchId:          data.branchId || null }),
      ...(data.hireDate         !== undefined && { hireDate:          data.hireDate || null }),
      ...(data.probationEndDate !== undefined && { probationEndDate:  data.probationEndDate || null }),
      ...(data.managerId        !== undefined && { managerId:         data.managerId || null }),
      ...(data.salary           !== undefined && { salary:            typeof data.salary === "number" ? data.salary : 0 }),
      ...(data.hourlyRate       !== undefined && { hourlyRate:        typeof data.hourlyRate === "number" ? data.hourlyRate : null }),
      ...(data.bankAccounts     !== undefined && { bankAccounts:      data.bankAccounts }),
      ...(data.ssn              !== undefined && { ssn:               data.ssn || null }),
      ...(data.ssfFundType      !== undefined && { ssfFundType:       data.ssfFundType || null }),
      ...(data.ssfEnrollmentDate !== undefined && { ssfEnrollmentDate: data.ssfEnrollmentDate || null }),
      ...(data.ssfHospital      !== undefined && { ssfHospital:       data.ssfHospital || null }),
      ...(data.ssfStatus        !== undefined && { ssfStatus:         data.ssfStatus || null }),
      ...(data.emergencyName    !== undefined && { emergencyName:     data.emergencyName || null }),
      ...(data.emergencyRelation !== undefined && { emergencyRelation: data.emergencyRelation || null }),
      ...(data.emergencyPhone   !== undefined && { emergencyPhone:    data.emergencyPhone || null }),
      ...(data.photo            !== undefined && { photo:             data.photo || null }),
      ...(data.documents        !== undefined && { documents:         data.documents }),
      ...(data.status           !== undefined && { status:            data.status }),
      ...(data.verified         !== undefined && { verified:          data.verified }),
      ...(data.verifiedDate     !== undefined && { verifiedDate:      data.verifiedDate || null }),
    },
  });

  return NextResponse.json(mapEmployee(employee));
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  await prisma.employee.delete({ where: { employeeId: params.id } });
  return NextResponse.json({ ok: true });
}
