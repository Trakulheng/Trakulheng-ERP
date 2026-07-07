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
  Lock, AlertTriangle, KeyRound, Database,
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

type PermMatrix = Record<string, { create: boolean; edit: boolean; view: boolean; sidebar?: boolean }>;

function permAllowed(permKey: string | undefined, p: PermMatrix): boolean {
  if (!permKey) return true;
  const m = p[permKey];
  if (!m) return true; // not in matrix → unrestricted
  if (!m.view) return false; // no view access → hide
  // sidebar=false means explicitly hidden; undefined means visible by default
  if (m.sidebar === false) return false;
  return true;
}

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Tasks", href: "/tasks", icon: CheckSquare },
  {
    label: "Finance", icon: DollarSign,
    children: [
      { label: "Overview",  href: "/finance",          icon: BarChart3, permKey: "finance_overview" },
      { label: "Invoices",  href: "/finance/invoices", icon: FileText,  permKey: "finance_invoices" },
      { label: "Expenses",  href: "/finance/expenses", icon: Receipt,   permKey: "finance_expenses" },
    ],
  },
  {
    label: "Inventory", icon: Package,
    children: [
      { label: "Overview",        href: "/inventory",                  icon: BarChart3,   permKey: "inv_overview"      },
      { label: "Products",        href: "/inventory/products",         icon: Package,     permKey: "inv_products"  },
      { label: "Purchase Orders", href: "/inventory/purchase-orders",  icon: ShoppingCart,permKey: "inv_po"        },
      { label: "Goods Receive",   href: "/inventory/goods-receive",    icon: PackageCheck,permKey: "inv_gr"        },
      { label: "Suppliers",       href: "/inventory/suppliers",        icon: Truck,       permKey: "inv_suppliers" },
    ],
  },
  {
    label: "Sales & CRM", icon: TrendingUp,
    children: [
      { label: "Overview",   href: "/sales",           icon: BarChart3,    permKey: "sales_overview"    },
      { label: "Customers",  href: "/sales/customers", icon: Users,        permKey: "sales_customers" },
      { label: "Orders",     href: "/sales/orders",    icon: ClipboardList,permKey: "sales_orders"    },
    ],
  },
  {
    label: "HR & Payroll", icon: UserCheck,
    children: [
      { label: "Overview",    href: "/hr",             icon: BarChart3,   permKey: "hr_overview"       },
      { label: "Employees",   href: "/hr/employees",   icon: Users,       permKey: "hr_employees"  },
      { label: "Payroll",     href: "/hr/payroll",     icon: CreditCard,  permKey: "hr_payroll"    },
      { label: "Leave",       href: "/hr/leave",       icon: CalendarDays,permKey: "hr_leave"      },
      { label: "Attendance",  href: "/hr/attendance",  icon: ScanLine,    permKey: "hr_attendance" },
      { label: "Clock In/Out",href: "/hr/clock",       icon: Fingerprint, permKey: "hr_attendance" },
      { label: "Shifts",      href: "/hr/shifts",      icon: CalendarClock, permKey: "hr_shifts" },
    ],
  },
  {
    label: "CRM", icon: HeartHandshake,
    children: [
      { label: "Overview",     href: "/crm",              icon: BarChart3,  permKey: "crm_overview"      },
      { label: "Customers",    href: "/crm/customers",    icon: Users,      permKey: "crm_customers" },
      { label: "Campaigns",    href: "/crm/campaigns",    icon: Zap,        permKey: "crm_campaigns" },
      { label: "Rewards",      href: "/crm/rewards",      icon: Gift,       permKey: "crm_rewards"   },
      { label: "Redemptions",  href: "/crm/redemptions",  icon: TicketCheck, permKey: "crm_redemptions" },
      { label: "Analytics",    href: "/crm/analytics",    icon: PieChart,    permKey: "crm_analytics"   },
    ],
  },
  {
    label: "Settings", icon: Settings,
    children: [
      { label: "General",           href: "/settings/general",        icon: Settings,       permKey: "set_general"       },
      { label: "Branches",          href: "/settings/branches",       icon: GitBranch,      permKey: "set_branches"      },
      { label: "Brands",            href: "/settings/brands",             icon: ArrowLeftRight, permKey: "set_brands"        },
      { label: "Master Data",  href: "/settings/master-data", icon: Database, permKey: "set_product_cats" },
      { label: "Departments", href: "/settings/departments", icon: Layers,   permKey: "set_departments"  },
      { label: "Users",             href: "/settings/users",          icon: Shield,         permKey: "set_users"         },
      { label: "Dashboard Layout",  href: "/settings/dashboard",      icon: LayoutDashboard, permKey: "set_dashboard"   },
      { label: "Role Permissions",  href: "/settings/roles",          icon: ClipboardCheck, permKey: "set_roles"         },
      { label: "Points Config",     href: "/settings/points",         icon: Sliders,        permKey: "set_points"        },
      { label: "Notifications",     href: "/settings/notifications",  icon: Bell,           permKey: "set_notifications" },
      { label: "Appearance",        href: "/settings/appearance",     icon: Sliders,        permKey: "set_appearance"    },
    ],
  },
];

