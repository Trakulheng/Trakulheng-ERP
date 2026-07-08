import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, createInviteToken } from "@/lib/auth";
import { sendInviteEmail } from "@/lib/email";

function mapUser(u: any) {
  const lastSession = Array.isArray(u.sessions) ? u.sessions[0] : null;
  return {
    id:          u.id,
    employeeId:  u.employeeRecordId ?? "",
    name:        u.name ?? "",
    email:       u.email,
    role:        u.role,
    branchId:    Array.isArray(u.branchIds) ? (u.branchIds[0] ?? "") : "",
    branchIds:   Array.isArray(u.branchIds) ? u.branchIds : [],
    status:      u.emailVerified ? "active" : "pending",
    startDate:   u.accessStartDate ?? "",
    endDate:     u.accessEndDate ?? null,
    lastLogin:   lastSession ? lastSession.createdAt.toISOString() : u.createdAt.toISOString(),
    createdAt:   u.createdAt.toISOString().split("T")[0],
  };
}

export async function GET() {
  const currentUser = await getSessionUser();
  if (!currentUser) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (currentUser.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const users = await prisma.user.findMany({
    include: { sessions: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(users.map(mapUser));
}

export async function POST(req: Request) {
  const currentUser = await getSessionUser();
  if (!currentUser) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (currentUser.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const data = await req.json();

  if (!data.email || !data.name) {
    return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
  }

  if (!data.employeeId) {
    return NextResponse.json({ error: "An employee record must be linked." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: "A user with this email already exists." }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      email:            data.email.toLowerCase(),
      name:             data.name,
      password:         null,
      role:             data.role ?? "staff",
      emailVerified:    false,
      employeeRecordId: data.employeeId || null,
      branchIds:        data.branchIds ?? [],
      accessStartDate:  data.startDate || null,
      accessEndDate:    data.endDate || null,
    },
    include: { sessions: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  const token = await createInviteToken(user.id);

  try {
    await sendInviteEmail(user.email, user.name ?? user.email, token);
  } catch (err) {
    console.error("[invite-email]", err);
  }

  return NextResponse.json(mapUser(user), { status: 201 });
}
