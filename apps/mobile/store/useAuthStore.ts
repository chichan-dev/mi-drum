import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type AuthUser = {
    id: string;
    email?: string;
    name?: string;
    picture?: string;
};

type AuthState = {
    token: string | null;
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
};

type AuthActions = {
    setAuth: (token: string, user: AuthUser) => Promise<void>;
    clearAuth: () => Promise<void>;
    setLoading: (loading: boolean) => void;
    initialize: () => Promise<void>;
};

// Storage adapter para expo-secure-store
const secureStorage = {
    getItem: async (key: string): Promise<string | null> => {
        try {
            return await SecureStore.getItemAsync(key);
        } catch (error) {
            console.error("Error reading from SecureStore:", error);
            return null;
        }
    },
    setItem: async (key: string, value: string): Promise<void> => {
        try {
            await SecureStore.setItemAsync(key, value);
        } catch (error) {
            console.error("Error writing to SecureStore:", error);
        }
    },
    removeItem: async (key: string): Promise<void> => {
        try {
            await SecureStore.deleteItemAsync(key);
        } catch (error) {
            console.error("Error removing from SecureStore:", error);
        }
    },
};

export const useAuthStore = create<AuthState & AuthActions>()(
    persist(
        (set, get) => ({
            // State
            token: null,
            user: null,
            isAuthenticated: false,
            isLoading: true,

            // Actions
            setAuth: async (token: string, user: AuthUser) => {
                set({
                    token,
                    user,
                    isAuthenticated: true,
                    isLoading: false,
                });
            },

            clearAuth: async () => {
                set({
                    token: null,
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                });
            },

            setLoading: (loading: boolean) => {
                set({ isLoading: loading });
            },

            initialize: async () => {
                // Esta función se llama al iniciar la app para verificar si hay sesión guardada
                const state = get();
                set({ isLoading: false, isAuthenticated: !!state.token });
            },
        }),
        {
            name: "auth-storage",
            storage: createJSONStorage(() => secureStorage),
            onRehydrateStorage: () => {
                return (state, error) => {
                    if (error) {
                        console.error("Error al rehidratar auth store:", error);
                    }
                    // Marcar como no loading una vez rehidratado
                    if (state) {
                        state.isLoading = false;
                    }
                };
            },
        }
    )
);
