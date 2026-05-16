"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const initAuth = useAuthStore((state) => state.initAuth);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  if (!isInitialized) {
    return (
      <div className="bg-cream flex items-center justify-center min-h-screen">
        <div className="animate-pulse font-display text-fir-green font-bold text-2xl">
          Khyber IT Portal...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
