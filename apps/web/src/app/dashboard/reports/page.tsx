"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { FileText, Download, Printer, Loader2, ClipboardCheck, AlertCircle, CheckCircle, Clock } from "lucide-react";
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
    <div className="flex justify-center items-center h-64 text-slate-mid">
      <Loader2 className="animate-spin mr-2" /> Generating shift report...
    </div>
  );

  if (!data) return <div className="text-center p-8 text-slate-mid">Failed to load shift report data.</div>;

  const resolvedIssuesList = data.issues.filter(i => i.status === "RESOLVED");
  const pendingIssuesList = data.issues.filter(i => i.status !== "RESOLVED");

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto p-2 print:p-0 print:max-w-full">
      {/* Action Buttons - Hidden when printing */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-3xl font-bold text-slate-dark font-display">IT Operational Shift Report</h2>
          <p className="text-slate-mid">Export, print, or review today's complete IT operational metrics.</p>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3 w-full md:w-auto">
          <Link 
            href="/dashboard/reports/new"
            className="flex-1 md:flex-initial bg-fir-green text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 hover:bg-fir-green/90 transition-all shadow-sm font-bold text-xs md:text-sm shrink-0"
          >
            <FileText size={16} className="shrink-0" />
            <span className="truncate">Submit Handover</span>
          </Link>
          <button 
            onClick={() => window.print()}
            className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 border border-slate-border text-slate-dark bg-white rounded-xl hover:bg-slate-50 transition-all font-bold text-xs md:text-sm shadow-sm shrink-0"
          >
            <Printer size={16} className="shrink-0" /> <span className="truncate">Print Sheet</span>
          </button>
          <button 
            onClick={handleExportPDF}
            disabled={exporting}
            className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 bg-antique-gold hover:bg-antique-gold-dark text-white rounded-xl transition-all font-bold text-xs md:text-sm shadow-sm disabled:opacity-55 shrink-0"
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

      {/* Main Handover Sheet Grid */}
      <div className="bg-white border-2 border-slate-dark p-6 md:p-8 print:p-0 print:border-none shadow-md print:shadow-none flex flex-col gap-6 font-sans print-sheet">
        
        {/* 1. Main Sheet Header */}
        <div className="border-4 double border-[#19433E] p-4 text-center">
          <h1 className="text-xl md:text-3xl font-extrabold text-fir-green tracking-wider uppercase font-display border-b-2 border-fir-green pb-2">
            Professional IT Shift Handover Report
          </h1>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-left text-sm font-semibold text-slate-dark">
            <div>
              <span className="text-slate-mid font-bold block uppercase text-[10px]">Report Date</span>
              <span>{format(new Date(data.date), "dd MMMM yyyy")}</span>
            </div>
            <div>
              <span className="text-slate-mid font-bold block uppercase text-[10px]">Shift Timing</span>
              <span>Morning / Afternoon</span>
            </div>
            <div>
              <span className="text-slate-mid font-bold block uppercase text-[10px]">Prepared By</span>
              <span>On-duty IT Engineer</span>
            </div>
            <div>
              <span className="text-slate-mid font-bold block uppercase text-[10px]">Team Members On Duty</span>
              <span>{data.summary.teamOnDuty || "On-duty IT Team"}</span>
            </div>
          </div>
        </div>

        {/* 2. SHIFT SUMMARY */}
        <div>
          <div className="bg-fir-green text-white text-xs font-extrabold uppercase py-2 px-3 tracking-wider mb-2">
            Shift Summary
          </div>
          <div className="overflow-x-auto border border-slate-300">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-dark font-bold border-b border-slate-300">
                  <th className="p-2 border-r border-slate-300">Total Incidents</th>
                  <th className="p-2 border-r border-slate-300">Resolved</th>
                  <th className="p-2 border-r border-slate-300">Pending</th>
                  <th className="p-2 border-r border-slate-300">Critical Alerts</th>
                  <th className="p-2 border-r border-slate-300">Downtime (min)</th>
                  <th className="p-2 border-r border-slate-300">Escalations</th>
                  <th className="p-2 border-r border-slate-300">Users Supported</th>
                  <th className="p-2">Remarks</th>
                </tr>
              </thead>
              <tbody>
                <tr className="font-semibold text-slate-dark text-sm">
                  <td className="p-2 border-r border-slate-300">{data.summary.totalIncidents}</td>
                  <td className="p-2 border-r border-slate-300 text-green-700">{data.summary.resolvedIncidents}</td>
                  <td className="p-2 border-r border-slate-300 text-amber-700">{data.summary.pendingIncidents}</td>
                  <td className="p-2 border-r border-slate-300 text-red-600">{data.summary.criticalAlerts}</td>
                  <td className="p-2 border-r border-slate-300">{data.summary.downtime} mins</td>
                  <td className="p-2 border-r border-slate-300 text-orange-600">{data.summary.escalations}</td>
                  <td className="p-2 border-r border-slate-300">{data.summary.usersSupported}</td>
                  <td className="p-2 text-xs font-normal text-slate-mid">All checklists and handovers captured automatically.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. DAILY OPERATIONS CHECKLIST */}
        <div>
          <div className="bg-fir-green text-white text-xs font-extrabold uppercase py-2 px-3 tracking-wider mb-2">
            Daily Operations Checklist
          </div>
          <div className="overflow-x-auto border border-slate-300">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-dark font-bold border-b border-slate-300">
                  <th className="p-2 border-r border-slate-300 w-1/3">Checklist Item</th>
                  <th className="p-2 border-r border-slate-300 w-1/4">Status</th>
                  <th className="p-2">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {data.checklist.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-slate-mid italic">No checklist data logged for this shift yet.</td>
                  </tr>
                ) : (
                  data.checklist.map((item) => (
                    <tr key={item.id} className="border-b border-slate-200 hover:bg-slate-50/50">
                      <td className="p-2 border-r border-slate-300 font-semibold text-slate-dark">{item.checklistItem.name}</td>
                      <td className="p-2 border-r border-slate-300">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.completed ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}>
                          {item.completed ? "✓ COMPLETED" : "✗ INCOMPLETE"}
                        </span>
                        <span className="text-[10px] text-slate-mid ml-2">by {item.user.name.split(" ")[0]}</span>
                      </td>
                      <td className="p-2 text-slate-dark italic">{item.remarks || "No remarks entered."}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. ALL ISSUES FACED */}
        <div>
          <div className="bg-fir-green text-white text-xs font-extrabold uppercase py-2 px-3 tracking-wider mb-2">
            Issues Faced During Shift
          </div>
          <div className="overflow-x-auto border border-slate-300">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-dark font-bold border-b border-slate-300">
                  <th className="p-2 border-r border-slate-300 w-24">Ticket No</th>
                  <th className="p-2 border-r border-slate-300">Issue Description</th>
                  <th className="p-2 border-r border-slate-300">Priority</th>
                  <th className="p-2 border-r border-slate-300">Department/Location</th>
                  <th className="p-2 border-r border-slate-300">Status</th>
                  <th className="p-2 border-r border-slate-300">Assigned To</th>
                  <th className="p-2">Start Time</th>
                </tr>
              </thead>
              <tbody>
                {data.issues.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-slate-mid italic">No incidents or tickets logged today.</td>
                  </tr>
                ) : (
                  data.issues.map((issue, idx) => (
                    <tr key={issue.id} className="border-b border-slate-200">
                      <td className="p-2 border-r border-slate-300 font-bold text-slate-dark">KHY-{100 + idx}</td>
                      <td className="p-2 border-r border-slate-300 font-semibold text-slate-dark">{issue.title}</td>
                      <td className="p-2 border-r border-slate-300">
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          issue.priority === "CRITICAL" ? "bg-red-100 text-red-800 border border-red-300" :
                          issue.priority === "HIGH" ? "bg-orange-100 text-orange-800" :
                          "bg-slate-100 text-slate-700"
                        }`}>
                          {issue.priority}
                        </span>
                      </td>
                      <td className="p-2 border-r border-slate-300">{issue.department}</td>
                      <td className="p-2 border-r border-slate-300 font-bold uppercase text-[10px]">{issue.status}</td>
                      <td className="p-2 border-r border-slate-300">{issue.assignee?.name || "Unassigned"}</td>
                      <td className="p-2 text-slate-mid">{format(new Date(issue.createdAt), "hh:mm a")}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. RESOLVED ISSUES */}
        <div>
          <div className="bg-fir-green text-white text-xs font-extrabold uppercase py-2 px-3 tracking-wider mb-2">
            Resolved Issues
          </div>
          <div className="overflow-x-auto border border-slate-300">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-dark font-bold border-b border-slate-300">
                  <th className="p-2 border-r border-slate-300 w-24">Ticket No</th>
                  <th className="p-2 border-r border-slate-300">Issue</th>
                  <th className="p-2 border-r border-slate-300">Resolution Provided</th>
                  <th className="p-2 border-r border-slate-300">Closed By</th>
                  <th className="p-2 border-r border-slate-300">Duration</th>
                  <th className="p-2">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {resolvedIssuesList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-slate-mid italic">No resolved issues to display for this shift.</td>
                  </tr>
                ) : (
                  resolvedIssuesList.map((issue, idx) => (
                    <tr key={issue.id} className="border-b border-slate-200">
                      <td className="p-2 border-r border-slate-300 font-bold text-slate-dark">KHY-{100 + idx}</td>
                      <td className="p-2 border-r border-slate-300 font-semibold text-slate-dark">{issue.title}</td>
                      <td className="p-2 border-r border-slate-300 italic text-slate-dark">
                        {issue.notes[0]?.content || "Marked as resolved."}
                      </td>
                      <td className="p-2 border-r border-slate-300">{issue.assignee?.name || "On-duty Team"}</td>
                      <td className="p-2 border-r border-slate-300 font-semibold text-slate-dark">
                        {getDuration(issue.createdAt, issue.updatedAt)}
                      </td>
                      <td className="p-2 text-slate-mid">Resolved successfully.</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 6. PENDING / IN-PROGRESS ISSUES */}
        <div>
          <div className="bg-fir-green text-white text-xs font-extrabold uppercase py-2 px-3 tracking-wider mb-2">
            Pending / In-Progress Issues
          </div>
          <div className="overflow-x-auto border border-slate-300">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-dark font-bold border-b border-slate-300">
                  <th className="p-2 border-r border-slate-300 w-24">Ticket No</th>
                  <th className="p-2 border-r border-slate-300">Issue</th>
                  <th className="p-2 border-r border-slate-300">Current Status</th>
                  <th className="p-2 border-r border-slate-300">Action Required</th>
                  <th className="p-2 border-r border-slate-300">ETA</th>
                  <th className="p-2 border-r border-slate-300">Escalated To</th>
                  <th className="p-2 border-r border-slate-300">Priority</th>
                  <th className="p-2">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {pendingIssuesList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-4 text-center text-slate-mid italic">No pending operations issues outstanding.</td>
                  </tr>
                ) : (
                  pendingIssuesList.map((issue, idx) => (
                    <tr key={issue.id} className="border-b border-slate-200">
                      <td className="p-2 border-r border-slate-300 font-bold text-slate-dark">KHY-{100 + idx}</td>
                      <td className="p-2 border-r border-slate-300 font-semibold text-slate-dark">{issue.title}</td>
                      <td className="p-2 border-r border-slate-300 uppercase font-bold text-orange-600">{issue.status}</td>
                      <td className="p-2 border-r border-slate-300 italic text-slate-dark">
                        {issue.notes[0]?.content || issue.description || "Awaiting investigation."}
                      </td>
                      <td className="p-2 border-r border-slate-300 font-semibold text-slate-dark">
                        {issue.escalation?.contactDetails || "Within shift"}
                      </td>
                      <td className="p-2 border-r border-slate-300 font-semibold text-fir-green">
                        {issue.escalation?.escalatedTo || "Internal IT"}
                      </td>
                      <td className="p-2 border-r border-slate-300 font-bold text-slate-dark">{issue.priority}</td>
                      <td className="p-2 text-slate-mid italic">
                        {issue.escalation?.remarks || "High priority incident."}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 7. HANDOVER NOTES */}
        <div className="border border-slate-300 p-4 bg-slate-50">
          <div className="text-xs font-bold text-slate-mid uppercase tracking-widest mb-2">Handover Notes</div>
          <p className="text-sm text-slate-dark leading-relaxed whitespace-pre-line italic">
            {data.summary.handoverNotes || "No summary or handover notes submitted for this shift yet."}
          </p>
        </div>

        {/* Footer */}
        <div className="text-center text-[10px] text-slate-mid border-t border-slate-300 pt-4 mt-2">
          Handover report generated automatically by the Khyber IT Operations Portal. This document serves as the official IT operational record for the resort.
        </div>
      </div>
    </div>
  );
}
