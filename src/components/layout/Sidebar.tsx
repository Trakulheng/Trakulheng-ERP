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
  Zap,
  PieChart,
  Shield,
  Bell,
  Sliders,
  PackageCheck,
  ClipboardCheck,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";

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
      { label: "Goods Receive", href: "/inventory/goods-receive", icon: PackageCheck },
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
      { label: "Overview",    href: "/crm",                 icon: BarChart3 },
      { label: "Customers",   href: "/crm/customers",       icon: Users },
      { label: "Campaigns",   href: "/crm/campaigns",       icon: Zap },
      { label: "Rewards",     href: "/crm/rewards",         icon: Gift },
      { label: "Redemptions", href: "/crm/redemptions",     icon: TicketCheck },
      { label: "Analytics",   href: "/crm/analytics",       icon: PieChart },
    ],
  },
  {
    label: "Settings",
    icon: Settings,
    children: [
      { label: "General",          href: "/settings/general",    icon: Settings },
      { label: "Branches",         href: "/settings/branches",   icon: GitBranch },
      { label: "Users",            href: "/settings/users",      icon: Shield },
      { label: "Role Permissions", href: "/settings/roles",      icon: ClipboardCheck },
      { label: "Points Config",    href: "/settings/points",     icon: Sliders },
      { label: "Notifications",    href: "/settings/notifications", icon: Bell },
      { label: "Appearance",       href: "/settings/appearance", icon: Sliders },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme } = useTheme();
  const [openSections, setOpenSections] = useState<string[]>(["Finance", "Inventory", "Sales & CRM", "HR & Payroll", "CRM", "Settings"]);

  // Style tokens per sidebar variant
  const S = {
    dark: {
      aside:       "bg-slate-900 text-slate-100",
      logoBorder:  "border-slate-700",
      logoIcon:    "bg-blue-600",
      logoText:    "text-white",
      logoSub:     "text-slate-400",
      activeLink:  "bg-blue-600 text-white",
      inactiveLink:"text-slate-300 hover:bg-slate-800 hover:text-white",
      sectionActive:"text-blue-400",
      sectionHover:"text-slate-300 hover:bg-slate-800 hover:text-white",
      childBorder: "border-slate-700",
      childActive: "bg-blue-600 text-white font-medium",
      childInactive:"text-slate-400 hover:bg-slate-800 hover:text-white",
      footerBorder:"border-slate-700",
      userName:    "text-white",
      userEmail:   "text-slate-400",
      avatar:      "bg-blue-600",
    },
    light: {
      aside:       "bg-white text-slate-800 border-r border-slate-200",
      logoBorder:  "border-slate-100",
      logoIcon:    "bg-blue-600",
      logoText:    "text-slate-900",
      logoSub:     "text-slate-400",
      activeLink:  "bg-blue-600 text-white",
      inactiveLink:"text-slate-600 hover:bg-slate-100 hover:text-slate-900",
      sectionActive:"text-blue-600",
      sectionHover:"text-slate-600 hover:bg-slate-100 hover:text-slate-900",
      childBorder: "border-slate-200",
      childActive: "bg-blue-600 text-white font-medium",
      childInactive:"text-slate-500 hover:bg-slate-100 hover:text-slate-900",
      footerBorder:"border-slate-100",
      userName:    "text-slate-900",
      userEmail:   "text-slate-500",
      avatar:      "bg-blue-600",
    },
    midnight: {
      aside:       "bg-[#0d1b2a] text-slate-100",
      logoBorder:  "border-[#1a2f45]",
      logoIcon:    "bg-blue-600",
      logoText:    "text-white",
      logoSub:     "text-slate-500",
      activeLink:  "bg-blue-600 text-white",
      inactiveLink:"text-slate-400 hover:bg-[#1a2f45] hover:text-white",
      sectionActive:"text-blue-400",
      sectionHover:"text-slate-400 hover:bg-[#1a2f45] hover:text-white",
      childBorder: "border-[#1a2f45]",
      childActive: "bg-blue-600 text-white font-medium",
      childInactive:"text-slate-500 hover:bg-[#1a2f45] hover:text-white",
      footerBorder:"border-[#1a2f45]",
      userName:    "text-white",
      userEmail:   "text-slate-500",
      avatar:      "bg-blue-600",
    },
  }[theme.sidebar];

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
    <aside className={cn("flex flex-col w-64 min-h-screen fixed left-0 top-0 bottom-0 z-50 transition-colors duration-300", S.aside)}>
      {/* Logo */}
      <div className={cn("flex items-center gap-3 px-6 py-5 border-b", S.logoBorder)}>
        <div className={cn("flex items-center justify-center w-9 h-9 rounded-lg", S.logoIcon)}>
          <Building2 size={20} className="text-white" />
        </div>
        <div>
          <p className={cn("font-bold text-sm leading-tight", S.logoText)}>Trakulheng</p>
          <p className={cn("text-xs", S.logoSub)}>Enterprise System</p>
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
                  isActive(item.href!) ? S.activeLink : S.inactiveLink
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
                  isSectionActive ? S.sectionActive : S.sectionHover
                )}
              >
                <Icon size={18} />
                <span className="flex-1 text-left">{item.label}</span>
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>

              {isOpen && (
                <div className={cn("ml-4 mt-1 border-l pl-3 space-y-1", S.childBorder)}>
                  {item.children.map((child) => {
                    const ChildIcon = child.icon;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                          isActive(child.href) ? S.childActive : S.childInactive
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
      <div className={cn("border-t px-4 py-4", S.footerBorder)}>
        <div className="flex items-center gap-3">
          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold", S.avatar)}>
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn("text-sm font-medium truncate", S.userName)}>Admin User</p>
            <p className={cn("text-xs truncate", S.userEmail)}>admin@trakulheng.co.th</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
