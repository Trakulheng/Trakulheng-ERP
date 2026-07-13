import { prisma } from "./db";

export async function createBackupSnapshot(label: string) {
  const [
    branches, departments, employees, leaveTypes, brands,
    productCategories, supplierCategories, generalSetting,
    rolePermissions, products, suppliers, customers,
    invoices, expenses, expenseLimits, salesOrders,
    purchaseOrders, taskLists, tasks,
  ] = await Promise.all([
    prisma.branch.findMany(),
    prisma.department.findMany(),
    prisma.employee.findMany(),
    prisma.leaveType.findMany(),
    prisma.brand.findMany(),
    prisma.productCategory.findMany(),
    prisma.supplierCategory.findMany(),
    prisma.generalSetting.findMany(),
    prisma.rolePermission.findMany(),
    prisma.product.findMany(),
    prisma.supplier.findMany(),
    prisma.customer.findMany(),
    prisma.invoice.findMany(),
    prisma.expense.findMany(),
    prisma.expenseLimit.findMany(),
    prisma.salesOrder.findMany({ include: { lines: true } }),
    prisma.purchaseOrder.findMany(),
    prisma.taskList.findMany(),
    prisma.task.findMany(),
  ]);

  const data = {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    data: {
      branches, departments, employees, leaveTypes, brands,
      productCategories, supplierCategories, generalSetting,
      rolePermissions, products, suppliers, customers,
      invoices, expenses, expenseLimits, salesOrders,
      purchaseOrders, taskLists, tasks,
    },
  };

  const sizeBytes = Buffer.byteLength(JSON.stringify(data), "utf8");

  const snapshot = await prisma.backupSnapshot.create({
    data: { label, sizeBytes, data: data as unknown as Parameters<typeof prisma.backupSnapshot.create>[0]["data"]["data"] },
  });

  return snapshot;
}

export async function pruneOldBackups(retentionDays: number) {
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  const deleted = await prisma.backupSnapshot.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });
  return deleted.count;
}

export async function getBackupRetentionDays(): Promise<number> {
  const row = await prisma.generalSetting.findUnique({ where: { id: "singleton" } });
  const d = row?.data as Record<string, unknown> | null;
  const b = d?.backup as Record<string, unknown> | undefined;
  return typeof b?.retentionDays === "number" ? b.retentionDays : 30;
}
