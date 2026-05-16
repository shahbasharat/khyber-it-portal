"use client";

import { useAuthStore } from "@/store/authStore";

export default function DashboardPage() {
  const { user } = useAuthStore();

  if (!user) return null;

  const isManager = user.role === "MANAGER";

  return (
    <div className="flex flex-col gap-6">
      <div className="mb-2">
        <h2 className="text-3xl font-bold text-slate-dark font-display">
          Welcome back, {user.name.split(" ")[0]}
        </h2>
        <p className="text-slate-mid mt-1">
          {isManager
            ? "Here is the IT Team's operational overview for today."
            : "Here are your pending tasks and resort status."}
        </p>
      </div>

      {isManager ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-base p-6 border border-slate-border/50 flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-mid uppercase tracking-wide">Checklist</span>
            <span className="text-4xl font-bold text-slate-dark font-display">0/12</span>
            <span className="text-sm text-antique-gold font-medium">Morning Shift</span>
          </div>
          <div className="bg-white rounded-xl shadow-base p-6 border border-slate-border/50 flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-mid uppercase tracking-wide">Open Issues</span>
            <span className="text-4xl font-bold text-slate-dark font-display">3</span>
            <span className="text-sm text-slate-mid font-medium">None critical</span>
          </div>
          <div className="bg-white rounded-xl shadow-base p-6 border border-slate-border/50 flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-mid uppercase tracking-wide">Escalations</span>
            <span className="text-4xl font-bold text-slate-dark font-display">1</span>
            <span className="text-sm text-color-error font-medium">Oracle PMS</span>
          </div>
          <div className="bg-white rounded-xl shadow-base p-6 border border-slate-border/50 flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-mid uppercase tracking-wide">Last Report</span>
            <span className="text-4xl font-bold text-slate-dark font-display">12h</span>
            <span className="text-sm text-slate-mid font-medium">Yesterday Afternoon</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-base p-6 border border-slate-border/50 cursor-pointer transition-all hover:shadow-md hover:border-fir-green/30">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-dark">Morning Checklist</h3>
                <p className="text-slate-mid">0/12 Complete</p>
              </div>
              <span className="px-2 py-1 rounded text-xs font-semibold bg-antique-gold-subtle text-antique-gold">Pending</span>
            </div>
            <div className="w-full bg-cream rounded-full h-2">
              <div className="bg-fir-green h-2 rounded-full" style={{ width: "0%" }}></div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-base p-6 border border-slate-border/50">
            <h3 className="text-xl font-bold text-slate-dark mb-2">My Open Issues</h3>
            <p className="text-slate-mid mb-4">You have 2 assigned issues.</p>
            <div className="flex flex-col gap-3">
              <div className="p-3 bg-cream rounded-lg text-sm border border-slate-border/50">
                <span className="font-semibold text-[#C0392B] mr-2">Critical</span>
                Wi-Fi down in Wing B
              </div>
              <div className="p-3 bg-cream rounded-lg text-sm border border-slate-border/50">
                <span className="font-semibold text-blue-600 mr-2">Medium</span>
                Printer paper jam Front Desk
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
