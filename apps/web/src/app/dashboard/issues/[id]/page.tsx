"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { ArrowLeft, Clock, CheckCircle, ArrowUpCircle, AlertCircle, MessageSquare, Send, Loader2 } from "lucide-react";
import Link from "next/link";
import { Modal } from "@/app/components/Modal";
import { useForm } from "react-hook-form";

export default function IssueDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [issue, setIssue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [noteContent, setNoteContent] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<{ resolutionNote: string }>();

  const fetchIssue = async () => {
    try {
      const response = await api.get(`/issues/${params.id}`);
      setIssue(response.data);
    } catch (error) {
      console.error("Failed to fetch issue", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssue();
  }, [params.id]);

  const handleAddNote = async () => {
    if (!noteContent.trim()) return;
    setIsSubmittingNote(true);
    try {
      await api.post(`/issues/${params.id}/notes`, { content: noteContent });
      setNoteContent("");
      fetchIssue();
    } catch (error) {
      console.error("Failed to add note", error);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleResolve = async (data: { resolutionNote: string }) => {
    try {
      await api.patch(`/issues/${params.id}`, { status: "RESOLVED", resolutionNote: data.resolutionNote });
      setIsResolveModalOpen(false);
      fetchIssue();
    } catch (error) {
      console.error("Failed to resolve issue", error);
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-fir-green" /></div>;
  if (!issue) return <div className="p-8 text-center text-slate-mid">Issue not found.</div>;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "CRITICAL": return "text-color-error bg-red-50 border-red-100";
      case "HIGH": return "text-orange-600 bg-orange-50 border-orange-100";
      case "MEDIUM": return "text-blue-600 bg-blue-50 border-blue-100";
      default: return "text-slate-mid bg-slate-50 border-slate-100";
    }
  };

  const isResolved = issue.status === "RESOLVED";
  const isEscalated = issue.status === "ESCALATED";

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <Link href="/dashboard/issues" className="flex items-center gap-2 text-slate-mid hover:text-fir-green w-fit">
        <ArrowLeft size={16} /> Back to Issues
      </Link>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-border/50">
        <div className="flex justify-between items-start gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getPriorityColor(issue.priority)}`}>
                {issue.priority}
              </span>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-dark rounded text-[10px] font-bold uppercase border border-slate-200">
                {issue.status.replace("_", " ")}
              </span>
            </div>
            <h1 className="text-2xl font-bold font-display text-slate-dark">{issue.title}</h1>
          </div>
          
          <div className="flex gap-2">
            {!isResolved && !isEscalated && (
              <>
                <Link href={`/dashboard/issues/${issue.id}/escalate`} className="bg-orange-100 text-orange-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-orange-200 transition-colors">
                  Escalate
                </Link>
                <button onClick={() => setIsResolveModalOpen(true)} className="bg-fir-green text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-fir-green/90 transition-colors">
                  Resolve
                </button>
              </>
            )}
          </div>
        </div>

        <p className="text-slate-dark mb-6 whitespace-pre-wrap">{issue.description}</p>

        <div className="flex items-center gap-6 text-sm text-slate-mid pb-4 border-b border-slate-border/50">
          <span className="flex items-center gap-1"><Clock size={16} /> {new Date(issue.createdAt).toLocaleString()}</span>
          <span>Reporter: <strong>{issue.reporter.name}</strong></span>
        </div>

        {/* Threaded Notes */}
        <div className="mt-6 flex flex-col gap-4">
          <h3 className="font-bold text-slate-dark flex items-center gap-2">
            <MessageSquare size={18} /> Progress Notes
          </h3>
          
          <div className="flex flex-col gap-3">
            {issue.notes.length === 0 ? (
              <p className="text-sm text-slate-mid italic">No notes added yet.</p>
            ) : (
              issue.notes.map((note: any) => (
                <div key={note.id} className="bg-cream p-4 rounded-lg border border-slate-border/50">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-sm text-fir-green">{note.author.name}</span>
                    <span className="text-xs text-slate-mid">{new Date(note.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-slate-dark whitespace-pre-wrap">{note.content}</p>
                </div>
              ))
            )}
          </div>

          {!isResolved && (
            <div className="mt-4 flex gap-2">
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Add a progress update..."
                className="flex-1 p-3 bg-cream border border-slate-border/50 rounded-lg text-sm focus:ring-2 focus:ring-fir-green outline-none resize-none"
                rows={2}
              />
              <button
                onClick={handleAddNote}
                disabled={isSubmittingNote || !noteContent.trim()}
                className="bg-antique-gold text-white px-4 rounded-lg font-bold hover:bg-antique-gold/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmittingNote ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
              </button>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={isResolveModalOpen} onClose={() => setIsResolveModalOpen(false)} title="Resolve Issue">
        <form onSubmit={handleSubmit(handleResolve)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-slate-dark">Resolution Note</label>
            <textarea 
              {...register("resolutionNote", { required: "Please provide details on how it was fixed." })}
              rows={4}
              placeholder="What steps were taken to resolve this?"
              className="p-3 bg-cream border border-slate-border/50 rounded-xl focus:ring-2 focus:ring-fir-green outline-none resize-none"
            />
            {errors.resolutionNote && <span className="text-xs text-color-error">{errors.resolutionNote.message}</span>}
          </div>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="mt-4 bg-fir-green text-white p-3 rounded-xl font-bold flex justify-center items-center gap-2"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "Mark as Resolved"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