const AVATAR_COLOR: Record<string, string> = {
  admin:   "bg-blue-600",
  manager: "bg-violet-600",
  staff:   "bg-emerald-600",
  viewer:  "bg-slate-500",
};

function initials(name: string | null, email: string) {
  if (name) {
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [perms, setPerms] = useState<PermMatrix>({});

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.email) setMe(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!me?.role) return;
    const load = () =>
      fetch("/api/settings/role-permissions")
        .then((r) => r.ok ? r.json() : null)
        .then((d) => { if (d?.permissions?.[me.role]) setPerms(d.permissions[me.role]); })
        .catch(() => {});
    load();
    window.addEventListener("permissions-updated", load);
    return () => window.removeEventListener("permissions-updated", load);
  }, [me?.role]);

  const sortedNavItems = useMemo(() => {
    if (!me?.menuOrder?.length) return navItems;
    const orderMap = new Map(me.menuOrder.map((id, i) => [id, i]));
    return [...navItems].sort((a, b) => {
      const aId = NAV_LABEL_TO_SECTION[a.label] ?? a.label;
      const bId = NAV_LABEL_TO_SECTION[b.label] ?? b.label;
      return (orderMap.get(aId) ?? 999) - (orderMap.get(bId) ?? 999);
    });
  }, [me?.menuOrder]);

  const visibleNav = useMemo(() => {
    if (!me?.role || me.role === "admin" || Object.keys(perms).length === 0) return sortedNavItems;
    return sortedNavItems.map((item) => {
      if (!(item as any).children) return item;
      const children: any[] = (item as any).children;
      const permKeyedChildren = children.filter((c) => c.permKey);
      if (permKeyedChildren.length === 0) return item; // no permKey children — always show
      const anyAllowed = permKeyedChildren.some((c) => permAllowed(c.permKey, perms));
      if (!anyAllowed) return null; // hide entire section
      return { ...item, children: children.filter((c) => permAllowed(c.permKey, perms)) };
    }).filter(Boolean) as typeof sortedNavItems;
  }, [sortedNavItems, perms, me?.role]);

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
          {visibleNav.map((item) => {
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
        <div className={cn("border-t px-4 py-3 flex-shrink-0 relative", S.footerBorder)}>
          <button
            onClick={() => setShowUserMenu((v) => !v)}
            className={cn("w-full flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors", S.sectionHover)}
          >
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0", AVATAR_COLOR[me?.role ?? ""] ?? "bg-slate-500")}>
              {me ? initials(me.name, me.email) : "?"}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className={cn("text-sm font-medium truncate", S.userName)}>
                {me?.name ?? me?.email ?? "Loading…"}
              </p>
              <p className={cn("text-xs truncate", S.userEmail)}>{me?.email ?? ""}</p>
            </div>
            <ChevronDown size={14} className={cn("text-slate-400 transition-transform shrink-0", showUserMenu && "rotate-180")} />
          </button>

          {showUserMenu && (
            <div className="absolute bottom-full left-3 right-3 mb-1 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50">
              <button
                onClick={() => { setShowSwitcher(true); setShowUserMenu(false); }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <ArrowLeftRight size={15} className="text-slate-400" />
                Switch account
              </button>
              <Link
                href="/auth/set-pin"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <KeyRound size={15} className="text-slate-400" />
                Set / Change PIN
              </Link>
              <div className="border-t border-slate-100 my-1" />
              <button
                onClick={() => { setShowLogoutConfirm(true); setShowUserMenu(false); }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={15} />
                Log out
              </button>
            </div>
          )}
        </div>
      </aside>

      {showSwitcher && <UserSwitcher onClose={() => setShowSwitcher(false)} />}

      {/* Logout confirmation dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
                <AlertTriangle size={26} className="text-red-500" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">Log out?</h2>
              <p className="text-sm text-slate-500 mb-6">You will be redirected to the login page.</p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { setShowLogoutConfirm(false); handleLogout(); }}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors"
                >
                  Log out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
