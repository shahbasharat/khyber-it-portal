"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ArrowLeft, Loader2, FileText } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";

interface ReportFormData {
  content: string;
}

export default function NewShiftReportPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ReportFormData>();

  const onSubmit = async (data: ReportFormData) => {
    setIsSubmitting(true);
    try {
      await api.post(`/reports`, data);
      router.push(`/dashboard/reports`);
    } catch (error) {
      console.error("Failed to submit shift report", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <Link href="/dashboard/reports" className="flex items-center gap-2 text-slate-mid hover:text-fir-green w-fit">
        <ArrowLeft size={16} /> Back to Reports
      </Link>

      <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-border/50">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-border/50">
          <div className="w-12 h-12 rounded-full bg-antique-gold/20 flex items-center justify-center">
            <FileText className="text-antique-gold" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display text-slate-dark">Shift Handover Report</h1>
            <p className="text-slate-mid text-sm">Submit your end-of-shift notes for the incoming team and management.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-slate-dark">Handover Notes <span className="text-color-error">*</span></label>
            <p className="text-xs text-slate-mid mb-2">Include a summary of major issues resolved, ongoing tasks, and any special instructions for the next shift.</p>
            <textarea 
              {...register("content", { required: "Report content is required", minLength: { value: 10, message: "Please provide a more detailed handover note." } })}
              rows={8}
              placeholder="1. Resolved Wi-Fi issue in Banquet Hall.&#10;2. Pending: Oracle PMS sync error (Escalated).&#10;3. VIP Guest in Room 402 requested additional router..."
              className="p-4 bg-cream border border-slate-border/50 rounded-xl focus:ring-2 focus:ring-fir-green outline-none resize-y text-slate-dark leading-relaxed"
            />
            {errors.content && <span className="text-xs text-color-error font-medium">{errors.content.message}</span>}
          </div>

          <div className="bg-fir-green-subtle p-4 rounded-xl border border-fir-green/20">
            <p className="text-sm text-fir-green font-medium">
              <strong>Note:</strong> Submitting this report will automatically notify the IT Manager and mark your active shift tasks as handed over.
            </p>
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <Link 
              href="/dashboard/reports"
              className="px-6 py-3 rounded-xl font-bold text-slate-dark bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </Link>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-fir-green text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-fir-green/90 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "Submit Handover Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
