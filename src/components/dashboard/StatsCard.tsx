import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string;
  change: number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
}

export function StatsCard({ title, value, change, subtitle, icon: Icon, iconColor = "blue" }: StatsCardProps) {
  const isPositive = change >= 0;

  const colorMap: Record<string, string> = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-emerald-100 text-emerald-600",
    orange: "bg-orange-100 text-orange-600",
    purple: "bg-purple-100 text-purple-600",
    red: "bg-red-100 text-red-600",
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className={cn("p-2 rounded-lg", colorMap[iconColor] ?? colorMap.blue)}>
          <Icon size={18} />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900 mb-1">{value}</p>
      <div className="flex items-center gap-1.5">
        {isPositive ? (
          <TrendingUp size={14} className="text-emerald-600" />
        ) : (
          <TrendingDown size={14} className="text-red-500" />
        )}
        <span className={cn("text-xs font-medium", isPositive ? "text-emerald-600" : "text-red-500")}>
          {isPositive ? "+" : ""}{change}%
        </span>
        {subtitle && <span className="text-xs text-slate-400">{subtitle}</span>}
      </div>
    </div>
  );
}
