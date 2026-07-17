import { create } from "zustand";
import client from "../api/client";
import type { User } from "../types";

interface AuthState {
  user: User | null;
  loading: boolean;
  fetchMe: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  fetchMe: async () => {
    try {
      const { data } = await client.get<User>("/auth/me");
      set({ user: data, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },

  logout: async () => {
    await client.post("/auth/logout");
    set({ user: null });
  },
}));
