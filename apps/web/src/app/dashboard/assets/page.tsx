"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { Wrench, Plus, Search, Activity } from "lucide-react";
import { Modal } from "@/app/components/Modal";
import { useForm } from "react-hook-form";
import { useToast } from "@/lib/toast";

interface AssetActivity {
  id: string;
  assetId: string;
  deviceType: string;
  userDepartment: string;
  activity: string;
  status: string;
  createdAt: string;
  engineer: {
    name: string;
  };
}

export default function AssetActivityPage() {
  const [activities, setActivities] = useState<AssetActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const { success, error } = useToast();

  const fetchActivities = async () => {
    try {
      const response = await api.get("/asset-activity");
      setActivities(response.data);
    } catch (error) {
      console.error("Failed to load activities", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const onSubmit = async (data: any) => {
    try {
      await api.post("/asset-activity", data);
      success("Activity logged successfully");
      setIsModalOpen(false);
      reset();
      fetchActivities();
    } catch {
      error("Failed to log activity");
    }
  };

  const filteredActivities = activities.filter(a => 
    a.assetId.toLowerCase().includes(search.toLowerCase()) || 
    a.deviceType.toLowerCase().includes(search.toLowerCase()) ||
    a.userDepartment.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-fir-green flex items-center gap-3">
            <Wrench className="text-antique-gold" size={32} />
            Asset Activity Log
          </h1>
          <p className="text-slate-mid mt-1">Track hardware repairs, configurations, and replacements.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-fir-green text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:bg-fir-green-light transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>Log Activity</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-base border border-slate-border/50 overflow-hidden flex flex-col h-[calc(100vh-200px)]">
        <div className="p-4 border-b border-slate-border/50 bg-cream/50 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-mid" size={18} />
            <input 
              type="text" 
              placeholder="Search by Asset ID, Device Type, or Department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-border focus:ring-2 focus:ring-fir-green outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex justify-center items-center h-32 text-slate-mid">Loading activity log...</div>
          ) : filteredActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-mid">
              <Activity size={48} className="mb-4 opacity-50 text-fir-green" />
              <p className="font-medium">No asset activities found.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white shadow-sm">
                <tr className="border-b border-slate-border/50">
                  <th className="p-4 text-xs font-bold text-slate-mid uppercase tracking-wider">Date & Time</th>
                  <th className="p-4 text-xs font-bold text-slate-mid uppercase tracking-wider">Asset Info</th>
                  <th className="p-4 text-xs font-bold text-slate-mid uppercase tracking-wider hidden md:table-cell">Activity Performed</th>
                  <th className="p-4 text-xs font-bold text-slate-mid uppercase tracking-wider">Engineer</th>
                  <th className="p-4 text-xs font-bold text-slate-mid uppercase tracking-wider text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-border/30">
                {filteredActivities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-cream/20 transition-colors">
                    <td className="p-4">
                      <div className="text-sm font-semibold text-slate-dark">{format(new Date(activity.createdAt), "MMM d, yyyy")}</div>
                      <div className="text-xs text-slate-mid">{format(new Date(activity.createdAt), "h:mm a")}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-fir-green">{activity.assetId}</div>
                      <div className="text-sm text-slate-dark">{activity.deviceType}</div>
                      <div className="text-xs text-slate-mid">{activity.userDepartment}</div>
                    </td>
                    <td className="p-4 hidden md:table-cell max-w-xs">
                      <p className="text-sm text-slate-dark truncate" title={activity.activity}>{activity.activity}</p>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-medium text-slate-dark">{activity.engineer.name}</span>
                    </td>
                    <td className="p-4 text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        activity.status === "COMPLETED" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {activity.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Log Asset Activity">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-dark mb-1">Asset ID *</label>
              <input
                {...register("assetId", { required: true })}
                className="w-full px-3 py-2 rounded-lg border border-slate-border focus:ring-2 focus:ring-fir-green outline-none"
                placeholder="e.g. KHY-PC-042"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-dark mb-1">Device Type *</label>
              <input
                {...register("deviceType", { required: true })}
                className="w-full px-3 py-2 rounded-lg border border-slate-border focus:ring-2 focus:ring-fir-green outline-none"
                placeholder="e.g. Printer, Router, Laptop"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-dark mb-1">User / Department *</label>
            <input
              {...register("userDepartment", { required: true })}
              className="w-full px-3 py-2 rounded-lg border border-slate-border focus:ring-2 focus:ring-fir-green outline-none"
              placeholder="e.g. Front Desk / John Smith"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-dark mb-1">Activity Performed *</label>
            <textarea
              {...register("activity", { required: true })}
              className="w-full px-3 py-2 rounded-lg border border-slate-border focus:ring-2 focus:ring-fir-green outline-none resize-none"
              placeholder="e.g. Replaced black toner cartridge and cleaned drum."
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-dark mb-1">Status</label>
            <select
              {...register("status")}
              className="w-full px-3 py-2 rounded-lg border border-slate-border focus:ring-2 focus:ring-fir-green outline-none font-medium"
            >
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending (Follow-up required)</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 font-bold text-slate-mid hover:bg-slate-50 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 font-bold bg-fir-green text-white hover:bg-fir-green-light rounded-lg transition-colors"
            >
              Save Log
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
