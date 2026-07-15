import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { hasModulePermission } from "@/lib/permissions-server";

export async function GET() {
  const user = await getSessionUser();
  if (!user || !(await hasModulePermission(user, "set_backup", "view"))) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const [
    branches,
    departments,
    employees,
    leaveTypes,
    brands,
    productCategories,
    supplierCategories,
    generalSetting,
    rolePermissions,
    products,
    suppliers,
    customers,
    invoices,
    expenses,
    expenseLimits,
    salesOrders,
    purchaseOrders,
    taskLists,
    tasks,
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

  const backup = {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    exportedBy: user.email,
    data: {
      branches,
      departments,
      employees,
      leaveTypes,
      brands,
      productCategories,
      supplierCategories,
      generalSetting,
      rolePermissions,
      products,
      suppliers,
      customers,
      invoices,
      expenses,
      expenseLimits,
      salesOrders,
      purchaseOrders,
      taskLists,
      tasks,
    },
  };

  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="ddk-erp-backup-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || !(await hasModulePermission(user, "set_backup", "edit"))) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  let backup: {
    version: string;
    data: Record<string, unknown[]>;
  };

  try {
    backup = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON file." }, { status: 400 });
  }

  if (!backup?.version || !backup?.data) {
    return NextResponse.json({ error: "Invalid backup file format." }, { status: 400 });
  }

  const results: Record<string, number> = {};

  try {
    await prisma.$transaction(async (tx) => {
      // Restore master / settings data (upsert by id)
      if (Array.isArray(backup.data.generalSetting)) {
        for (const row of backup.data.generalSetting as { id: string; data: Record<string, unknown> }[]) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await tx.generalSetting.upsert({ where: { id: row.id }, create: row as any, update: { data: row.data as any } });
        }
        results.generalSetting = backup.data.generalSetting.length;
      }

      if (Array.isArray(backup.data.branches)) {
        for (const row of backup.data.branches as { id: string }[]) {
          await tx.branch.upsert({ where: { id: row.id }, create: row as Parameters<typeof tx.branch.create>[0]["data"], update: row as Parameters<typeof tx.branch.update>[0]["data"] });
        }
        results.branches = backup.data.branches.length;
      }

      if (Array.isArray(backup.data.departments)) {
        for (const row of backup.data.departments as { id: string }[]) {
          await tx.department.upsert({ where: { id: row.id }, create: row as Parameters<typeof tx.department.create>[0]["data"], update: row as Parameters<typeof tx.department.update>[0]["data"] });
        }
        results.departments = backup.data.departments.length;
      }

      if (Array.isArray(backup.data.leaveTypes)) {
        for (const row of backup.data.leaveTypes as { id: string }[]) {
          await tx.leaveType.upsert({ where: { id: row.id }, create: row as Parameters<typeof tx.leaveType.create>[0]["data"], update: row as Parameters<typeof tx.leaveType.update>[0]["data"] });
        }
        results.leaveTypes = backup.data.leaveTypes.length;
      }

      if (Array.isArray(backup.data.brands)) {
        for (const row of backup.data.brands as { id: string }[]) {
          await tx.brand.upsert({ where: { id: row.id }, create: row as Parameters<typeof tx.brand.create>[0]["data"], update: row as Parameters<typeof tx.brand.update>[0]["data"] });
        }
        results.brands = backup.data.brands.length;
      }

      if (Array.isArray(backup.data.productCategories)) {
        for (const row of backup.data.productCategories as { id: string }[]) {
          await tx.productCategory.upsert({ where: { id: row.id }, create: row as Parameters<typeof tx.productCategory.create>[0]["data"], update: row as Parameters<typeof tx.productCategory.update>[0]["data"] });
        }
        results.productCategories = backup.data.productCategories.length;
      }

      if (Array.isArray(backup.data.supplierCategories)) {
        for (const row of backup.data.supplierCategories as { id: string }[]) {
          await tx.supplierCategory.upsert({ where: { id: row.id }, create: row as Parameters<typeof tx.supplierCategory.create>[0]["data"], update: row as Parameters<typeof tx.supplierCategory.update>[0]["data"] });
        }
        results.supplierCategories = backup.data.supplierCategories.length;
      }

      if (Array.isArray(backup.data.rolePermissions)) {
        for (const row of backup.data.rolePermissions as { id: string }[]) {
          await tx.rolePermission.upsert({ where: { id: row.id }, create: row as Parameters<typeof tx.rolePermission.create>[0]["data"], update: row as Parameters<typeof tx.rolePermission.update>[0]["data"] });
        }
        results.rolePermissions = backup.data.rolePermissions.length;
      }

      // Employees
      if (Array.isArray(backup.data.employees)) {
        for (const row of backup.data.employees as { id: string }[]) {
          await tx.employee.upsert({ where: { id: row.id }, create: row as Parameters<typeof tx.employee.create>[0]["data"], update: row as Parameters<typeof tx.employee.update>[0]["data"] });
        }
        results.employees = backup.data.employees.length;
      }

      // Products & Suppliers
      if (Array.isArray(backup.data.suppliers)) {
        for (const row of backup.data.suppliers as { id: string }[]) {
          await tx.supplier.upsert({ where: { id: row.id }, create: row as Parameters<typeof tx.supplier.create>[0]["data"], update: row as Parameters<typeof tx.supplier.update>[0]["data"] });
        }
        results.suppliers = backup.data.suppliers.length;
      }

      if (Array.isArray(backup.data.products)) {
        for (const row of backup.data.products as { id: string }[]) {
          await tx.product.upsert({ where: { id: row.id }, create: row as Parameters<typeof tx.product.create>[0]["data"], update: row as Parameters<typeof tx.product.update>[0]["data"] });
        }
        results.products = backup.data.products.length;
      }

      // Customers
      if (Array.isArray(backup.data.customers)) {
        for (const row of backup.data.customers as { id: string }[]) {
          await tx.customer.upsert({ where: { id: row.id }, create: row as Parameters<typeof tx.customer.create>[0]["data"], update: row as Parameters<typeof tx.customer.update>[0]["data"] });
        }
        results.customers = backup.data.customers.length;
      }

      // Financial
      if (Array.isArray(backup.data.invoices)) {
        for (const row of backup.data.invoices as { id: string }[]) {
          await tx.invoice.upsert({ where: { id: row.id }, create: row as Parameters<typeof tx.invoice.create>[0]["data"], update: row as Parameters<typeof tx.invoice.update>[0]["data"] });
        }
        results.invoices = backup.data.invoices.length;
      }

      if (Array.isArray(backup.data.expenses)) {
        for (const row of backup.data.expenses as { id: string }[]) {
          await tx.expense.upsert({ where: { id: row.id }, create: row as Parameters<typeof tx.expense.create>[0]["data"], update: row as Parameters<typeof tx.expense.update>[0]["data"] });
        }
        results.expenses = backup.data.expenses.length;
      }

      if (Array.isArray(backup.data.expenseLimits)) {
        for (const row of backup.data.expenseLimits as { id: string }[]) {
          await tx.expenseLimit.upsert({ where: { id: row.id }, create: row as Parameters<typeof tx.expenseLimit.create>[0]["data"], update: row as Parameters<typeof tx.expenseLimit.update>[0]["data"] });
        }
        results.expenseLimits = backup.data.expenseLimits.length;
      }

      // Tasks
      if (Array.isArray(backup.data.taskLists)) {
        for (const row of backup.data.taskLists as { id: string }[]) {
          await tx.taskList.upsert({ where: { id: row.id }, create: row as Parameters<typeof tx.taskList.create>[0]["data"], update: row as Parameters<typeof tx.taskList.update>[0]["data"] });
        }
        results.taskLists = backup.data.taskLists.length;
      }

      if (Array.isArray(backup.data.tasks)) {
        for (const row of backup.data.tasks as { id: string }[]) {
          await tx.task.upsert({ where: { id: row.id }, create: row as Parameters<typeof tx.task.create>[0]["data"], update: row as Parameters<typeof tx.task.update>[0]["data"] });
        }
        results.tasks = backup.data.tasks.length;
      }
    }, { timeout: 60000 });

    return NextResponse.json({ ok: true, restored: results });
  } catch (err) {
    console.error("[restore]", err);
    return NextResponse.json({ error: "Restore failed. See server logs for details." }, { status: 500 });
  }
}
