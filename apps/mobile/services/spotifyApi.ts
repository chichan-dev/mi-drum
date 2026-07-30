import { useSpotifyStore } from "@/store/useSpotifyStore";

// Backend propio (apps/api) para Spotify. En un dispositivo físico definí
// EXPO_PUBLIC_SPOTIFY_API_URL con la IP LAN de tu máquina, ej.
// http://192.168.x.x:2700
export const SPOTIFY_API_BASE =
  process.env.EXPO_PUBLIC_SPOTIFY_API_URL ?? "http://localhost:2700";

export type SpotifyTrack = {
  id: string;
  name: string;
  uri: string;
  artists: { name: string }[];
  album?: { name?: string; images?: { url: string }[] };
  duration_ms: number;
};

async function spotifyApiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = useSpotifyStore.getState().token;
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${SPOTIFY_API_BASE}${path}`, { ...init, headers });

  if (response.status === 204) {
    return {} as T;
  }

  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || response.statusText || "Error en la API de Spotify");
  }
  if (!text) return {} as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

export function fetchSpotifyProfile() {
  return spotifyApiFetch<{ id: string; display_name?: string; product?: string }>("/spotify/me");
}

export async function searchSpotifyTracks(query: string): Promise<SpotifyTrack[]> {
  const params = new URLSearchParams({ q: query, type: "track" });
  const data = await spotifyApiFetch<{ tracks?: { items?: SpotifyTrack[] } }>(
    `/spotify/search?${params.toString()}`
  );
  return data.tracks?.items ?? [];
}

export type SpotifyPlayerState = {
  is_playing: boolean;
  progress_ms: number | null;
  item: SpotifyTrack | null;
  device?: { id: string; name: string; volume_percent: number };
};

export function fetchSpotifyPlayerState() {
  return spotifyApiFetch<SpotifyPlayerState | null>("/spotify/player/state");
}

export function playSpotifyTrack(uri: string) {
  return spotifyApiFetch<void>("/spotify/player/play", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uri }),
  });
}

export function resumeSpotifyPlayback() {
  return spotifyApiFetch<void>("/spotify/player/play", { method: "PUT" });
}

export function pauseSpotifyPlayback() {
  return spotifyApiFetch<void>("/spotify/player/pause", { method: "PUT" });
}

export function nextSpotifyTrack() {
  return spotifyApiFetch<void>("/spotify/player/next", { method: "POST" });
}

export function previousSpotifyTrack() {
  return spotifyApiFetch<void>("/spotify/player/previous", { method: "POST" });
}

export function seekSpotifyPlayback(positionMs: number) {
  return spotifyApiFetch<void>(`/spotify/player/seek?position_ms=${Math.round(positionMs)}`, {
    method: "PUT",
  });
}
