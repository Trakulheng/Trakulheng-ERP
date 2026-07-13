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

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const currentUser = await getSessionUser();
  if (!currentUser) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (currentUser.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const data = await req.json();
  const update: Record<string, unknown> = {};

  if (data.name !== undefined)       update.name             = data.name;
  if (data.email !== undefined)      update.email            = data.email.toLowerCase();
  if (data.role !== undefined)       update.role             = data.role;
  if (data.employeeId !== undefined) update.employeeRecordId = data.employeeId || null;
  if (data.branchIds !== undefined)  update.branchIds        = data.branchIds;
  if (data.startDate !== undefined)  update.accessStartDate  = data.startDate || null;
  if (data.endDate !== undefined)    update.accessEndDate    = data.endDate || null;

  const user = await prisma.user.update({
    where: { id: params.id },
    data:  update,
    include: { sessions: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  return NextResponse.json(mapUser(user));
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const currentUser = await getSessionUser();
  if (!currentUser) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (currentUser.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  if (currentUser.id === params.id) {
    return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
  }

  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const currentUser = await getSessionUser();
  if (!currentUser) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (currentUser.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { action } = await req.json();

  if (action === "resend-invite") {
    const user = await prisma.user.findUnique({ where: { id: params.id } });
    if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });
    if (user.emailVerified) return NextResponse.json({ error: "User has already accepted the invite." }, { status: 400 });

    const token = await createInviteToken(user.id);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://erp.trakulheng.com";
    const inviteLink = `${appUrl}/auth/accept-invite?token=${token}`;

    let emailSent = false;
    try {
      await sendInviteEmail(user.email, user.name ?? user.email, token);
      emailSent = true;
    } catch (err) {
      console.error("[resend-invite]", err);
    }
    return NextResponse.json({ ok: true, emailSent, inviteLink });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
