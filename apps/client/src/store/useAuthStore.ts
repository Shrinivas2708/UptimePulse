import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface AuthState {
  token: string | null; // We'll store the JWT here
  isAuthenticated: boolean;
  login: (token: string) => void; // The login function now accepts a token
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      isAuthenticated: false,
      login: (token: string) => {
        console.log("Storing token and setting auth state...");
        set({ token, isAuthenticated: true });
      },
      logout: () => {
        console.log("Clearing token and logging out...");
        set({ token: null, isAuthenticated: false });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
