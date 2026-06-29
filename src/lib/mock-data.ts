// Mock data for DDK ERP - frontend demo

// Finance
export const invoices = [
  { id: "INV-001", customer: "Acme Corporation", date: "2026-06-01", dueDate: "2026-06-30", amount: 12500, status: "paid" },
  { id: "INV-002", customer: "TechStart Inc.", date: "2026-06-05", dueDate: "2026-07-05", amount: 8750, status: "pending" },
  { id: "INV-003", customer: "Global Traders Ltd.", date: "2026-05-15", dueDate: "2026-06-15", amount: 21300, status: "overdue" },
  { id: "INV-004", customer: "Sunrise Foods Co.", date: "2026-06-10", dueDate: "2026-07-10", amount: 5600, status: "pending" },
  { id: "INV-005", customer: "Metro Building Supplies", date: "2026-06-12", dueDate: "2026-07-12", amount: 34200, status: "paid" },
  { id: "INV-006", customer: "Pacific Logistics", date: "2026-05-28", dueDate: "2026-06-28", amount: 9800, status: "overdue" },
  { id: "INV-007", customer: "Crown Retail Group", date: "2026-06-15", dueDate: "2026-07-15", amount: 15600, status: "pending" },
  { id: "INV-008", customer: "Elite Services Co.", date: "2026-06-18", dueDate: "2026-07-18", amount: 7200, status: "paid" },
];

export const expenses = [
  { id: "EXP-001", category: "Office Supplies", description: "Stationery and paper", date: "2026-06-02", amount: 450, status: "approved" },
  { id: "EXP-002", category: "Travel", description: "Client visit - Bangkok", date: "2026-06-05", amount: 12500, status: "approved" },
  { id: "EXP-003", category: "Utilities", description: "Electricity bill - June", date: "2026-06-10", amount: 8200, status: "approved" },
  { id: "EXP-004", category: "Marketing", description: "Social media ads", date: "2026-06-12", amount: 25000, status: "pending" },
  { id: "EXP-005", category: "Software", description: "SaaS subscriptions", date: "2026-06-15", amount: 5800, status: "approved" },
  { id: "EXP-006", category: "Maintenance", description: "Office equipment repair", date: "2026-06-18", amount: 3200, status: "pending" },
];

export const revenueData = [
  { month: "Jul", revenue: 380000, expenses: 220000 },
  { month: "Aug", revenue: 420000, expenses: 240000 },
  { month: "Sep", revenue: 395000, expenses: 215000 },
  { month: "Oct", revenue: 480000, expenses: 260000 },
  { month: "Nov", revenue: 510000, expenses: 280000 },
  { month: "Dec", revenue: 620000, expenses: 320000 },
  { month: "Jan", revenue: 450000, expenses: 250000 },
  { month: "Feb", revenue: 490000, expenses: 265000 },
  { month: "Mar", revenue: 530000, expenses: 290000 },
  { month: "Apr", revenue: 575000, expenses: 310000 },
  { month: "May", revenue: 610000, expenses: 330000 },
  { month: "Jun", revenue: 648000, expenses: 355000 },
];

// Inventory
export const products = [
  { id: "SKU-001", name: "Industrial Valve 2\"", category: "Fittings", stock: 145, minStock: 50, unitPrice: 850, status: "ok" },
  { id: "SKU-002", name: "Hydraulic Pump 5HP", category: "Equipment", stock: 12, minStock: 20, unitPrice: 15500, status: "low" },
  { id: "SKU-003", name: "Steel Pipe 6m", category: "Materials", stock: 0, minStock: 30, unitPrice: 1200, status: "out" },
  { id: "SKU-004", name: "Pressure Gauge 100psi", category: "Instruments", stock: 68, minStock: 25, unitPrice: 650, status: "ok" },
  { id: "SKU-005", name: "Electric Motor 10kW", category: "Equipment", stock: 8, minStock: 15, unitPrice: 42000, status: "low" },
  { id: "SKU-006", name: "Copper Fitting 1\"", category: "Fittings", stock: 320, minStock: 100, unitPrice: 125, status: "ok" },
  { id: "SKU-007", name: "Ball Valve 3\"", category: "Fittings", stock: 5, minStock: 40, unitPrice: 2100, status: "low" },
  { id: "SKU-008", name: "Safety Helmet", category: "Safety", stock: 85, minStock: 30, unitPrice: 480, status: "ok" },
  { id: "SKU-009", name: "Cable 16mm 100m", category: "Electrical", stock: 0, minStock: 20, unitPrice: 8500, status: "out" },
  { id: "SKU-010", name: "Bearing 6205", category: "Mechanical", stock: 250, minStock: 80, unitPrice: 320, status: "ok" },
];

