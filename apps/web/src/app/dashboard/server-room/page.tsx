"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Modal } from "@/app/components/Modal";
import { useForm } from "react-hook-form";
import { ClipboardList, Plus, Loader2, Clock, User as UserIcon } from "lucide-react";

interface LogEntry {
  id: string;
  entryDate: string;
  entryTime: string;
  userName: string;
  reason: string;
}

interface LogFormData {
  userName: string;
  entryTime: string;
  reason: string;
}

export default function ServerRoomPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<LogFormData>({
    defaultValues: {
      entryTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
    }
  });

  const fetchLogs = async () => {
    try {
      const response = await api.get("/server-room");
      setLogs(response.data);
    } catch (error) {
      console.error("Failed to fetch logs", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const onSubmit = async (data: LogFormData) => {
    setIsSubmitting(true);
    try {
      await api.post("/server-room", data);
      setIsModalOpen(false);
      reset();
      fetchLogs();
    } catch (error) {
      console.error("Failed to create log", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-slate-mid">
      <Loader2 className="animate-spin mr-2" /> Loading Server Room Logs...
    </div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-dark font-display">Server Room Door Log</h2>
          <p className="text-slate-mid">Mandatory record of all entries into the Server Room.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-fir-green text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-fir-green/90 transition-all shadow-sm"
        >
          <Plus size={20} />
          Add Entry
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-base border border-slate-border/50 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-cream border-b border-slate-border/50">
              <th className="p-4 text-xs font-bold text-slate-mid uppercase tracking-widest">Date</th>
              <th className="p-4 text-xs font-bold text-slate-mid uppercase tracking-widest">Time</th>
              <th className="p-4 text-xs font-bold text-slate-mid uppercase tracking-widest">User</th>
              <th className="p-4 text-xs font-bold text-slate-mid uppercase tracking-widest">Reason / Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-border/30">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-mid">No log entries found.</td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-cream/30 transition-colors">
                  <td className="p-4 text-sm text-slate-dark font-medium">
                    {new Date(log.entryDate).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-sm text-slate-dark">
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} className="text-slate-mid" />
                      {log.entryTime}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-dark">
                    <span className="flex items-center gap-1.5">
                      <UserIcon size={14} className="text-slate-mid" />
                      {log.userName}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-mid">
                    {log.reason}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Server Room Entry Log">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-slate-dark">User Name</label>
            <input 
              {...register("userName", { required: "Name is required" })}
              placeholder="Full name of person entering"
              className="p-3 bg-cream border border-slate-border/50 rounded-xl focus:ring-2 focus:ring-fir-green outline-none transition-all"
            />
            {errors.userName && <span className="text-xs text-color-error">{errors.userName.message}</span>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-slate-dark">Entry Time</label>
            <input 
              {...register("entryTime", { required: "Time is required" })}
              type="time"
              className="p-3 bg-cream border border-slate-border/50 rounded-xl focus:ring-2 focus:ring-fir-green outline-none transition-all"
            />
            {errors.entryTime && <span className="text-xs text-color-error">{errors.entryTime.message}</span>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-slate-dark">Reason / Remarks</label>
            <textarea 
              {...register("reason", { required: "Reason is required" })}
              rows={3}
              placeholder="e.g. Server maintenance, Backup check, Vendor visit..."
              className="p-3 bg-cream border border-slate-border/50 rounded-xl focus:ring-2 focus:ring-fir-green outline-none transition-all resize-none"
            />
            {errors.reason && <span className="text-xs text-color-error">{errors.reason.message}</span>}
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="mt-4 bg-fir-green text-white p-3 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-fir-green/90 transition-all disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "Record Entry"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
