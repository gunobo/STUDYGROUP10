import { create } from "zustand";
import client from "../api/client";

export const useAuthStore = create((set) => ({
  user: null,
  loading: true,

  fetchMe: async () => {
    try {
      const { data } = await client.get("/auth/me");
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