export const purchaseOrders = [
  { id: "PO-001", supplier: "Thai Industrial Supply", date: "2026-06-01", expectedDate: "2026-06-15", items: 5, total: 125000, status: "received" },
  { id: "PO-002", supplier: "Asia Pacific Equipment", date: "2026-06-08", expectedDate: "2026-06-25", items: 3, total: 285000, status: "in-transit" },
  { id: "PO-003", supplier: "Bangkok Parts Co.", date: "2026-06-15", expectedDate: "2026-07-01", items: 8, total: 45600, status: "pending" },
  { id: "PO-004", supplier: "Global Fittings Ltd.", date: "2026-06-20", expectedDate: "2026-07-10", items: 12, total: 78900, status: "pending" },
  { id: "PO-005", supplier: "KL Mechanical Supplies", date: "2026-05-28", expectedDate: "2026-06-12", items: 6, total: 192000, status: "received" },
];

export const suppliers = [
  { id: "SUP-001", name: "Thai Industrial Supply", contact: "Somchai Jaidee", email: "somchai@tis.co.th", phone: "02-555-1234", category: "General", rating: 4.5 },
  { id: "SUP-002", name: "Asia Pacific Equipment", contact: "David Lim", email: "david@ape.com.sg", phone: "+65-6789-0123", category: "Equipment", rating: 4.2 },
  { id: "SUP-003", name: "Bangkok Parts Co.", contact: "Nidnoy Sukjai", email: "info@bkparts.co.th", phone: "02-666-5678", category: "Parts", rating: 3.8 },
  { id: "SUP-004", name: "Global Fittings Ltd.", contact: "James Wong", email: "james@gfl.com.hk", phone: "+852-2345-6789", category: "Fittings", rating: 4.7 },
];

// Sales
export const customers = [
  { id: "CUST-001", name: "Acme Corporation", contact: "John Smith", email: "john@acme.com", phone: "02-111-2345", type: "Enterprise", totalSpend: 485000, status: "active" },
  { id: "CUST-002", name: "TechStart Inc.", contact: "Sara Lee", email: "sara@techstart.io", phone: "02-222-3456", type: "SME", totalSpend: 125000, status: "active" },
  { id: "CUST-003", name: "Global Traders Ltd.", contact: "Ahmed Hassan", email: "ahmed@gtraders.com", phone: "02-333-4567", type: "Enterprise", totalSpend: 892000, status: "active" },
  { id: "CUST-004", name: "Sunrise Foods Co.", contact: "Malee Prasert", email: "malee@sunrisefoods.co.th", phone: "02-444-5678", type: "SME", totalSpend: 67500, status: "active" },
  { id: "CUST-005", name: "Metro Building Supplies", contact: "Tom Richards", email: "tom@metrobuilding.com", phone: "02-555-6789", type: "Enterprise", totalSpend: 1250000, status: "active" },
  { id: "CUST-006", name: "Pacific Logistics", contact: "Kanokwan Thong", email: "kanokwan@paclog.co.th", phone: "02-666-7890", type: "SME", totalSpend: 98000, status: "inactive" },
];

