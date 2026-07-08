// Mock data for Trakulheng ERP - frontend demo

// Branches
export type BranchEmployeeRole = "manager" | "staff" | "viewer";
export interface BranchEmployee { id: string; role: BranchEmployeeRole; }

export interface Branch {
  id: string; code: string; name: string; brand: string; address: string;
  googleMapsUrl: string; location: string; floor: string; sizeSqm: number;
  phone: string; email: string; lineId: string; managerId: string; manager: string;
  startDate: string; assignedEmployeeIds: string[]; assignedEmployees: BranchEmployee[];
  employees: number; status: "active" | "inactive"; isHeadOffice: boolean;
  lat: number; lng: number; radiusMeters: number;
}

export const branches: Branch[] = [];

// Finance
export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";
export const INVOICE_PAYMENT_TERMS = ["Due on Receipt", "Net 15", "Net 30", "Net 45", "Net 60"] as const;

export const invoices: {
  id: string; customerId: string; customer: string; branchId: string;
  date: string; dueDate: string; amount: number; tax: number; discount: number;
  status: InvoiceStatus; paymentTerms: string; notes: string;
  paidDate: string | null; createdBy: string;
}[] = [];

export const invoiceItems: {
  id: string; invoiceId: string; productId: string; description: string;
  qty: number; unitPrice: number; total: number;
}[] = [];

export type ExpenseStatus = "draft" | "pending" | "approved" | "rejected" | "reimbursed";
export const EXPENSE_CATEGORIES = ["Office Supplies", "Travel", "Utilities", "Marketing", "Software", "Maintenance", "Meals", "Training", "Equipment", "Other"] as const;

export interface ExpenseRequestItem { name: string; qty: number; unitPrice: number; }
export interface ExpenseAttachment  { name: string; type: "receipt" | "invoice" | "other"; url: string; }

export const expenses: {
  id: string; category: string; description: string; date: string; amount: number;
  status: ExpenseStatus; employeeId: string; employeeName: string; branchId: string;
  requestItems: ExpenseRequestItem[]; attachments: ExpenseAttachment[];
  notes: string; approvedBy: string | null; approvedAt: string | null;
  reimbursedInPayroll: string | null;
}[] = [];

export const revenueData: { month: string; revenue: number; expenses: number; }[] = [];

// Inventory
export type StockStatus = "ok" | "low" | "out";
export type StockMovementType = "receive" | "issue" | "adjustment" | "return";

export const PRODUCT_CATEGORIES = ["Fittings","Equipment","Materials","Instruments","Safety","Electrical","Mechanical"] as const;
export const PRODUCT_BRANDS = ["DDK Pro", "DDK Express", "OEM", "Unbranded"] as const;

export const products: {
  id: string; name: string; category: string; stock: number; minStock: number;
  unitPrice: number; status: StockStatus; description: string; barcode: string;
  supplierId: string; size: string; leadTime: number; brand: string; branchIds: string[];
}[] = [];

export const stockMovements: {
  id: string; productId: string; type: StockMovementType; qty: number;
  refNo: string; date: string; note: string; processedBy: string; balanceAfter: number;
}[] = [];

export type POStatus         = "pending" | "in-transit" | "received" | "cancelled";
export type POApprovalStatus = "draft" | "pending_approval" | "approved" | "rejected";
export type POSendMethod     = "email" | "line" | "none";

export const purchaseOrders: {
  id: string; supplierId: string; supplier: string; date: string; expectedDate: string;
  items: number; total: number; status: POStatus; approvalStatus: POApprovalStatus;
  approvalRequestedAt: string; sendMethod: POSendMethod; notes: string;
}[] = [];

export const poLineItems: {
  id: string; poId: string; productId: string; productName: string;
  qty: number; unitPrice: number; total: number;
}[] = [];

export const suppliers: {
  id: string; name: string; contact: string; email: string; phone: string;
  category: string; rating: number; address: string; country: string;
  paymentTerms: string; taxId: string; notes: string; status: "active" | "inactive";
}[] = [];

// Sales
export type SalesOrderStage = "prospect" | "quoted" | "negotiation" | "confirmed" | "invoiced" | "delivered";
export type CustomerType   = "individual" | "corporate";
export type CustomerGender = "male" | "female" | "other";

export const customers: {
  id: string; name: string; contact: string; email: string; phone: string;
  type: string; totalSpend: number; status: string; address: string;
}[] = [];

