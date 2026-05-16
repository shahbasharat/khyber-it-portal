"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { FileText, Download, Printer, Loader2, TrendingUp, Users, AlertTriangle } from "lucide-react";

interface ReportData {
  date: string;
  summary: {
    totalIncidents: number;
    resolvedIncidents: number;
    pendingIncidents: number;
    criticalAlerts: number;
    escalations: number;
    checklistCompletion: string;
    usersSupported: number;
    downtime: number;
  };
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await api.get("/reports/summary");
        setData(response.data);
      } catch (error) {
        console.error("Failed to fetch report", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-64 text-slate-mid">
      <Loader2 className="animate-spin mr-2" /> Generating shift report...
    </div>
  );

  if (!data) return <div>Failed to load report.</div>;

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-dark font-display">Shift Report</h2>
          <p className="text-slate-mid">Handover summary for {new Date(data.date).toLocaleDateString()}</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-border text-slate-dark rounded-lg hover:bg-white transition-all">
            <Printer size={18} /> Print
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-fir-green text-white rounded-lg hover:bg-fir-green/90 transition-all shadow-sm">
            <Download size={18} /> Export PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-border/50">
        <div className="bg-fir-green p-8 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <FileText size={32} />
              <h3 className="text-2xl font-bold font-display uppercase tracking-wider">IT Operations Handover</h3>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-80 uppercase font-bold tracking-widest">Shift Status</p>
              <p className="text-xl font-bold">OPERATIONAL</p>
            </div>
          </div>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-6">
            <h4 className="font-bold text-slate-dark border-b border-slate-border/50 pb-2 flex items-center gap-2">
              <TrendingUp size={18} className="text-fir-green" /> Incident Metrics
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-cream p-4 rounded-xl border border-slate-border/30">
                <p className="text-xs text-slate-mid font-bold uppercase mb-1">Total</p>
                <p className="text-2xl font-bold text-slate-dark">{data.summary.totalIncidents}</p>
              </div>
              <div className="bg-cream p-4 rounded-xl border border-slate-border/30">
                <p className="text-xs text-slate-mid font-bold uppercase mb-1">Resolved</p>
                <p className="text-2xl font-bold text-color-success">{data.summary.resolvedIncidents}</p>
              </div>
              <div className="bg-cream p-4 rounded-xl border border-slate-border/30">
                <p className="text-xs text-slate-mid font-bold uppercase mb-1">Pending</p>
                <p className="text-2xl font-bold text-antique-gold">{data.summary.pendingIncidents}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                <p className="text-xs text-red-400 font-bold uppercase mb-1">Critical</p>
                <p className="text-2xl font-bold text-color-error">{data.summary.criticalAlerts}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="font-bold text-slate-dark border-b border-slate-border/50 pb-2 flex items-center gap-2">
              <Users size={18} className="text-fir-green" /> Support & Service
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-mid text-sm">Users Supported</span>
                <span className="font-bold text-slate-dark">{data.summary.usersSupported}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-mid text-sm">Checklist Progress</span>
                <span className="font-bold text-fir-green">{data.summary.checklistCompletion}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-mid text-sm">Downtime (min)</span>
                <span className="font-bold text-slate-dark">{data.summary.downtime}</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="font-bold text-slate-dark border-b border-slate-border/50 pb-2 flex items-center gap-2">
              <AlertTriangle size={18} className="text-fir-green" /> Escalations
            </h4>
            <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-orange-600 font-bold text-2xl">{data.summary.escalations}</p>
                <p className="text-xs text-orange-400 font-medium uppercase">Active Vendor Tickets</p>
              </div>
              <TrendingUp size={32} className="text-orange-200" />
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-slate-border/50 bg-cream/50">
          <p className="text-xs text-slate-mid text-center">
            Handover report generated automatically. This document serves as the official IT operational record for the resort.
          </p>
        </div>
      </div>
    </div>
  );
}