export const salesOrders = [
  { id: "SO-001", customer: "Metro Building Supplies", date: "2026-06-01", items: 8, amount: 342000, stage: "delivered", probability: 100 },
  { id: "SO-002", customer: "Acme Corporation", date: "2026-06-05", items: 5, amount: 125000, stage: "invoiced", probability: 95 },
  { id: "SO-003", customer: "Global Traders Ltd.", date: "2026-06-10", items: 12, amount: 580000, stage: "confirmed", probability: 90 },
  { id: "SO-004", customer: "TechStart Inc.", date: "2026-06-12", items: 3, amount: 87500, stage: "quoted", probability: 60 },
  { id: "SO-005", customer: "Sunrise Foods Co.", date: "2026-06-15", items: 6, amount: 56000, stage: "negotiation", probability: 75 },
  { id: "SO-006", customer: "Crown Retail Group", date: "2026-06-18", items: 4, amount: 215000, stage: "prospect", probability: 30 },
  { id: "SO-007", customer: "Elite Services Co.", date: "2026-06-20", items: 2, amount: 42000, stage: "confirmed", probability: 90 },
];

// HR
export const employees = [
  { id: "EMP-001", name: "Somchai Wannasuk", department: "Engineering", position: "Senior Engineer", hireDate: "2020-03-15", salary: 85000, status: "active" },
  { id: "EMP-002", name: "Nattaporn Srisuk", department: "Finance", position: "Finance Manager", hireDate: "2019-08-01", salary: 95000, status: "active" },
  { id: "EMP-003", name: "Prapas Chamnankit", department: "Sales", position: "Sales Director", hireDate: "2018-05-10", salary: 120000, status: "active" },
  { id: "EMP-004", name: "Pornpimol Kittipat", department: "HR", position: "HR Manager", hireDate: "2021-01-20", salary: 88000, status: "active" },
  { id: "EMP-005", name: "Wichai Thongdee", department: "Operations", position: "Operations Supervisor", hireDate: "2020-11-05", salary: 72000, status: "active" },
  { id: "EMP-006", name: "Kanokwan Srisuwan", department: "Sales", position: "Sales Representative", hireDate: "2022-06-15", salary: 55000, status: "active" },
  { id: "EMP-007", name: "Thanachart Boonsri", department: "Engineering", position: "Junior Engineer", hireDate: "2023-02-01", salary: 45000, status: "active" },
  { id: "EMP-008", name: "Siriporn Naknoi", department: "Finance", position: "Accountant", hireDate: "2021-09-10", salary: 52000, status: "active" },
  { id: "EMP-009", name: "Ratchanon Pimpa", department: "IT", position: "IT Administrator", hireDate: "2022-03-28", salary: 60000, status: "active" },
  { id: "EMP-010", name: "Ploy Jaidee", department: "Marketing", position: "Marketing Specialist", hireDate: "2023-07-01", salary: 48000, status: "on-leave" },
];

export const payrollRuns = [
  { id: "PAY-001", period: "June 2026", employees: 10, grossPay: 720000, deductions: 108000, netPay: 612000, status: "processed", date: "2026-06-29" },
  { id: "PAY-002", period: "May 2026", employees: 10, grossPay: 720000, deductions: 108000, netPay: 612000, status: "paid", date: "2026-05-30" },
  { id: "PAY-003", period: "April 2026", employees: 10, grossPay: 715000, deductions: 107250, netPay: 607750, status: "paid", date: "2026-04-30" },
  { id: "PAY-004", period: "March 2026", employees: 9, grossPay: 668000, deductions: 100200, netPay: 567800, status: "paid", date: "2026-03-31" },
];

export const leaveRequests = [
  { id: "LV-001", employee: "Somchai Wannasuk", type: "Annual", from: "2026-07-10", to: "2026-07-14", days: 5, status: "approved" },
  { id: "LV-002", employee: "Ploy Jaidee", type: "Sick", from: "2026-06-20", to: "2026-06-25", days: 6, status: "approved" },
  { id: "LV-003", employee: "Kanokwan Srisuwan", type: "Annual", from: "2026-07-01", to: "2026-07-03", days: 3, status: "pending" },
  { id: "LV-004", employee: "Thanachart Boonsri", type: "Personal", from: "2026-07-05", to: "2026-07-05", days: 1, status: "pending" },
];

// Dashboard KPIs
export const kpiData = {
  totalRevenue: 648000,
  revenueChange: 6.2,
  totalExpenses: 355000,
  expensesChange: 7.6,
  inventoryValue: 4850000,
  inventoryChange: -2.1,
  headcount: 10,
  headcountChange: 0,
};
