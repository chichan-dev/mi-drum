import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";

import { SPOTIFY_API_BASE, fetchSpotifyProfile } from "@/services/spotifyApi";
import { useSpotifyStore } from "@/store/useSpotifyStore";

WebBrowser.maybeCompleteAuthSession();

const REDIRECT_URI = AuthSession.makeRedirectUri({
  scheme: "mi-drum-app",
  path: "spotify-auth",
});

export function useSpotifyAuth() {
  const { setAuth, setProfile, disconnect } = useSpotifyStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const loginUrl = `${SPOTIFY_API_BASE}/auth/spotify/login?redirect_uri=${encodeURIComponent(
        REDIRECT_URI
      )}`;
      const result = await WebBrowser.openAuthSessionAsync(loginUrl, REDIRECT_URI);

      if (result.type !== "success" || !result.url) {
        if (result.type !== "cancel") {
          setError("No se pudo completar la conexión con Spotify");
        }
        return { success: false };
      }

      const url = new URL(result.url);
      const token = url.searchParams.get("token");
      const userId = url.searchParams.get("userId");
      const apiError = url.searchParams.get("error");

      if (apiError) {
        setError(apiError);
        return { success: false };
      }
      if (!token || !userId) {
        setError("Respuesta de autenticación incompleta");
        return { success: false };
      }

      setAuth(token, userId);

      try {
        const profile = await fetchSpotifyProfile();
        setProfile(profile);
      } catch {
        // el perfil se puede refrescar después; no bloquea la conexión
      }

      return { success: true };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error conectando con Spotify");
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  return { connect, disconnect, isLoading, error };
}
