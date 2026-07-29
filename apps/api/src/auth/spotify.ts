import { env } from "../env";
import { getSpotifyAccount, updateSpotifyTokens } from "../db";

const TOKEN_URL = "https://accounts.spotify.com/api/token";
const API_BASE = "https://api.spotify.com/v1";

export const SPOTIFY_SCOPES = [
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
  "playlist-read-private",
  "user-library-read",
].join(" ");

function basicAuthHeader() {
  const raw = `${env.spotifyClientId}:${env.spotifyClientSecret}`;
  return `Basic ${Buffer.from(raw).toString("base64")}`;
}

type SpotifyTokenResponse = {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token?: string;
};

export async function exchangeCodeForTokens(code: string): Promise<SpotifyTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: env.spotifyRedirectUri,
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`No se pudo intercambiar el código de Spotify: ${text}`);
  }

  return res.json() as Promise<SpotifyTokenResponse>;
}

async function refreshAccessToken(refreshToken: string): Promise<SpotifyTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`No se pudo refrescar el token de Spotify: ${text}`);
  }

  return res.json() as Promise<SpotifyTokenResponse>;
}

/**
 * Devuelve un access_token válido para el usuario, refrescándolo contra
 * Spotify si ya venció (con 60s de margen).
 */
export async function getValidAccessToken(userId: string): Promise<string> {
  const account = getSpotifyAccount(userId);
  if (!account) {
    throw new Error("Cuenta de Spotify no vinculada para este usuario");
  }

  const now = Math.floor(Date.now() / 1000);
  if (account.expires_at - 60 > now) {
    return account.access_token;
  }

  const refreshed = await refreshAccessToken(account.refresh_token);
  const expiresAt = now + refreshed.expires_in;
  updateSpotifyTokens(userId, refreshed.access_token, expiresAt, refreshed.refresh_token);
  return refreshed.access_token;
}

/**
 * Llama a la Web API de Spotify autenticado como el usuario, refrescando el
 * token automáticamente si hace falta.
 */
export async function spotifyFetch(
  userId: string,
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const accessToken = await getValidAccessToken(userId);
  return fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init.headers as Record<string, string> | undefined),
      Authorization: `Bearer ${accessToken}`,
    },
  });
}
