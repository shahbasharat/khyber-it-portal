"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { getQueuedRequests, syncOfflineQueue } from "@/lib/offlineQueue";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [queueCount, setQueueCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const updateQueueCount = () => {
    setQueueCount(getQueuedRequests().length);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);
    updateQueueCount();

    const handleOnline = async () => {
      setIsOnline(true);
      if (getQueuedRequests().length > 0) {
        setSyncing(true);
        await syncOfflineQueue(api);
        setSyncing(false);
        setSyncSuccess(true);
        setTimeout(() => setSyncSuccess(false), 4000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("offline_queue_changed", updateQueueCount);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("offline_queue_changed", updateQueueCount);
    };
  }, []);

  if (syncSuccess) {
    return (
      <div className="bg-fir-green text-white py-2.5 px-4 text-center text-sm font-bold flex items-center justify-center gap-2 transition-all duration-300 shadow-md animate-fade-in z-50 sticky top-0 md:relative">
        <Wifi size={16} className="animate-pulse" />
        <span>Back online! Operations successfully synced. ✓</span>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div 
        role="alert"
        aria-live="assertive"
        className="bg-antique-gold-subtle border-b border-antique-gold/20 text-antique-gold-light py-2.5 px-4 text-center text-sm font-bold flex items-center justify-center gap-2 transition-all duration-300 z-50 sticky top-0 md:relative"
        style={{ backgroundColor: "#FDF6E7", color: "#7A5B18", borderBottomColor: "rgba(189, 141, 39, 0.3)" }}
      >
        <WifiOff size={16} />
        <span>
          You're offline — {queueCount > 0 ? `${queueCount} actions queued for sync` : "changes will sync when reconnected"}
        </span>
        {syncing && <RefreshCw size={14} className="animate-spin ml-1" />}
      </div>
    );
  }

  return null;
}
