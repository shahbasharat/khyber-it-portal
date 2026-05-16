"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";

interface EscalateFormData {
  escalatedTo: string;
  contactDetails: string;
  remarks: string;
}

export default function EscalateIssuePage() {
  const params = useParams();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<EscalateFormData>();

  const onSubmit = async (data: EscalateFormData) => {
    setIsSubmitting(true);
    try {
      await api.post(`/issues/${params.id}/escalate`, data);
      router.push(`/dashboard/issues/${params.id}`);
    } catch (error) {
      console.error("Failed to escalate issue", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <Link href={`/dashboard/issues/${params.id}`} className="flex items-center gap-2 text-slate-mid hover:text-fir-green w-fit">
        <ArrowLeft size={16} /> Back to Issue
      </Link>

      <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-border/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
            <AlertTriangle className="text-orange-600" size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display text-slate-dark">Escalate Issue</h1>
            <p className="text-slate-mid text-sm">Assign this issue to an external vendor or specialized team.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-slate-dark">Vendor / External Team Name <span className="text-color-error">*</span></label>
            <input 
              {...register("escalatedTo", { required: "Vendor name is required" })}
              placeholder="e.g., Oracle Support, Cisco TAC"
              className="p-3 bg-cream border border-slate-border/50 rounded-xl focus:ring-2 focus:ring-fir-green outline-none"
            />
            {errors.escalatedTo && <span className="text-xs text-color-error">{errors.escalatedTo.message}</span>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-slate-dark">Contact Details</label>
            <input 
              {...register("contactDetails")}
              placeholder="e.g., Ticket #12345 or +91 9876543210"
              className="p-3 bg-cream border border-slate-border/50 rounded-xl focus:ring-2 focus:ring-fir-green outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-slate-dark">Escalation Remarks</label>
            <textarea 
              {...register("remarks")}
              rows={4}
              placeholder="Why is this being escalated? Any instructions for the manager?"
              className="p-3 bg-cream border border-slate-border/50 rounded-xl focus:ring-2 focus:ring-fir-green outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Link 
              href={`/dashboard/issues/${params.id}`}
              className="px-6 py-3 rounded-xl font-bold text-slate-dark bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </Link>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-orange-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "Confirm Escalation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