export const customerProfiles: {
  id: string; customerType: CustomerType;
  firstName?: string; lastName?: string; gender?: CustomerGender; dob?: string; nationalId?: string;
  companyName?: string; taxId?: string; registrationNo?: string; contactPerson?: string;
  contactTitle?: string; businessType?: string; website?: string;
  phone: string; email: string; address: string; totalSpend: number;
  status: "active" | "inactive"; joinDate: string; notes: string; tags: string[];
}[] = [];

export const salesOrders: {
  id: string; customerId: string; customer: string; date: string; deliveryDate: string;
  items: number; amount: number; stage: SalesOrderStage; probability: number; notes: string;
}[] = [];

export const soLineItems: {
  id: string; soId: string; productId: string; productName: string;
  qty: number; unitPrice: number; total: number;
}[] = [];

// HR
export type EmployeeStatus     = "active" | "on-leave" | "inactive";
export type EmploymentType     = "full-time" | "part-time" | "contract" | "intern";
export type EmployeeGender     = "male" | "female" | "other";

export const DEPARTMENTS       = ["Engineering", "Finance", "Sales", "HR", "Operations", "IT", "Marketing", "Procurement"] as const;
export const BANKS             = ["SCB", "Kbank", "BBL", "KTB", "TMBThanachart", "Krungthai", "Bangkok Bank", "Other"] as const;

export const SSF_FUND_TYPES: { id: "33" | "39" | "40"; label: string; desc: string }[] = [
  { id: "33", label: "มาตรา 33", desc: "Regular employee — employer registers, 5% of salary (max ฿750/mo)" },
  { id: "39", label: "มาตรา 39", desc: "Formerly employed, voluntary continuation — ฿432/mo fixed" },
  { id: "40", label: "มาตรา 40", desc: "Self-employed / informal worker — voluntary, 3 contribution tiers" },
];

export const SSF_HOSPITALS = [
  "Bangkok Hospital", "Bumrungrad International Hospital", "Samitivej Hospital",
  "Phramongkutklao Hospital", "Ramathibodi Hospital", "Siriraj Hospital",
  "Chulalongkorn Hospital", "Paolo Hospital", "Vejthani Hospital",
  "MedPark Hospital", "Yanhee Hospital", "Phyathai Hospital",
  "Bangpakok Hospital", "BNH Hospital", "Ratchathewi Hospital",
  "Wattanosoth Hospital", "Theptarin Hospital", "Praram 9 Hospital",
  "Saint Louis Hospital", "Other",
] as const;

export type SsfStatus = "active" | "inactive" | "not-enrolled";
export const EMPLOYMENT_TYPES: { id: EmploymentType; label: string }[] = [
  { id: "full-time", label: "Full-time" },
  { id: "part-time", label: "Part-time" },
  { id: "contract",  label: "Contract"  },
  { id: "intern",    label: "Intern"    },
];

export interface BankAccount {
  id:            string;
  bankName:      string;
  branch:        string;
  accountNumber: string;
  accountName:   string;
  isMain:        boolean;
}

export interface Employee {
  id:                string;
  firstName:         string;
  lastName:          string;
  firstNameTh?:      string;
  lastNameTh?:       string;
  nickname?:         string;
  name:              string;
  gender:            EmployeeGender;
  dob?:              string;
  nationalId?:       string;
  phone?:            string;
  personalEmail?:    string;
  workEmail?:        string;
  department:        string;
  position:          string;
  employmentType:    EmploymentType;
  branchId?:         string;
  hireDate:          string;
  probationEndDate?: string;
  managerId?:        string;
  salary:            number;
  hourlyRate?:       number;
  bankAccounts?:     BankAccount[];
  ssn?:              string;
  ssfFundType?:      "33" | "39" | "40";
  ssfEnrollmentDate?:string;
  ssfHospital?:      string;
  ssfStatus?:        SsfStatus;
  emergencyName?:    string;
  emergencyRelation?:string;
  emergencyPhone?:   string;
  photo?:            string;
  documents?:        string[];
  weeklyDaysOff?:    number[];
  status:            EmployeeStatus;
  verified?:         boolean;
  verifiedDate?:     string;
}

export const employees: Employee[] = [];

export const payrollRuns: {
  id: string; period: string; employees: number; grossPay: number;
  deductions: number; netPay: number; status: string; date: string;
}[] = [];

export const leaveRequests: {
  id: string; employee: string; type: string; from: string; to: string;
  days: number; status: string;
}[] = [];

