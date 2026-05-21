"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Modal } from "@/app/components/Modal";
import { useForm } from "react-hook-form";
import { Wifi, Plus, Loader2, Copy, Check, Smartphone, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/lib/toast";

interface WifiCode {
  id: string;
  fromDate: string;
  toDate: string;
  accessCode: string;
  deviceLimit: number;
  plan: string;
  issuedTo: string;
  createdAt: string;
}

interface WifiFormData {
  accessCode: string;
  issuedTo: string;
  plan: string;
  deviceLimit: number;
  fromDate: string;
  toDate: string;
}

export default function GuestWifiPage() {
  const { success, error } = useToast();
  const [codes, setCodes] = useState<WifiCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const today = format(new Date(), "yyyy-MM-dd");

  const { register, handleSubmit, reset, formState: { errors } } = useForm<WifiFormData>({
    defaultValues: {
      fromDate: today,
      toDate: today,
      deviceLimit: 2,
      plan: "Basic",
    }
  });

  const fetchCodes = async () => {
    try {
      const res = await api.get("/guest-wifi");
      setCodes(res.data);
    } catch {
      error("Failed to load Wi-Fi codes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCodes();
  }, []);

  const onSubmit = async (data: WifiFormData) => {
    setIsSubmitting(true);
    try {
      await api.post("/guest-wifi", {
        ...data,
        deviceLimit: Number(data.deviceLimit),
      });
      success("Wi-Fi voucher issued", `Code ${data.accessCode} issued to ${data.issuedTo}`);
      setIsModalOpen(false);
      reset({ fromDate: today, toDate: today, deviceLimit: 2, plan: "Basic" });
      fetchCodes();
    } catch (err: any) {
      error("Failed to issue voucher", err.response?.data?.error || "Please try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    success("Copied!", `Access code ${code} copied to clipboard`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isActive = (code: WifiCode) => {
    const now = new Date();
    return new Date(code.fromDate) <= now && new Date(code.toDate) >= now;
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64 text-slate-mid gap-3">
      <Loader2 className="animate-spin text-fir-green" size={28} />
    </div>
  );

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-fir-green flex items-center gap-2">
            <Wifi size={28} /> Guest Wi-Fi Vouchers
          </h1>
          <p className="text-slate-mid mt-1 text-sm">Issue and manage guest internet access codes.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-fir-green text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-fir-green/90 transition-all shadow-sm font-bold text-sm w-max"
        >
          <Plus size={18} /> Issue New Voucher
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Issued", value: codes.length, color: "text-slate-dark" },
          { label: "Active Today", value: codes.filter(isActive).length, color: "text-emerald-600" },
          { label: "Total Devices", value: codes.reduce((s, c) => s + c.deviceLimit, 0), color: "text-blue-600" },
          { label: "Issued Today", value: codes.filter(c => format(new Date(c.createdAt), "yyyy-MM-dd") === today).length, color: "text-antique-gold" },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl border border-slate-border/50 p-4 shadow-sm">
            <p className="text-xs font-bold text-slate-mid uppercase tracking-wider">{stat.label}</p>
            <p className={`text-3xl font-extrabold font-display mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Voucher List */}
      <div className="bg-white rounded-2xl border border-slate-border/50 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-border/30 bg-cream/30">
          <h3 className="font-bold text-slate-dark">Recent Vouchers</h3>
        </div>
        {codes.length === 0 ? (
          <div className="p-12 text-center text-slate-mid">
            <Wifi size={40} className="mx-auto mb-3 opacity-20" />
            <p className="font-semibold">No vouchers issued yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-border/30">
            {codes.map((code) => (
              <div key={code.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-cream/20 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isActive(code) ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                    <Wifi size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-dark font-mono text-lg">{code.accessCode}</span>
                      <button
                        onClick={() => copyCode(code.accessCode, code.id)}
                        className="text-slate-mid hover:text-fir-green transition-colors p-1"
                        title="Copy code"
                      >
                        {copiedId === code.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      </button>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive(code) ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {isActive(code) ? "ACTIVE" : "EXPIRED"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-mid flex-wrap">
                      <span className="flex items-center gap-1"><User size={11} /> {code.issuedTo}</span>
                      <span className="flex items-center gap-1"><Smartphone size={11} /> {code.deviceLimit} devices</span>
                      <span className="flex items-center gap-1"><Calendar size={11} /> {format(new Date(code.fromDate), "dd MMM")} – {format(new Date(code.toDate), "dd MMM yyyy")}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-bold text-slate-mid bg-cream px-3 py-1 rounded-full border border-slate-border/40">{code.plan}</span>
                  <span className="text-[10px] text-slate-mid">{format(new Date(code.createdAt), "hh:mm a")}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Issue Voucher Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Issue Guest Wi-Fi Voucher">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div>
            <label className="block text-sm font-medium text-slate-dark mb-1">Access Code</label>
            <input
              {...register("accessCode", { required: "Access code is required" })}
              className="w-full px-3 py-2 rounded-lg border border-slate-border focus:ring-2 focus:ring-fir-green outline-none font-mono"
              placeholder="e.g. KHYBER2024"
            />
            {errors.accessCode && <p className="text-xs text-red-500 mt-1">{errors.accessCode.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-dark mb-1">Issued To (Guest / Room)</label>
            <input
              {...register("issuedTo", { required: "Required" })}
              className="w-full px-3 py-2 rounded-lg border border-slate-border focus:ring-2 focus:ring-fir-green outline-none"
              placeholder="e.g. Room 204 - Mr. Ahmed"
            />
            {errors.issuedTo && <p className="text-xs text-red-500 mt-1">{errors.issuedTo.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-dark mb-1">Plan</label>
              <select
                {...register("plan", { required: "Required" })}
                className="w-full px-3 py-2 rounded-lg border border-slate-border focus:ring-2 focus:ring-fir-green outline-none"
              >
                <option value="Basic">Basic (1 Mbps)</option>
                <option value="Standard">Standard (5 Mbps)</option>
                <option value="Premium">Premium (10 Mbps)</option>
                <option value="VIP">VIP (Unlimited)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-dark mb-1">Device Limit</label>
              <input
                type="number"
                min={1}
                max={10}
                {...register("deviceLimit", { required: "Required", min: 1, max: 10 })}
                className="w-full px-3 py-2 rounded-lg border border-slate-border focus:ring-2 focus:ring-fir-green outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-dark mb-1">Valid From</label>
              <input
                type="date"
                {...register("fromDate", { required: "Required" })}
                className="w-full px-3 py-2 rounded-lg border border-slate-border focus:ring-2 focus:ring-fir-green outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-dark mb-1">Valid To</label>
              <input
                type="date"
                {...register("toDate", { required: "Required" })}
                className="w-full px-3 py-2 rounded-lg border border-slate-border focus:ring-2 focus:ring-fir-green outline-none"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-mid hover:bg-slate-50 rounded-lg transition-colors font-medium">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-fir-green text-white rounded-lg font-bold hover:bg-fir-green/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Wifi size={16} />}
              Issue Voucher
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
