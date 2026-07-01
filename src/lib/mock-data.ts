// Mock data for DDK ERP - frontend demo

// Branches
export const branches = [
  { id:"BR-001", code:"HQ",  name:"Head Office",       address:"88 Silom Rd, Bang Rak, Bangkok 10500",          phone:"02-100-1000",  email:"hq@ddk.co.th",         manager:"Prapas Chamnankit", employees:45, status:"active" as const, isHeadOffice:true,  lat:13.7222, lng:100.5219, radiusMeters:200 },
  { id:"BR-002", code:"CMI", name:"Chiang Mai Branch", address:"99 Nimman Rd, Suthep, Chiang Mai 50200",         phone:"053-200-2000", email:"chiangmai@ddk.co.th",  manager:"Wichai Thongdee",   employees:18, status:"active" as const, isHeadOffice:false, lat:18.7957, lng:98.9756,  radiusMeters:200 },
  { id:"BR-003", code:"PKT", name:"Phuket Branch",     address:"12 Rassada Rd, Phuket Town 83000",              phone:"076-300-3000", email:"phuket@ddk.co.th",     manager:"Kanokwan Srisuwan", employees:12, status:"active" as const, isHeadOffice:false, lat:7.8804,  lng:98.3923,  radiusMeters:200 },
  { id:"BR-004", code:"KKN", name:"Khon Kaen Branch",  address:"45 Mitraphap Rd, Muang, Khon Kaen 40000",       phone:"043-400-4000", email:"khonkaen@ddk.co.th",   manager:"Thanachart Boonsri",employees:8,  status:"inactive" as const,isHeadOffice:false, lat:16.4322, lng:102.8236, radiusMeters:200 },
];

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

// Shifts
export const shifts = [
  { id:"SH-001", name:"Morning Shift",   code:"MOR", startTime:"08:00", endTime:"17:00", breakMinutes:60, color:"blue"    as const },
  { id:"SH-002", name:"Afternoon Shift", code:"AFT", startTime:"13:00", endTime:"22:00", breakMinutes:60, color:"amber"   as const },
  { id:"SH-003", name:"Night Shift",     code:"NGT", startTime:"22:00", endTime:"07:00", breakMinutes:60, color:"violet"  as const },
  { id:"SH-004", name:"Half Day AM",     code:"HAM", startTime:"08:00", endTime:"12:00", breakMinutes:0,  color:"emerald" as const },
];

// daysOfWeek: 0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat
export const employeeShifts = [
  { id:"ES-001", employeeId:"EMP-001", shiftId:"SH-001", branchId:"BR-001", daysOfWeek:[1,2,3,4,5], effectiveFrom:"2026-01-01" },
  { id:"ES-002", employeeId:"EMP-002", shiftId:"SH-001", branchId:"BR-001", daysOfWeek:[1,2,3,4,5], effectiveFrom:"2026-01-01" },
  { id:"ES-003", employeeId:"EMP-003", shiftId:"SH-001", branchId:"BR-001", daysOfWeek:[1,2,3,4,5], effectiveFrom:"2026-01-01" },
  { id:"ES-004", employeeId:"EMP-004", shiftId:"SH-001", branchId:"BR-001", daysOfWeek:[1,2,3,4,5], effectiveFrom:"2026-01-01" },
  { id:"ES-005", employeeId:"EMP-005", shiftId:"SH-002", branchId:"BR-001", daysOfWeek:[1,2,3,4,5,6], effectiveFrom:"2026-01-01" },
  { id:"ES-006", employeeId:"EMP-006", shiftId:"SH-001", branchId:"BR-001", daysOfWeek:[1,2,3,4,5], effectiveFrom:"2026-01-01" },
  { id:"ES-007", employeeId:"EMP-007", shiftId:"SH-001", branchId:"BR-001", daysOfWeek:[1,2,3,4,5], effectiveFrom:"2026-01-01" },
  { id:"ES-008", employeeId:"EMP-008", shiftId:"SH-001", branchId:"BR-001", daysOfWeek:[1,2,3,4,5], effectiveFrom:"2026-01-01" },
  { id:"ES-009", employeeId:"EMP-009", shiftId:"SH-003", branchId:"BR-001", daysOfWeek:[0,1,2,3,4,5,6], effectiveFrom:"2026-01-01" },
  { id:"ES-010", employeeId:"EMP-010", shiftId:"SH-001", branchId:"BR-001", daysOfWeek:[1,2,3,4,5], effectiveFrom:"2026-01-01" },
];

