"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  DollarSign,
  FileText,
  Receipt,
  BarChart3,
  Package,
  ShoppingCart,
  Truck,
  Users,
  TrendingUp,
  ClipboardList,
  UserCheck,
  CreditCard,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Building2,
  Settings,
  GitBranch,
  ScanLine,
  CalendarClock,
  HeartHandshake,
  Gift,
  TicketCheck,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Finance",
    icon: DollarSign,
    children: [
      { label: "Overview", href: "/finance", icon: BarChart3 },
      { label: "Invoices", href: "/finance/invoices", icon: FileText },
      { label: "Expenses", href: "/finance/expenses", icon: Receipt },
    ],
  },
  {
    label: "Inventory",
    icon: Package,
    children: [
      { label: "Overview", href: "/inventory", icon: BarChart3 },
      { label: "Products", href: "/inventory/products", icon: Package },
      { label: "Purchase Orders", href: "/inventory/purchase-orders", icon: ShoppingCart },
      { label: "Suppliers", href: "/inventory/suppliers", icon: Truck },
    ],
  },
  {
    label: "Sales & CRM",
    icon: TrendingUp,
    children: [
      { label: "Overview", href: "/sales", icon: BarChart3 },
      { label: "Customers", href: "/sales/customers", icon: Users },
      { label: "Orders", href: "/sales/orders", icon: ClipboardList },
    ],
  },
  {
    label: "HR & Payroll",
    icon: UserCheck,
    children: [
      { label: "Overview", href: "/hr", icon: BarChart3 },
      { label: "Employees", href: "/hr/employees", icon: Users },
      { label: "Payroll", href: "/hr/payroll", icon: CreditCard },
      { label: "Leave", href: "/hr/leave", icon: CalendarDays },
      { label: "Attendance", href: "/hr/attendance", icon: ScanLine },
      { label: "Shifts", href: "/hr/shifts", icon: CalendarClock },
    ],
  },
  {
    label: "CRM",
    icon: HeartHandshake,
    children: [
      { label: "Overview",    href: "/crm",               icon: BarChart3 },
      { label: "Customers",   href: "/crm/customers",     icon: Users },
      { label: "Rewards",     href: "/crm/rewards",       icon: Gift },
      { label: "Redemptions", href: "/crm/redemptions",   icon: TicketCheck },
    ],
  },
  {
    label: "Settings",
    icon: Settings,
    children: [
      { label: "Branches", href: "/settings/branches", icon: GitBranch },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<string[]>(["Finance", "Inventory", "Sales & CRM", "HR & Payroll"]);

  const toggleSection = (label: string) => {
    setOpenSections((prev) =>
      prev.includes(label) ? prev.filter((s) => s !== label) : [...prev, label]
    );
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-slate-900 text-slate-100 fixed left-0 top-0 bottom-0 z-50">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600">
          <Building2 size={20} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-white text-sm leading-tight">DDK ERP</p>
          <p className="text-slate-400 text-xs">Enterprise System</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;

          if (!item.children) {
            return (
              <Link
                key={item.label}
                href={item.href!}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-colors",
                  isActive(item.href!)
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          }

          const isOpen = openSections.includes(item.label);
          const isSectionActive = item.children.some((child) => isActive(child.href));

          return (
            <div key={item.label} className="mb-1">
              <button
                onClick={() => toggleSection(item.label)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-sm font-medium transition-colors",
                  isSectionActive ? "text-blue-400" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                <Icon size={18} />
                <span className="flex-1 text-left">{item.label}</span>
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>

              {isOpen && (
                <div className="ml-4 mt-1 border-l border-slate-700 pl-3 space-y-1">
                  {item.children.map((child) => {
                    const ChildIcon = child.icon;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                          isActive(child.href)
                            ? "bg-blue-600 text-white font-medium"
                            : "text-slate-400 hover:bg-slate-800 hover:text-white"
                        )}
                      >
                        <ChildIcon size={15} />
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User area */}
      <div className="border-t border-slate-700 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">Admin User</p>
            <p className="text-xs text-slate-400 truncate">admin@ddk.co.th</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
