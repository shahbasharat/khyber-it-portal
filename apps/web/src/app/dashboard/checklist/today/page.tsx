"use client";

import React, { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { CheckSquare, Square, ClipboardList, Loader2, Wifi, Plus, Search, Filter, Server, Shield, Cpu, Phone, CheckCircle2, XCircle, AlertCircle, Clock, ChevronDown } from "lucide-react";
import { Modal } from "@/app/components/Modal";
import { useForm } from "react-hook-form";
import debounce from "lodash/debounce";
import { useAuthStore } from "@/store/authStore";

interface ChecklistItem {
  id: string;
  title: string;
  category: string;
  description: string | null;
  completed: boolean;
  status: string;
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
  const [bulkUpdatingCategory, setBulkUpdatingCategory] = useState<string | null>(null);
  const [isWifiModalOpen, setIsWifiModalOpen] = useState(false);
  const [isSubmittingWifi, setIsSubmittingWifi] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

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

  const handleStatusChange = async (itemId: string, newStatus: string) => {
    if (user?.role === "VIEWER") return;

    const completed = newStatus === "WORKING";
    setItems(prev => prev.map(item => item.id === itemId ? { 
      ...item, 
      status: newStatus, 
      completed,
      completedBy: user?.name || "IT Engineer",
      completedAt: new Date().toISOString()
    } : item));

    setToggling(itemId);
    try {
      await api.post(`/checklist/update/${itemId}`, { status: newStatus, completed });
    } catch (error) {
      console.error("Failed to update item status", error);
      fetchChecklist();
    } finally {
      setToggling(null);
    }
  };

  const handleBulkUpdate = async (category: string, newStatus: string) => {
    if (user?.role === "VIEWER") return;

    setBulkUpdatingCategory(category);
    const completed = newStatus === "WORKING";

    setItems(prev => prev.map(item => item.category === category ? { 
      ...item, 
      status: newStatus, 
      completed,
      completedBy: user?.name || "IT Engineer",
      completedAt: new Date().toISOString()
    } : item));

    try {
      await api.post("/checklist/bulk-update", { category, status: newStatus });
    } catch (error) {
      console.error("Failed to bulk update category", error);
      fetchChecklist();
    } finally {
      setBulkUpdatingCategory(null);
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
    return (
      <div className="flex flex-col justify-center items-center h-64 text-slate-mid gap-3">
        <Loader2 className="animate-spin text-fir-green" size={36} />
        <span className="text-sm font-medium">Loading Khyber's Daily IT Flash...</span>
      </div>
    );
  }

  const completedCount = items.filter(i => i.status === "WORKING").length;
  const progressPercent = items.length > 0 ? (completedCount / items.length) * 100 : 0;
  const allCategories = ["All", ...Array.from(new Set(items.map(i => i.category)))];

  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.remarks && item.remarks.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes("wifi") || cat.includes("network")) return <Wifi size={18} className="text-fir-green" />;
    if (cat.includes("server") || cat.includes("system")) return <Server size={18} className="text-fir-green" />;
    if (cat.includes("firewall") || cat.includes("security")) return <Shield size={18} className="text-fir-green" />;
    if (cat.includes("hardware") || cat.includes("printer")) return <Cpu size={18} className="text-fir-green" />;
    if (cat.includes("communication") || cat.includes("epbax") || cat.includes("trunk")) return <Phone size={18} className="text-fir-green" />;
    return <ClipboardList size={18} className="text-fir-green" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "WORKING": return "bg-emerald-50 text-emerald-700 border-emerald-300 focus:ring-emerald-500";
      case "NOT_WORKING": return "bg-rose-50 text-rose-700 border-rose-300 focus:ring-rose-500";
      case "PARTIAL": return "bg-amber-50 text-amber-700 border-amber-300 focus:ring-amber-500";
      default: return "bg-slate-50 text-slate-600 border-slate-300 focus:ring-slate-400";
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto pb-16">
      <div className="bg-gradient-to-r from-slate-dark to-[#19433E] p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <ClipboardList size={250} />
        </div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full w-max text-xs font-medium backdrop-blur-sm">
              <Clock size={14} className="text-cream" /> Midnight Auto-Reset Active
            </div>
            <h2 className="text-3xl font-extrabold font-display tracking-tight text-white">Khyber's Daily IT Flash</h2>
            <p className="text-sm text-cream/80 max-w-lg">
              Live operational dashboard for {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. Select operational status and enter specific remarks for each interface.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/15 flex flex-col items-center md:items-end gap-1 w-full md:w-auto shadow-inner">
            <span className="text-4xl font-black font-display text-cream tracking-tight">{completedCount}/{items.length}</span>
            <p className="text-xs text-cream/80 font-semibold uppercase tracking-wider">Systems Fully Online</p>
            <div className="w-full md:w-48 bg-black/30 rounded-full h-2 mt-2 overflow-hidden">
              <div 
                className="bg-cream h-2 rounded-full transition-all duration-700 ease-out shadow-sm" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl shadow-base border border-slate-border/50 sticky top-16 z-30 backdrop-blur-md bg-white/90">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-mid" size={18} />
          <input 
            type="text" 
            placeholder="Search interfaces or remarks..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-cream/50 border border-slate-border/60 rounded-xl text-sm outline-none focus:border-fir-green focus:bg-white transition-all shadow-inner"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
          <Filter size={16} className="text-slate-mid mr-1 shrink-0 hidden md:block" />
          {allCategories.map(cat => {
            const count = cat === "All" ? items.length : items.filter(i => i.category === cat).length;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 shadow-sm ${
                  isSelected 
                    ? "bg-fir-green text-white shadow-fir-green/20 scale-105" 
                    : "bg-cream text-slate-dark hover:bg-cream/80 border border-slate-border/40"
                }`}
              >
                {cat}
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  isSelected ? "bg-white/20 text-white" : "bg-white text-slate-dark border border-slate-border/30"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-8">
        {allCategories.filter(cat => cat !== "All" && (selectedCategory === "All" || selectedCategory === cat)).map(category => {
          const catItems = filteredItems.filter(i => i.category === category);
          if (catItems.length === 0) return null;

          return (
            <div key={category} className="bg-white rounded-3xl shadow-base border border-slate-border/50 overflow-hidden transition-all duration-300 hover:shadow-lg">
              <div className="bg-gradient-to-r from-cream to-cream/30 px-6 py-4 border-b border-slate-border/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white rounded-2xl shadow-sm border border-slate-border/40 text-fir-green">
                    {getCategoryIcon(category)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-dark font-display tracking-tight">{category}</h3>
                    <p className="text-xs text-slate-mid font-medium">{catItems.length} interfaces in this group</p>
                  </div>
                </div>

                {user?.role !== "VIEWER" && (
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <span className="text-xs text-slate-mid font-bold hidden md:inline">Bulk Action:</span>
                    <div className="inline-flex rounded-xl shadow-sm rounded-xl overflow-hidden border border-slate-border/60 p-0.5 bg-white">
                      <button
                        onClick={() => handleBulkUpdate(category, "WORKING")}
                        disabled={bulkUpdatingCategory === category}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <CheckCircle2 size={14} /> All Working
                      </button>
                      <button
                        onClick={() => handleBulkUpdate(category, "PARTIAL")}
                        disabled={bulkUpdatingCategory === category}
                        className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <AlertCircle size={14} /> All Partial
                      </button>
                      <button
                        onClick={() => handleBulkUpdate(category, "NOT_WORKING")}
                        disabled={bulkUpdatingCategory === category}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <XCircle size={14} /> All Offline
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 text-slate-mid text-xs uppercase tracking-wider font-bold border-b border-slate-border/30">
                      <th className="p-4 pl-6 w-1/3">Interface Description</th>
                      <th className="p-4 w-48 text-center">Operational Status</th>
                      <th className="p-4 pr-6">Operational Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-border/30">
                    {catItems.map(item => (
                      <tr key={item.id} className="hover:bg-cream/15 transition-colors group">
                        <td className="p-4 pl-6">
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-slate-dark text-sm group-hover:text-fir-green transition-colors">
                              {item.title}
                            </span>
                            {item.completedBy && item.status !== "PENDING" && (
                              <span className="text-[10px] text-slate-mid flex items-center gap-1">
                                ✓ Inspected by {item.completedBy.split(" ")[0]} at {new Date(item.completedAt!).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="p-4 text-center">
                          <div className="relative inline-block w-40">
                            <select
                              value={item.status}
                              onChange={e => handleStatusChange(item.id, e.target.value)}
                              disabled={user?.role === "VIEWER" || toggling === item.id}
                              className={`w-full py-2 pl-3 pr-8 rounded-xl border text-xs font-bold appearance-none outline-none transition-all shadow-sm cursor-pointer ${getStatusColor(item.status)} ${user?.role === "VIEWER" ? "cursor-not-allowed opacity-80" : ""}`}
                            >
                              <option value="PENDING" className="bg-white text-slate-600 font-bold">Pending</option>
                              <option value="WORKING" className="bg-white text-emerald-700 font-bold">Working</option>
                              <option value="PARTIAL" className="bg-white text-amber-700 font-bold">Partial / Flagged</option>
                              <option value="NOT_WORKING" className="bg-white text-rose-700 font-bold">Not Working</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                              {toggling === item.id ? (
                                <Loader2 className="animate-spin text-slate-mid" size={14} />
                              ) : (
                                <ChevronDown size={14} className="text-slate-mid opacity-70" />
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="p-4 pr-6">
                          <input 
                            type="text" 
                            value={item.remarks}
                            onChange={e => handleRemarksChange(item.id, e.target.value)}
                            disabled={user?.role === "VIEWER"}
                            placeholder={user?.role === "VIEWER" ? "No remarks recorded" : "Enter specific operational remarks..."}
                            className={`w-full p-2.5 bg-transparent border-b border-dashed border-slate-border/60 focus:border-fir-green focus:bg-cream/30 focus:ring-0 outline-none text-sm text-slate-dark transition-all rounded-lg ${user?.role === "VIEWER" ? "cursor-not-allowed text-slate-mid/70 border-none" : ""}`}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden flex flex-col divide-y divide-slate-border/20">
                {catItems.map(item => (
                  <div key={item.id} className="p-5 flex flex-col gap-4 hover:bg-cream/10 transition-colors">
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-slate-dark text-base">
                        {item.title}
                      </span>
                      {item.completedBy && item.status !== "PENDING" && (
                        <span className="text-xs text-slate-mid">
                          ✓ Inspected by {item.completedBy.split(" ")[0]} at {new Date(item.completedAt!).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs font-bold text-slate-mid">Operational Status:</span>
                      <div className="relative w-44">
                        <select
                          value={item.status}
                          onChange={e => handleStatusChange(item.id, e.target.value)}
                          disabled={user?.role === "VIEWER" || toggling === item.id}
                          className={`w-full py-2.5 pl-3 pr-8 rounded-xl border text-xs font-bold appearance-none outline-none transition-all shadow-sm cursor-pointer ${getStatusColor(item.status)} ${user?.role === "VIEWER" ? "cursor-not-allowed opacity-80" : ""}`}
                        >
                          <option value="PENDING" className="bg-white text-slate-600 font-bold">Pending</option>
                          <option value="WORKING" className="bg-white text-emerald-700 font-bold">Working</option>
                          <option value="PARTIAL" className="bg-white text-amber-700 font-bold">Partial / Flagged</option>
                          <option value="NOT_WORKING" className="bg-white text-rose-700 font-bold">Not Working</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                          {toggling === item.id ? (
                            <Loader2 className="animate-spin text-slate-mid" size={14} />
                          ) : (
                            <ChevronDown size={14} className="text-slate-mid opacity-70" />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="w-full pt-1 border-t border-slate-border/20">
                      <input 
                        type="text" 
                        value={item.remarks}
                        onChange={e => handleRemarksChange(item.id, e.target.value)}
                        disabled={user?.role === "VIEWER"}
                        placeholder={user?.role === "VIEWER" ? "No remarks recorded" : "Enter specific operational remarks..."}
                        className={`w-full p-3 bg-cream/40 border border-slate-border/60 focus:border-fir-green focus:bg-white focus:ring-0 outline-none text-xs text-slate-dark transition-all rounded-xl shadow-inner ${user?.role === "VIEWER" ? "cursor-not-allowed text-slate-mid/70 bg-transparent border-none shadow-none px-0" : ""}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-4 mt-6 bg-white p-8 rounded-3xl shadow-base border border-slate-border/50">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-slate-border/40 pb-6">
          <div>
            <h3 className="text-2xl font-extrabold text-slate-dark font-display flex items-center gap-3 tracking-tight">
              <Wifi size={28} className="text-fir-green" /> Today's Access Codes (Guest Wi-Fi)
            </h3>
            <p className="text-xs text-slate-mid mt-1">Manage active Wi-Fi vouchers and access codes for VIP guests and conferences.</p>
          </div>
          {user?.role !== "VIEWER" && (
            <button 
              onClick={() => setIsWifiModalOpen(true)}
              className="px-5 py-3 bg-fir-green text-white rounded-2xl text-xs font-bold hover:bg-fir-green/90 transition-all flex items-center gap-2 shadow-md hover:shadow-fir-green/20 hover:scale-105 active:scale-95 w-max"
            >
              <Plus size={16} /> Add Access Code
            </button>
          )}
        </div>

        <div className="overflow-x-auto pt-2">
          <table className="w-full min-w-[700px] text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-mid text-xs uppercase tracking-wider font-bold border-b border-slate-border/30">
                <th className="p-4 pl-6">From Date</th>
                <th className="p-4">To Date</th>
                <th className="p-4 font-bold text-slate-dark">Access Code</th>
                <th className="p-4">Device Limit</th>
                <th className="p-4">Plan Type</th>
                <th className="p-4 pr-6">Issued To</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-border/30">
              {wifiCodes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-mid text-sm italic bg-cream/20 rounded-2xl">
                    No active Wi-Fi access codes recorded for today. Click "Add Access Code" to generate one.
                  </td>
                </tr>
              ) : (
                wifiCodes.map((code) => (
                  <tr key={code.id} className="hover:bg-cream/20 transition-colors text-sm group">
                    <td className="p-4 pl-6 text-slate-dark font-medium">{new Date(code.fromDate).toLocaleDateString('en-IN')}</td>
                    <td className="p-4 text-slate-dark font-medium">{new Date(code.toDate).toLocaleDateString('en-IN')}</td>
                    <td className="p-4 font-mono font-extrabold text-fir-green text-base bg-emerald-50/50 rounded-lg group-hover:bg-emerald-50 transition-colors">{code.accessCode}</td>
                    <td className="p-4 text-slate-dark font-medium">{code.deviceLimit} Devices</td>
                    <td className="p-4 text-slate-dark font-medium">{code.plan}</td>
                    <td className="p-4 pr-6 text-slate-mid font-bold">{code.issuedTo}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isWifiModalOpen} onClose={() => setIsWifiModalOpen(false)} title="Add Guest Wi-Fi Access Code">
        <form onSubmit={handleSubmit(onWifiSubmit)} className="flex flex-col gap-5 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-dark uppercase tracking-wider">From Date</label>
              <input type="date" {...register("fromDate", { required: true })} className="p-3.5 bg-cream border border-slate-border/60 rounded-2xl outline-none text-sm focus:border-fir-green focus:bg-white transition-all shadow-inner" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-dark uppercase tracking-wider">To Date</label>
              <input type="date" {...register("toDate", { required: true })} className="p-3.5 bg-cream border border-slate-border/60 rounded-2xl outline-none text-sm focus:border-fir-green focus:bg-white transition-all shadow-inner" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-dark uppercase tracking-wider">Access Code</label>
            <input placeholder="e.g. KHYBER2026" {...register("accessCode", { required: true })} className="p-3.5 bg-cream border border-slate-border/60 rounded-2xl outline-none font-mono text-base font-bold focus:border-fir-green focus:bg-white transition-all shadow-inner uppercase" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-dark uppercase tracking-wider">Device Limit</label>
              <input type="number" defaultValue={2} {...register("deviceLimit", { required: true })} className="p-3.5 bg-cream border border-slate-border/60 rounded-2xl outline-none text-sm focus:border-fir-green focus:bg-white transition-all shadow-inner" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-dark uppercase tracking-wider">Plan Type</label>
              <input placeholder="e.g. Premium High Speed" {...register("plan", { required: true })} className="p-3.5 bg-cream border border-slate-border/60 rounded-2xl outline-none text-sm focus:border-fir-green focus:bg-white transition-all shadow-inner" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-dark uppercase tracking-wider">Issued To</label>
            <input placeholder="e.g. VIP Guest Name or Conference Dept" {...register("issuedTo", { required: true })} className="p-3.5 bg-cream border border-slate-border/60 rounded-2xl outline-none text-sm focus:border-fir-green focus:bg-white transition-all shadow-inner" />
          </div>
          <button 
            type="submit" 
            disabled={isSubmittingWifi}
            className="mt-4 bg-fir-green text-white p-4 rounded-2xl font-extrabold flex justify-center items-center gap-2 hover:bg-fir-green/90 transition-all disabled:opacity-50 shadow-lg hover:shadow-fir-green/20 active:scale-95 text-sm"
          >
            {isSubmittingWifi ? <Loader2 className="animate-spin" size={20} /> : "Save Access Code"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
