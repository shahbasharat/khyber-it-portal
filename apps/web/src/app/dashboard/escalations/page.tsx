"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { AlertTriangle, Clock, CheckCircle2, Phone, Search } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/lib/toast";

interface Escalation {
  id: string;
  issueId: string;
  escalatedTo: string;
  contactDetails: string | null;
  remarks: string | null;
  status: "ACTIVE" | "RESOLVED";
  createdAt: string;
  issue: {
    title: string;
    priority: string;
    reporter: {
      name: string;
    };
  };
}

export default function EscalationsPage() {
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { success, error } = useToast();

  const fetchEscalations = async () => {
    try {
      const response = await api.get("/escalations");
      setEscalations(response.data);
    } catch (error) {
      console.error("Failed to fetch escalations", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEscalations();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await api.put(`/escalations/${id}/status`, { status: newStatus });
      success(newStatus === "RESOLVED" ? "Escalation resolved" : "Ticket re-opened");
      fetchEscalations();
    } catch {
      error("Failed to update status");
    }
  };

  const filteredEscalations = escalations.filter(e => 
    e.escalatedTo.toLowerCase().includes(search.toLowerCase()) || 
    e.issue.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-fir-green flex items-center gap-3">
            <AlertTriangle className="text-color-error" size={32} />
            Vendor Escalation Tracker
          </h1>
          <p className="text-slate-mid mt-1">Monitor issues escalated to external vendors and 3rd party support.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-base border border-slate-border/50 overflow-hidden flex flex-col min-h-[500px]">
        <div className="p-4 border-b border-slate-border/50 bg-cream/50 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-mid" size={18} />
            <input 
              type="text" 
              placeholder="Search by vendor or issue..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-border focus:ring-2 focus:ring-fir-green outline-none"
            />
          </div>
        </div>

        <div className="flex-1 p-4 md:p-6 bg-slate-50/50">
          {loading ? (
            <div className="flex justify-center items-center h-32 text-slate-mid">Loading escalations...</div>
          ) : filteredEscalations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-mid">
              <CheckCircle2 size={48} className="mb-4 opacity-50 text-fir-green" />
              <p className="font-medium text-lg">No active escalations</p>
              <p className="text-sm">All vendor tickets have been resolved.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEscalations.map((escalation) => (
                <div 
                  key={escalation.id} 
                  className={`bg-white rounded-xl border p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden ${
                    escalation.status === "ACTIVE" ? "border-orange-200" : "border-slate-border opacity-75"
                  }`}
                >
                  {/* Status Strip */}
                  <div className={`absolute top-0 left-0 w-1 h-full ${
                    escalation.status === "ACTIVE" ? "bg-orange-400" : "bg-green-500"
                  }`} />

                  <div className="flex justify-between items-start mb-4 pl-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                      escalation.status === "ACTIVE" ? "bg-orange-100 text-orange-800" : "bg-green-100 text-green-800"
                    }`}>
                      {escalation.status === "ACTIVE" ? "Awaiting Vendor" : "Resolved"}
                    </span>
                    <span className="text-xs text-slate-mid font-medium flex items-center gap-1">
                      <Clock size={12} /> {format(new Date(escalation.createdAt), "MMM d")}
                    </span>
                  </div>

                  <div className="pl-2 space-y-4">
                    <div>
                      <h3 className="font-bold text-slate-dark text-lg leading-tight mb-1">{escalation.escalatedTo}</h3>
                      {escalation.contactDetails && (
                        <div className="flex items-center gap-1.5 text-sm text-slate-mid">
                          <Phone size={14} /> <span>{escalation.contactDetails}</span>
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                      <p className="text-xs text-slate-mid font-bold uppercase mb-1">Issue Overview</p>
                      <Link href={`/dashboard/issues?id=${escalation.issueId}`} className="text-sm font-medium text-fir-green hover:underline line-clamp-2">
                        {escalation.issue.title}
                      </Link>
                      <p className="text-xs text-slate-mid mt-1.5">Escalated by {escalation.issue.reporter.name}</p>
                    </div>

                    {escalation.remarks && (
                      <div>
                        <p className="text-xs text-slate-mid font-bold uppercase mb-1">Remarks</p>
                        <p className="text-sm text-slate-dark italic">"{escalation.remarks}"</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 pl-2 pt-4 border-t border-slate-border/50">
                    {escalation.status === "ACTIVE" ? (
                      <button
                        onClick={() => updateStatus(escalation.id, "RESOLVED")}
                        className="w-full py-2 bg-white border border-green-200 text-green-700 hover:bg-green-50 rounded-lg text-sm font-bold transition-colors"
                      >
                        Mark as Resolved
                      </button>
                    ) : (
                      <button
                        onClick={() => updateStatus(escalation.id, "ACTIVE")}
                        className="w-full py-2 bg-white border border-orange-200 text-orange-700 hover:bg-orange-50 rounded-lg text-sm font-bold transition-colors"
                      >
                        Re-open Ticket
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
