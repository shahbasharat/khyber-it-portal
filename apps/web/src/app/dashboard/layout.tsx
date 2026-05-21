"use client";

import { useAuthStore } from "@/store/authStore";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Home, CheckSquare, AlertCircle, FileText, Settings, LogOut, Package, Wrench, AlertTriangle, Sun, Moon, Key, MoreHorizontal, Wifi } from "lucide-react";
import { api } from "@/lib/api";
import { NotificationBell } from "@/app/components/NotificationBell";
import { OfflineBanner } from "@/app/components/OfflineBanner";
import { Modal } from "@/app/components/Modal";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Change Password States
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError("");
    setPwdSuccess(false);

    if (newPassword !== confirmPassword) {
      setPwdError("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setPwdError("New password must be at least 6 characters long");
      return;
    }

    setIsSavingPassword(true);
    try {
      await api.post("/auth/change-password", { currentPassword, newPassword });
      setPwdSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPwdSuccess(false);
      }, 1500);
    } catch (err: any) {
      setPwdError(err.response?.data?.error || "Failed to change password");
    } finally {
      setIsSavingPassword(false);
    }
  };

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
    { name: "Guest Wi-Fi", href: "/dashboard/guest-wifi", icon: Wifi },
    ...(isManager ? [{ name: "Admin", href: "/dashboard/admin/users", icon: Settings }] : []),
  ];

  return (
    <div className="min-h-screen bg-cream flex flex-col md:flex-row">
      {/* Top Header - Mobile Only */}
      <header className="md:hidden h-14 bg-white border-b border-slate-border/50 flex items-center justify-between px-4 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center border border-slate-border/50 overflow-hidden shrink-0 p-0.5">
            <img src="/logo.png" alt="The Khyber Logo" className="w-full h-full object-contain" />
          </div>
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
          <button 
            onClick={() => setIsPasswordModalOpen(true)} 
            className="text-slate-mid hover:text-antique-gold p-1"
            title="Change Password"
          >
            <Key size={18} />
          </button>
          <button onClick={handleLogout} className="text-slate-mid hover:text-color-error p-1">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Sidebar - Desktop Only */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-slate-border/50 fixed h-full z-40">
        <div className="h-16 flex items-center px-6 border-b border-slate-border/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-slate-border/50 overflow-hidden shrink-0 p-0.5">
              <img src="/logo.png" alt="The Khyber Logo" className="w-full h-full object-contain" />
            </div>
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
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setIsPasswordModalOpen(true)} 
                className="text-slate-mid hover:text-antique-gold p-2 transition-colors rounded-lg hover:bg-cream"
                title="Change Password"
              >
                <Key size={18} />
              </button>
              <button 
                onClick={handleLogout} 
                className="text-slate-mid hover:text-color-error p-2 transition-colors rounded-lg hover:bg-red-50"
                title="Log Out"
              >
                <LogOut size={18} />
              </button>
            </div>
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
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className={`flex flex-col items-center justify-center w-full h-full gap-1 ${
            isMobileMenuOpen ? "text-fir-green" : "text-slate-mid"
          }`}
        >
          <MoreHorizontal size={24} />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </nav>

      {/* Mobile slide-up More menu overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-50 md:hidden bg-slate-dark/40 backdrop-blur-sm animate-in fade-in duration-200" 
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div 
            className="fixed bottom-0 left-0 w-full bg-white rounded-t-3xl shadow-2xl p-6 border-t border-slate-border/50 flex flex-col gap-4 animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-border/30 pb-3">
              <span className="text-sm font-bold text-slate-dark font-display uppercase tracking-wider">More Operations</span>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-slate-mid hover:text-slate-dark text-xs font-bold bg-cream px-3 py-1 rounded-full border border-slate-border/40 transition-colors"
              >
                Close
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-4 py-2">
              {navLinks.slice(4).map((link) => {
                const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
                const Icon = link.icon;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                      isActive 
                        ? "bg-fir-green-subtle border-fir-green text-fir-green shadow-xs" 
                        : "bg-cream/45 border-slate-border/30 text-slate-dark hover:bg-cream"
                    }`}
                  >
                    <Icon size={22} className="mb-1.5" />
                    <span className="text-[10px] font-bold text-center leading-none">{link.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      <Modal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} title="Change Your Password">
        <form onSubmit={handlePasswordChange} className="space-y-4 mt-4">
          {pwdError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-xl text-xs font-semibold">
              {pwdError}
            </div>
          )}
          {pwdSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-3.5 py-2.5 rounded-xl text-xs font-semibold">
              🎉 Password updated successfully!
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-dark mb-1">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-border focus:ring-2 focus:ring-fir-green outline-none"
              placeholder="••••••••"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-dark mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-border focus:ring-2 focus:ring-fir-green outline-none"
              placeholder="•••••••• (Min 6 characters)"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-dark mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-border focus:ring-2 focus:ring-fir-green outline-none"
              placeholder="••••••••"
              required
            />
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              disabled={isSavingPassword}
              onClick={() => setIsPasswordModalOpen(false)}
              className="px-4 py-2 font-medium text-slate-mid hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingPassword}
              className="px-4 py-2 font-medium bg-fir-green text-white hover:bg-fir-green-light rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSavingPassword ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
