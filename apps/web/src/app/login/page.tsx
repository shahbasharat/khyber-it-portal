"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema, type LoginInput } from "@khyber/schemas";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { Mail, KeyRound, ShieldAlert, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema as any),
  });

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);
    try {
      const response = await api.post("/auth/login", data);
      setAuth(response.data.user, response.data.accessToken);
      router.push("/dashboard");
    } catch (error: any) {
      setServerError(
        error.response?.data?.error || "Cannot connect. Check your internet connection."
      );
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0F1E1B] to-[#19433E] px-4 relative overflow-hidden">
      {/* Soft branding blur circles */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-antique-gold/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-white/5 rounded-full blur-3xl" />

      <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-10 w-full max-w-md border border-antique-gold/20 backdrop-blur-md relative z-10 flex flex-col gap-6">
        
        {/* 1. BRAND LOGO */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center border-2 border-antique-gold shadow-md mb-4 overflow-hidden p-0.5">
            <img src="/logo.png" alt="The Khyber Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="font-display font-extrabold text-fir-green text-2xl uppercase tracking-wider leading-none">THE KHYBER</h1>
          <p className="text-[10px] font-sans font-bold text-antique-gold uppercase tracking-widest leading-none mt-1.5">IT Operations Portal</p>
          <p className="text-slate-mid text-xs mt-3">Provide your engineering credentials to access the secure shift dashboard</p>
        </div>

        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2.5 text-xs font-semibold">
            <ShieldAlert size={16} className="shrink-0 text-red-600" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          {/* Email input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-dark uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <input
                type="email"
                {...register("email")}
                className={`w-full pl-11 pr-4 py-3 bg-cream/30 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-antique-gold focus:border-antique-gold transition-all ${
                  errors.email ? "border-red-400" : "border-slate-border"
                }`}
                placeholder="itmanager@khyberhotel.com"
              />
              <Mail size={16} className="absolute left-4 top-3.5 text-slate-mid" />
            </div>
            {errors.email && (
              <span className="text-[10px] font-semibold text-red-600 mt-0.5">{errors.email.message}</span>
            )}
          </div>

          {/* Password input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-dark uppercase tracking-wider">Security Password</label>
            <div className="relative">
              <input
                type="password"
                {...register("password")}
                className={`w-full pl-11 pr-4 py-3 bg-cream/30 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-antique-gold focus:border-antique-gold transition-all ${
                  errors.password ? "border-red-400" : "border-slate-border"
                }`}
                placeholder="••••••••"
              />
              <KeyRound size={16} className="absolute left-4 top-3.5 text-slate-mid" />
            </div>
            {errors.password && (
              <span className="text-[10px] font-semibold text-red-600 mt-0.5">{errors.password.message}</span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-antique-gold to-antique-gold-dark text-white py-3.5 rounded-xl text-sm font-bold transition-all shadow-md hover:brightness-105 active:scale-[0.99] disabled:opacity-50 mt-6 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Securing tunnel...
              </>
            ) : (
              "Authorize Access"
            )}
          </button>
        </form>
        
        {/* Fine print */}
        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-[9px] font-sans font-medium text-slate-mid uppercase tracking-widest">
            Protected by Khyber Security Systems • Gulmarg
          </p>
        </div>
      </div>
    </main>
  );
}
