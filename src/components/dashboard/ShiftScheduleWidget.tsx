import { CalendarClock } from "lucide-react";

export interface ShiftDay {
  date: string;
  shiftName: string | null;
  shiftCode: string | null;
  startTime: string | null;
  endTime: string | null;
  color: string | null;
  dayOff: boolean;
  noAssignment: boolean;
}

const SHIFT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  blue:   { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200"   },
  green:  { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200"},
  red:    { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200"    },
  orange: { bg: "bg-orange-50",  text: "text-orange-700",  border: "border-orange-200" },
  purple: { bg: "bg-purple-50",  text: "text-purple-700",  border: "border-purple-200" },
  yellow: { bg: "bg-yellow-50",  text: "text-yellow-700",  border: "border-yellow-200" },
  pink:   { bg: "bg-pink-50",    text: "text-pink-700",    border: "border-pink-200"   },
  gray:   { bg: "bg-slate-50",   text: "text-slate-600",   border: "border-slate-200"  },
};

function calcHours(start: string, end: string): string {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const totalMin = (eh * 60 + em) - (sh * 60 + sm);
  if (totalMin <= 0) return "";
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function formatDay(dateStr: string, index: number): string {
  if (index === 0) return "Today";
  if (index === 1) return "Tomorrow";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long" });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ShiftScheduleWidget({ days }: { days: ShiftDay[] }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <CalendarClock size={16} className="text-indigo-500" />
          <h3 className="text-base font-semibold text-slate-900">My Shift Schedule</h3>
        </div>
        <a href="/hr/shifts" className="text-sm text-blue-600 hover:underline">View all</a>
      </div>

      <div className="divide-y divide-slate-50">
        {days.map((day, i) => {
          const clr = SHIFT_COLORS[day.color ?? "gray"] ?? SHIFT_COLORS.gray;

          if (day.noAssignment) {
            return (
              <div key={day.date} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{formatDay(day.date, i)}</p>
                  <p className="text-xs text-slate-400">{formatDate(day.date)}</p>
                </div>
                <span className="text-xs text-slate-400 italic">No schedule</span>
              </div>
            );
          }

          if (day.dayOff) {
            return (
              <div key={day.date} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{formatDay(day.date, i)}</p>
                  <p className="text-xs text-slate-400">{formatDate(day.date)}</p>
                </div>
                <span className="inline-block text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 font-medium">Day Off</span>
              </div>
            );
          }

          const hours = day.startTime && day.endTime ? calcHours(day.startTime, day.endTime) : "";

          return (
            <div key={day.date} className="flex items-center justify-between px-5 py-3.5">
              <div>
                <p className="text-sm font-semibold text-slate-800">{formatDay(day.date, i)}</p>
                <p className="text-xs text-slate-400">{formatDate(day.date)}</p>
              </div>
              <div className={`flex flex-col items-end gap-0.5`}>
                <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium border ${clr.bg} ${clr.text} ${clr.border}`}>
                  {day.shiftName ?? day.shiftCode ?? "Shift"}
                </span>
                {day.startTime && day.endTime && (
                  <span className="text-xs text-slate-400">
                    {day.startTime}–{day.endTime}{hours ? ` · ${hours}` : ""}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
