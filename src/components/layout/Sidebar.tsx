"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, DollarSign, FileText, Receipt, BarChart3, Package,
  ShoppingCart, Truck, Users, TrendingUp, ClipboardList, UserCheck,
  CreditCard, CalendarDays, ChevronDown, ChevronRight, Building2,
  Settings, GitBranch, ScanLine, CalendarClock, HeartHandshake, Gift,
  TicketCheck, Zap, PieChart, Shield, Bell, Sliders, PackageCheck,
  ClipboardCheck, CheckSquare, X, ArrowLeftRight, Layers, Fingerprint, LogOut,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";
import { useSidebar } from "@/context/SidebarContext";
import { useT } from "@/context/LanguageContext";
import { UserSwitcher } from "./UserSwitcher";

const NAV_LABEL_TO_SECTION: Record<string, string> = {
  "Dashboard":  "dashboard",
  "Tasks":      "tasks",
  "Finance":    "finance",
  "Inventory":  "inventory",
  "Sales & CRM":"sales_crm",
  "HR & Payroll":"hr_payroll",
  "CRM":        "crm",
  "Settings":   "settings",
};

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Tasks", href: "/tasks", icon: CheckSquare },
  {
    label: "Finance", icon: DollarSign,
    children: [
      { label: "Overview", href: "/finance", icon: BarChart3 },
      { label: "Invoices", href: "/finance/invoices", icon: FileText },
      { label: "Expenses", href: "/finance/expenses", icon: Receipt },
    ],
  },
  {
    label: "Inventory", icon: Package,
    children: [
      { label: "Overview", href: "/inventory", icon: BarChart3 },
      { label: "Products", href: "/inventory/products", icon: Package },
      { label: "Purchase Orders", href: "/inventory/purchase-orders", icon: ShoppingCart },
      { label: "Goods Receive", href: "/inventory/goods-receive", icon: PackageCheck },
      { label: "Suppliers", href: "/inventory/suppliers", icon: Truck },
    ],
  },
  {
    label: "Sales & CRM", icon: TrendingUp,
    children: [
      { label: "Overview", href: "/sales", icon: BarChart3 },
      { label: "Customers", href: "/sales/customers", icon: Users },
      { label: "Orders", href: "/sales/orders", icon: ClipboardList },
    ],
  },
  {
    label: "HR & Payroll", icon: UserCheck,
    children: [
      { label: "Overview", href: "/hr", icon: BarChart3 },
      { label: "Employees", href: "/hr/employees", icon: Users },
      { label: "Payroll", href: "/hr/payroll", icon: CreditCard },
      { label: "Leave", href: "/hr/leave", icon: CalendarDays },
      { label: "Attendance", href: "/hr/attendance", icon: ScanLine },
      { label: "Clock In/Out", href: "/hr/clock", icon: Fingerprint },
      { label: "Shifts", href: "/hr/shifts", icon: CalendarClock },
    ],
  },
  {
    label: "CRM", icon: HeartHandshake,
    children: [
      { label: "Overview", href: "/crm", icon: BarChart3 },
      { label: "Customers", href: "/crm/customers", icon: Users },
      { label: "Campaigns", href: "/crm/campaigns", icon: Zap },
      { label: "Rewards", href: "/crm/rewards", icon: Gift },
      { label: "Redemptions", href: "/crm/redemptions", icon: TicketCheck },
      { label: "Analytics", href: "/crm/analytics", icon: PieChart },
    ],
  },
  {
    label: "Settings", icon: Settings,
    children: [
      { label: "General", href: "/settings/general", icon: Settings },
      { label: "Branches", href: "/settings/branches", icon: GitBranch },
      { label: "Brands", href: "/settings/brands", icon: ArrowLeftRight },
      { label: "Departments", href: "/settings/departments", icon: Layers },
      { label: "Users", href: "/settings/users", icon: Shield },
      { label: "Dashboard Layout", href: "/settings/dashboard", icon: LayoutDashboard },
      { label: "Role Permissions", href: "/settings/roles", icon: ClipboardCheck },
      { label: "Points Config", href: "/settings/points", icon: Sliders },
      { label: "Notifications", href: "/settings/notifications", icon: Bell },
      { label: "Appearance", href: "/settings/appearance", icon: Sliders },
    ],
  },
];

