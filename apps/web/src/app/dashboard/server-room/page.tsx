"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Modal } from "@/app/components/Modal";
import { useForm } from "react-hook-form";
import { ClipboardList, Plus, Loader2, Clock, User as UserIcon, Activity, Wifi, Database, Tv, Lock, RefreshCw, Radio, Trash2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

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

interface Heartbeat {
  id: string;
  name: string;
  ip: string;
  latency: number;
  status: string;
  uptime: string;
  category: string;
}

interface DeviceFormData {
  name: string;
  ip: string;
  category: string;
}

export default function ServerRoomPage() {
  const { user } = useAuthStore();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [heartbeats, setHeartbeats] = useState<Heartbeat[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingHeartbeats, setFetchingHeartbeats] = useState(true);
  
  // Modals and Submit States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddingDevice, setIsAddingDevice] = useState(false);

  // Door Logs Form
  const { register, handleSubmit, reset, formState: { errors } } = useForm<LogFormData>({
    defaultValues: {
      entryTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
    }
  });

  // Network Devices Form
  const { register: registerDevice, handleSubmit: handleDeviceSubmit, reset: resetDevice, formState: { errors: deviceErrors } } = useForm<DeviceFormData>({
    defaultValues: {
      category: "INTERNET"
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

  const fetchHeartbeats = async () => {
    try {
      const response = await api.get("/server-room/heartbeat");
      setHeartbeats(response.data);
      setHeartbeats(response.data);
    } catch (error) {
      console.error("Failed to fetch heartbeats", error);
    } finally {
      setFetchingHeartbeats(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchHeartbeats();
    
    const interval = setInterval(fetchHeartbeats, 5000); // Fast live updates every 5 seconds
    return () => clearInterval(interval);
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

  const onAddDevice = async (data: DeviceFormData) => {
    setIsAddingDevice(true);
    try {
      await api.post("/server-room/devices", data);
      setIsDeviceModalOpen(false);
      resetDevice();
      fetchHeartbeats();
    } catch (error) {
      console.error("Failed to add network device", error);
      alert("Failed to register device. Make sure the IP is unique.");
    } finally {
      setIsAddingDevice(false);
    }
  };

  const onDeleteDevice = async (id: string) => {
    if (!confirm("⚠️ Are you sure you want to remove this network device from the Heartbeat Console?")) return;
    try {
      await api.delete(`/server-room/devices/${id}`);
      fetchHeartbeats();
    } catch (error) {
      console.error("Failed to delete network device", error);
      alert("Failed to remove network device.");
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-slate-mid">
      <Loader2 className="animate-spin mr-2" /> Loading Server Room Logs...
    </div>;
  }

  return (
    <div className="flex flex-col gap-8">
      {/* 🖥️ LIVE HEARTBEAT PING MONITOR CONSOLE */}
      <div className="bg-white rounded-2xl shadow-base border border-slate-border/50 p-6 flex flex-col gap-6">
        <div className="flex justify-between items-center border-b border-slate-border/30 pb-4">
          <div>
            <h3 className="text-xl font-bold font-display text-slate-dark flex items-center gap-2">
              <Activity className="text-fir-green animate-pulse" size={20} />
              Infrastructure Heartbeat Monitor
            </h3>
            <p className="text-slate-mid text-xs mt-1">Real-time pings and diagnostic telemetry of resort-critical core networks.</p>
          </div>
          <div className="flex items-center gap-3">
            {user?.role === "MANAGER" && (
              <button 
                onClick={() => setIsDeviceModalOpen(true)}
                className="bg-antique-gold hover:bg-antique-gold-dark text-white px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all text-xs font-bold shadow-sm"
              >
                <Plus size={14} /> Add Server / IP
              </button>
            )}
            <div className="flex items-center gap-2 text-[10px] font-bold text-fir-green uppercase bg-fir-green-subtle px-3 py-1 rounded-full border border-fir-green/20">
              <Radio size={12} className="animate-ping" />
              Live Autopilot Connected
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {fetchingHeartbeats ? (
            <div className="col-span-4 flex justify-center py-6 text-slate-mid text-xs">
              <Loader2 className="animate-spin mr-2" size={16} /> Gathering ping responses...
            </div>
          ) : (
            heartbeats.map((server) => {
              const Icon = server.category === "DATABASE" ? Database :
                            server.category === "ACCESS_CONTROL" ? Lock :
                            server.category === "INTERNET" ? Wifi : Tv;

              return (
                <div key={server.id} className="border border-slate-border/50 bg-cream/20 hover:border-antique-gold/30 rounded-xl p-4 transition-all flex flex-col gap-3 group relative">
                  <div className="flex justify-between items-start">
                    <div className="w-9 h-9 rounded-lg bg-antique-gold/10 text-antique-gold flex items-center justify-center">
                      <Icon size={18} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      {user?.role === "MANAGER" && (
                        <button 
                          onClick={() => onDeleteDevice(server.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-mid hover:text-color-error p-1 rounded-lg hover:bg-slate-100"
                          title="Remove Device"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                      <span className="text-[9px] font-bold tracking-widest text-fir-green bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase">
                        {server.status}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-bold text-slate-dark text-sm leading-snug">{server.name}</h4>
                    <span className="text-[10px] text-slate-mid font-mono">{server.ip}</span>
                  </div>

                  <div className="flex justify-between items-end border-t border-slate-100 pt-3 mt-1">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-mid uppercase tracking-wide">Latency</span>
                      <span className="text-lg font-bold font-display text-slate-dark leading-none mt-1">
                        {server.latency} <span className="text-[10px] font-sans font-semibold">ms</span>
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] font-bold text-slate-mid uppercase tracking-wide">Uptime</span>
                      <span className="text-xs font-bold text-slate-dark mt-1">{server.uptime}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 🚪 DOOR ACCESS SECURITY LOGS */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-dark font-display">Server Room Door Log</h2>
          <p className="text-slate-mid">Mandatory record of all entries into the Server Room.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-fir-green text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-fir-green/90 transition-all shadow-sm font-bold text-sm"
        >
          <Plus size={20} />
          Add Entry
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-base border border-slate-border/50 overflow-x-auto">
        <table className="w-full min-w-[600px] text-left border-collapse">
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

      {/* ➕ REGISTER NETWORK DEVICE MODAL (Visible only to MANAGER) */}
      {user?.role === "MANAGER" && (
        <Modal isOpen={isDeviceModalOpen} onClose={() => setIsDeviceModalOpen(false)} title="Register Core Network Device">
          <form onSubmit={handleDeviceSubmit(onAddDevice)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-slate-dark">Device Name</label>
              <input 
                {...registerDevice("name", { required: "Device name is required" })}
                placeholder="e.g. Guest Wi-Fi Controller, CCTV NVR"
                className="p-3 bg-cream border border-slate-border/50 rounded-xl focus:ring-2 focus:ring-fir-green outline-none transition-all text-slate-dark"
              />
              {deviceErrors.name && <span className="text-xs text-color-error">{deviceErrors.name.message}</span>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-slate-dark">IP Address</label>
              <input 
                {...registerDevice("ip", { required: "IP address is required", pattern: { value: /^[0-9.]+$/, message: "Please enter a valid IP address" } })}
                placeholder="e.g. 10.200.1.50"
                className="p-3 bg-cream border border-slate-border/50 rounded-xl focus:ring-2 focus:ring-fir-green outline-none transition-all font-mono text-slate-dark"
              />
              {deviceErrors.ip && <span className="text-xs text-color-error">{deviceErrors.ip.message}</span>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-slate-dark">System Category</label>
              <select
                {...registerDevice("category", { required: "Category is required" })}
                className="p-3 bg-cream border border-slate-border/50 rounded-xl focus:ring-2 focus:ring-fir-green outline-none transition-all text-slate-dark"
              >
                <option value="INTERNET">🌐 Internet Gateway / WAN</option>
                <option value="DATABASE">🗄️ Database / PMS Server</option>
                <option value="ACCESS_CONTROL">🔒 Access Control / Door Security</option>
                <option value="ENTERTAINMENT">📺 Entertainment / IPTV Core</option>
              </select>
              {deviceErrors.category && <span className="text-xs text-color-error">{deviceErrors.category.message}</span>}
            </div>

            <button 
              type="submit" 
              disabled={isAddingDevice}
              className="mt-4 bg-antique-gold hover:bg-antique-gold-dark text-white p-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-all disabled:opacity-50"
            >
              {isAddingDevice ? <Loader2 className="animate-spin" size={20} /> : "Register Device"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
