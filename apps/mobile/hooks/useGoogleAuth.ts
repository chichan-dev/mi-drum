import { API_BASE, fetchProfile, setAuthToken } from "@/services/api";
import { AuthUser, useAuthStore } from "@/store/useAuthStore";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

// Necesario para que el navegador se cierre automáticamente después del login
WebBrowser.maybeCompleteAuthSession();

const platformLocalhost =
    Platform.select({
        android: "10.0.2.2",
        ios: "https://presolar-nonimitatively-buster.ngrok-free.dev",
        default: "localhost",
    }) ?? "localhost";

const REDIRECT_URI = AuthSession.makeRedirectUri({
    scheme: "mi-drum-app",
    path: "auth",
});

export function useGoogleAuth() {
    const { setAuth, clearAuth, setLoading, token } = useAuthStore();
    const [error, setError] = useState<string | null>(null);

    // Configurar el token en el servicio API cuando cambie
    useEffect(() => {
        setAuthToken(token);
    }, [token]);

    const loginWithGoogle = async () => {
        try {
            setLoading(true);
            setError(null);

            // Abrir el navegador para OAuth
            const authUrl = `${API_BASE}/auth/google?redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
            const result = await WebBrowser.openAuthSessionAsync(authUrl, REDIRECT_URI);

            if (result.type === "success" && result.url) {
                // Extraer el token de la URL de redirect
                const url = new URL(result.url);
                const token = url.searchParams.get("token");
                const userId = url.searchParams.get("userId");

                if (!token) {
                    throw new Error("No se recibió el token de autenticación");
                }

                // Configurar el token para las próximas llamadas
                setAuthToken(token);

                // Obtener perfil del usuario
                const profile = await fetchProfile();

                const user: AuthUser = {
                    id: userId || profile.id || "unknown",
                    email: profile.email,
                    name: profile.name,
                    picture: profile.picture,
                };

                await setAuth(token, user);
                setLoading(false);
                return { success: true, user };
            } else if (result.type === "cancel") {
                setLoading(false);
                setError("Autenticación cancelada");
                return { success: false, error: "Cancelado por el usuario" };
            } else {
                setLoading(false);
                setError("Error en la autenticación");
                return { success: false, error: "Error desconocido" };
            }
        } catch (err) {
            setLoading(false);
            const message = err instanceof Error ? err.message : "Error al iniciar sesión";
            setError(message);
            return { success: false, error: message };
        }
    };

    const logout = async () => {
        setAuthToken(null);
        await clearAuth();
    };

    return {
        loginWithGoogle,
        logout,
        error,
    };
}
