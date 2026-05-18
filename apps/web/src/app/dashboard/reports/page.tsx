"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { FileText, Download, Printer, Loader2, ClipboardCheck, AlertCircle, CheckCircle, Clock, Users, Flame, AlertTriangle, CheckCircle2, Activity } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

interface ChecklistItem {
  id: string;
  name: string;
  category: string;
}

interface ChecklistResponse {
  id: string;
  checklistItem: ChecklistItem;
  completed: boolean;
  status: string;
  remarks: string | null;
  user: {
    name: string;
  };
  createdAt: string;
}

interface Issue {
  id: string;
  title: string;
  description: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "ESCALATED";
  department: string;
  createdAt: string;
  updatedAt: string;
  reporter: {
    name: string;
  };
  assignee: {
    name: string;
  } | null;
  notes: {
    content: string;
    createdAt: string;
    author: {
      name: string;
    };
  }[];
  escalation: {
    escalatedTo: string;
    contactDetails: string | null;
    remarks: string | null;
  } | null;
}

interface ReportData {
  date: string;
  summary: {
    id: string | null;
    totalIncidents: number;
    resolvedIncidents: number;
    pendingIncidents: number;
    criticalAlerts: number;
    escalations: number;
    checklistCompletion: string;
    usersSupported: number;
    downtime: number;
    handoverNotes: string | null;
    teamOnDuty: string | null;
  };
  checklist: ChecklistResponse[];
  issues: Issue[];
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const getDuration = (start: string, end: string) => {
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    const diffMins = Math.round(diffMs / 1000 / 60);
    if (diffMins < 60) return `${diffMins} mins`;
    const diffHours = Math.floor(diffMins / 60);
    const remainingMins = diffMins % 60;
    return `${diffHours}h ${remainingMins}m`;
  };

