"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import Link from "next/link";
import { AlertCircle, CheckSquare, Clock, ArrowUpCircle, Loader2 } from "lucide-react";

interface Stats {
  openIssues: number;
  criticalIssues: number;
  dailyTasks: number;
  completedTasks: number;
  escalations: number;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get("/stats");
        setStats(response.data);
      } catch (error) {
        console.error("Failed to fetch stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (!user || loading) return (
    <div className="flex justify-center items-center h-64 text-slate-mid">
      <Loader2 className="animate-spin mr-2" /> Loading operational status...
    </div>
  );

  const isManager = user.role === "MANAGER";
  const checklistProgress = stats ? (stats.completedTasks / stats.dailyTasks) * 100 : 0;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-dark font-display">
          Welcome back, {user.name.split(" ")[0]}
        </h2>
        <p className="text-slate-mid mt-1">
          {isManager
            ? "Here is the IT Team's operational overview for today."
            : "Here are your pending tasks and resort status."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Link href="/dashboard/checklist/today" className="bg-white rounded-2xl shadow-base p-6 border border-slate-border/50 flex flex-col gap-2 hover:border-fir-green/30 transition-all group">
          <span className="text-xs font-bold text-slate-mid uppercase tracking-widest flex items-center gap-2">
            <CheckSquare size={14} /> Checklist
          </span>
          <span className="text-4xl font-bold text-slate-dark font-display group-hover:text-fir-green transition-colors">
            {stats?.completedTasks}/{stats?.dailyTasks}
          </span>
          <div className="w-full bg-cream rounded-full h-1.5 mt-2">
            <div className="bg-fir-green h-1.5 rounded-full transition-all" style={{ width: `${checklistProgress}%` }} />
          </div>
        </Link>

        <Link href="/dashboard/issues" className="bg-white rounded-2xl shadow-base p-6 border border-slate-border/50 flex flex-col gap-2 hover:border-fir-green/30 transition-all group">
          <span className="text-xs font-bold text-slate-mid uppercase tracking-widest flex items-center gap-2">
            <AlertCircle size={14} /> Open Issues
          </span>
          <span className="text-4xl font-bold text-slate-dark font-display group-hover:text-fir-green transition-colors">
            {stats?.openIssues}
          </span>
          <span className={`text-xs font-medium ${stats?.criticalIssues ? 'text-color-error animate-pulse' : 'text-slate-mid'}`}>
            {stats?.criticalIssues ? `${stats.criticalIssues} critical requires attention` : 'None critical'}
          </span>
        </Link>

        <div className="bg-white rounded-2xl shadow-base p-6 border border-slate-border/50 flex flex-col gap-2">
          <span className="text-xs font-bold text-slate-mid uppercase tracking-widest flex items-center gap-2">
            <ArrowUpCircle size={14} /> Escalations
          </span>
          <span className="text-4xl font-bold text-slate-dark font-display">
            {stats?.escalations}
          </span>
          <span className="text-xs text-slate-mid font-medium">Pending vendor action</span>
        </div>

        <div className="bg-white rounded-2xl shadow-base p-6 border border-slate-border/50 flex flex-col gap-2">
          <span className="text-xs font-bold text-slate-mid uppercase tracking-widest flex items-center gap-2">
            <Clock size={14} /> Shift Time
          </span>
          <span className="text-4xl font-bold text-slate-dark font-display">
            {new Date().getHours() < 13 ? 'Morning' : 'Afternoon'}
          </span>
          <span className="text-xs text-slate-mid font-medium">Active operational window</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-base p-8 border border-slate-border/50">
          <h3 className="text-xl font-bold text-slate-dark mb-6 font-display">Recent Activity</h3>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-fir-green-subtle flex items-center justify-center text-fir-green shrink-0">
                <CheckSquare size={20} />
              </div>
              <div>
                <p className="text-sm text-slate-dark font-medium">Daily checklist items verified for Morning shift.</p>
                <p className="text-xs text-slate-mid mt-1">Today, 8:45 AM</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-cream flex items-center justify-center text-antique-gold shrink-0">
                <AlertCircle size={20} />
              </div>
              <div>
                <p className="text-sm text-slate-dark font-medium">New Critical issue reported: Wing B Wi-Fi failure.</p>
                <p className="text-xs text-slate-mid mt-1">Today, 10:15 AM</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-fir-green rounded-2xl p-8 text-white shadow-lg relative overflow-hidden group">
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-2 font-display">Operational Health</h3>
            <p className="text-white/80 text-sm mb-6 max-w-[240px]">Overall system status is stable. 2 maintenance windows scheduled for tonight.</p>
            <Link href="/dashboard/checklist/today" className="inline-flex items-center gap-2 px-6 py-3 bg-antique-gold hover:bg-antique-gold-dark rounded-xl font-bold transition-all transform group-hover:translate-x-1">
              Complete Tasks <CheckSquare size={18} />
            </Link>
          </div>
          <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/5 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
        </div>
      </div>
    </div>
  );
}
