import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type SpotifyProfile = {
  id: string;
  display_name?: string;
  product?: string;
  images?: { url: string }[];
};

type SpotifyState = {
  token: string | null;
  userId: string | null;
  profile: SpotifyProfile | null;
  isConnected: boolean;
};

type SpotifyActions = {
  setAuth: (token: string, userId: string) => void;
  setProfile: (profile: SpotifyProfile) => void;
  disconnect: () => void;
};

const secureStorage = {
  getItem: async (key: string) => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // ignore
    }
  },
  removeItem: async (key: string) => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // ignore
    }
  },
};

export const useSpotifyStore = create<SpotifyState & SpotifyActions>()(
  persist(
    (set) => ({
      token: null,
      userId: null,
      profile: null,
      isConnected: false,

      setAuth: (token, userId) => set({ token, userId, isConnected: true }),
      setProfile: (profile) => set({ profile }),
      disconnect: () =>
        set({ token: null, userId: null, profile: null, isConnected: false }),
    }),
    {
      name: "spotify-storage",
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
