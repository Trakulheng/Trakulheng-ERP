// Mock data for DDK ERP - frontend demo

// Branches
export type BranchEmployeeRole = "manager" | "staff" | "viewer";
export interface BranchEmployee { id: string; role: BranchEmployeeRole; }

export const branches = [
  { id:"BR-001", code:"HQ",  name:"Head Office",       brand:"DDK Enterprise", address:"88 Silom Rd, Bang Rak, Bangkok 10500",      googleMapsUrl:"https://maps.google.com/?q=13.7222,100.5219", location:"Bang Rak, Bangkok",       floor:"G-8", sizeSqm:850, phone:"02-100-1000",  email:"hq@ddk.co.th",         lineId:"@ddkHQ",  managerId:"EMP-003", manager:"Prapas Chamnankit",  startDate:"2018-01-01", assignedEmployeeIds:["EMP-001","EMP-002","EMP-003","EMP-004","EMP-005","EMP-006","EMP-007","EMP-008","EMP-009","EMP-010"], assignedEmployees:[{id:"EMP-001",role:"staff"},{id:"EMP-002",role:"manager"},{id:"EMP-003",role:"manager"},{id:"EMP-004",role:"staff"},{id:"EMP-005",role:"staff"},{id:"EMP-006",role:"staff"},{id:"EMP-007",role:"staff"},{id:"EMP-008",role:"staff"},{id:"EMP-009",role:"staff"},{id:"EMP-010",role:"viewer"}] as BranchEmployee[], employees:45, status:"active"   as const, isHeadOffice:true,  lat:13.7222, lng:100.5219, radiusMeters:200 },
  { id:"BR-002", code:"CMI", name:"Chiang Mai Branch", brand:"DDK Express",    address:"99 Nimman Rd, Suthep, Chiang Mai 50200",     googleMapsUrl:"https://maps.google.com/?q=18.7957,98.9756",  location:"Nimman, Chiang Mai",       floor:"G-2", sizeSqm:320, phone:"053-200-2000", email:"chiangmai@ddk.co.th",  lineId:"@ddkCMI", managerId:"EMP-005", manager:"Wichai Thongdee",    startDate:"2020-06-01", assignedEmployeeIds:["EMP-005","EMP-006"],                                                                                       assignedEmployees:[{id:"EMP-005",role:"manager"},{id:"EMP-006",role:"staff"}] as BranchEmployee[], employees:18, status:"active"   as const, isHeadOffice:false, lat:18.7957, lng:98.9756,  radiusMeters:200 },
  { id:"BR-003", code:"PKT", name:"Phuket Branch",     brand:"DDK Express",    address:"12 Rassada Rd, Phuket Town 83000",           googleMapsUrl:"https://maps.google.com/?q=7.8804,98.3923",   location:"Phuket Town, Phuket",      floor:"G",   sizeSqm:245, phone:"076-300-3000", email:"phuket@ddk.co.th",     lineId:"@ddkPKT", managerId:"EMP-006", manager:"Kanokwan Srisuwan",  startDate:"2021-03-01", assignedEmployeeIds:["EMP-006"],                                                                                                assignedEmployees:[{id:"EMP-006",role:"manager"}] as BranchEmployee[], employees:12, status:"active"   as const, isHeadOffice:false, lat:7.8804,  lng:98.3923,  radiusMeters:200 },
  { id:"BR-004", code:"KKN", name:"Khon Kaen Branch",  brand:"DDK Express",    address:"45 Mitraphap Rd, Muang, Khon Kaen 40000",   googleMapsUrl:"https://maps.google.com/?q=16.4322,102.8236", location:"Muang, Khon Kaen",         floor:"G",   sizeSqm:180, phone:"043-400-4000", email:"khonkaen@ddk.co.th",   lineId:"@ddkKKN", managerId:"EMP-007", manager:"Thanachart Boonsri", startDate:"2022-09-01", assignedEmployeeIds:["EMP-007"],                                                                                                assignedEmployees:[{id:"EMP-007",role:"manager"}] as BranchEmployee[], employees:8,  status:"inactive" as const, isHeadOffice:false, lat:16.4322, lng:102.8236, radiusMeters:200 },
];

// Finance
export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";
export const INVOICE_PAYMENT_TERMS = ["Due on Receipt", "Net 15", "Net 30", "Net 45", "Net 60"] as const;

export const invoices = [
  { id:"INV-001", customerId:"CUST-001", customer:"Acme Corporation",       branchId:"BR-001", date:"2026-06-01", dueDate:"2026-06-30", amount:12500,  tax:875,   discount:0,     status:"paid"     as InvoiceStatus, paymentTerms:"Net 30", notes:"",                                  paidDate:"2026-06-28", createdBy:"EMP-003" },
  { id:"INV-002", customerId:"CUST-002", customer:"TechStart Inc.",          branchId:"BR-001", date:"2026-06-05", dueDate:"2026-07-05", amount:8750,   tax:612.5, discount:500,   status:"sent"     as InvoiceStatus, paymentTerms:"Net 30", notes:"Awaiting approval from client.",      paidDate:null as string|null, createdBy:"EMP-003" },
  { id:"INV-003", customerId:"CUST-003", customer:"Global Traders Ltd.",     branchId:"BR-001", date:"2026-05-15", dueDate:"2026-06-15", amount:21300,  tax:1491,  discount:0,     status:"overdue"  as InvoiceStatus, paymentTerms:"Net 30", notes:"Follow up on payment.",              paidDate:null as string|null, createdBy:"EMP-008" },
  { id:"INV-004", customerId:"CUST-004", customer:"Sunrise Foods Co.",       branchId:"BR-002", date:"2026-06-10", dueDate:"2026-07-10", amount:5600,   tax:392,   discount:0,     status:"sent"     as InvoiceStatus, paymentTerms:"Net 30", notes:"",                                  paidDate:null as string|null, createdBy:"EMP-006" },
  { id:"INV-005", customerId:"CUST-005", customer:"Metro Building Supplies", branchId:"BR-001", date:"2026-06-12", dueDate:"2026-07-12", amount:34200,  tax:2394,  discount:2000,  status:"paid"     as InvoiceStatus, paymentTerms:"Net 30", notes:"Bulk order discount applied.",       paidDate:"2026-07-01", createdBy:"EMP-003" },
  { id:"INV-006", customerId:"CUST-006", customer:"Pacific Logistics",       branchId:"BR-003", date:"2026-05-28", dueDate:"2026-06-28", amount:9800,   tax:686,   discount:0,     status:"overdue"  as InvoiceStatus, paymentTerms:"Net 30", notes:"Account on hold.",                   paidDate:null as string|null, createdBy:"EMP-006" },
  { id:"INV-007", customerId:"CUST-007", customer:"Crown Retail Group",      branchId:"BR-001", date:"2026-06-15", dueDate:"2026-07-15", amount:15600,  tax:1092,  discount:600,   status:"sent"     as InvoiceStatus, paymentTerms:"Net 30", notes:"",                                  paidDate:null as string|null, createdBy:"EMP-003" },
  { id:"INV-008", customerId:"CUST-008", customer:"Elite Services Co.",      branchId:"BR-001", date:"2026-06-18", dueDate:"2026-07-18", amount:7200,   tax:504,   discount:0,     status:"paid"     as InvoiceStatus, paymentTerms:"Net 30", notes:"Repeat customer, priority service.", paidDate:"2026-07-03", createdBy:"EMP-008" },
];

export const invoiceItems = [
  { id:"IVI-001", invoiceId:"INV-001", productId:"SKU-002", description:"Hydraulic Pump 5HP",      qty:1,  unitPrice:12000, total:12000 },
  { id:"IVI-002", invoiceId:"INV-001", productId:"SKU-004", description:"Pressure Gauge 100psi",   qty:8,  unitPrice:625,   total:5000  },
  { id:"IVI-003", invoiceId:"INV-002", productId:"SKU-001", description:'Industrial Valve 2"',     qty:5,  unitPrice:950,   total:4750  },
  { id:"IVI-004", invoiceId:"INV-002", productId:"SKU-010", description:"Bearing 6205",            qty:12, unitPrice:333,   total:4000  },
  { id:"IVI-005", invoiceId:"INV-003", productId:"SKU-005", description:"Electric Motor 10kW",    qty:2,  unitPrice:44000, total:88000 },
  { id:"IVI-006", invoiceId:"INV-003", productId:"SKU-008", description:"Safety Helmet",           qty:25, unitPrice:520,   total:13000 },
  { id:"IVI-007", invoiceId:"INV-004", productId:"SKU-006", description:'Copper Fitting 1"',       qty:45, unitPrice:125,   total:5625  },
  { id:"IVI-008", invoiceId:"INV-005", productId:"SKU-005", description:"Electric Motor 10kW",    qty:5,  unitPrice:45000, total:225000},
  { id:"IVI-009", invoiceId:"INV-005", productId:"SKU-002", description:"Hydraulic Pump 5HP",     qty:3,  unitPrice:16000, total:48000 },
  { id:"IVI-010", invoiceId:"INV-006", productId:"SKU-007", description:'Ball Valve 3"',           qty:5,  unitPrice:2100,  total:10500 },
  { id:"IVI-011", invoiceId:"INV-007", productId:"SKU-001", description:'Industrial Valve 2"',    qty:10, unitPrice:900,   total:9000  },
  { id:"IVI-012", invoiceId:"INV-007", productId:"SKU-004", description:"Pressure Gauge 100psi",  qty:10, unitPrice:700,   total:7000  },
  { id:"IVI-013", invoiceId:"INV-008", productId:"SKU-006", description:'Copper Fitting 1"',      qty:60, unitPrice:120,   total:7200  },
];