const TODAY = "2026-06-29";
export const attendanceRecords = [
  { id:"ATT-001", employeeId:"EMP-001", branchId:"BR-001", date:TODAY, shiftId:"SH-001", clockIn:"07:58", clockInLat:13.7220, clockInLng:100.5218, clockInDistance:28,  clockOut:null, clockOutLat:null, clockOutLng:null, clockOutDistance:null, status:"clocked-in" as const, workMinutes:null },
  { id:"ATT-002", employeeId:"EMP-002", branchId:"BR-001", date:TODAY, shiftId:"SH-001", clockIn:"08:03", clockInLat:13.7224, clockInLng:100.5220, clockInDistance:45,  clockOut:null, clockOutLat:null, clockOutLng:null, clockOutDistance:null, status:"clocked-in" as const, workMinutes:null },
  { id:"ATT-003", employeeId:"EMP-003", branchId:"BR-001", date:TODAY, shiftId:"SH-001", clockIn:"08:22", clockInLat:13.7221, clockInLng:100.5219, clockInDistance:12,  clockOut:null, clockOutLat:null, clockOutLng:null, clockOutDistance:null, status:"late"       as const, workMinutes:null },
  { id:"ATT-007", employeeId:"EMP-007", branchId:"BR-001", date:TODAY, shiftId:"SH-001", clockIn:"08:01", clockInLat:13.7222, clockInLng:100.5219, clockInDistance:5,   clockOut:"09:15", clockOutLat:13.7221, clockOutLng:100.5218, clockOutDistance:18, status:"completed"  as const, workMinutes:74 },
  { id:"ATT-008", employeeId:"EMP-008", branchId:"BR-001", date:TODAY, shiftId:"SH-001", clockIn:"08:00", clockInLat:13.7223, clockInLng:100.5220, clockInDistance:32,  clockOut:null, clockOutLat:null, clockOutLng:null, clockOutDistance:null, status:"clocked-in" as const, workMinutes:null },
  { id:"ATT-009", employeeId:"EMP-009", branchId:"BR-001", date:TODAY, shiftId:"SH-003", clockIn:"22:01", clockInLat:13.7222, clockInLng:100.5219, clockInDistance:8,   clockOut:null, clockOutLat:null, clockOutLng:null, clockOutDistance:null, status:"clocked-in" as const, workMinutes:null },
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

// ── CRM ──────────────────────────────────────────────────────────────

export type Tier = "bronze" | "silver" | "gold" | "platinum";

export function getTier(points: number): Tier {
  if (points >= 10000) return "platinum";
  if (points >= 5000)  return "gold";
  if (points >= 1000)  return "silver";
  return "bronze";
}

export const tierColors: Record<Tier, { bg: string; text: string; border: string }> = {
  bronze:   { bg: "bg-orange-100",  text: "text-orange-700",  border: "border-orange-300" },
  silver:   { bg: "bg-slate-100",   text: "text-slate-600",   border: "border-slate-400" },
  gold:     { bg: "bg-amber-100",   text: "text-amber-700",   border: "border-amber-400" },
  platinum: { bg: "bg-violet-100",  text: "text-violet-700",  border: "border-violet-400" },
};

export const tierThresholds: Record<Tier, { min: number; max: number | null; multiplier: number }> = {
  bronze:   { min: 0,     max: 999,   multiplier: 1.0 },
  silver:   { min: 1000,  max: 4999,  multiplier: 1.5 },
  gold:     { min: 5000,  max: 9999,  multiplier: 2.0 },
  platinum: { min: 10000, max: null,  multiplier: 3.0 },
};

export const pointsSettings = {
  earnRate: 1,       // points earned
  earnPer: 100,      // per this many THB
  minPurchase: 500,  // minimum purchase to earn points
  expiryMonths: 24,
};

export const crmCustomers = [
  { id:"CRM-001", firstName:"John",       lastName:"Smith",      phone:"02-111-2345",  email:"john@acme.com",           address:"123 Sukhumvit Rd, Bangkok",      birthDate:"1985-03-15", joinDate:"2024-01-10", pointsBalance:8750,  totalPointsEarned:9200,  totalPointsRedeemed:450,  totalSpend:485000, lastVisit:"2026-06-20", branchId:"BR-001", notes:"VIP customer" },
  { id:"CRM-002", firstName:"Sara",        lastName:"Lee",        phone:"02-222-3456",  email:"sara@techstart.io",        address:"456 Rama IV Rd, Bangkok",        birthDate:"1990-07-22", joinDate:"2024-03-05", pointsBalance:2340,  totalPointsEarned:2340,  totalPointsRedeemed:0,    totalSpend:125000, lastVisit:"2026-06-18", branchId:"BR-001", notes:"" },
  { id:"CRM-003", firstName:"Ahmed",       lastName:"Hassan",     phone:"02-333-4567",  email:"ahmed@gtraders.com",       address:"789 Silom Rd, Bangkok",          birthDate:"1978-11-08", joinDate:"2023-08-20", pointsBalance:12500, totalPointsEarned:14200, totalPointsRedeemed:1700, totalSpend:892000, lastVisit:"2026-06-25", branchId:"BR-001", notes:"Platinum — handle with care" },
  { id:"CRM-004", firstName:"Malee",       lastName:"Prasert",    phone:"02-444-5678",  email:"malee@sunrisefoods.co.th", address:"22 Charoen Krung Rd, Bangkok",   birthDate:"1992-05-30", joinDate:"2025-01-12", pointsBalance:675,   totalPointsEarned:675,   totalPointsRedeemed:0,    totalSpend:67500,  lastVisit:"2026-06-10", branchId:"BR-001", notes:"" },
  { id:"CRM-005", firstName:"Tom",         lastName:"Richards",   phone:"02-555-6789",  email:"tom@metrobuilding.com",    address:"55 Ratchadaphisek Rd, Bangkok",  birthDate:"1980-09-14", joinDate:"2023-05-01", pointsBalance:15200, totalPointsEarned:16000, totalPointsRedeemed:800,  totalSpend:1250000,lastVisit:"2026-06-28", branchId:"BR-001", notes:"Enterprise account" },
  { id:"CRM-006", firstName:"Kanokwan",    lastName:"Thong",      phone:"02-666-7890",  email:"kanokwan@paclog.co.th",    address:"10 Lat Phrao Rd, Bangkok",       birthDate:"1995-02-18", joinDate:"2025-04-20", pointsBalance:980,   totalPointsEarned:1200,  totalPointsRedeemed:220,  totalSpend:98000,  lastVisit:"2026-05-30", branchId:"BR-001", notes:"" },
];

export const pointsTransactions = [
  { id:"PTX-001", customerId:"CRM-001", type:"earn"   as const, points: 500,  description:"Purchase ฿50,000 — INV-005",       date:"2026-06-20", balanceAfter:8750,  processedBy:"Admin" },
  { id:"PTX-002", customerId:"CRM-001", type:"redeem" as const, points:-450,  description:"Redeemed: Premium Tool Set",        date:"2026-06-15", balanceAfter:8250,  processedBy:"Admin" },
  { id:"PTX-003", customerId:"CRM-001", type:"earn"   as const, points: 342,  description:"Purchase ฿34,200 — INV-005",       date:"2026-05-20", balanceAfter:8700,  processedBy:"System" },
  { id:"PTX-004", customerId:"CRM-003", type:"earn"   as const, points:1250,  description:"Purchase ฿125,000 — SO-003",       date:"2026-06-25", balanceAfter:12500, processedBy:"Admin" },
  { id:"PTX-005", customerId:"CRM-003", type:"redeem" as const, points:-500,  description:"Redeemed: 10% Discount Voucher",   date:"2026-06-10", balanceAfter:11250, processedBy:"Admin" },
  { id:"PTX-006", customerId:"CRM-005", type:"earn"   as const, points:1562,  description:"Purchase ฿156,200 — SO-001",       date:"2026-06-28", balanceAfter:15200, processedBy:"System" },
  { id:"PTX-007", customerId:"CRM-002", type:"earn"   as const, points: 234,  description:"Purchase ฿23,400",                 date:"2026-06-18", balanceAfter:2340,  processedBy:"Admin" },
  { id:"PTX-008", customerId:"CRM-004", type:"earn"   as const, points: 100,  description:"Purchase ฿10,000",                 date:"2026-06-10", balanceAfter:675,   processedBy:"Admin" },
  { id:"PTX-009", customerId:"CRM-006", type:"redeem" as const, points:-220,  description:"Redeemed: DDK Branded Mug",        date:"2026-05-30", balanceAfter:980,   processedBy:"Admin" },
];

export const giftItems = [
  { id:"GIFT-001", name:"DDK Branded Mug",           category:"Merchandise",  pointsRequired:200,  stock:50,  status:"active"   as const, color:"blue"    },
  { id:"GIFT-002", name:"Safety Gloves (Premium)",   category:"Safety",       pointsRequired:350,  stock:30,  status:"active"   as const, color:"emerald" },
  { id:"GIFT-003", name:"10% Discount Voucher",      category:"Voucher",      pointsRequired:500,  stock:999, status:"active"   as const, color:"amber"   },
  { id:"GIFT-004", name:"Free Delivery (1 Order)",   category:"Voucher",      pointsRequired:300,  stock:999, status:"active"   as const, color:"violet"  },
  { id:"GIFT-005", name:"Premium Tool Set",          category:"Tools",        pointsRequired:2000, stock:10,  status:"active"   as const, color:"red"     },
  { id:"GIFT-006", name:"DDK Cap & T-Shirt Set",    category:"Merchandise",  pointsRequired:800,  stock:25,  status:"active"   as const, color:"slate"   },
  { id:"GIFT-007", name:"Birthday Bonus (500 pts)", category:"Bonus",        pointsRequired:0,    stock:999, status:"inactive" as const, color:"pink"    },
  { id:"GIFT-008", name:"VIP Event Ticket",         category:"Experience",   pointsRequired:5000, stock:20,  status:"active"   as const, color:"indigo"  },
];

export const redemptions = [
  { id:"RD-001", customerId:"CRM-001", customerName:"John Smith",    rewardId:"GIFT-005", rewardName:"Premium Tool Set",        pointsUsed:2000, date:"2026-06-15", status:"completed" as const, processedBy:"Admin" },
  { id:"RD-002", customerId:"CRM-003", customerName:"Ahmed Hassan",  rewardId:"GIFT-003", rewardName:"10% Discount Voucher",    pointsUsed:500,  date:"2026-06-10", status:"completed" as const, processedBy:"Admin" },
  { id:"RD-003", customerId:"CRM-006", customerName:"Kanokwan Thong",rewardId:"GIFT-001", rewardName:"DDK Branded Mug",         pointsUsed:200,  date:"2026-05-30", status:"completed" as const, processedBy:"Admin" },
  { id:"RD-004", customerId:"CRM-005", customerName:"Tom Richards",  rewardId:"GIFT-004", rewardName:"Free Delivery (1 Order)", pointsUsed:300,  date:"2026-06-01", status:"completed" as const, processedBy:"System" },
];
