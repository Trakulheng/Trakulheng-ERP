export interface WidgetConfig {
  id:      string;
  enabled: boolean;
  order:   number;
}

export interface WidgetDef {
  id:           string;
  label:        string;
  description:  string;
  type:         "kpi" | "chart" | "table" | "list";
  size:         "sm" | "md" | "lg" | "full";
}

export const ALL_WIDGETS: WidgetDef[] = [
  { id: "revenue",         label: "Monthly Revenue",     description: "KPI card showing total monthly revenue",        type: "kpi",   size: "sm" },
  { id: "expenses",        label: "Monthly Expenses",    description: "KPI card showing total monthly expenses",       type: "kpi",   size: "sm" },
  { id: "inventory_value", label: "Inventory Value",     description: "KPI card showing total inventory value",        type: "kpi",   size: "sm" },
  { id: "headcount",       label: "Headcount",           description: "KPI card showing total active employees",       type: "kpi",   size: "sm" },
  { id: "revenue_chart",   label: "Revenue Chart",       description: "Revenue vs Expenses bar chart (last 12 months)", type: "chart", size: "full" },
  { id: "recent_invoices", label: "Recent Invoices",     description: "List of the 5 most recent invoices",            type: "table", size: "md" },
  { id: "stock_alerts",    label: "Stock Alerts",        description: "Products with low or zero stock levels",        type: "table", size: "md" },
  { id: "payroll",         label: "Payroll Summary",     description: "Upcoming payroll runs table",                   type: "table", size: "full" },
  { id: "tasks",           label: "My Tasks",            description: "Tasks assigned to the current user",            type: "list",  size: "md" },
  { id: "leave_requests",  label: "Leave Requests",      description: "Pending leave requests to review",              type: "list",  size: "md" },
];

const mkDefault = (ids: string[]): WidgetConfig[] =>
  ids.map((id, i) => ({ id, enabled: true, order: i }));

export const DEFAULT_WIDGETS: Record<string, WidgetConfig[]> = {
  admin:   mkDefault(["revenue","expenses","inventory_value","headcount","revenue_chart","recent_invoices","stock_alerts","payroll","tasks","leave_requests"]),
  manager: mkDefault(["revenue","expenses","inventory_value","headcount","revenue_chart","recent_invoices","stock_alerts","tasks","leave_requests"]),
  staff:   mkDefault(["inventory_value","stock_alerts","tasks"]),
  viewer:  mkDefault(["revenue","expenses","inventory_value","tasks"]),
};
