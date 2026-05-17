"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AlertCircle, Clock, CheckCircle, ArrowUpCircle, Plus, Loader2, User, FileText, Send, PhoneCall } from "lucide-react";
import { Modal } from "@/app/components/Modal";
import { useForm } from "react-hook-form";

type Priority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

interface IssueFormData {
  title: string;
  description: string;
  priority: Priority;
  department: string;
}

interface Issue {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "ESCALATED";
  department: string;
  createdAt: string;
  reporter: { name: string };
  assignee?: { name: string } | null;
}

interface IssueNote {
  id: string;
  content: string;
  createdAt: string;
  author: {
    name: string;
    role: string;
  };
}

interface EscalationDetail {
  id: string;
  escalatedTo: string;
  contactDetails: string | null;
  remarks: string | null;
  status: string;
}

interface DetailedIssue extends Issue {
  notes: IssueNote[];
  escalation: EscalationDetail | null;
}

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Issue Detail States
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<DetailedIssue | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [newStatus, setNewStatus] = useState<"OPEN" | "IN_PROGRESS" | "RESOLVED" | "ESCALATED">("OPEN");
  const [resolutionNote, setResolutionNote] = useState("");
  const [escalatedTo, setEscalatedTo] = useState("");
  const [contactDetails, setContactDetails] = useState("");
  const [escalationRemarks, setEscalationRemarks] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);

  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    department: ""
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<IssueFormData>({
    defaultValues: { priority: "LOW", department: "Other" },
  });

  const fetchIssues = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append("status", filters.status);
      if (filters.priority) queryParams.append("priority", filters.priority);
      if (filters.department) queryParams.append("department", filters.department);

      const response = await api.get(`/issues?${queryParams.toString()}`);
      setIssues(response.data);
    } catch (error) {
      console.error("Failed to fetch issues", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchIssueDetail = async (id: string) => {
    setLoadingDetail(true);
    try {
      const response = await api.get(`/issues/${id}`);
      setSelectedIssue(response.data);
      setNewStatus(response.data.status);
      // Reset inputs
      setResolutionNote("");
      setEscalatedTo(response.data.escalation?.escalatedTo || "");
      setContactDetails(response.data.escalation?.contactDetails || "");
      setEscalationRemarks(response.data.escalation?.remarks || "");
    } catch (error) {
      console.error("Failed to fetch issue details", error);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [filters]);

  useEffect(() => {
    if (selectedIssueId) {
      fetchIssueDetail(selectedIssueId);
    } else {
      setSelectedIssue(null);
    }
  }, [selectedIssueId]);

  const onSubmit = async (data: IssueFormData) => {
    setIsSubmitting(true);
    try {
      await api.post("/issues", data);
      setIsModalOpen(false);
      reset();
      fetchIssues();
    } catch (error) {
      console.error("Failed to create issue", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedIssue) return;
    setIsSaving(true);
    try {
      if (newStatus === "ESCALATED") {
        if (!escalatedTo) {
          alert("Please enter who the issue is escalated to.");
          setIsSaving(false);
          return;
        }
        await api.post(`/issues/${selectedIssue.id}/escalate`, {
          escalatedTo,
          contactDetails,
          remarks: escalationRemarks
        });
      } else {
        await api.patch(`/issues/${selectedIssue.id}`, {
          status: newStatus,
          resolutionNote: newStatus === "RESOLVED" ? resolutionNote : undefined
        });
      }
      
      // Refresh
      await fetchIssueDetail(selectedIssue.id);
      await fetchIssues();
    } catch (error) {
      console.error("Failed to update status", error);
      alert("Failed to update status.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssueId || !newNoteContent.trim()) return;
    setIsAddingNote(true);
    try {
      await api.post(`/issues/${selectedIssueId}/notes`, {
        content: newNoteContent
      });
      setNewNoteContent("");
      await fetchIssueDetail(selectedIssueId);
    } catch (error) {
      console.error("Failed to add note", error);
      alert("Failed to add note.");
    } finally {
      setIsAddingNote(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "CRITICAL": return "text-color-error bg-red-50 border-red-100";
      case "HIGH": return "text-orange-600 bg-orange-50 border-orange-100";
      case "MEDIUM": return "text-blue-600 bg-blue-50 border-blue-100";
      default: return "text-slate-mid bg-slate-50 border-slate-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "RESOLVED": return <CheckCircle className="text-color-success" size={18} />;
      case "IN_PROGRESS": return <Clock className="text-antique-gold" size={18} />;
      case "ESCALATED": return <ArrowUpCircle className="text-orange-600" size={18} />;
      default: return <AlertCircle className="text-slate-mid" size={18} />;
    }
  };

  if (loading) {
    return <div className="animate-pulse flex flex-col gap-4">
      {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white rounded-xl" />)}
    </div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-dark font-display">Issues Tracker</h2>
          <p className="text-slate-mid">Manage and track IT incidents across the resort.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-fir-green text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-fir-green/90 transition-all shadow-sm"
        >
          <Plus size={20} />
          New Issue
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-border/50 shadow-sm flex flex-wrap gap-4 items-center">
        <span className="text-xs font-bold text-slate-mid uppercase tracking-widest mr-2">Filter By:</span>
        <select 
          className="p-2 bg-cream border border-slate-border/50 rounded-lg text-sm outline-none focus:ring-1 focus:ring-fir-green"
          value={filters.status}
          onChange={(e) => setFilters({...filters, status: e.target.value})}
        >
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="ESCALATED">Escalated</option>
        </select>
        <select 
          className="p-2 bg-cream border border-slate-border/50 rounded-lg text-sm outline-none focus:ring-1 focus:ring-fir-green"
          value={filters.priority}
          onChange={(e) => setFilters({...filters, priority: e.target.value})}
        >
          <option value="">All Priorities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <select 
          className="p-2 bg-cream border border-slate-border/50 rounded-lg text-sm outline-none focus:ring-1 focus:ring-fir-green"
          value={filters.department}
          onChange={(e) => setFilters({...filters, department: e.target.value})}
        >
          <option value="">All Departments</option>
          {["Front Desk", "Guest Room", "Restaurant", "Spa", "Server Room", "Conference Room", "Staff Area", "Other"].map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
        {(filters.status || filters.priority || filters.department) && (
          <button 
            onClick={() => setFilters({ status: "", priority: "", department: "" })}
            className="text-xs font-bold text-color-error hover:underline"
          >
            Clear Filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {issues.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-border text-center">
            <p className="text-slate-mid">No active issues found. All systems operational!</p>
          </div>
        ) : (
          issues.map((issue) => (
            <div 
              key={issue.id} 
              onClick={() => setSelectedIssueId(issue.id)}
              className="bg-white p-6 rounded-xl shadow-base border border-slate-border/50 hover:border-fir-green/30 transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getPriorityColor(issue.priority)}`}>
                      {issue.priority}
                    </span>
                    <h3 className="text-lg font-bold text-slate-dark group-hover:text-fir-green transition-colors">
                      {issue.title}
                    </h3>
                    <span className="text-[10px] font-bold text-slate-mid bg-slate-100 px-2 py-0.5 rounded uppercase">
                      {issue.department}
                    </span>
                  </div>
                  <p className="text-slate-mid text-sm mb-4 line-clamp-2">{issue.description}</p>
                  <div className="flex items-center gap-6 text-xs text-slate-mid">
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {new Date(issue.createdAt).toLocaleDateString()}
                    </span>
                    <span className="font-medium">Reporter: {issue.reporter.name}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-cream rounded-full border border-slate-border/50 hover:bg-slate-100 transition-colors">
                    {getStatusIcon(issue.status)}
                    <span className="text-xs font-bold text-slate-dark uppercase">{issue.status.replace("_", " ")}</span>
                  </div>
                  <span className="text-[10px] text-fir-green font-bold opacity-0 group-hover:opacity-100 transition-opacity">Click to Manage →</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE ISSUE MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Report New IT Issue">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-slate-dark">Title</label>
            <input 
              {...register("title", { required: "Title is required", minLength: { value: 3, message: "Title must be at least 3 characters" } })}
              placeholder="e.g., Wi-Fi down in Wing B"
              className="p-3 bg-cream border border-slate-border/50 rounded-xl focus:ring-2 focus:ring-fir-green outline-none transition-all"
            />
            {errors.title && <span className="text-xs text-color-error">{errors.title.message}</span>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-slate-dark">Description</label>
            <textarea 
              {...register("description", { required: "Description is required", minLength: { value: 5, message: "Description must be at least 5 characters" } })}
              rows={3}
              placeholder="Describe the problem and location..."
              className="p-3 bg-cream border border-slate-border/50 rounded-xl focus:ring-2 focus:ring-fir-green outline-none transition-all resize-none"
            />
            {errors.description && <span className="text-xs text-color-error">{errors.description.message}</span>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-slate-dark">Department / Location</label>
            <select 
              {...register("department")}
              className="p-3 bg-cream border border-slate-border/50 rounded-xl focus:ring-2 focus:ring-fir-green outline-none transition-all"
            >
              {["Front Desk", "Guest Room", "Restaurant", "Spa", "Server Room", "Conference Room", "Staff Area", "Other"].map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-slate-dark">Priority</label>
            <select 
              {...register("priority")}
              className="p-3 bg-cream border border-slate-border/50 rounded-xl focus:ring-2 focus:ring-fir-green outline-none transition-all"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="mt-4 bg-fir-green text-white p-3 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-fir-green/90 transition-all disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "Submit Issue"}
          </button>
        </form>
      </Modal>

      {/* ISSUE DETAIL & LIFECYCLE MODAL */}
      <Modal 
        isOpen={!!selectedIssueId} 
        onClose={() => setSelectedIssueId(null)} 
        title={selectedIssue ? `Incident KHY-${selectedIssue.id.substring(0,4).toUpperCase()}` : "Loading Details..."}
      >
        {loadingDetail || !selectedIssue ? (
          <div className="flex justify-center items-center py-12 text-slate-mid">
            <Loader2 className="animate-spin mr-2" /> Loading incident history...
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            
            {/* Header / Info Section */}
            <div className="bg-cream p-4 rounded-xl border border-slate-border/50 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getPriorityColor(selectedIssue.priority)}`}>
                  {selectedIssue.priority} Priority
                </span>
                <span className="text-[10px] font-bold text-slate-mid bg-slate-200 px-2 py-0.5 rounded uppercase">
                  {selectedIssue.department}
                </span>
              </div>
              <h4 className="text-lg font-bold text-slate-dark">{selectedIssue.title}</h4>
              <p className="text-slate-mid text-sm">{selectedIssue.description}</p>
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-mid mt-2 border-t border-slate-border/30 pt-2">
                <span><strong>Reported:</strong> {new Date(selectedIssue.createdAt).toLocaleString()}</span>
                <span><strong>Reporter:</strong> {selectedIssue.reporter.name}</span>
                {selectedIssue.assignee && <span><strong>Assignee:</strong> {selectedIssue.assignee.name}</span>}
              </div>
            </div>

            {/* Lifecycle Status Modifier Section */}
            <div className="border border-slate-border/50 rounded-xl p-4 flex flex-col gap-4">
              <h5 className="font-bold text-slate-dark text-sm border-b border-slate-border/30 pb-2">Update Incident Status</h5>
              
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-mid uppercase flex justify-between items-center">
                    <span>Incident Status Workflow</span>
                    <span className="text-[10px] text-fir-green font-bold normal-case">
                      Current State: {selectedIssue.status.replace("_", " ")}
                    </span>
                  </label>
                  
                  {/* Beautiful visual helpers based on current status */}
                  {selectedIssue.status === "RESOLVED" && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-semibold mb-2 flex items-center gap-2">
                      <CheckCircle size={16} className="text-emerald-600 shrink-0" />
                      This incident is currently marked as RESOLVED & CLOSED.
                    </div>
                  )}
                  {selectedIssue.status === "ESCALATED" && (
                    <div className="bg-red-50 border border-red-100 text-red-800 p-3 rounded-xl text-xs font-semibold mb-2 flex items-center gap-2">
                      <ArrowUpCircle size={16} className="text-red-500 shrink-0" />
                      This incident is currently ESCALATED to vendor: {escalatedTo || "Specialist"}
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewStatus("OPEN")}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                        newStatus === "OPEN"
                          ? "bg-slate-100 border-slate-400 text-slate-800 shadow-sm font-extrabold scale-102"
                          : "bg-white border-slate-border/50 text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      <AlertCircle size={14} className={newStatus === "OPEN" ? "text-slate-700" : "text-slate-400"} />
                      Open
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewStatus("IN_PROGRESS")}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                        newStatus === "IN_PROGRESS"
                          ? "bg-amber-50 border-antique-gold text-amber-900 shadow-sm font-extrabold scale-102"
                          : "bg-white border-slate-border/50 text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      <Clock size={14} className={newStatus === "IN_PROGRESS" ? "text-antique-gold" : "text-slate-400"} />
                      In Progress
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewStatus("RESOLVED")}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                        newStatus === "RESOLVED"
                          ? "bg-green-50/70 border-green-600 text-green-900 shadow-sm font-extrabold scale-102"
                          : "bg-white border-slate-border/50 text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      <CheckCircle size={14} className={newStatus === "RESOLVED" ? "text-green-600" : "text-slate-400"} />
                      Resolved
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewStatus("ESCALATED")}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                        newStatus === "ESCALATED"
                          ? "bg-red-50 border-red-500 text-red-900 shadow-sm font-extrabold scale-102"
                          : "bg-white border-slate-border/50 text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      <ArrowUpCircle size={14} className={newStatus === "ESCALATED" ? "text-red-500" : "text-slate-400"} />
                      Escalated
                    </button>
                  </div>

                  {/* Active helper instructions */}
                  <div className="mt-1 text-[11px] font-semibold text-slate-mid italic">
                    {newStatus === "OPEN" && "👉 Re-opens the incident queue for incoming IT shifts."}
                    {newStatus === "IN_PROGRESS" && "👉 Sets the incident to In Progress (Active Troubleshooting)."}
                    {newStatus === "RESOLVED" && "👉 Solved! Enter resolution details below to complete the report."}
                    {newStatus === "ESCALATED" && "👉 Escalates incident to third-party vendor or resort technician."}
                  </div>
                </div>

                {/* Conditional Fields based on newStatus selection */}
                {newStatus === "RESOLVED" && (
                  <div className="flex flex-col gap-1.5 animate-fadeIn">
                    <label className="text-xs font-bold text-slate-mid uppercase">Resolution Provided (Required for Handover Report):</label>
                    <textarea
                      value={resolutionNote}
                      onChange={(e) => setResolutionNote(e.target.value)}
                      rows={2}
                      placeholder="Explain how the issue was resolved (e.g., rebooted router, replaced ethernet cable)..."
                      className="p-2.5 bg-cream border border-slate-border/50 rounded-xl text-xs outline-none focus:ring-2 focus:ring-fir-green resize-none"
                    />
                  </div>
                )}

                {newStatus === "ESCALATED" && (
                  <div className="flex flex-col gap-3 animate-fadeIn">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-mid uppercase">Escalated To (Vendor/Specialist Name):</label>
                      <input
                        type="text"
                        value={escalatedTo}
                        onChange={(e) => setEscalatedTo(e.target.value)}
                        placeholder="e.g., Airtel, Keeline System, OTIS Elevator"
                        className="p-2.5 bg-cream border border-slate-border/50 rounded-xl text-xs outline-none focus:ring-2 focus:ring-fir-green"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-mid uppercase">Vendor ETA / Contact Details:</label>
                      <input
                        type="text"
                        value={contactDetails}
                        onChange={(e) => setContactDetails(e.target.value)}
                        placeholder="e.g., ETA 2 hours / Call center Ref #99831"
                        className="p-2.5 bg-cream border border-slate-border/50 rounded-xl text-xs outline-none focus:ring-2 focus:ring-fir-green"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-mid uppercase">Escalation Remarks:</label>
                      <textarea
                        value={escalationRemarks}
                        onChange={(e) => setEscalationRemarks(e.target.value)}
                        rows={2}
                        placeholder="Awaiting spares, engineer dispatched..."
                        className="p-2.5 bg-cream border border-slate-border/50 rounded-xl text-xs outline-none focus:ring-2 focus:ring-fir-green resize-none"
                      />
                    </div>
                  </div>
                )}
                
                <button
                  onClick={handleUpdateStatus}
                  disabled={isSaving}
                  className="mt-2 bg-fir-green text-white py-2 px-4 rounded-xl text-xs font-bold flex justify-center items-center gap-2 hover:bg-fir-green/90 transition-all disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle size={14} />}
                  Save Status Update
                </button>
              </div>
            </div>

            {/* Progress Notes / Comments Section */}
            <div className="flex flex-col gap-4">
              <h5 className="font-bold text-slate-dark text-sm border-b border-slate-border/30 pb-2 flex items-center gap-2">
                <FileText size={16} className="text-fir-green" /> Progress Notes & History
              </h5>

              {/* List of notes */}
              <div className="flex flex-col gap-3 max-h-48 overflow-y-auto pr-1">
                {selectedIssue.notes.length === 0 ? (
                  <p className="text-xs text-slate-mid italic py-2">No progress notes added to this incident yet.</p>
                ) : (
                  selectedIssue.notes.map((note) => (
                    <div key={note.id} className="bg-cream/40 p-2.5 rounded-lg border border-slate-border/30 text-xs">
                      <div className="flex justify-between items-center text-[10px] text-slate-mid mb-1 font-semibold">
                        <span className="flex items-center gap-1">
                          <User size={10} />
                          {note.author.name} ({note.author.role})
                        </span>
                        <span>{new Date(note.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-dark leading-normal whitespace-pre-line">{note.content}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Progress Note Form */}
              <form onSubmit={handleAddNote} className="flex gap-2">
                <input
                  type="text"
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Type a quick progress update or remark..."
                  className="flex-1 p-2.5 bg-cream border border-slate-border/50 rounded-xl text-xs outline-none focus:ring-2 focus:ring-fir-green"
                />
                <button
                  type="submit"
                  disabled={isAddingNote || !newNoteContent.trim()}
                  className="bg-antique-gold text-white px-4 rounded-xl flex items-center justify-center hover:bg-antique-gold/90 transition-all disabled:opacity-50"
                >
                  {isAddingNote ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                </button>
              </form>
            </div>

          </div>
        )}
      </Modal>
    </div>
  );
}