  const handleExportPDF = async () => {
    if (!data?.summary?.id) {
      alert("No submitted report found for today yet! Please click 'Submit Handover' first to log today's shift report before exporting.");
      return;
    }
    setExporting(true);
    try {
      const response = await api.get(`/reports/${data.summary.id}/pdf`, {
        responseType: "blob"
      });
      
      const blob = new Blob([response.data], { type: "application/pdf" });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", `KHY_Handover_Report_${data.summary.id.substring(0, 6)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      console.error("Failed to download PDF", error);
      alert("Failed to export branded PDF report.");
    } finally {
      setExporting(false);
    }
  };

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
    <div className="flex flex-col justify-center items-center h-64 text-slate-mid gap-3">
      <Loader2 className="animate-spin text-fir-green" size={36} />
      <span className="text-sm font-medium">Generating IT Operational Shift Report...</span>
    </div>
  );

  if (!data) return <div className="text-center p-8 text-slate-mid">Failed to load shift report data.</div>;

  const resolvedIssuesList = data.issues.filter(i => i.status === "RESOLVED");
  const pendingIssuesList = data.issues.filter(i => i.status !== "RESOLVED");

  const getStatusBadge = (item: ChecklistResponse) => {
    const status = item.status || (item.completed ? "WORKING" : "PENDING");
    switch (status) {
      case "WORKING":
        return <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm shrink-0">🟢 Working</span>;
      case "NOT_WORKING":
        return <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 shadow-sm shrink-0">🔴 Not Working</span>;
      case "PARTIAL":
        return <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-sm shrink-0">🟡 Partial / Flagged</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300 shadow-sm shrink-0">⚪ Pending</span>;
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto pb-16 print:pb-0 print:max-w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden bg-gradient-to-r from-slate-dark to-[#19433E] p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <FileText size={250} />
        </div>
        <div className="flex flex-col gap-2 relative z-10">
          <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full w-max text-xs font-medium backdrop-blur-sm">
            <Activity size={14} className="text-cream" /> Live Executive Report
          </div>
          <h2 className="text-3xl font-extrabold text-white font-display tracking-tight">IT Operational Shift Report</h2>
          <p className="text-sm text-cream/80 max-w-lg">
            Review, print, or export today's complete IT operational metrics, interface status logs, and shift handover notes.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto relative z-10">
          <Link 
            href="/dashboard/reports/new"
            className="flex-1 md:flex-initial bg-fir-green text-white px-5 py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-fir-green/90 transition-all shadow-md hover:shadow-fir-green/20 hover:scale-105 active:scale-95 font-bold text-xs md:text-sm shrink-0"
          >
            <FileText size={16} className="shrink-0" />
            <span className="truncate">Submit Handover</span>
          </Link>
          <button 
            onClick={() => window.print()}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-3 border border-white/20 text-white bg-white/10 backdrop-blur-md rounded-2xl hover:bg-white/20 transition-all font-bold text-xs md:text-sm shadow-md hover:scale-105 active:scale-95 shrink-0"
          >
            <Printer size={16} className="shrink-0" /> <span className="truncate">Print Sheet</span>
          </button>
          <button 
            onClick={handleExportPDF}
            disabled={exporting}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-3 bg-antique-gold hover:bg-antique-gold-dark text-white rounded-2xl transition-all font-bold text-xs md:text-sm shadow-md hover:shadow-antique-gold/20 hover:scale-105 active:scale-95 disabled:opacity-50 shrink-0"
          >
            {exporting ? (
              <>
                <Loader2 className="animate-spin shrink-0" size={16} />
                <span className="truncate">Exporting...</span>
              </>
            ) : (
              <>
                <Download size={16} className="shrink-0" /> <span className="truncate">Export PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto bg-white p-3 rounded-2xl shadow-base border border-slate-border/50 print:hidden sticky top-16 z-30 backdrop-blur-md bg-white/90 scrollbar-none">
        {[
          { id: "all", label: "All Sections", count: null },
          { id: "summary", label: "Shift Summary", count: null },
          { id: "checklist", label: "Daily Checklist", count: data.checklist.length },
          { id: "incidents", label: "Incidents Faced", count: data.issues.length },
          { id: "notes", label: "Handover Notes", count: null }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 shadow-sm ${
              activeTab === tab.id 
                ? "bg-fir-green text-white shadow-fir-green/20 scale-105" 
                : "bg-cream text-slate-dark hover:bg-cream/80 border border-slate-border/40"
            }`}
          >
            {tab.label}
            {tab.count !== null && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === tab.id ? "bg-white/20 text-white" : "bg-white text-slate-dark border border-slate-border/30"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="bg-white border-2 border-slate-dark p-8 rounded-3xl print:p-0 print:border-none shadow-xl print:shadow-none flex flex-col gap-8 font-sans print-sheet">
        <div className="border-4 double border-[#19433E] p-6 rounded-2xl text-center bg-cream/20 shadow-inner print:bg-transparent print:border-2 print:p-4">
          <h1 className="text-2xl md:text-4xl font-extrabold text-fir-green tracking-tight uppercase font-display border-b-2 border-fir-green/40 pb-4">
            Professional IT Shift Handover Report
          </h1>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6 text-left text-sm font-semibold text-slate-dark">
            <div className="bg-white p-3.5 rounded-xl border border-slate-border/50 shadow-sm print:border-none print:p-0 print:shadow-none print:bg-transparent">
              <span className="text-slate-mid font-bold block uppercase text-[10px] tracking-wider mb-1">Report Date</span>
              <span className="text-slate-dark font-extrabold text-base">{format(new Date(data.date), "dd MMMM yyyy")}</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-border/50 shadow-sm print:border-none print:p-0 print:shadow-none print:bg-transparent">
              <span className="text-slate-mid font-bold block uppercase text-[10px] tracking-wider mb-1">Shift Timing</span>
              <span className="text-slate-dark font-extrabold text-base">Morning / Afternoon</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-border/50 shadow-sm print:border-none print:p-0 print:shadow-none print:bg-transparent">
              <span className="text-slate-mid font-bold block uppercase text-[10px] tracking-wider mb-1">Prepared By</span>
              <span className="text-slate-dark font-extrabold text-base">On-duty IT Engineer</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-border/50 shadow-sm print:border-none print:p-0 print:shadow-none print:bg-transparent">
              <span className="text-slate-mid font-bold block uppercase text-[10px] tracking-wider mb-1">Team Members On Duty</span>
              <span className="text-slate-dark font-extrabold text-base truncate block">{data.summary.teamOnDuty || "On-duty IT Team"}</span>
            </div>
          </div>
        </div>

        {(activeTab === "all" || activeTab === "summary") && (
          <div className="flex flex-col gap-4">
            <div className="bg-fir-green text-white text-sm font-extrabold uppercase py-2.5 px-4 rounded-xl tracking-wider shadow-sm flex items-center gap-2">
              <Activity size={18} /> Shift Executive Summary
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-gradient-to-br from-cream to-cream/40 p-5 rounded-2xl border border-slate-border/60 shadow-sm flex flex-col justify-between gap-3">
                <div className="flex justify-between items-center text-slate-mid">
                  <span className="text-xs font-bold uppercase tracking-wider">Total Incidents</span>
                  <AlertTriangle size={20} className="text-slate-mid" />
                </div>
                <div className="flex flex-col">
                  <span className="text-3xl font-extrabold font-display text-slate-dark">{data.summary.totalIncidents}</span>
                  <span className="text-[10px] text-slate-mid mt-0.5">Tickets logged today</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-5 rounded-2xl border border-emerald-200 shadow-sm flex flex-col justify-between gap-3">
                <div className="flex justify-between items-center text-emerald-700">
                  <span className="text-xs font-bold uppercase tracking-wider">Resolved</span>
                  <CheckCircle2 size={20} className="text-emerald-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-3xl font-extrabold font-display text-emerald-700">{data.summary.resolvedIncidents}</span>
                  <span className="text-[10px] text-emerald-600 mt-0.5">Successfully closed</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 p-5 rounded-2xl border border-rose-200 shadow-sm flex flex-col justify-between gap-3">
                <div className="flex justify-between items-center text-rose-700">
                  <span className="text-xs font-bold uppercase tracking-wider">Critical Alerts</span>
                  <Flame size={20} className="text-rose-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-3xl font-extrabold font-display text-rose-700">{data.summary.criticalAlerts}</span>
                  <span className="text-[10px] text-rose-600 mt-0.5">High severity issues</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 p-5 rounded-2xl border border-amber-200 shadow-sm flex flex-col justify-between gap-3">
                <div className="flex justify-between items-center text-amber-700">
                  <span className="text-xs font-bold uppercase tracking-wider">Downtime</span>
                  <Clock size={20} className="text-amber-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-3xl font-extrabold font-display text-amber-700">{data.summary.downtime}m</span>
                  <span className="text-[10px] text-amber-600 mt-0.5">System outage duration</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-5 rounded-2xl border border-blue-200 shadow-sm flex flex-col justify-between gap-3 col-span-2 md:col-span-1">
                <div className="flex justify-between items-center text-blue-700">
                  <span className="text-xs font-bold uppercase tracking-wider">Users Supported</span>
                  <Users size={20} className="text-blue-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-3xl font-extrabold font-display text-blue-700">{data.summary.usersSupported}</span>
                  <span className="text-[10px] text-blue-600 mt-0.5">Resort staff assisted</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {(activeTab === "all" || activeTab === "checklist") && (
          <div className="flex flex-col gap-4">
            <div className="bg-fir-green text-white text-sm font-extrabold uppercase py-2.5 px-4 rounded-xl tracking-wider shadow-sm flex items-center gap-2">
              <ClipboardCheck size={18} /> Daily Operations Checklist Logs
            </div>
            <div className="overflow-x-auto border border-slate-border/60 rounded-2xl shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-dark font-bold border-b border-slate-border/60 uppercase tracking-wider">
                    <th className="p-4 border-r border-slate-border/40 w-1/3">Checklist Item Description</th>
                    <th className="p-4 border-r border-slate-border/40 w-48 text-center">Operational Status</th>
                    <th className="p-4">Inspected Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-border/40">
                  {data.checklist.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-slate-mid italic bg-cream/20">No checklist data logged for this shift yet.</td>
                    </tr>
                  ) : (
                    data.checklist.map((item) => (
                      <tr key={item.id} className="hover:bg-cream/15 transition-colors">
                        <td className="p-4 border-r border-slate-border/40 font-bold text-slate-dark text-sm">{item.checklistItem.name}</td>
                        <td className="p-4 border-r border-slate-border/40 text-center">
                          <div className="flex flex-col items-center gap-1.5 justify-center">
                            {getStatusBadge(item)}
                            <span className="text-[10px] text-slate-mid font-medium">by {item.user.name.split(" ")[0]}</span>
                          </div>
                        </td>
                        <td className="p-4 text-slate-dark italic text-sm">{item.remarks || "No specific remarks entered."}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {(activeTab === "all" || activeTab === "incidents") && (
          <div className="flex flex-col gap-4">
            <div className="bg-fir-green text-white text-sm font-extrabold uppercase py-2.5 px-4 rounded-xl tracking-wider shadow-sm flex items-center gap-2">
              <AlertCircle size={18} /> Issues Faced During Shift
            </div>
            <div className="overflow-x-auto border border-slate-border/60 rounded-2xl shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-dark font-bold border-b border-slate-border/60 uppercase tracking-wider">
                    <th className="p-4 border-r border-slate-border/40 w-24">Ticket No</th>
                    <th className="p-4 border-r border-slate-border/40">Issue Description</th>
                    <th className="p-4 border-r border-slate-border/40 w-28 text-center">Priority</th>
                    <th className="p-4 border-r border-slate-border/40">Department</th>
                    <th className="p-4 border-r border-slate-border/40 w-28 text-center">Status</th>
                    <th className="p-4 border-r border-slate-border/40">Assigned To</th>
                    <th className="p-4">Start Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-border/40">
                  {data.issues.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-mid italic bg-cream/20">No incidents or tickets logged today.</td>
                    </tr>
                  ) : (
                    data.issues.map((issue, idx) => (
                      <tr key={issue.id} className="hover:bg-cream/15 transition-colors">
                        <td className="p-4 border-r border-slate-border/40 font-extrabold text-slate-dark font-mono text-sm">KHY-{100 + idx}</td>
                        <td className="p-4 border-r border-slate-border/40 font-bold text-slate-dark text-sm">{issue.title}</td>
                        <td className="p-4 border-r border-slate-border/40 text-center">
                          <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider shadow-sm ${
                            issue.priority === "CRITICAL" ? "bg-red-100 text-red-800 border border-red-300 animate-pulse" :
                            issue.priority === "HIGH" ? "bg-orange-100 text-orange-800 border border-orange-300" :
                            "bg-slate-100 text-slate-700 border border-slate-300"
                          }`}>
                            {issue.priority}
                          </span>
                        </td>
                        <td className="p-4 border-r border-slate-border/40 font-medium text-slate-dark">{issue.department}</td>
                        <td className="p-4 border-r border-slate-border/40 text-center font-extrabold uppercase text-[10px] text-slate-dark">{issue.status}</td>
                        <td className="p-4 border-r border-slate-border/40 font-semibold text-slate-dark">{issue.assignee?.name || "Unassigned"}</td>
                        <td className="p-4 text-slate-mid font-medium">{format(new Date(issue.createdAt), "hh:mm a")}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {(activeTab === "all" || activeTab === "incidents") && (
          <div className="flex flex-col gap-4">
            <div className="bg-fir-green text-white text-sm font-extrabold uppercase py-2.5 px-4 rounded-xl tracking-wider shadow-sm flex items-center gap-2">
              <CheckCircle size={18} /> Resolved Issues & Resolutions
            </div>
            <div className="overflow-x-auto border border-slate-border/60 rounded-2xl shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-dark font-bold border-b border-slate-border/60 uppercase tracking-wider">
                    <th className="p-4 border-r border-slate-border/40 w-24">Ticket No</th>
                    <th className="p-4 border-r border-slate-border/40 w-1/4">Issue</th>
                    <th className="p-4 border-r border-slate-border/40">Resolution Provided</th>
                    <th className="p-4 border-r border-slate-border/40 w-32">Closed By</th>
                    <th className="p-4 border-r border-slate-border/40 w-24">Duration</th>
                    <th className="p-4 w-28">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-border/40">
                  {resolvedIssuesList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-mid italic bg-cream/20">No resolved issues to display for this shift.</td>
                    </tr>
                  ) : (
                    resolvedIssuesList.map((issue, idx) => (
                      <tr key={issue.id} className="hover:bg-cream/15 transition-colors">
                        <td className="p-4 border-r border-slate-border/40 font-extrabold text-slate-dark font-mono text-sm">KHY-{100 + idx}</td>
                        <td className="p-4 border-r border-slate-border/40 font-bold text-slate-dark text-sm">{issue.title}</td>
                        <td className="p-4 border-r border-slate-border/40 italic text-slate-dark text-sm leading-relaxed">
                          {issue.notes[0]?.content || "Marked as resolved."}
                        </td>
                        <td className="p-4 border-r border-slate-border/40 font-bold text-slate-dark">{issue.assignee?.name || "On-duty Team"}</td>
                        <td className="p-4 border-r border-slate-border/40 font-bold text-fir-green">
                          {getDuration(issue.createdAt, issue.updatedAt)}
                        </td>
                        <td className="p-4 text-slate-mid font-medium">Resolved successfully.</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {(activeTab === "all" || activeTab === "incidents") && (
          <div className="flex flex-col gap-4">
            <div className="bg-fir-green text-white text-sm font-extrabold uppercase py-2.5 px-4 rounded-xl tracking-wider shadow-sm flex items-center gap-2">
              <Clock size={18} /> Pending / In-Progress Issues
            </div>
            <div className="overflow-x-auto border border-slate-border/60 rounded-2xl shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-dark font-bold border-b border-slate-border/60 uppercase tracking-wider">
                    <th className="p-4 border-r border-slate-border/40 w-24">Ticket No</th>
                    <th className="p-4 border-r border-slate-border/40 w-1/4">Issue</th>
                    <th className="p-4 border-r border-slate-border/40 w-28 text-center">Current Status</th>
                    <th className="p-4 border-r border-slate-border/40">Action Required</th>
                    <th className="p-4 border-r border-slate-border/40 w-24">ETA</th>
                    <th className="p-4 border-r border-slate-border/40 w-32">Escalated To</th>
                    <th className="p-4 border-r border-slate-border/40 w-24 text-center">Priority</th>
                    <th className="p-4">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-border/40">
                  {pendingIssuesList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-mid italic bg-cream/20">No pending operations issues outstanding.</td>
                    </tr>
                  ) : (
                    pendingIssuesList.map((issue, idx) => (
                      <tr key={issue.id} className="hover:bg-cream/15 transition-colors">
                        <td className="p-4 border-r border-slate-border/40 font-extrabold text-slate-dark font-mono text-sm">KHY-{100 + idx}</td>
                        <td className="p-4 border-r border-slate-border/40 font-bold text-slate-dark text-sm">{issue.title}</td>
                        <td className="p-4 border-r border-slate-border/40 text-center font-extrabold uppercase text-[10px] text-orange-600">{issue.status}</td>
                        <td className="p-4 border-r border-slate-border/40 italic text-slate-dark text-sm leading-relaxed">
                          {issue.notes[0]?.content || issue.description || "Awaiting investigation."}
                        </td>
                        <td className="p-4 border-r border-slate-border/40 font-bold text-slate-dark">
                          {issue.escalation?.contactDetails || "Within shift"}
                        </td>
                        <td className="p-4 border-r border-slate-border/40 font-extrabold text-fir-green">
                          {issue.escalation?.escalatedTo || "Internal IT"}
                        </td>
                        <td className="p-4 border-r border-slate-border/40 text-center font-extrabold text-slate-dark">{issue.priority}</td>
                        <td className="p-4 text-slate-mid italic font-medium">
                          {issue.escalation?.remarks || "High priority incident."}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {(activeTab === "all" || activeTab === "notes") && (
          <div className="border-2 border-slate-border/80 p-6 rounded-2xl bg-slate-50/70 shadow-inner print:border print:bg-transparent print:p-4 print:shadow-none flex flex-col gap-3">
            <div className="text-xs font-extrabold text-slate-mid uppercase tracking-widest flex items-center gap-2">
              <FileText size={16} /> Shift Handover Notes & Instructions
            </div>
            <p className="text-sm text-slate-dark font-medium leading-relaxed whitespace-pre-line italic bg-white p-6 rounded-xl border border-slate-border/40 shadow-sm print:border-none print:p-0 print:shadow-none print:bg-transparent">
              {data.summary.handoverNotes || "No summary or handover notes submitted for this shift yet."}
            </p>
          </div>
        )}

        <div className="text-center text-xs text-slate-mid border-t border-slate-border/60 pt-6 mt-4 font-medium print:text-[10px] print:pt-4">
          Handover report generated automatically by the Khyber IT Operations Portal. This document serves as the official IT operational record for the resort.
        </div>
      </div>
    </div>
  );
}