export type ExpenseStatus = "draft" | "pending" | "approved" | "rejected" | "reimbursed";
export const EXPENSE_CATEGORIES = ["Office Supplies", "Travel", "Utilities", "Marketing", "Software", "Maintenance", "Meals", "Training", "Equipment", "Other"] as const;

export interface ExpenseRequestItem { name: string; qty: number; unitPrice: number; }
export interface ExpenseAttachment  { name: string; type: "receipt" | "invoice" | "other"; url: string; }

export const expenses = [
  {
    id:"EXP-001", category:"Office Supplies", description:"Stationery and paper for Q3",
    date:"2026-06-02", amount:450, status:"reimbursed" as ExpenseStatus,
    employeeId:"EMP-007", employeeName:"Thanachart Boonsri", branchId:"BR-001",
    requestItems:[{ name:"A4 Paper (ream)", qty:10, unitPrice:30 }, { name:"Pens box", qty:2, unitPrice:120 }, { name:"Stapler", qty:1, unitPrice:180 }] as ExpenseRequestItem[],
    attachments:[{ name:"receipt_stationery.jpg", type:"receipt" as const, url:"" }] as ExpenseAttachment[],
    notes:"Monthly office supplies top-up.", approvedBy:"EMP-005", approvedAt:"2026-06-03", reimbursedInPayroll:"PAY-002",
  },
  {
    id:"EXP-002", category:"Travel", description:"Client visit to Chiang Mai — taxi + hotel",
    date:"2026-06-05", amount:12500, status:"reimbursed" as ExpenseStatus,
    employeeId:"EMP-006", employeeName:"Kanokwan Srisuwan", branchId:"BR-002",
    requestItems:[{ name:"Taxi (BKK-Airport)", qty:1, unitPrice:400 }, { name:"Flight BKK-CNX", qty:1, unitPrice:4200 }, { name:"Hotel (2 nights)", qty:2, unitPrice:2500 }, { name:"Meals", qty:2, unitPrice:500 }, { name:"Taxi local", qty:4, unitPrice:150 }] as ExpenseRequestItem[],
    attachments:[{ name:"flight_ticket.pdf", type:"invoice" as const, url:"" }, { name:"hotel_receipt.jpg", type:"receipt" as const, url:"" }] as ExpenseAttachment[],
    notes:"Client meeting at CMI office.", approvedBy:"EMP-003", approvedAt:"2026-06-06", reimbursedInPayroll:"PAY-002",
  },
  {
    id:"EXP-003", category:"Utilities", description:"Electricity bill — June 2026",
    date:"2026-06-10", amount:8200, status:"approved" as ExpenseStatus,
    employeeId:"EMP-008", employeeName:"Siriporn Naknoi", branchId:"BR-001",
    requestItems:[{ name:"Electricity (June)", qty:1, unitPrice:8200 }] as ExpenseRequestItem[],
    attachments:[{ name:"electricity_june.pdf", type:"invoice" as const, url:"" }] as ExpenseAttachment[],
    notes:"", approvedBy:"EMP-003", approvedAt:"2026-06-11", reimbursedInPayroll:null as string|null,
  },
  {
    id:"EXP-004", category:"Marketing", description:"Social media ad campaign — Facebook",
    date:"2026-06-12", amount:25000, status:"pending" as ExpenseStatus,
    employeeId:"EMP-010", employeeName:"Ploy Jaidee", branchId:"BR-001",
    requestItems:[{ name:"Facebook Ads June budget", qty:1, unitPrice:25000 }] as ExpenseRequestItem[],
    attachments:[{ name:"fb_invoice.pdf", type:"invoice" as const, url:"" }] as ExpenseAttachment[],
    notes:"Q3 awareness campaign — approved in plan.", approvedBy:null as string|null, approvedAt:null as string|null, reimbursedInPayroll:null as string|null,
  },
  {
    id:"EXP-005", category:"Software", description:"SaaS tools — Figma, Notion, Slack",
    date:"2026-06-15", amount:5800, status:"approved" as ExpenseStatus,
    employeeId:"EMP-009", employeeName:"Ratchanon Pimpa", branchId:"BR-001",
    requestItems:[{ name:"Figma (annual)", qty:1, unitPrice:3200 }, { name:"Notion (team)", qty:1, unitPrice:1600 }, { name:"Slack (monthly)", qty:1, unitPrice:1000 }] as ExpenseRequestItem[],
    attachments:[{ name:"software_receipts.pdf", type:"receipt" as const, url:"" }] as ExpenseAttachment[],
    notes:"Annual renewal.", approvedBy:"EMP-003", approvedAt:"2026-06-16", reimbursedInPayroll:null as string|null,
  },
  {
    id:"EXP-006", category:"Maintenance", description:"Office printer repair",
    date:"2026-06-18", amount:3200, status:"pending" as ExpenseStatus,
    employeeId:"EMP-001", employeeName:"Somchai Wannasuk", branchId:"BR-001",
    requestItems:[{ name:"Technician service fee", qty:1, unitPrice:1800 }, { name:"Spare parts", qty:1, unitPrice:1400 }] as ExpenseRequestItem[],
    attachments:[] as ExpenseAttachment[],
    notes:"Printer broken mid-print job. Required same-day fix.", approvedBy:null as string|null, approvedAt:null as string|null, reimbursedInPayroll:null as string|null,
  },
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
export type StockStatus = "ok" | "low" | "out";
export type StockMovementType = "receive" | "issue" | "adjustment" | "return";

export const PRODUCT_CATEGORIES = ["Fittings","Equipment","Materials","Instruments","Safety","Electrical","Mechanical"] as const;

export const PRODUCT_BRANDS = ["DDK Pro", "DDK Express", "OEM", "Unbranded"] as const;

export const products = [
  { id:"SKU-001", name:'Industrial Valve 2"',    category:"Fittings",    stock:145, minStock:50,  unitPrice:850,   status:"ok"  as StockStatus, description:'Heavy-duty industrial gate valve, 2 inch, PN16 rated. Suitable for water and oil systems up to 180°C.',       barcode:"8850001000010", supplierId:"SUP-004", size:'2"',    leadTime:7,  brand:"DDK Pro",     branchIds:["BR-001","BR-002"] },
  { id:"SKU-002", name:"Hydraulic Pump 5HP",     category:"Equipment",   stock:12,  minStock:20,  unitPrice:15500, status:"low" as StockStatus, description:"5 horsepower hydraulic pump with 250 bar max pressure, direct drive, includes mounting bracket.",                barcode:"8850001000027", supplierId:"SUP-002", size:"5HP",   leadTime:21, brand:"OEM",         branchIds:["BR-001"] },
  { id:"SKU-003", name:"Steel Pipe 6m",          category:"Materials",   stock:0,   minStock:30,  unitPrice:1200,  status:"out" as StockStatus, description:"Schedule 40 carbon steel pipe, 6 metre length, 2 inch OD. Suitable for gas and water installations.",           barcode:"8850001000034", supplierId:"SUP-001", size:"6m",    leadTime:10, brand:"OEM",         branchIds:["BR-001","BR-003"] },
  { id:"SKU-004", name:"Pressure Gauge 100psi",  category:"Instruments", stock:68,  minStock:25,  unitPrice:650,   status:"ok"  as StockStatus, description:"Stainless steel bourdon tube pressure gauge, 100 psi / 7 bar, 2.5 inch dial, bottom connection.",              barcode:"8850001000041", supplierId:"SUP-004", size:"2.5\"", leadTime:14, brand:"DDK Pro",     branchIds:["BR-001","BR-002","BR-003"] },
  { id:"SKU-005", name:"Electric Motor 10kW",    category:"Equipment",   stock:8,   minStock:15,  unitPrice:42000, status:"low" as StockStatus, description:"Three-phase AC induction motor, 10kW / 13.4HP, IE3 efficiency class, 1450 RPM, B3 foot mounting.",             barcode:"8850001000058", supplierId:"SUP-002", size:"10kW",  leadTime:28, brand:"OEM",         branchIds:["BR-001"] },
  { id:"SKU-006", name:'Copper Fitting 1"',      category:"Fittings",    stock:320, minStock:100, unitPrice:125,   status:"ok"  as StockStatus, description:"Compression copper elbow fitting, 1 inch, suitable for hot and cold water plumbing up to 10 bar.",              barcode:"8850001000065", supplierId:"SUP-004", size:'1"',    leadTime:5,  brand:"DDK Express", branchIds:["BR-001","BR-002","BR-003","BR-004"] },
  { id:"SKU-007", name:'Ball Valve 3"',          category:"Fittings",    stock:5,   minStock:40,  unitPrice:2100,  status:"low" as StockStatus, description:"Full-bore stainless steel ball valve, 3 inch flanged ends, PN16, lever operated, bidirectional.",              barcode:"8850001000072", supplierId:"SUP-004", size:'3"',    leadTime:14, brand:"DDK Pro",     branchIds:["BR-001","BR-002"] },
  { id:"SKU-008", name:"Safety Helmet",          category:"Safety",      stock:85,  minStock:30,  unitPrice:480,   status:"ok"  as StockStatus, description:"Hard hat class E, ABS shell, 6-point suspension, adjustable ratchet, meets ANSI Z89.1 and EN 397.",            barcode:"8850001000089", supplierId:"SUP-001", size:"M/L",   leadTime:7,  brand:"DDK Express", branchIds:["BR-001","BR-002","BR-003","BR-004"] },
  { id:"SKU-009", name:"Cable 16mm 100m",        category:"Electrical",  stock:0,   minStock:20,  unitPrice:8500,  status:"out" as StockStatus, description:"PVC insulated copper cable, 16mm² single core, 100m drum, rated 450/750V, suitable for power distribution.",  barcode:"8850001000096", supplierId:"SUP-001", size:"16mm",  leadTime:10, brand:"OEM",         branchIds:["BR-001"] },
  { id:"SKU-010", name:"Bearing 6205",           category:"Mechanical",  stock:250, minStock:80,  unitPrice:320,   status:"ok"  as StockStatus, description:"Deep groove ball bearing 6205-2RS, 25×52×15mm, rubber sealed, C3 clearance, grease lubricated.",               barcode:"8850001000102", supplierId:"SUP-002", size:"6205",  leadTime:14, brand:"DDK Express", branchIds:["BR-001","BR-002","BR-004"] },
];

export const stockMovements = [
  { id:"SM-001", productId:"SKU-001", type:"receive"    as StockMovementType, qty:50,   refNo:"PO-005", date:"2026-05-28", note:"Regular restock from Global Fittings",          processedBy:"Admin",  balanceAfter:145 },
  { id:"SM-002", productId:"SKU-001", type:"issue"      as StockMovementType, qty:20,   refNo:"SO-001", date:"2026-06-01", note:"Issued for Metro Building Supplies order",      processedBy:"System", balanceAfter:125 },
  { id:"SM-003", productId:"SKU-001", type:"receive"    as StockMovementType, qty:40,   refNo:"PO-001", date:"2026-06-15", note:"Emergency top-up order",                        processedBy:"Admin",  balanceAfter:165 },
  { id:"SM-004", productId:"SKU-001", type:"issue"      as StockMovementType, qty:20,   refNo:"SO-003", date:"2026-06-20", note:"Issued for Global Traders order",               processedBy:"System", balanceAfter:145 },
  { id:"SM-005", productId:"SKU-002", type:"receive"    as StockMovementType, qty:10,   refNo:"PO-002", date:"2026-06-08", note:"In-transit from Asia Pacific Equipment",         processedBy:"Admin",  balanceAfter:22  },
  { id:"SM-006", productId:"SKU-002", type:"issue"      as StockMovementType, qty:10,   refNo:"SO-002", date:"2026-06-10", note:"Sold to Acme Corporation",                      processedBy:"System", balanceAfter:12  },
  { id:"SM-007", productId:"SKU-003", type:"issue"      as StockMovementType, qty:15,   refNo:"SO-003", date:"2026-06-05", note:"Issued for project — stock now depleted",       processedBy:"Admin",  balanceAfter:0   },
  { id:"SM-008", productId:"SKU-004", type:"receive"    as StockMovementType, qty:30,   refNo:"PO-003", date:"2026-06-15", note:"Received from Bangkok Parts Co.",               processedBy:"Admin",  balanceAfter:68  },
  { id:"SM-009", productId:"SKU-005", type:"issue"      as StockMovementType, qty:2,    refNo:"SO-001", date:"2026-06-01", note:"Sold to Metro Building Supplies",               processedBy:"System", balanceAfter:8   },
  { id:"SM-010", productId:"SKU-006", type:"receive"    as StockMovementType, qty:200,  refNo:"PO-004", date:"2026-06-20", note:"Bulk order from Global Fittings",               processedBy:"Admin",  balanceAfter:320 },
  { id:"SM-011", productId:"SKU-007", type:"issue"      as StockMovementType, qty:10,   refNo:"SO-004", date:"2026-06-12", note:"Sold to TechStart Inc.",                        processedBy:"System", balanceAfter:5   },
  { id:"SM-012", productId:"SKU-009", type:"adjustment" as StockMovementType, qty:-5,   refNo:"ADJ-001",date:"2026-06-01", note:"Stock count variance — damaged cables",         processedBy:"Admin",  balanceAfter:0   },
  { id:"SM-013", productId:"SKU-010", type:"receive"    as StockMovementType, qty:100,  refNo:"PO-005", date:"2026-05-30", note:"Received from KL Mechanical Supplies",          processedBy:"Admin",  balanceAfter:250 },
  { id:"SM-014", productId:"SKU-008", type:"issue"      as StockMovementType, qty:15,   refNo:"SO-001", date:"2026-06-01", note:"Safety equipment for Metro project",            processedBy:"System", balanceAfter:85  },
];

export type POStatus         = "pending" | "in-transit" | "received" | "cancelled";
export type POApprovalStatus = "draft" | "pending_approval" | "approved" | "rejected";
export type POSendMethod     = "email" | "line" | "none";

export const purchaseOrders = [
  { id:"PO-001", supplierId:"SUP-001", supplier:"Thai Industrial Supply",  date:"2026-06-01", expectedDate:"2026-06-15", items:5,  total:125000, status:"received"   as POStatus, approvalStatus:"approved"          as POApprovalStatus, approvalRequestedAt:"2026-06-01T08:00:00", sendMethod:"email" as POSendMethod, notes:"Regular monthly restock. Deliver to warehouse dock B." },
  { id:"PO-002", supplierId:"SUP-002", supplier:"Asia Pacific Equipment",  date:"2026-06-08", expectedDate:"2026-06-25", items:3,  total:285000, status:"in-transit"  as POStatus, approvalStatus:"approved"          as POApprovalStatus, approvalRequestedAt:"2026-06-08T09:00:00", sendMethod:"line"  as POSendMethod, notes:"Urgent — motors needed for Acme project. Expedited shipping." },
  { id:"PO-003", supplierId:"SUP-003", supplier:"Bangkok Parts Co.",       date:"2026-06-15", expectedDate:"2026-07-01", items:8,  total:45600,  status:"pending"     as POStatus, approvalStatus:"pending_approval"  as POApprovalStatus, approvalRequestedAt:"2026-07-04T07:00:00", sendMethod:"none"  as POSendMethod, notes:"Awaiting supplier confirmation." },
  { id:"PO-004", supplierId:"SUP-004", supplier:"Global Fittings Ltd.",    date:"2026-06-20", expectedDate:"2026-07-10", items:12, total:78900,  status:"pending"     as POStatus, approvalStatus:"pending_approval"  as POApprovalStatus, approvalRequestedAt:"2026-07-04T08:30:00", sendMethod:"none"  as POSendMethod, notes:"Bulk order to restock low-stock fittings." },
  { id:"PO-005", supplierId:"SUP-001", supplier:"KL Mechanical Supplies",  date:"2026-05-28", expectedDate:"2026-06-12", items:6,  total:192000, status:"received"   as POStatus, approvalStatus:"approved"          as POApprovalStatus, approvalRequestedAt:"2026-05-28T10:00:00", sendMethod:"email" as POSendMethod, notes:"" },
];

export const poLineItems = [
  { id:"PLI-001", poId:"PO-001", productId:"SKU-008", productName:"Safety Helmet",          qty:50,  unitPrice:460,   total:23000  },
  { id:"PLI-002", poId:"PO-001", productId:"SKU-003", productName:"Steel Pipe 6m",           qty:30,  unitPrice:1100,  total:33000  },
  { id:"PLI-003", poId:"PO-001", productId:"SKU-009", productName:"Cable 16mm 100m",         qty:5,   unitPrice:8000,  total:40000  },
  { id:"PLI-004", poId:"PO-001", productId:"SKU-004", productName:"Pressure Gauge 100psi",   qty:20,  unitPrice:600,   total:12000  },
  { id:"PLI-005", poId:"PO-001", productId:"SKU-010", productName:"Bearing 6205",            qty:100, unitPrice:170,   total:17000  },
  { id:"PLI-006", poId:"PO-002", productId:"SKU-005", productName:"Electric Motor 10kW",    qty:5,   unitPrice:40000, total:200000 },
  { id:"PLI-007", poId:"PO-002", productId:"SKU-002", productName:"Hydraulic Pump 5HP",      qty:5,   unitPrice:14000, total:70000  },
  { id:"PLI-008", poId:"PO-002", productId:"SKU-004", productName:"Pressure Gauge 100psi",   qty:15,  unitPrice:600,   total:9000   },  // padding to sum=285000 approx
  { id:"PLI-009", poId:"PO-003", productId:"SKU-001", productName:'Industrial Valve 2"',     qty:20,  unitPrice:800,   total:16000  },
  { id:"PLI-010", poId:"PO-003", productId:"SKU-006", productName:'Copper Fitting 1"',       qty:150, unitPrice:110,   total:16500  },
  { id:"PLI-011", poId:"PO-003", productId:"SKU-007", productName:'Ball Valve 3"',           qty:6,   unitPrice:2000,  total:12000  },
  { id:"PLI-012", poId:"PO-004", productId:"SKU-001", productName:'Industrial Valve 2"',     qty:40,  unitPrice:800,   total:32000  },
  { id:"PLI-013", poId:"PO-004", productId:"SKU-006", productName:'Copper Fitting 1"',       qty:200, unitPrice:110,   total:22000  },
  { id:"PLI-014", poId:"PO-004", productId:"SKU-007", productName:'Ball Valve 3"',           qty:12,  unitPrice:2000,  total:24000  },
  { id:"PLI-015", poId:"PO-005", productId:"SKU-010", productName:"Bearing 6205",            qty:200, unitPrice:280,   total:56000  },
  { id:"PLI-016", poId:"PO-005", productId:"SKU-008", productName:"Safety Helmet",          qty:30,  unitPrice:450,   total:13500  },
  { id:"PLI-017", poId:"PO-005", productId:"SKU-004", productName:"Pressure Gauge 100psi",   qty:30,  unitPrice:600,   total:18000  },
];

export const suppliers = [
  { id:"SUP-001", name:"Thai Industrial Supply", contact:"Somchai Jaidee",  email:"somchai@tis.co.th",    phone:"02-555-1234",    category:"General",   rating:4.5, address:"123 Industrial Estate Rd, Samut Prakan 10280", country:"Thailand",  paymentTerms:"Net 30", taxId:"0105553001234", notes:"Reliable local supplier. Volume discounts above ฿100k. Lead time 5–7 days.", status:"active"   as const },
  { id:"SUP-002", name:"Asia Pacific Equipment", contact:"David Lim",        email:"david@ape.com.sg",      phone:"+65-6789-0123",  category:"Equipment", rating:4.2, address:"45 Tuas South Ave 2, Singapore 637534",       country:"Singapore", paymentTerms:"Net 45", taxId:"SG201234567A",  notes:"Specialises in heavy machinery. Minimum order SGD 5,000. 3–4 week lead time.", status:"active"   as const },
  { id:"SUP-003", name:"Bangkok Parts Co.",       contact:"Nidnoy Sukjai",   email:"info@bkparts.co.th",    phone:"02-666-5678",    category:"Parts",     rating:3.8, address:"56/7 Lat Krabang Industrial, Bangkok 10520",  country:"Thailand",  paymentTerms:"Net 15", taxId:"0105554005678", notes:"Good for small parts and fasteners. Occasional delays. Prefer COD.",           status:"active"   as const },
  { id:"SUP-004", name:"Global Fittings Ltd.",    contact:"James Wong",       email:"james@gfl.com.hk",      phone:"+852-2345-6789", category:"Fittings",  rating:4.7, address:"Unit 8, Kwai Chung Industrial, Hong Kong",    country:"Hong Kong", paymentTerms:"Net 60", taxId:"HK12345678",    notes:"Premium fittings, ISO certified. Best pricing for orders >฿50k. 2 week lead.", status:"active"   as const },
  { id:"SUP-005", name:"KL Mechanical Supplies",  contact:"Ahmad Razif",      email:"ahmad@klmech.com.my",   phone:"+60-3-7890-1234",category:"Mechanical",rating:4.1, address:"Lot 22, Shah Alam Industrial Park, Selangor",  country:"Malaysia",  paymentTerms:"Net 30", taxId:"MY201987654",   notes:"Bearings and mechanical parts specialist. Good quality, competitive pricing.",   status:"inactive" as const },
];

// Sales
export type SalesOrderStage = "prospect" | "quoted" | "negotiation" | "confirmed" | "invoiced" | "delivered";
export type CustomerType   = "individual" | "corporate";
export type CustomerGender = "male" | "female" | "other";

export const customers = [
  { id: "CUST-001", name: "Acme Corporation",       contact: "John Smith",      email: "john@acme.com",           phone: "02-111-2345", type: "Enterprise", totalSpend: 485000,  status: "active",   address: "22 Sathorn Rd, Bangkok 10120" },
  { id: "CUST-002", name: "TechStart Inc.",          contact: "Sara Lee",        email: "sara@techstart.io",       phone: "02-222-3456", type: "SME",        totalSpend: 125000,  status: "active",   address: "88 Rama 9 Rd, Bangkok 10310" },
  { id: "CUST-003", name: "Global Traders Ltd.",     contact: "Ahmed Hassan",    email: "ahmed@gtraders.com",      phone: "02-333-4567", type: "Enterprise", totalSpend: 892000,  status: "active",   address: "55 Surawong Rd, Bangkok 10500" },
  { id: "CUST-004", name: "Sunrise Foods Co.",       contact: "Malee Prasert",   email: "malee@sunrisefoods.co.th",phone: "02-444-5678", type: "SME",        totalSpend: 67500,   status: "active",   address: "9 Ladprao Rd, Bangkok 10900" },
  { id: "CUST-005", name: "Metro Building Supplies", contact: "Tom Richards",    email: "tom@metrobuilding.com",   phone: "02-555-6789", type: "Enterprise", totalSpend: 1250000, status: "active",   address: "100 Bangna-Trad Rd, Bangkok 10260" },
  { id: "CUST-006", name: "Pacific Logistics",       contact: "Kanokwan Thong",  email: "kanokwan@paclog.co.th",   phone: "02-666-7890", type: "SME",        totalSpend: 98000,   status: "inactive", address: "77 Ratchadapisek Rd, Bangkok 10400" },
  { id: "CUST-007", name: "Crown Retail Group",      contact: "James Crawford",  email: "james@crownretail.co.th", phone: "02-777-8901", type: "Enterprise", totalSpend: 340000,  status: "active",   address: "34 Phaholyothin Rd, Bangkok 10400" },
  { id: "CUST-008", name: "Elite Services Co.",      contact: "Priya Sharma",    email: "priya@eliteservices.com", phone: "02-888-9012", type: "SME",        totalSpend: 52000,   status: "active",   address: "18 Wireless Rd, Bangkok 10330" },
];

// Rich customer profiles (Individual + Corporate)
export const customerProfiles = [
  // ── Individuals ──
  { id:"CP-001", customerType:"individual" as CustomerType, firstName:"Somchai",  lastName:"Jaidee",    gender:"male"   as CustomerGender, dob:"1985-03-15", nationalId:"1100100234567", phone:"081-234-5678",  email:"somchai.j@gmail.com",           address:"123/45 Sukhumvit Soi 11, Klongtoey, Bangkok 10110",         totalSpend:285000, status:"active"   as const, joinDate:"2024-01-15", notes:"VIP — prefers cash on delivery. Long-term buyer.",   tags:["vip","repeat"] },
  { id:"CP-002", customerType:"individual" as CustomerType, firstName:"Ploy",     lastName:"Srichan",   gender:"female" as CustomerGender, dob:"1992-07-22", nationalId:"3100200345678", phone:"089-345-6789",  email:"ploy.s@hotmail.com",             address:"56/7 Rama IV Rd, Klong Toei, Bangkok 10120",                totalSpend:89500,  status:"active"   as const, joinDate:"2024-03-05", notes:"",                                                   tags:["regular"] },
  { id:"CP-003", customerType:"individual" as CustomerType, firstName:"James",    lastName:"Crawford",  gender:"male"   as CustomerGender, dob:"1978-11-08", nationalId:"",             phone:"090-456-7890",  email:"james.c@outlook.com",            address:"18/9 Wireless Rd, Lumphini, Bangkok 10330",                 totalSpend:425000, status:"active"   as const, joinDate:"2023-08-20", notes:"Expat — requires English invoice.",                  tags:["vip","english"] },
  { id:"CP-004", customerType:"individual" as CustomerType, firstName:"Malee",    lastName:"Wongkham",  gender:"female" as CustomerGender, dob:"1990-05-30", nationalId:"2300400567890", phone:"082-567-8901",  email:"malee.w@yahoo.com",              address:"22 Charoen Krung Soi 38, Bang Rak, Bangkok 10500",          totalSpend:52000,  status:"active"   as const, joinDate:"2025-01-12", notes:"",                                                   tags:[] },
  { id:"CP-005", customerType:"individual" as CustomerType, firstName:"Thanida",  lastName:"Poolsub",   gender:"female" as CustomerGender, dob:"1995-02-18", nationalId:"3100500678901", phone:"094-678-9012",  email:"thanida.p@gmail.com",            address:"10/3 Lat Phrao Rd, Chatuchak, Bangkok 10900",               totalSpend:38000,  status:"inactive" as const, joinDate:"2025-04-20", notes:"Inactive since Q2 2026.",                            tags:[] },
  // ── Corporate ──
  { id:"CP-006", customerType:"corporate" as CustomerType, companyName:"Acme Corporation",          taxId:"0105554001234", registrationNo:"BC-2548-001234", contactPerson:"John Smith",     contactTitle:"Procurement Director", businessType:"Manufacturing", phone:"02-111-2345",  email:"procurement@acme.com",          address:"22 Sathorn Rd, Sathorn, Bangkok 10120",           website:"www.acme.com",            totalSpend:485000,  status:"active"   as const, joinDate:"2023-05-01", notes:"Enterprise account. Net 30 payment.",            tags:["enterprise","net30"] },
  { id:"CP-007", customerType:"corporate" as CustomerType, companyName:"TechStart Inc.",            taxId:"0105556002345", registrationNo:"BC-2556-002345", contactPerson:"Sara Lee",        contactTitle:"Operations Manager",   businessType:"Technology",    phone:"02-222-3456",  email:"sara@techstart.io",             address:"88 Rama 9 Rd, Huai Khwang, Bangkok 10310",       website:"www.techstart.io",        totalSpend:125000,  status:"active"   as const, joinDate:"2024-01-10", notes:"Startup — flexible payment preferred.",          tags:["sme","startup"] },
  { id:"CP-008", customerType:"corporate" as CustomerType, companyName:"Global Traders Ltd.",       taxId:"0105558003456", registrationNo:"BC-2558-003456", contactPerson:"Ahmed Hassan",    contactTitle:"CEO",                  businessType:"Trading",       phone:"02-333-4567",  email:"ahmed@gtraders.com",            address:"55 Surawong Rd, Bang Rak, Bangkok 10500",         website:"www.gtraders.com",        totalSpend:892000,  status:"active"   as const, joinDate:"2023-03-15", notes:"Largest account. Priority service. VIP pricing.", tags:["enterprise","priority","vip"] },
  { id:"CP-009", customerType:"corporate" as CustomerType, companyName:"Metro Building Supplies",   taxId:"0105560004567", registrationNo:"BC-2560-004567", contactPerson:"Tom Richards",    contactTitle:"Purchasing Manager",   businessType:"Construction",  phone:"02-555-6789",  email:"tom@metrobuilding.com",         address:"100 Bangna-Trad Rd, Bangna, Bangkok 10260",      website:"www.metrobuilding.com",   totalSpend:1250000, status:"active"   as const, joinDate:"2022-11-01", notes:"Top customer. Special pricing applies.",         tags:["enterprise","vip","discount"] },
  { id:"CP-010", customerType:"corporate" as CustomerType, companyName:"Pacific Logistics Co., Ltd.",taxId:"0105562005678",registrationNo:"BC-2562-005678", contactPerson:"Kanokwan Thong",  contactTitle:"Operations Director",  businessType:"Logistics",     phone:"02-666-7890",  email:"kanokwan@paclog.co.th",         address:"77 Ratchadapisek Rd, Din Daeng, Bangkok 10400",  website:"www.paclog.co.th",        totalSpend:98000,   status:"inactive" as const, joinDate:"2023-07-20", notes:"Account suspended pending payment.",             tags:["inactive"] },
  { id:"CP-011", customerType:"corporate" as CustomerType, companyName:"Crown Retail Group",        taxId:"0105564006789", registrationNo:"BC-2564-006789", contactPerson:"James Crawford",  contactTitle:"Procurement VP",       businessType:"Retail",        phone:"02-777-8901",  email:"james@crownretail.co.th",       address:"34 Phaholyothin Rd, Phaya Thai, Bangkok 10400",  website:"www.crownretail.co.th",   totalSpend:340000,  status:"active"   as const, joinDate:"2024-06-01", notes:"New enterprise prospect. High growth potential.", tags:["enterprise","prospect"] },
  { id:"CP-012", customerType:"corporate" as CustomerType, companyName:"Elite Services Co.",         taxId:"0105566007890", registrationNo:"BC-2566-007890", contactPerson:"Priya Sharma",    contactTitle:"General Manager",      businessType:"Services",      phone:"02-888-9012",  email:"priya@eliteservices.com",       address:"18 Wireless Rd, Pathumwan, Bangkok 10330",       website:"www.eliteservices.com",   totalSpend:52000,   status:"active"   as const, joinDate:"2025-02-14", notes:"Regular repeat customer.",                       tags:["sme","repeat"] },
];

export const salesOrders = [
  { id:"SO-001", customerId:"CUST-005", customer:"Metro Building Supplies", date:"2026-06-01", deliveryDate:"2026-06-14", items:8,  amount:342000, stage:"delivered"   as SalesOrderStage, probability:100, notes:"Priority delivery to site 3. Dock 2 at rear entrance." },
  { id:"SO-002", customerId:"CUST-001", customer:"Acme Corporation",        date:"2026-06-05", deliveryDate:"2026-06-20", items:5,  amount:125000, stage:"invoiced"    as SalesOrderStage, probability:95,  notes:"Invoice sent. Awaiting payment NET30." },
  { id:"SO-003", customerId:"CUST-003", customer:"Global Traders Ltd.",     date:"2026-06-10", deliveryDate:"2026-07-05", items:12, amount:580000, stage:"confirmed"   as SalesOrderStage, probability:90,  notes:"Large order confirmed. Coordinate with logistics for split delivery." },
  { id:"SO-004", customerId:"CUST-002", customer:"TechStart Inc.",          date:"2026-06-12", deliveryDate:"2026-06-30", items:3,  amount:87500,  stage:"quoted"      as SalesOrderStage, probability:60,  notes:"Quote sent. Client comparing with 2 other vendors." },
  { id:"SO-005", customerId:"CUST-004", customer:"Sunrise Foods Co.",       date:"2026-06-15", deliveryDate:"2026-07-10", items:6,  amount:56000,  stage:"negotiation" as SalesOrderStage, probability:75,  notes:"Negotiating bulk discount on Safety items. Target close by 20 Jun." },
  { id:"SO-006", customerId:"CUST-007", customer:"Crown Retail Group",      date:"2026-06-18", deliveryDate:"2026-07-15", items:4,  amount:215000, stage:"prospect"    as SalesOrderStage, probability:30,  notes:"Prospect from trade show. Follow-up call scheduled 25 Jun." },
  { id:"SO-007", customerId:"CUST-008", customer:"Elite Services Co.",      date:"2026-06-20", deliveryDate:"2026-07-08", items:2,  amount:42000,  stage:"confirmed"   as SalesOrderStage, probability:90,  notes:"Repeat customer. Confirmed via email. Standard terms apply." },
];

export const soLineItems = [
  // SO-001 Metro Building Supplies (8 lines)
  { id:"SOL-001", soId:"SO-001", productId:"SKU-005", productName:"Electric Motor 10kW",    qty:5,   unitPrice:46000, total:230000 },
  { id:"SOL-002", soId:"SO-001", productId:"SKU-002", productName:"Hydraulic Pump 5HP",     qty:3,   unitPrice:16500, total:49500  },
  { id:"SOL-003", soId:"SO-001", productId:"SKU-001", productName:'Industrial Valve 2"',    qty:15,  unitPrice:950,   total:14250  },
  { id:"SOL-004", soId:"SO-001", productId:"SKU-008", productName:"Safety Helmet",          qty:40,  unitPrice:550,   total:22000  },
  { id:"SOL-005", soId:"SO-001", productId:"SKU-006", productName:'Copper Fitting 1"',      qty:80,  unitPrice:150,   total:12000  },
  { id:"SOL-006", soId:"SO-001", productId:"SKU-010", productName:"Bearing 6205",           qty:30,  unitPrice:360,   total:10800  },
  { id:"SOL-007", soId:"SO-001", productId:"SKU-004", productName:"Pressure Gauge 100psi",  qty:10,  unitPrice:750,   total:7500   },
  { id:"SOL-008", soId:"SO-001", productId:"SKU-007", productName:'Ball Valve 3"',          qty:1,   unitPrice:2400,  total:2400   },
  // SO-002 Acme Corporation (5 lines)
  { id:"SOL-009", soId:"SO-002", productId:"SKU-002", productName:"Hydraulic Pump 5HP",     qty:4,   unitPrice:16000, total:64000  },
  { id:"SOL-010", soId:"SO-002", productId:"SKU-004", productName:"Pressure Gauge 100psi",  qty:25,  unitPrice:700,   total:17500  },
  { id:"SOL-011", soId:"SO-002", productId:"SKU-001", productName:'Industrial Valve 2"',    qty:15,  unitPrice:900,   total:13500  },
  { id:"SOL-012", soId:"SO-002", productId:"SKU-010", productName:"Bearing 6205",           qty:60,  unitPrice:360,   total:21600  },
  { id:"SOL-013", soId:"SO-002", productId:"SKU-006", productName:'Copper Fitting 1"',      qty:55,  unitPrice:150,   total:8250   },
  // SO-003 Global Traders (12 lines)
  { id:"SOL-014", soId:"SO-003", productId:"SKU-005", productName:"Electric Motor 10kW",    qty:8,   unitPrice:46000, total:368000 },
  { id:"SOL-015", soId:"SO-003", productId:"SKU-002", productName:"Hydraulic Pump 5HP",     qty:4,   unitPrice:16500, total:66000  },
  { id:"SOL-016", soId:"SO-003", productId:"SKU-007", productName:'Ball Valve 3"',          qty:10,  unitPrice:2400,  total:24000  },
  { id:"SOL-017", soId:"SO-003", productId:"SKU-001", productName:'Industrial Valve 2"',    qty:35,  unitPrice:950,   total:33250  },
  { id:"SOL-018", soId:"SO-003", productId:"SKU-004", productName:"Pressure Gauge 100psi",  qty:20,  unitPrice:750,   total:15000  },
  { id:"SOL-019", soId:"SO-003", productId:"SKU-009", productName:"Cable 16mm 100m",        qty:3,   unitPrice:9200,  total:27600  },
  { id:"SOL-020", soId:"SO-003", productId:"SKU-006", productName:'Copper Fitting 1"',      qty:80,  unitPrice:150,   total:12000  },
  { id:"SOL-021", soId:"SO-003", productId:"SKU-008", productName:"Safety Helmet",          qty:20,  unitPrice:550,   total:11000  },
  { id:"SOL-022", soId:"SO-003", productId:"SKU-010", productName:"Bearing 6205",           qty:25,  unitPrice:360,   total:9000   },
  { id:"SOL-023", soId:"SO-003", productId:"SKU-003", productName:"Steel Pipe 6m",          qty:5,   unitPrice:1400,  total:7000   },
  { id:"SOL-024", soId:"SO-003", productId:"SKU-004", productName:"Pressure Gauge 100psi",  qty:10,  unitPrice:750,   total:7500   },
  { id:"SOL-025", soId:"SO-003", productId:"SKU-002", productName:"Hydraulic Pump 5HP",     qty:1,   unitPrice:16500, total:16500  },
  // SO-004 TechStart (3 lines)
  { id:"SOL-026", soId:"SO-004", productId:"SKU-002", productName:"Hydraulic Pump 5HP",     qty:3,   unitPrice:16000, total:48000  },
  { id:"SOL-027", soId:"SO-004", productId:"SKU-005", productName:"Electric Motor 10kW",    qty:1,   unitPrice:46000, total:46000  },
  { id:"SOL-028", soId:"SO-004", productId:"SKU-010", productName:"Bearing 6205",           qty:20,  unitPrice:360,   total:7200   },
  // SO-005 Sunrise Foods (6 lines)
  { id:"SOL-029", soId:"SO-005", productId:"SKU-001", productName:'Industrial Valve 2"',    qty:10,  unitPrice:950,   total:9500   },
  { id:"SOL-030", soId:"SO-005", productId:"SKU-006", productName:'Copper Fitting 1"',      qty:100, unitPrice:150,   total:15000  },
  { id:"SOL-031", soId:"SO-005", productId:"SKU-008", productName:"Safety Helmet",          qty:20,  unitPrice:550,   total:11000  },
  { id:"SOL-032", soId:"SO-005", productId:"SKU-004", productName:"Pressure Gauge 100psi",  qty:8,   unitPrice:750,   total:6000   },
  { id:"SOL-033", soId:"SO-005", productId:"SKU-010", productName:"Bearing 6205",           qty:20,  unitPrice:360,   total:7200   },
  { id:"SOL-034", soId:"SO-005", productId:"SKU-003", productName:"Steel Pipe 6m",          qty:5,   unitPrice:1400,  total:7000   },
  // SO-006 Crown Retail Group (4 lines)
  { id:"SOL-035", soId:"SO-006", productId:"SKU-005", productName:"Electric Motor 10kW",    qty:3,   unitPrice:46000, total:138000 },
  { id:"SOL-036", soId:"SO-006", productId:"SKU-002", productName:"Hydraulic Pump 5HP",     qty:3,   unitPrice:16500, total:49500  },
  { id:"SOL-037", soId:"SO-006", productId:"SKU-004", productName:"Pressure Gauge 100psi",  qty:20,  unitPrice:750,   total:15000  },
  { id:"SOL-038", soId:"SO-006", productId:"SKU-007", productName:'Ball Valve 3"',          qty:5,   unitPrice:2400,  total:12000  },
  // SO-007 Elite Services (2 lines)
  { id:"SOL-039", soId:"SO-007", productId:"SKU-001", productName:'Industrial Valve 2"',    qty:25,  unitPrice:950,   total:23750  },
  { id:"SOL-040", soId:"SO-007", productId:"SKU-010", productName:"Bearing 6205",           qty:50,  unitPrice:360,   total:18000  },
];

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
  // Name
  firstName:         string;
  lastName:          string;
  firstNameTh?:      string;
  lastNameTh?:       string;
  nickname?:         string;
  name:              string; // firstName + " " + lastName
  gender:            EmployeeGender;
  dob?:              string;
  nationalId?:       string;
  // Contact
  phone?:            string;
  personalEmail?:    string;
  workEmail?:        string;
  // Employment
  department:        string;
  position:          string;
  employmentType:    EmploymentType;
  branchId?:         string;
  hireDate:          string;
  probationEndDate?: string;
  managerId?:        string;
  // Compensation
  salary:            number;
  bankAccounts?:     BankAccount[];
  // Social Security Fund (ประกันสังคม)
  ssn?:              string;  // เลขที่ผู้ประกันตน
  ssfFundType?:      "33" | "39" | "40";
  ssfEnrollmentDate?:string;
  ssfHospital?:      string;
  ssfStatus?:        SsfStatus;
  // Emergency
  emergencyName?:    string;
  emergencyRelation?:string;
  emergencyPhone?:   string;
  // Documents / photo
  photo?:            string;
  documents?:        string[];
  // Status
  status:            EmployeeStatus;
}

