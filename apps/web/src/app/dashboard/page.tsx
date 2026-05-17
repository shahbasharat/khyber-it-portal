"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import Link from "next/link";
import { AlertCircle, CheckSquare, Clock, ArrowUpCircle, Loader2, Package } from "lucide-react";

interface Stats {
  openIssues: number;
  criticalIssues: number;
  dailyTasks: number;
  completedTasks: number;
  escalations: number;
  weeklyTrends: { dayName: string; count: number }[];
}

interface Activity {
  id: string;
  type: "CHECKLIST_COMPLETED" | "NEW_ISSUE" | "CRITICAL_ISSUE" | "SHIFT_REPORT";
  title: string;
  description: string;
  timestamp: string;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, activityRes] = await Promise.all([
          api.get("/stats"),
          api.get("/activity")
        ]);
        setStats(statsRes.data);
        setActivities(activityRes.data);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
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

        <Link href="/dashboard/server-room" className="bg-white rounded-2xl shadow-base p-6 border border-slate-border/50 flex flex-col gap-2 hover:border-fir-green/30 transition-all group">
          <span className="text-xs font-bold text-slate-mid uppercase tracking-widest flex items-center gap-2">
            <Package size={14} /> Server Log
          </span>
          <span className="text-4xl font-bold text-slate-dark font-display group-hover:text-fir-green transition-colors">
            LOG
          </span>
          <span className="text-xs text-slate-mid font-medium">Record room entry/exit</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-base p-8 border border-slate-border/50">
          <h3 className="text-xl font-bold text-slate-dark mb-6 font-display">Recent Activity</h3>
          <div className="space-y-6">
            {activities.length === 0 ? (
              <p className="text-slate-mid text-sm">No recent operational activity.</p>
            ) : (
              activities.map((activity) => (
                <div key={activity.id} className="flex gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    activity.type === 'CHECKLIST_COMPLETED' ? 'bg-fir-green-subtle text-fir-green' :
                    activity.type === 'CRITICAL_ISSUE' ? 'bg-red-50 text-red-600' :
                    activity.type === 'NEW_ISSUE' ? 'bg-amber-50 text-amber-600' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {activity.type === 'CHECKLIST_COMPLETED' ? <CheckSquare size={20} /> :
                     activity.type === 'CRITICAL_ISSUE' ? <AlertCircle size={20} /> :
                     activity.type === 'NEW_ISSUE' ? <AlertCircle size={20} /> :
                     <Clock size={20} />}
                  </div>
                  <div>
                    <p className="text-sm text-slate-dark font-medium">{activity.title}</p>
                    <p className="text-xs text-slate-mid mt-1">
                      {activity.description} • {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-fir-green rounded-2xl p-8 text-white shadow-lg relative overflow-hidden group">
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <h3 className="text-xl font-bold mb-2 font-display">Operational Health</h3>
              <p className="text-white/80 text-sm mb-6 max-w-[280px]">Overall system status is stable. Daily IT operational checks and audits are running actively.</p>
              <Link href="/dashboard/checklist/today" className="inline-flex items-center gap-2 px-6 py-3 bg-antique-gold hover:bg-antique-gold-dark rounded-xl font-bold transition-all transform group-hover:translate-x-1">
                Complete Tasks <CheckSquare size={18} />
              </Link>
            </div>

            {/* SVG Trend Chart */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <h4 className="text-xs font-bold tracking-widest uppercase text-white/50 mb-4 flex justify-between items-center">
                <span>7-Day Incident Trend</span>
                <span className="text-antique-gold text-[10px] lowercase font-normal tracking-normal bg-antique-gold/10 px-2 py-0.5 rounded-full border border-antique-gold/20">live updates</span>
              </h4>
              
              <div className="h-28 w-full flex items-end justify-between gap-3 px-1">
                {stats?.weeklyTrends?.map((trend, idx) => {
                  const maxCount = Math.max(...(stats.weeklyTrends.map(t => t.count) || [1]), 5);
                  // Calculate height percentage, min 10% for visibility of zero counts
                  const heightPercent = Math.max((trend.count / maxCount) * 80, 10);
                  
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group/bar">
                      <div className="w-full relative flex items-end justify-center h-20">
                        {/* Hover Tooltip */}
                        <span className="absolute -top-7 text-[9px] font-bold bg-white text-fir-green px-1.5 py-0.5 rounded shadow opacity-0 group-hover/bar:opacity-100 transition-opacity duration-200 pointer-events-none z-20 whitespace-nowrap">
                          {trend.count} {trend.count === 1 ? 'incident' : 'incidents'}
                        </span>
                        
                        {/* The Actual Vertical Bar */}
                        <div 
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-t-md transition-all duration-300 cursor-pointer ${
                            trend.count > 0 
                              ? 'bg-antique-gold hover:bg-antique-gold-dark shadow-sm' 
                              : 'bg-white/10 hover:bg-white/20'
                          }`}
                        />
                      </div>
                      
                      {/* X-Axis Label */}
                      <span className="text-[10px] font-bold text-white/50 uppercase group-hover/bar:text-antique-gold transition-colors duration-200">
                        {trend.dayName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/5 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
        </div>
      </div>
    </div>
  );
}
