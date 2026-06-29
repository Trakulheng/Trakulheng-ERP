"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { revenueData } from "@/lib/mock-data";

const formatYAxis = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value.toString();
};

interface TooltipEntry { dataKey: string; color: string; name: string; value: number; }
interface TooltipProps { active?: boolean; payload?: TooltipEntry[]; label?: string; }

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-slate-700 mb-2">{label}</p>
        {payload.map((entry: TooltipEntry) => (
          <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-600">{entry.name}:</span>
            <span className="font-medium">฿{(entry.value / 1000).toFixed(0)}K</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function RevenueChart() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Revenue vs Expenses</h3>
          <p className="text-sm text-slate-500">Last 12 months</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-blue-600" />
            <span className="text-slate-600">Revenue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-slate-300" />
            <span className="text-slate-600">Expenses</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={revenueData} barGap={4} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatYAxis}
            tick={{ fontSize: 12, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="revenue" name="Revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expenses" name="Expenses" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
