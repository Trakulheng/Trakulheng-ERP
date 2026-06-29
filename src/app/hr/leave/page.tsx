import { Header } from "@/components/layout/Header";
import { leaveRequests } from "@/lib/mock-data";
import { Plus } from "lucide-react";

const statusColors: Record<string, string> = {
  approved: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  rejected: "bg-red-100 text-red-700",
};

export default function LeavePage() {
  const pending = leaveRequests.filter(l => l.status === "pending").length;
  const approved = leaveRequests.filter(l => l.status === "approved").length;

  return (
    <div>
      <Header
        title="Leave Management"
        subtitle={`${leaveRequests.length} requests • ${pending} pending`}
        actions={
          <button className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Plus size={16} />
            New Request
          </button>
        }
      />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="text-xs text-slate-500 mb-1">Total Requests</p>
            <p className="text-2xl font-bold text-slate-900">{leaveRequests.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="text-xs text-slate-500 mb-1">Pending Review</p>
            <p className="text-2xl font-bold text-amber-600">{pending}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="text-xs text-slate-500 mb-1">Approved</p>
            <p className="text-2xl font-bold text-emerald-600">{approved}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-900">Leave Requests</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">ID</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Employee</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">From</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">To</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Days</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaveRequests.map((lr, i) => (
                  <tr key={lr.id} className={i % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50/50 hover:bg-slate-50"}>
                    <td className="px-5 py-3 font-mono text-xs text-slate-500">{lr.id}</td>
                    <td className="px-5 py-3 font-medium text-slate-800">{lr.employee}</td>
                    <td className="px-5 py-3 text-slate-600">{lr.type}</td>
                    <td className="px-5 py-3 text-slate-600">{lr.from}</td>
                    <td className="px-5 py-3 text-slate-600">{lr.to}</td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-900">{lr.days}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${statusColors[lr.status]}`}>
                        {lr.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
