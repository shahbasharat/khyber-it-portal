import { create } from "zustand";
import { api } from "@/lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  role: "MANAGER" | "ENGINEER";
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isInitialized: boolean;
  setAuth: (user: User, accessToken: string) => void;
  logout: () => void;
  initAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isInitialized: false,
  setAuth: (user, accessToken) => set({ user, accessToken, isInitialized: true }),
  logout: () => {
    set({ user: null, accessToken: null, isInitialized: true });
    // Cleanup local storage if any
  },
  initAuth: async () => {
    try {
      const response = await api.get("/auth/me");
      set({ user: response.data, isInitialized: true });
    } catch (error) {
      set({ isInitialized: true });
    }
  },
}));
