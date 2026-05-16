"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema, type LoginInput } from "@khyber/schemas";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
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
    <main className="min-h-screen flex items-center justify-center bg-cream px-4">
      <div className="bg-white rounded-xl shadow-base p-8 w-full max-w-md border border-slate-border/50">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-display text-fir-green">Khyber IT Portal</h1>
          <p className="text-slate-mid mt-2">Sign in to your account</p>
        </div>

        {serverError && (
          <div className="bg-[#FDECEA] text-[#C0392B] p-3 rounded mb-6 text-sm font-medium">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-dark">Email *</label>
            <input
              type="email"
              {...register("email")}
              className={`w-full px-4 py-3 rounded border text-base focus:outline-none focus:ring-2 focus:ring-fir-green ${
                errors.email ? "border-color-error" : "border-slate-border"
              }`}
              placeholder="e.g. itmanager@khyberhotel.com"
            />
            {errors.email && (
              <span className="text-xs text-color-error">{errors.email.message}</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-dark">Password *</label>
            <input
              type="password"
              {...register("password")}
              className={`w-full px-4 py-3 rounded border text-base focus:outline-none focus:ring-2 focus:ring-fir-green ${
                errors.password ? "border-color-error" : "border-slate-border"
              }`}
            />
            {errors.password && (
              <span className="text-xs text-color-error">{errors.password.message}</span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-fir-green text-white px-5 py-3 rounded text-base font-semibold transition-colors duration-200 hover:bg-fir-green-light disabled:opacity-50 mt-4"
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </main>
  );
}
