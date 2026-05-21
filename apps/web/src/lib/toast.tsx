"use client";

import * as Toast from "@radix-ui/react-toast";
import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CheckCircle, XCircle, AlertTriangle, X } from "lucide-react";

type ToastType = "success" | "error" | "warning";

interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastContextValue {
  toast: (type: ToastType, title: string, description?: string) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = useCallback((type: ToastType, title: string, description?: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, title, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const success = useCallback((title: string, description?: string) => toast("success", title, description), [toast]);
  const error = useCallback((title: string, description?: string) => toast("error", title, description), [toast]);
  const warning = useCallback((title: string, description?: string) => toast("warning", title, description), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning }}>
      <Toast.Provider swipeDirection="right">
        {children}
        {toasts.map((t) => (
          <Toast.Root
            key={t.id}
            open={true}
            className={`flex items-start gap-3 p-4 rounded-2xl shadow-2xl border max-w-sm w-full animate-in slide-in-from-right-full duration-300 ${
              t.type === "success" ? "bg-white border-emerald-200" :
              t.type === "error" ? "bg-white border-red-200" :
              "bg-white border-amber-200"
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {t.type === "success" && <CheckCircle size={18} className="text-emerald-500" />}
              {t.type === "error" && <XCircle size={18} className="text-red-500" />}
              {t.type === "warning" && <AlertTriangle size={18} className="text-amber-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <Toast.Title className="text-sm font-bold text-slate-dark">{t.title}</Toast.Title>
              {t.description && (
                <Toast.Description className="text-xs text-slate-mid mt-0.5">{t.description}</Toast.Description>
              )}
            </div>
            <Toast.Close className="shrink-0 text-slate-mid hover:text-slate-dark transition-colors">
              <X size={14} />
            </Toast.Close>
          </Toast.Root>
        ))}
        <Toast.Viewport className="fixed bottom-4 right-4 flex flex-col gap-2 z-[100] w-full max-w-sm" />
      </Toast.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