// Shifts
export const shifts: {
  id: string; name: string; code: string; startTime: string; endTime: string;
  breakMinutes: number; color: "blue" | "amber" | "violet" | "emerald";
}[] = [];

export const employeeShifts: {
  id: string; employeeId: string; shiftId: string; branchId: string;
  daysOfWeek: number[]; effectiveFrom: string;
}[] = [];

export const attendanceRecords: {
  id: string; employeeId: string; branchId: string; date: string; shiftId: string;
  clockIn: string | null; clockInLat: number | null; clockInLng: number | null;
  clockInDistance: number | null; clockOut: string | null; clockOutLat: number | null;
  clockOutLng: number | null; clockOutDistance: number | null;
  status: "clocked-in" | "late" | "completed" | "absent"; workMinutes: number | null;
}[] = [];

// Dashboard KPIs
export const kpiData = {
  totalRevenue:    0,
  revenueChange:   0,
  totalExpenses:   0,
  expensesChange:  0,
  inventoryValue:  0,
  inventoryChange: 0,
  headcount:       0,
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
  earnRate: 1,
  earnPer: 100,
  minPurchase: 500,
  expiryMonths: 24,
};

export const crmCustomers: {
  id: string; firstName: string; lastName: string; phone: string; email: string;
  address: string; birthDate: string; joinDate: string; pointsBalance: number;
  totalPointsEarned: number; totalPointsRedeemed: number; totalSpend: number;
  lastVisit: string; branchId: string; notes: string;
}[] = [];

export const pointsTransactions: {
  id: string; customerId: string; type: "earn" | "redeem"; points: number;
  description: string; date: string; balanceAfter: number; processedBy: string;
}[] = [];

export const giftItems: {
  id: string; name: string; category: string; pointsRequired: number;
  stock: number; status: "active" | "inactive"; color: string;
}[] = [];

export const redemptions: {
  id: string; customerId: string; customerName: string; rewardId: string;
  rewardName: string; pointsUsed: number; date: string;
  status: "completed" | "pending" | "cancelled"; processedBy: string;
}[] = [];

// ── Campaigns ─────────────────────────────────────────────────────────

export const campaigns: {
  id: string; name: string; description: string;
  type: "multiplier" | "bonus"; value: number;
  startDate: string; endDate: string;
  status: "active" | "scheduled" | "ended"; eligibleTiers: Tier[];
  participantCount: number; pointsIssued: number; createdBy: string;
}[] = [];

// ── System Users ──────────────────────────────────────────────────────

export type UserRole = "admin" | "manager" | "staff" | "viewer";

export const systemUsers: {
  id: string; employeeId: string; name: string; email: string;
  role: UserRole; branchId: string; branchIds: string[];
  status: "active" | "inactive"; startDate: string; endDate: string | null;
  lastLogin: string; createdAt: string;
}[] = [];

// ── Company Settings ──────────────────────────────────────────────────

export const companySettings = {
  name:            "บริษัท ตระกูลเฮง จำกัด",
  nameEn:          "Trakulheng Co., Ltd.",
  taxId:           "0105562001234",
  address:         "88 Silom Rd, Bang Rak, Bangkok 10500",
  phone:           "02-100-1000",
  email:           "info@trakulheng.co.th",
  website:         "www.trakulheng.co.th",
  lineId:          "@trakulheng",
  currency:        "THB",
  timezone:        "Asia/Bangkok",
  language:        "th",
  fiscalYearStart: "January",
};

// ── Notification Settings ─────────────────────────────────────────────

export const notificationSettings = {
  email: { newOrder:true,  orderStatusChange:true,  lowStock:true,  payrollProcessed:true,  leaveRequest:true,  pointsEarned:false, redemption:true,  campaignAlert:true  },
  sms:   { newOrder:false, orderStatusChange:true,  lowStock:false, payrollProcessed:false, leaveRequest:true,  pointsEarned:false, redemption:false, campaignAlert:false },
  inApp: { newOrder:true,  orderStatusChange:true,  lowStock:true,  payrollProcessed:true,  leaveRequest:true,  pointsEarned:true,  redemption:true,  campaignAlert:true  },
};

// ── CRM Monthly Analytics Data ────────────────────────────────────────

export const crmMonthlyData: {
  month: string; newMembers: number; pointsEarned: number; pointsRedeemed: number;
}[] = [];
