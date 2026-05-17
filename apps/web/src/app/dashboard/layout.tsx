"use client";

import { useAuthStore } from "@/store/authStore";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Home, CheckSquare, AlertCircle, FileText, Settings, LogOut, Package, Wrench, AlertTriangle, Sun, Moon } from "lucide-react";
import { api } from "@/lib/api";
import { NotificationBell } from "@/app/components/NotificationBell";
import { OfflineBanner } from "@/app/components/OfflineBanner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    setMounted(true);
    if (!user) {
      router.push("/login");
      return;
    }

    // Initialize Theme Mode
    const savedTheme = localStorage.getItem("khyber-theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    }
  }, [user, router]);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("khyber-theme", nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  };

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
    { name: "Checklist", href: "/dashboard/checklist/today", icon: CheckSquare },
    { name: "Issues", href: "/dashboard/issues", icon: AlertCircle },
    { name: "Reports", href: "/dashboard/reports", icon: FileText },
    { name: "Escalations", href: "/dashboard/escalations", icon: AlertTriangle },
    { name: "Server Log", href: "/dashboard/server-room", icon: Package },
    ...(isManager ? [{ name: "Admin", href: "/dashboard/admin/users", icon: Settings }] : []),
  ];

  return (
    <div className="min-h-screen bg-cream flex flex-col md:flex-row">
      {/* Top Header - Mobile Only */}
      <header className="md:hidden h-14 bg-white border-b border-slate-border/50 flex items-center justify-between px-4 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L4 14H20L12 2Z" fill="#C5A880" />
            <path d="M12 6L7 14H17L12 6Z" fill="#19433E" />
            <path d="M12 10L9 14H15L12 10Z" fill="#C5A880" />
            <rect x="11" y="14" width="2" height="6" fill="#19433E" />
          </svg>
          <div className="flex flex-col">
            <span className="font-display font-bold text-fir-green text-xs uppercase tracking-wider leading-none">THE KHYBER</span>
            <span className="text-[8px] font-sans font-semibold text-antique-gold uppercase tracking-widest leading-none mt-0.5">IT Operations</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleTheme} 
            className="text-slate-mid hover:text-antique-gold transition-colors p-1.5 rounded-lg flex items-center justify-center"
            aria-label="Toggle theme"
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <NotificationBell />
          <span className="text-sm font-medium text-slate-dark">{user.name.split(" ")[0]}</span>
          <button onClick={handleLogout} className="text-slate-mid hover:text-color-error">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Sidebar - Desktop Only */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-slate-border/50 fixed h-full z-40">
        <div className="h-16 flex items-center px-6 border-b border-slate-border/50">
          <div className="flex items-center gap-2.5">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L4 14H20L12 2Z" fill="#C5A880" />
              <path d="M12 6L7 14H17L12 6Z" fill="#19433E" />
              <path d="M12 10L9 14H15L12 10Z" fill="#C5A880" />
              <rect x="11" y="14" width="2" height="6" fill="#19433E" />
            </svg>
            <div className="flex flex-col">
              <span className="font-display font-bold text-fir-green text-sm uppercase tracking-wider leading-none">THE KHYBER</span>
              <span className="text-[9px] font-sans font-semibold text-antique-gold uppercase tracking-widest leading-none mt-0.5">IT Operations</span>
            </div>
          </div>
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
        <OfflineBanner />
        {/* Desktop Top Header */}
        <header className="hidden md:flex h-16 bg-white border-b border-slate-border/50 items-center justify-between px-8 sticky top-0 z-30">
          <h1 className="text-xl font-bold font-display text-slate-dark">
            {navLinks.find((l) => pathname === l.href || (l.href !== "/dashboard" && pathname.startsWith(l.href)))?.name || "Portal"}
          </h1>
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme} 
              className="text-slate-mid hover:text-antique-gold transition-colors p-2 rounded-xl bg-cream border border-slate-border/20 hover:bg-slate-border/10 flex items-center justify-center shadow-sm"
              aria-label="Toggle theme"
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <NotificationBell />
          </div>
        </header>

        <div className="p-4 md:p-8">
          {children}
        </div>
        
        {/* Floating Action Button - Mobile Only */}
        {!isManager && (
          <Link href="/dashboard/issues" className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-antique-gold text-white shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 md:hidden">
            <span className="text-3xl leading-none mt-[-4px]">+</span>
          </Link>
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
