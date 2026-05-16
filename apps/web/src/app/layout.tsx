"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initAuth = useAuthStore((state) => state.initAuth);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  if (!isInitialized) {
    return (
      <html lang="en">
        <body className="bg-cream flex items-center justify-center min-h-screen">
          <div className="animate-pulse font-display text-fir-green font-bold text-2xl">
            Khyber IT Portal...
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-cream">
        {children}
      </body>
    </html>
  );
}
