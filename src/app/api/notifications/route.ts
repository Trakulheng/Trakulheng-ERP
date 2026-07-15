import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getManagedEmployeeIds, getOwnEmployeeId } from "@/lib/leave-scope";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const today = new Date().toISOString().slice(0, 10);
  const isReviewer = ["admin", "manager"].includes(user.role);
  const managed = isReviewer ? await getManagedEmployeeIds(user) : [];
  const ownEmpId = await getOwnEmployeeId(user);
  const decisionsSince = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const [leaveRequests, myDecisions, shiftChanges, lowStock, overdueTasks] = await Promise.all([
    // Pending approvals — routed to the branch manager (admin sees all)
    isReviewer
      ? prisma.leaveRequest.findMany({
          where: {
            status: "pending",
            ...(managed !== null ? { employeeId: { in: managed } } : {}),
          },
          include: { employee: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: 5,
        })
      : Promise.resolve([]),
    // Decisions on my own requests (approved/rejected in the last 14 days)
    ownEmpId
      ? prisma.leaveRequest.findMany({
          where: {
            employeeId: ownEmpId,
            status: { in: ["approved", "rejected"] },
            reviewedAt: { gte: decisionsSince },
          },
          orderBy: { reviewedAt: "desc" },
          take: 5,
        })
      : Promise.resolve([]),
    prisma.shiftChangeRequest.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.product.findMany({
      where: { stock: { lte: prisma.product.fields.minStock } },
      orderBy: { stock: "asc" },
      take: 5,
    }).catch(() => []),
    prisma.task.findMany({
      where: {
        status: { in: ["pending", "in_progress"] },
        dueDate: { lt: today },
      },
      orderBy: { dueDate: "asc" },
      take: 5,
    }).catch(() => []),
  ]);

  // Low stock: filter in JS since Prisma can't compare two columns directly
  const allProducts = await prisma.product.findMany({
    where: { stock: { gt: 0 } },
    select: { id: true, name: true, sku: true, stock: true, minStock: true },
  }).catch(() => []);
  const lowStockItems = allProducts.filter((p) => p.stock <= p.minStock).slice(0, 5);

  const notifications = [
    ...leaveRequests.map((lr) => ({
      id: `leave-${lr.id}`,
      type: "leave" as const,
      title: "Leave request pending",
      body: `${lr.employee.name} — ${lr.type} (${lr.days} day${lr.days !== 1 ? "s" : ""})`,
      href: "/hr/leave",
      createdAt: lr.createdAt.toISOString(),
      read: false,
    })),
    ...myDecisions.map((lr) => ({
      id: `leave-decision-${lr.id}-${lr.status}`,
      type: "leave" as const,
      title: `Leave request ${lr.status}`,
      body: `Your ${lr.type} (${lr.fromDate.toISOString().slice(0, 10)} → ${lr.toDate.toISOString().slice(0, 10)}) was ${lr.status}${lr.reviewNote ? ` — "${lr.reviewNote}"` : ""}`,
      href: "/hr/leave",
      createdAt: (lr.reviewedAt ?? lr.updatedAt).toISOString(),
      read: false,
    })),
    ...shiftChanges.map((sc) => ({
      id: `shift-${sc.id}`,
      type: "shift" as const,
      title: "Shift change requested",
      body: `Employee on ${sc.date} — ${sc.reason.slice(0, 60)}`,
      href: "/hr/shifts",
      createdAt: sc.createdAt.toISOString(),
      read: false,
    })),
    ...lowStockItems.map((p) => ({
      id: `stock-${p.id}`,
      type: "stock" as const,
      title: "Low stock alert",
      body: `${p.name} — ${p.stock} left (min ${p.minStock})`,
      href: "/inventory/products",
      createdAt: new Date().toISOString(),
      read: false,
    })),
    ...(overdueTasks as any[]).map((t) => ({
      id: `task-${t.id}`,
      type: "task" as const,
      title: "Overdue task",
      body: `${t.title} — due ${t.dueDate}`,
      href: "/tasks",
      createdAt: t.updatedAt instanceof Date ? t.updatedAt.toISOString() : new Date().toISOString(),
      read: false,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json(notifications);
}