interface Me { name: string | null; email: string; role: string; menuOrder?: string[] | null }

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useTheme();
  const { isOpen, close } = useSidebar();
  const t = useT();
  const [openSections, setOpenSections] = useState<string[]>(["Finance", "Inventory", "Sales & CRM", "HR & Payroll", "CRM", "Settings"]);
  const [me, setMe] = useState<Me | null>(null);
  const [showSwitcher, setShowSwitcher] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.email) setMe(data); })
      .catch(() => {});
  }, []);

  const sortedNavItems = useMemo(() => {
    if (!me?.menuOrder?.length) return navItems;
    const orderMap = new Map(me.menuOrder.map((id, i) => [id, i]));
    return [...navItems].sort((a, b) => {
      const aId = NAV_LABEL_TO_SECTION[a.label] ?? a.label;
      const bId = NAV_LABEL_TO_SECTION[b.label] ?? b.label;
      return (orderMap.get(aId) ?? 999) - (orderMap.get(bId) ?? 999);
    });
  }, [me?.menuOrder]);

  const S = {
    dark: {
      aside: "bg-slate-900 text-slate-100",
      logoBorder: "border-slate-700", logoIcon: "bg-blue-600", logoText: "text-white", logoSub: "text-slate-400",
      activeLink: "bg-blue-600 text-white", inactiveLink: "text-slate-300 hover:bg-slate-800 hover:text-white",
      sectionActive: "text-blue-400", sectionHover: "text-slate-300 hover:bg-slate-800 hover:text-white",
      childBorder: "border-slate-700", childActive: "bg-blue-600 text-white font-medium",
      childInactive: "text-slate-400 hover:bg-slate-800 hover:text-white",
      footerBorder: "border-slate-700", userName: "text-white", userEmail: "text-slate-400", avatar: "bg-blue-600",
      closeBtn: "text-slate-400 hover:text-white hover:bg-slate-800",
    },
    light: {
      aside: "bg-white text-slate-800 border-r border-slate-200",
      logoBorder: "border-slate-100", logoIcon: "bg-blue-600", logoText: "text-slate-900", logoSub: "text-slate-400",
      activeLink: "bg-blue-600 text-white", inactiveLink: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
      sectionActive: "text-blue-600", sectionHover: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
      childBorder: "border-slate-200", childActive: "bg-blue-600 text-white font-medium",
      childInactive: "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
      footerBorder: "border-slate-100", userName: "text-slate-900", userEmail: "text-slate-500", avatar: "bg-blue-600",
      closeBtn: "text-slate-400 hover:text-slate-700 hover:bg-slate-100",
    },
    midnight: {
      aside: "bg-[#0d1b2a] text-slate-100",
      logoBorder: "border-[#1a2f45]", logoIcon: "bg-blue-600", logoText: "text-white", logoSub: "text-slate-500",
      activeLink: "bg-blue-600 text-white", inactiveLink: "text-slate-400 hover:bg-[#1a2f45] hover:text-white",
      sectionActive: "text-blue-400", sectionHover: "text-slate-400 hover:bg-[#1a2f45] hover:text-white",
      childBorder: "border-[#1a2f45]", childActive: "bg-blue-600 text-white font-medium",
      childInactive: "text-slate-500 hover:bg-[#1a2f45] hover:text-white",
      footerBorder: "border-[#1a2f45]", userName: "text-white", userEmail: "text-slate-500", avatar: "bg-blue-600",
      closeBtn: "text-slate-500 hover:text-white hover:bg-[#1a2f45]",
    },
  }[theme.sidebar];

  const toggleSection = (label: string) => {
    setOpenSections((prev) => prev.includes(label) ? prev.filter((s) => s !== label) : [...prev, label]);
  };

  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);

  const handleLinkClick = () => {
    if (window.innerWidth < 1024) close();
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={close}
      />

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col w-64 transition-transform duration-300 ease-in-out",
        "lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
        S.aside
      )}>
        {/* Logo */}
        <div className={cn("flex items-center gap-3 px-5 py-4 border-b flex-shrink-0", S.logoBorder)}>
          <div className={cn("flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0", S.logoIcon)}>
            <Building2 size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn("font-bold text-sm leading-tight", S.logoText)}>Trakulheng</p>
            <p className={cn("text-xs", S.logoSub)}>{t("Enterprise System")}</p>
          </div>
          <button
            onClick={close}
            className={cn("lg:hidden p-1.5 rounded-lg transition-colors flex-shrink-0", S.closeBtn)}
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          {sortedNavItems.map((item) => {
            const Icon = item.icon;

            if (!item.children) {
              return (
                <Link
                  key={item.label}
                  href={item.href!}
                  onClick={handleLinkClick}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-colors",
                    isActive(item.href!) ? S.activeLink : S.inactiveLink
                  )}
                >
                  <Icon size={18} />
                  {t(item.label)}
                </Link>
              );
            }

            const isOpen_ = openSections.includes(item.label);
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
                  <span className="flex-1 text-left">{t(item.label)}</span>
                  {isOpen_ ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                {isOpen_ && (
                  <div className={cn("ml-4 mt-1 border-l pl-3 space-y-0.5", S.childBorder)}>
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={handleLinkClick}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                            isActive(child.href) ? S.childActive : S.childInactive
                          )}
                        >
                          <ChildIcon size={15} />
                          {t(child.label)}
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
        <div className={cn("border-t px-4 py-3 flex-shrink-0", S.footerBorder)}>
          <div className="flex items-center gap-3">
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0", S.avatar)}>
              {me?.name ? me.name[0].toUpperCase() : me?.email?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-medium truncate", S.userName)}>
                {me?.name ?? me?.email ?? "Loading…"}
              </p>
              <p className={cn("text-xs truncate", S.userEmail)}>{me?.email ?? ""}</p>
            </div>
            <button
              onClick={() => setShowSwitcher(true)}
              title="Switch user"
              className={cn("p-1.5 rounded-lg transition-colors flex-shrink-0", S.closeBtn)}
            >
              <ArrowLeftRight size={15} />
            </button>
            <button
              onClick={handleLogout}
              title="Log out"
              className={cn("p-1.5 rounded-lg transition-colors flex-shrink-0", S.closeBtn)}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {showSwitcher && <UserSwitcher onClose={() => setShowSwitcher(false)} />}
    </>
  );
}
