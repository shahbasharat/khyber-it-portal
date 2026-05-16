"use client";

import { useAuthStore } from "@/store/authStore";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Home, CheckSquare, AlertCircle, FileText, Settings, LogOut, Package } from "lucide-react";
import { api } from "@/lib/api";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {}
    logout();
    router.push("/login");
  };

  if (!mounted || !user) {
    return null; // Avoid hydration mismatch or flash of content
  }

  const isManager = user.role === "MANAGER";

  const navLinks = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Checklist", href: "/checklist/today", icon: CheckSquare },
    { name: "Issues", href: "/issues", icon: AlertCircle },
    { name: "Reports", href: "/shift-report/history", icon: FileText },
    { name: "Assets", href: "/assets", icon: Package },
    ...(isManager ? [{ name: "Admin", href: "/admin/users", icon: Settings }] : []),
  ];

  return (
    <div className="min-h-screen bg-cream flex flex-col md:flex-row">
      {/* Top Header - Mobile Only */}
      <header className="md:hidden h-14 bg-white border-b border-slate-border/50 flex items-center justify-between px-4 sticky top-0 z-40">
        <span className="font-display font-bold text-fir-green text-lg">Khyber IT</span>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-slate-dark">{user.name}</span>
          <button onClick={handleLogout} className="text-slate-mid hover:text-color-error">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Sidebar - Desktop Only */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-slate-border/50 fixed h-full z-40">
        <div className="h-16 flex items-center px-6 border-b border-slate-border/50">
          <span className="font-display font-bold text-fir-green text-xl">Khyber IT</span>
        </div>
        
        <div className="flex-1 px-4 py-6 flex flex-col gap-2 overflow-y-auto">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-fir-green-subtle text-fir-green"
                    : "text-slate-dark hover:bg-cream"
                }`}
              >
                <Icon size={20} />
                {link.name}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-border/50">
          <div className="flex items-center justify-between px-2">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-dark">{user.name}</span>
              <span className="text-xs text-slate-mid">{user.role}</span>
            </div>
            <button onClick={handleLogout} className="text-slate-mid hover:text-color-error p-2">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-60 pb-20 md:pb-0 relative min-h-[calc(100vh-56px)] md:min-h-screen">
        {/* Desktop Top Header */}
        <header className="hidden md:flex h-16 bg-white border-b border-slate-border/50 items-center px-8 sticky top-0 z-30">
          <h1 className="text-xl font-bold font-display text-slate-dark">
            {navLinks.find((l) => pathname === l.href || (l.href !== "/dashboard" && pathname.startsWith(l.href)))?.name || "Portal"}
          </h1>
        </header>

        <div className="p-4 md:p-8">
          {children}
        </div>
        
        {/* Floating Action Button - Mobile Only */}
        {!isManager && (
          <button className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-antique-gold text-white shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 md:hidden">
            <span className="text-3xl leading-none mt-[-4px]">+</span>
          </button>
        )}
      </main>

      {/* Bottom Tab Bar - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 w-full h-16 bg-white border-t border-slate-border/50 flex items-center justify-around z-40 pb-safe">
        {navLinks.slice(0, 4).map((link) => {
          const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
          const Icon = link.icon;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 ${
                isActive ? "text-fir-green" : "text-slate-mid"
              }`}
            >
              <Icon size={24} />
              <span className="text-[10px] font-medium">{link.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
