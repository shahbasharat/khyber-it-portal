"use client";

import React, { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { CheckSquare, Square, ClipboardList, Loader2, Wifi, Plus } from "lucide-react";
import { Modal } from "@/app/components/Modal";
import { useForm } from "react-hook-form";
import debounce from "lodash/debounce";
import { useAuthStore } from "@/store/authStore";

interface ChecklistItem {
  id: string;
  title: string;
  category: string;
  completed: boolean;
  remarks: string;
  completedBy: string | null;
  completedAt: string | null;
}

interface WifiCode {
  id: string;
  fromDate: string;
  toDate: string;
  accessCode: string;
  deviceLimit: number;
  plan: string;
  issuedTo: string;
}

interface WifiFormData {
  fromDate: string;
  toDate: string;
  accessCode: string;
  deviceLimit: number;
  plan: string;
  issuedTo: string;
}

export default function ChecklistPage() {
  const user = useAuthStore(state => state.user);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [wifiCodes, setWifiCodes] = useState<WifiCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [isWifiModalOpen, setIsWifiModalOpen] = useState(false);
  const [isSubmittingWifi, setIsSubmittingWifi] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<WifiFormData>();

  const fetchChecklist = async () => {
    try {
      const response = await api.get("/checklist/today");
      setItems(response.data);
    } catch (error) {
      console.error("Failed to fetch checklist", error);
    }
  };

  const fetchWifiCodes = async () => {
    try {
      const response = await api.get("/guest-wifi");
      setWifiCodes(response.data);
    } catch (error) {
      console.error("Failed to fetch wifi codes", error);
    }
  };

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchChecklist(), fetchWifiCodes()]);
      setLoading(false);
    };
    init();
  }, []);

  const handleToggle = async (itemId: string, currentStatus: boolean) => {
    setToggling(itemId);
    try {
      await api.post(`/checklist/update/${itemId}`, { completed: !currentStatus });
      fetchChecklist();
    } catch (error) {
      console.error("Failed to toggle item", error);
    } finally {
      setToggling(null);
    }
  };

  const debouncedUpdateRemarks = useCallback(
    debounce(async (itemId: string, remarks: string) => {
      try {
        await api.post(`/checklist/update/${itemId}`, { remarks });
      } catch (error) {
        console.error("Failed to update remarks", error);
      }
    }, 1000),
    []
  );

  const handleRemarksChange = (itemId: string, val: string) => {
    setItems(prev => prev.map(item => item.id === itemId ? { ...item, remarks: val } : item));
    debouncedUpdateRemarks(itemId, val);
  };

  const onWifiSubmit = async (data: WifiFormData) => {
    setIsSubmittingWifi(true);
    try {
      await api.post("/guest-wifi", { ...data, deviceLimit: Number(data.deviceLimit) });
      setIsWifiModalOpen(false);
      reset();
      fetchWifiCodes();
    } catch (error) {
      console.error("Failed to save wifi code", error);
    } finally {
      setIsSubmittingWifi(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-slate-mid">
      <Loader2 className="animate-spin mr-2" /> Loading Operational Data...
    </div>;
  }

  const completedCount = items.filter(i => i.completed).length;
  const progressPercent = items.length > 0 ? (completedCount / items.length) * 100 : 0;
  const categories = Array.from(new Set(items.map(i => i.category)));

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      {/* Header & Progress */}
      <div className="bg-white p-6 rounded-2xl shadow-base border border-slate-border/50 sticky top-16 z-20">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-dark font-display">Daily Operations Checklist</h2>
            <p className="text-sm text-slate-mid">Mandatory checks for {new Date().toLocaleDateString()}</p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-bold text-fir-green font-display">{completedCount}/{items.length}</span>
            <p className="text-xs text-slate-mid font-medium uppercase tracking-wider">Completed</p>
          </div>
        </div>
        <div className="w-full bg-cream rounded-full h-3">
          <div 
            className="bg-fir-green h-3 rounded-full transition-all duration-500 ease-out shadow-sm" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Desktop Checklist Table (visible on md screens and larger) */}
      <div className="hidden md:block bg-white rounded-2xl shadow-base border border-slate-border/50 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-fir-green text-white">
              <th className="p-4 text-sm font-bold uppercase tracking-wider w-12 text-center">Done</th>
              <th className="p-4 text-sm font-bold uppercase tracking-wider w-1/3">Description</th>
              <th className="p-4 text-sm font-bold uppercase tracking-wider">Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-border/30">
            {categories.map(category => (
              <React.Fragment key={category}>
                <tr className="bg-cream/50">
                  <td colSpan={3} className="p-2 px-4 text-[10px] font-black text-slate-mid uppercase tracking-[0.2em]">
                    {category}
                  </td>
                </tr>
                {items.filter(i => i.category === category).map(item => (
                <tr key={item.id} className="hover:bg-cream/20 transition-colors">
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => !toggling && user?.role !== "VIEWER" && handleToggle(item.id, item.completed)}
                      disabled={toggling === item.id || user?.role === "VIEWER"}
                      className={`inline-flex items-center justify-center transition-transform active:scale-90 ${user?.role === "VIEWER" ? "cursor-not-allowed opacity-80" : ""}`}
                    >
                      {toggling === item.id ? (
                        <Loader2 size={24} className="animate-spin text-slate-mid" />
                      ) : item.completed ? (
                        <CheckSquare size={24} className="text-fir-green" />
                      ) : (
                        <Square size={24} className={`text-slate-mid transition-colors ${user?.role !== "VIEWER" ? "hover:text-fir-green" : ""}`} />
                      )}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className={`font-semibold text-slate-dark ${item.completed ? "line-through opacity-50" : ""}`}>
                        {item.title}
                      </span>
                      {item.completed && item.completedBy && (
                        <span className="text-[10px] text-slate-mid">
                          Checked by {item.completedBy.split(" ")[0]} at {new Date(item.completedAt!).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <input 
                      type="text"
                      value={item.remarks}
                      onChange={(e) => handleRemarksChange(item.id, e.target.value)}
                      disabled={user?.role === "VIEWER"}
                      placeholder={user?.role === "VIEWER" ? "No remarks entered" : "Enter remarks..."}
                      className={`w-full p-2 bg-transparent border-b border-dashed border-slate-border/50 focus:border-fir-green focus:ring-0 outline-none text-sm text-slate-dark transition-all ${user?.role === "VIEWER" ? "cursor-not-allowed text-slate-mid/70" : ""}`}
                    />
                  </td>
                </tr>
              ))}
            </React.Fragment>
          ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Checklist Card List (visible on small mobile devices only) */}
      <div className="md:hidden flex flex-col gap-6">
        {categories.map(category => (
          <div key={category} className="bg-white rounded-2xl shadow-base border border-slate-border/50 overflow-hidden">
            {/* Category Header */}
            <div className="bg-cream/70 px-4 py-2.5 border-b border-slate-border/30">
              <span className="text-[10px] font-black text-slate-mid uppercase tracking-[0.2em]">
                {category}
              </span>
            </div>
            
            {/* Cards List */}
            <div className="divide-y divide-slate-border/20">
              {items.filter(i => i.category === category).map(item => (
                <div key={item.id} className="p-4 flex flex-col gap-3 hover:bg-cream/10 transition-colors">
                  <div className="flex items-start gap-3">
                    {/* Checkbox trigger */}
                    <button 
                      onClick={() => !toggling && user?.role !== "VIEWER" && handleToggle(item.id, item.completed)}
                      disabled={toggling === item.id || user?.role === "VIEWER"}
                      className={`inline-flex items-center justify-center transition-transform active:scale-90 mt-0.5 shrink-0 ${user?.role === "VIEWER" ? "cursor-not-allowed opacity-80" : ""}`}
                    >
                      {toggling === item.id ? (
                        <Loader2 size={24} className="animate-spin text-slate-mid" />
                      ) : item.completed ? (
                        <CheckSquare size={24} className="text-fir-green" />
                      ) : (
                        <Square size={24} className={`text-slate-mid transition-colors ${user?.role !== "VIEWER" ? "hover:text-fir-green" : ""}`} />
                      )}
                    </button>
                    
                    {/* Title & Metadata */}
                    <div className="flex flex-col flex-1">
                      <span className={`font-semibold text-slate-dark text-sm leading-snug ${item.completed ? "line-through opacity-50" : ""}`}>
                        {item.title}
                      </span>
                      {item.completed && item.completedBy && (
                        <span className="text-[10px] text-slate-mid mt-1 font-medium">
                          ✓ Checked by {item.completedBy.split(" ")[0]} at {new Date(item.completedAt!).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Remarks input field under the title */}
                  <div className="pl-9 w-full">
                    <input 
                      type="text"
                      value={item.remarks}
                      onChange={(e) => handleRemarksChange(item.id, e.target.value)}
                      disabled={user?.role === "VIEWER"}
                      placeholder={user?.role === "VIEWER" ? "No remarks entered" : "Add operational remarks..."}
                      className={`w-full p-2 bg-cream/35 border-b border-dashed border-slate-border/50 focus:border-fir-green focus:ring-0 outline-none text-xs text-slate-dark transition-all rounded-lg ${user?.role === "VIEWER" ? "cursor-not-allowed text-slate-mid/70 bg-transparent border-none" : ""}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Guest Wi-Fi Codes Section */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-dark font-display flex items-center gap-2">
            <Wifi size={24} className="text-fir-green" /> Today's Access codes (Guest Wi-Fi)
          </h3>
          {user?.role !== "VIEWER" && (
            <button 
              onClick={() => setIsWifiModalOpen(true)}
              className="text-xs font-bold text-fir-green hover:underline flex items-center gap-1"
            >
              <Plus size={14} /> Add Code
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-base border border-slate-border/50 overflow-x-auto">
          <table className="w-full min-w-[700px] text-left border-collapse">
            <thead>
              <tr className="bg-slate-dark text-white text-xs">
                <th className="p-3 font-bold uppercase tracking-wider">From Date</th>
                <th className="p-3 font-bold uppercase tracking-wider">To Date</th>
                <th className="p-3 font-bold uppercase tracking-wider">Access Code</th>
                <th className="p-3 font-bold uppercase tracking-wider">Device Limit</th>
                <th className="p-3 font-bold uppercase tracking-wider">Plan</th>
                <th className="p-3 font-bold uppercase tracking-wider">Issued To</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-border/30">
              {wifiCodes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-mid text-sm italic">No active access codes recorded.</td>
                </tr>
              ) : (
                wifiCodes.map((code) => (
                  <tr key={code.id} className="hover:bg-cream/20 transition-colors text-sm">
                    <td className="p-3 text-slate-dark">{new Date(code.fromDate).toLocaleDateString()}</td>
                    <td className="p-3 text-slate-dark">{new Date(code.toDate).toLocaleDateString()}</td>
                    <td className="p-3 font-mono font-bold text-fir-green">{code.accessCode}</td>
                    <td className="p-3 text-slate-dark">{code.deviceLimit}</td>
                    <td className="p-3 text-slate-dark">{code.plan}</td>
                    <td className="p-3 text-slate-mid font-medium">{code.issuedTo}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isWifiModalOpen} onClose={() => setIsWifiModalOpen(false)} title="Add Guest Wi-Fi Access Code">
        <form onSubmit={handleSubmit(onWifiSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-slate-dark">From Date</label>
              <input type="date" {...register("fromDate", { required: true })} className="p-3 bg-cream border border-slate-border/50 rounded-xl outline-none" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-slate-dark">To Date</label>
              <input type="date" {...register("toDate", { required: true })} className="p-3 bg-cream border border-slate-border/50 rounded-xl outline-none" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-slate-dark">Access Code</label>
            <input placeholder="e.g. KHY2024" {...register("accessCode", { required: true })} className="p-3 bg-cream border border-slate-border/50 rounded-xl outline-none font-mono" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-slate-dark">Device Limit</label>
              <input type="number" defaultValue={2} {...register("deviceLimit", { required: true })} className="p-3 bg-cream border border-slate-border/50 rounded-xl outline-none" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-slate-dark">Plan</label>
              <input placeholder="e.g. High Speed" {...register("plan", { required: true })} className="p-3 bg-cream border border-slate-border/50 rounded-xl outline-none" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-slate-dark">Issued To</label>
            <input placeholder="e.g. Guest Name or Dept" {...register("issuedTo", { required: true })} className="p-3 bg-cream border border-slate-border/50 rounded-xl outline-none" />
          </div>
          <button 
            type="submit" 
            disabled={isSubmittingWifi}
            className="mt-4 bg-fir-green text-white p-3 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-fir-green/90 transition-all disabled:opacity-50"
          >
            {isSubmittingWifi ? <Loader2 className="animate-spin" size={20} /> : "Save Access Code"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
