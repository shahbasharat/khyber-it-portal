"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AlertCircle, Clock, CheckCircle, ArrowUpCircle, Plus, Loader2 } from "lucide-react";
import { Modal } from "@/app/components/Modal";
import { useForm } from "react-hook-form";

type Priority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

interface IssueFormData {
  title: string;
  description: string;
  priority: Priority;
}

interface Issue {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "ESCALATED";
  createdAt: string;
  reporter: { name: string };
}

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<IssueFormData>({
    defaultValues: { priority: "LOW" },
  });

  const fetchIssues = async () => {
    try {
      const response = await api.get("/issues");
      setIssues(response.data);
    } catch (error) {
      console.error("Failed to fetch issues", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

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

      <div className="grid grid-cols-1 gap-4">
        {issues.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-border text-center">
            <p className="text-slate-mid">No active issues found. All systems operational!</p>
          </div>
        ) : (
          issues.map((issue) => (
            <div key={issue.id} className="bg-white p-6 rounded-xl shadow-base border border-slate-border/50 hover:border-fir-green/30 transition-all group">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getPriorityColor(issue.priority)}`}>
                      {issue.priority}
                    </span>
                    <h3 className="text-lg font-bold text-slate-dark group-hover:text-fir-green transition-colors">
                      {issue.title}
                    </h3>
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
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-cream rounded-full border border-slate-border/50">
                    {getStatusIcon(issue.status)}
                    <span className="text-xs font-bold text-slate-dark uppercase">{issue.status.replace("_", " ")}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

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
    </div>
  );
}
