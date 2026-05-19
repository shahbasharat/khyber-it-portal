import { create } from "zustand";
import { api } from "@/lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  role: "MANAGER" | "ENGINEER" | "SENIOR_ASSOCIATE" | "ASSOCIATE" | "VIEWER";
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
  },
  initAuth: async () => {
    try {
      // First refresh to get a valid access token (handles page reloads)
      const refreshRes = await api.post("/auth/refresh");
      const { accessToken } = refreshRes.data;

      // Then fetch the current user profile
      const meRes = await api.get("/auth/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      set({ user: meRes.data, accessToken, isInitialized: true });
    } catch {
      // No valid session — mark as initialized so the app can redirect to login
      set({ isInitialized: true });
    }
  },
}));