export const employees: Employee[] = [
  { id:"EMP-001", firstName:"Somchai",    lastName:"Wannasuk",   firstNameTh:"สมชาย",    lastNameTh:"วรรณสุข",    nickname:"Chai",   name:"Somchai Wannasuk",    gender:"male",   dob:"1990-05-14", nationalId:"1-1001-00001-00-0", phone:"081-111-0001", personalEmail:"somchai.w@gmail.com",   workEmail:"somchai@ddk.co.th",   department:"Engineering", position:"Senior Engineer",         employmentType:"full-time", branchId:"BR-001", hireDate:"2020-03-15", probationEndDate:"2020-06-15", managerId:"EMP-003", salary:85000,  bankAccounts:[{ id:"ba1", bankName:"SCB",   branch:"Silom",       accountNumber:"123-4-56789-0", accountName:"Somchai Wannasuk",    isMain:true  }, { id:"ba2", bankName:"Kbank", branch:"Asok",        accountNumber:"234-1-11111-2", accountName:"Somchai Wannasuk",    isMain:false }], ssn:"1100100001000", ssfFundType:"33", ssfEnrollmentDate:"2020-03-15", ssfHospital:"Bangkok Hospital",              ssfStatus:"active",   emergencyName:"Malee Wannasuk",     emergencyRelation:"Spouse",  emergencyPhone:"081-111-9999", status:"active"   },
  { id:"EMP-002", firstName:"Nattaporn",  lastName:"Srisuk",     firstNameTh:"ณัฐพร",    lastNameTh:"ศรีสุข",      nickname:"Nat",    name:"Nattaporn Srisuk",    gender:"female", dob:"1988-11-22", nationalId:"1-1001-00002-00-0", phone:"082-222-0002", personalEmail:"nattaporn.s@gmail.com", workEmail:"nattaporn@ddk.co.th", department:"Finance",      position:"Finance Manager",         employmentType:"full-time", branchId:"BR-001", hireDate:"2019-08-01", probationEndDate:"2019-11-01", managerId:"EMP-003", salary:95000,  bankAccounts:[{ id:"ba3", bankName:"Kbank", branch:"Siam",        accountNumber:"234-5-67890-1", accountName:"Nattaporn Srisuk",    isMain:true  }, { id:"ba4", bankName:"BBL",   branch:"Ladprao",     accountNumber:"345-2-22222-3", accountName:"Nattaporn Srisuk",    isMain:false }], ssn:"1100100002000", ssfFundType:"33", ssfEnrollmentDate:"2019-08-01", ssfHospital:"Bumrungrad International Hospital", ssfStatus:"active",   emergencyName:"Prasit Srisuk",       emergencyRelation:"Father",  emergencyPhone:"082-222-8888", status:"active"   },
  { id:"EMP-003", firstName:"Prapas",     lastName:"Chamnankit", firstNameTh:"ประภาส",   lastNameTh:"ชำนาญกิจ",   nickname:"Boss",   name:"Prapas Chamnankit",   gender:"male",   dob:"1985-03-08", nationalId:"1-1001-00003-00-0", phone:"083-333-0003", personalEmail:"prapas.c@gmail.com",   workEmail:"prapas@ddk.co.th",    department:"Sales",        position:"Sales Director",          employmentType:"full-time", branchId:"BR-001", hireDate:"2018-05-10", probationEndDate:"2018-08-10", managerId:undefined,  salary:120000, bankAccounts:[{ id:"ba5", bankName:"BBL",   branch:"Wireless Rd", accountNumber:"345-6-78901-2", accountName:"Prapas Chamnankit",   isMain:true  }, { id:"ba6", bankName:"SCB",   branch:"Ratchada",    accountNumber:"456-3-33333-4", accountName:"Prapas Chamnankit",   isMain:false }, { id:"ba7", bankName:"KTB",   branch:"Phaya Thai",  accountNumber:"567-4-44444-5", accountName:"Prapas Chamnankit",   isMain:false }], ssn:"1100100003000", ssfFundType:"33", ssfEnrollmentDate:"2018-05-10", ssfHospital:"Samitivej Hospital",            ssfStatus:"active",   emergencyName:"Siripat Chamnankit",  emergencyRelation:"Spouse",  emergencyPhone:"083-333-7777", status:"active"   },
  { id:"EMP-004", firstName:"Pornpimol",  lastName:"Kittipat",   firstNameTh:"พรพิมล",   lastNameTh:"กิตติพัฒน์", nickname:"Pim",    name:"Pornpimol Kittipat",  gender:"female", dob:"1992-07-30", nationalId:"1-1001-00004-00-0", phone:"084-444-0004", personalEmail:"pornpimol.k@gmail.com", workEmail:"pornpimol@ddk.co.th", department:"HR",           position:"HR Manager",              employmentType:"full-time", branchId:"BR-001", hireDate:"2021-01-20", probationEndDate:"2021-04-20", managerId:"EMP-003", salary:88000,  bankAccounts:[{ id:"ba8", bankName:"KTB",   branch:"Chatuchak",   accountNumber:"456-7-89012-3", accountName:"Pornpimol Kittipat",  isMain:true  }],                                                                                                                                                         ssn:"1100100004000", ssfFundType:"33", ssfEnrollmentDate:"2021-01-20", ssfHospital:"Ramathibodi Hospital",          ssfStatus:"active",   emergencyName:"Kittipat Chaiya",     emergencyRelation:"Spouse",  emergencyPhone:"084-444-6666", status:"active"   },
  { id:"EMP-005", firstName:"Wichai",     lastName:"Thongdee",   firstNameTh:"วิชัย",    lastNameTh:"ทองดี",       nickname:"Chai",   name:"Wichai Thongdee",     gender:"male",   dob:"1991-09-12", nationalId:"1-1001-00005-00-0", phone:"085-555-0005", personalEmail:"wichai.t@gmail.com",   workEmail:"wichai@ddk.co.th",    department:"Operations",   position:"Operations Supervisor",   employmentType:"full-time", branchId:"BR-002", hireDate:"2020-11-05", probationEndDate:"2021-02-05", managerId:"EMP-003", salary:72000,  bankAccounts:[{ id:"ba9", bankName:"SCB",   branch:"Bang Na",     accountNumber:"567-8-90123-4", accountName:"Wichai Thongdee",     isMain:true  }],                                                                                                                                                         ssn:"1100100005000", ssfFundType:"33", ssfEnrollmentDate:"2020-11-05", ssfHospital:"Paolo Hospital",                ssfStatus:"active",   emergencyName:"Somjai Thongdee",     emergencyRelation:"Mother",  emergencyPhone:"085-555-5555", status:"active"   },
  { id:"EMP-006", firstName:"Kanokwan",   lastName:"Srisuwan",   firstNameTh:"กนกวรรณ",  lastNameTh:"ศรีสุวรรณ",  nickname:"Nok",    name:"Kanokwan Srisuwan",   gender:"female", dob:"1995-02-18", nationalId:"1-1001-00006-00-0", phone:"086-666-0006", personalEmail:"kanokwan.s@gmail.com",  workEmail:"kanokwan@ddk.co.th",  department:"Sales",        position:"Sales Representative",    employmentType:"full-time", branchId:"BR-003", hireDate:"2022-06-15", probationEndDate:"2022-09-15", managerId:"EMP-003", salary:55000,  bankAccounts:[{ id:"ba10",bankName:"Kbank", branch:"Pattaya",     accountNumber:"678-9-01234-5", accountName:"Kanokwan Srisuwan",   isMain:true  }],                                                                                                                                                         ssn:"1100100006000", ssfFundType:"33", ssfEnrollmentDate:"2022-06-15", ssfHospital:"Bangpakok Hospital",            ssfStatus:"active",   emergencyName:"Manat Srisuwan",      emergencyRelation:"Father",  emergencyPhone:"086-666-4444", status:"active"   },
  { id:"EMP-007", firstName:"Thanachart", lastName:"Boonsri",    firstNameTh:"ธนชาติ",   lastNameTh:"บุญศรี",      nickname:"Tana",   name:"Thanachart Boonsri",  gender:"male",   dob:"1998-06-05", nationalId:"1-1001-00007-00-0", phone:"087-777-0007", personalEmail:"thanachart.b@gmail.com",workEmail:"thanachart@ddk.co.th", department:"Engineering", position:"Junior Engineer",          employmentType:"full-time", branchId:"BR-001", hireDate:"2023-02-01", probationEndDate:"2023-05-01", managerId:"EMP-001", salary:45000,  bankAccounts:[{ id:"ba11",bankName:"BBL",   branch:"Bangkapi",    accountNumber:"789-0-12345-6", accountName:"Thanachart Boonsri",  isMain:true  }],                                                                                                                                                         ssn:"1100100007000", ssfFundType:"33", ssfEnrollmentDate:"2023-02-01", ssfHospital:"Vejthani Hospital",             ssfStatus:"active",   emergencyName:"Boonsri Decha",       emergencyRelation:"Father",  emergencyPhone:"087-777-3333", status:"active"   },
  { id:"EMP-008", firstName:"Siriporn",   lastName:"Naknoi",     firstNameTh:"ศิริพร",   lastNameTh:"นาคน้อย",    nickname:"Sri",    name:"Siriporn Naknoi",     gender:"female", dob:"1993-12-25", nationalId:"1-1001-00008-00-0", phone:"088-888-0008", personalEmail:"siriporn.n@gmail.com",  workEmail:"siriporn@ddk.co.th",  department:"Finance",      position:"Accountant",              employmentType:"full-time", branchId:"BR-001", hireDate:"2021-09-10", probationEndDate:"2021-12-10", managerId:"EMP-002", salary:52000,  bankAccounts:[{ id:"ba12",bankName:"KTB",   branch:"Nonthaburi",  accountNumber:"890-1-23456-7", accountName:"Siriporn Naknoi",     isMain:true  }, { id:"ba13",bankName:"TMBThanachart", branch:"Central",   accountNumber:"901-5-55555-6", accountName:"Siriporn Naknoi",     isMain:false }], ssn:"1100100008000", ssfFundType:"33", ssfEnrollmentDate:"2021-09-10", ssfHospital:"Phyathai Hospital",             ssfStatus:"active",   emergencyName:"Naknoi Suwan",        emergencyRelation:"Mother",  emergencyPhone:"088-888-2222", status:"active"   },
  { id:"EMP-009", firstName:"Ratchanon",  lastName:"Pimpa",      firstNameTh:"รัชนนท์",  lastNameTh:"พิมพ์พา",    nickname:"Non",    name:"Ratchanon Pimpa",     gender:"male",   dob:"1996-04-11", nationalId:"1-1001-00009-00-0", phone:"089-999-0009", personalEmail:"ratchanon.p@gmail.com", workEmail:"ratchanon@ddk.co.th", department:"IT",           position:"IT Administrator",        employmentType:"full-time", branchId:"BR-001", hireDate:"2022-03-28", probationEndDate:"2022-06-28", managerId:"EMP-003", salary:60000,  bankAccounts:[{ id:"ba14",bankName:"SCB",   branch:"Minburi",     accountNumber:"901-2-34567-8", accountName:"Ratchanon Pimpa",     isMain:true  }],                                                                                                                                                         ssn:"1100100009000", ssfFundType:"33", ssfEnrollmentDate:"2022-03-28", ssfHospital:"MedPark Hospital",              ssfStatus:"active",   emergencyName:"Amporn Pimpa",        emergencyRelation:"Mother",  emergencyPhone:"089-999-1111", status:"active"   },
  { id:"EMP-010", firstName:"Ploy",       lastName:"Jaidee",     firstNameTh:"พลอย",     lastNameTh:"ใจดี",        nickname:"Ploy",   name:"Ploy Jaidee",         gender:"female", dob:"1997-08-20", nationalId:"1-1001-00010-00-0", phone:"090-000-0010", personalEmail:"ploy.j@gmail.com",      workEmail:"ploy@ddk.co.th",      department:"Marketing",    position:"Marketing Specialist",    employmentType:"full-time", branchId:"BR-001", hireDate:"2023-07-01", probationEndDate:"2023-10-01", managerId:"EMP-003", salary:48000,  bankAccounts:[{ id:"ba15",bankName:"Kbank", branch:"Onnut",       accountNumber:"012-3-45678-9", accountName:"Ploy Jaidee",         isMain:true  }],                                                                                                                                                         ssn:"1100100010000", ssfFundType:"33", ssfEnrollmentDate:"2023-07-01", ssfHospital:"Yanhee Hospital",               ssfStatus:"active",   emergencyName:"Jaidee Somkid",       emergencyRelation:"Father",  emergencyPhone:"090-000-0000", status:"on-leave" },
  { id:"EMP-011", firstName:"Daddy",      lastName:"Dont Know",  firstNameTh:"แดดดี้",   lastNameTh:"ดอนต์โนว์",  nickname:"Daddy",  name:"Daddy Dont Know",     gender:"male",   dob:"1995-06-15", nationalId:"1-1001-00011-00-0", phone:"091-111-0011", personalEmail:"daddy.dont.know@gmail.com", workEmail:"daddy@ddk.co.th",  department:"Marketing",    position:"Social Media Manager",    employmentType:"full-time", branchId:"BR-001", hireDate:"2024-01-15", probationEndDate:"2024-04-15", managerId:"EMP-010", salary:58000,  bankAccounts:[{ id:"ba16",bankName:"Kbank", branch:"Thonglor",    accountNumber:"111-1-11111-1", accountName:"Daddy Dont Know",     isMain:true  }],                                                                                                                                                         ssn:"1100100011000", ssfFundType:"33", ssfEnrollmentDate:"2024-01-15", ssfHospital:"Samitivej Hospital",            ssfStatus:"active",   emergencyName:"Dont Know Sr.",       emergencyRelation:"Father",  emergencyPhone:"091-111-9999", status:"active"   },
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

// ── Campaigns ─────────────────────────────────────────────────────────

export const campaigns = [
  { id:"CAMP-001", name:"Summer Double Points",    description:"Earn 2× points on all purchases during summer",         type:"multiplier" as const, value:2,   startDate:"2026-06-01", endDate:"2026-08-31", status:"active"    as const, eligibleTiers:["bronze","silver","gold","platinum"] as Tier[], participantCount:45, pointsIssued:12500, createdBy:"Admin" },
  { id:"CAMP-002", name:"Platinum Welcome Bonus",  description:"500 bonus points awarded when customer reaches Platinum",type:"bonus"      as const, value:500, startDate:"2026-01-01", endDate:"2026-12-31", status:"active"    as const, eligibleTiers:["platinum"] as Tier[],                          participantCount:3,  pointsIssued:1500,  createdBy:"Admin" },
  { id:"CAMP-003", name:"New Member Kickstart",    description:"200 bonus points on first purchase",                    type:"bonus"      as const, value:200, startDate:"2026-03-01", endDate:"2026-06-30", status:"ended"     as const, eligibleTiers:["bronze"] as Tier[],                            participantCount:28, pointsIssued:5600,  createdBy:"Admin" },
  { id:"CAMP-004", name:"Q3 Gold Rush",            description:"Triple points for Gold & Platinum members in Q3",       type:"multiplier" as const, value:3,   startDate:"2026-07-01", endDate:"2026-09-30", status:"scheduled" as const, eligibleTiers:["gold","platinum"] as Tier[],                   participantCount:0,  pointsIssued:0,     createdBy:"Admin" },
  { id:"CAMP-005", name:"Birthday Month Bonus",    description:"Double points during the customer's birthday month",    type:"multiplier" as const, value:2,   startDate:"2026-01-01", endDate:"2026-12-31", status:"active"    as const, eligibleTiers:["silver","gold","platinum"] as Tier[],          participantCount:12, pointsIssued:3200,  createdBy:"Admin" },
];

// ── System Users ──────────────────────────────────────────────────────

export type UserRole = "admin" | "manager" | "staff" | "viewer";

export const systemUsers = [
  { id:"USR-001", employeeId:"EMP-003", name:"Prapas Chamnankit",  email:"prapas@ddk.co.th",      role:"admin"   as UserRole, branchId:"BR-001", branchIds:["BR-001","BR-002","BR-003","BR-004"], status:"active"   as const, startDate:"2023-01-01", endDate:null as string|null, lastLogin:"2026-07-02T09:15:00", createdAt:"2023-01-01" },
  { id:"USR-002", employeeId:"EMP-002", name:"Nattaporn Srisuk",   email:"nattaporn@ddk.co.th",   role:"manager" as UserRole, branchId:"BR-001", branchIds:["BR-001"],                             status:"active"   as const, startDate:"2023-01-15", endDate:null as string|null, lastLogin:"2026-07-02T08:30:00", createdAt:"2023-01-15" },
  { id:"USR-003", employeeId:"EMP-005", name:"Wichai Thongdee",    email:"wichai@ddk.co.th",      role:"manager" as UserRole, branchId:"BR-002", branchIds:["BR-002"],                             status:"active"   as const, startDate:"2023-03-01", endDate:null as string|null, lastLogin:"2026-07-01T14:22:00", createdAt:"2023-03-01" },
  { id:"USR-004", employeeId:"EMP-006", name:"Kanokwan Srisuwan",  email:"kanokwan@ddk.co.th",    role:"staff"   as UserRole, branchId:"BR-003", branchIds:["BR-003"],                             status:"active"   as const, startDate:"2023-06-01", endDate:null as string|null, lastLogin:"2026-06-30T11:45:00", createdAt:"2023-06-01" },
  { id:"USR-005", employeeId:"EMP-007", name:"Thanachart Boonsri", email:"thanachart@ddk.co.th",  role:"staff"   as UserRole, branchId:"BR-001", branchIds:["BR-001"],                             status:"active"   as const, startDate:"2023-06-15", endDate:null as string|null, lastLogin:"2026-07-01T16:10:00", createdAt:"2023-06-15" },
  { id:"USR-006", employeeId:"EMP-008", name:"Siriporn Naknoi",    email:"siriporn@ddk.co.th",    role:"viewer"  as UserRole, branchId:"BR-001", branchIds:["BR-001"],                             status:"inactive" as const, startDate:"2024-01-10", endDate:"2026-06-30",        lastLogin:"2026-06-15T10:00:00", createdAt:"2024-01-10" },
];

// ── Company Settings ──────────────────────────────────────────────────

export const companySettings = {
  name:            "บริษัท ดีดีเค เอ็นเตอร์ไพรส์ จำกัด",
  nameEn:          "DDK Enterprise Co., Ltd.",
  taxId:           "0105562001234",
  address:         "88 Silom Rd, Bang Rak, Bangkok 10500",
  phone:           "02-100-1000",
  email:           "info@ddk.co.th",
  website:         "www.ddk.co.th",
  lineId:          "@ddkenterprise",
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

export const crmMonthlyData = [
  { month:"Jul", newMembers:8,  pointsEarned:12400, pointsRedeemed:2200 },
  { month:"Aug", newMembers:12, pointsEarned:15800, pointsRedeemed:3100 },
  { month:"Sep", newMembers:9,  pointsEarned:11200, pointsRedeemed:1800 },
  { month:"Oct", newMembers:15, pointsEarned:18500, pointsRedeemed:4200 },
  { month:"Nov", newMembers:22, pointsEarned:24000, pointsRedeemed:5800 },
  { month:"Dec", newMembers:31, pointsEarned:32000, pointsRedeemed:7500 },
  { month:"Jan", newMembers:11, pointsEarned:14200, pointsRedeemed:3200 },
  { month:"Feb", newMembers:14, pointsEarned:16800, pointsRedeemed:3800 },
  { month:"Mar", newMembers:18, pointsEarned:20100, pointsRedeemed:4600 },
  { month:"Apr", newMembers:16, pointsEarned:19500, pointsRedeemed:4100 },
  { month:"May", newMembers:20, pointsEarned:22800, pointsRedeemed:5200 },
  { month:"Jun", newMembers:24, pointsEarned:28500, pointsRedeemed:6800 },
];
