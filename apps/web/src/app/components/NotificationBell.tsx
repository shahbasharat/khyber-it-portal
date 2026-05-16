"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Bell, Loader2 } from "lucide-react";
import Link from "next/link";

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  linkUrl?: string;
}

export const NotificationBell = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await api.get("/notifications");
      setNotifications(response.data);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 1 minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (e) {}
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-mid hover:text-fir-green hover:bg-cream rounded-full transition-all"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-color-error text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-border/50 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-4 border-b border-slate-border/50 flex justify-between items-center bg-cream/30">
              <h4 className="font-bold text-slate-dark">Notifications</h4>
              {loading && <Loader2 size={16} className="animate-spin text-slate-mid" />}
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-mid text-sm">
                  No notifications yet.
                </div>
              ) : (
                notifications.map((n) => (
                  <div 
                    key={n.id} 
                    onClick={() => markRead(n.id)}
                    className={`p-4 border-b border-slate-border/30 last:border-0 hover:bg-cream transition-all cursor-pointer ${!n.isRead ? 'bg-fir-green-subtle/30' : ''}`}
                  >
                    <p className={`text-sm font-bold ${!n.isRead ? 'text-fir-green' : 'text-slate-dark'}`}>{n.title}</p>
                    <p className="text-xs text-slate-mid mt-1">{n.message}</p>
                    <p className="text-[10px] text-slate-mid/60 mt-2 uppercase font-medium">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))
              )}
            </div>
            <div className="p-3 text-center border-t border-slate-border/50 bg-cream/30">
              <button className="text-xs font-bold text-fir-green hover:text-fir-green-dark">Clear All</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
