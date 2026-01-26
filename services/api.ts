export type ApiProfile = {
  id?: string;
  email?: string;
  name?: string;
  picture?: string;
};

export type ApiChannel = {
  id?: string;
  title?: string;
  description?: string;
  thumbnail?: string;
};

export type ApiPlaylist = {
  id?: string;
  title?: string;
  itemCount?: number;
};

export type ApiTrack = {
  id: string;
  title: string;
  artist?: string;
  thumbnail?: string;
  streamUrl?: string;
};

// Si usas dispositivo físico, define EXPO_PUBLIC_LAN_HOST en .env con la IP de tu máquina.
const envLanHost = process.env.EXPO_PUBLIC_LAN_HOST?.trim();
const fallbackLanHost = "192.168.80.26";
const resolvedHost = envLanHost && envLanHost.length > 0 ? envLanHost : fallbackLanHost;

export const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? `http://${resolvedHost}:2600`;
export const AUTH_URL =
  process.env.EXPO_PUBLIC_AUTH_URL ?? `http://${resolvedHost}:3000/auth/google`;

// Variable global para almacenar el token actual
let currentAuthToken: string | null = null;

export function setAuthToken(token: string | null) {
  currentAuthToken = token;
}

export function getAuthToken(): string | null {
  return currentAuthToken;
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(init?.headers as Record<string, string> ?? {}),
  };

  // Añadir token si está disponible
  if (currentAuthToken) {
    headers.Authorization = `Bearer ${currentAuthToken}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  const text = await response.text();
  if (!response.ok) {
    const message = text || response.statusText || "Error en la API";
    throw new Error(message);
  }

  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch (_e) {
    return text as unknown as T;
  }
}

const pickString = (value: unknown) =>
  typeof value === "string" && value.trim().length > 0 ? value : undefined;

export function normalizeTrack(raw: any): ApiTrack {
  const title = pickString(raw?.title) ?? pickString(raw?.name) ?? "Pista";
  const artist =
    pickString(raw?.artist) ??
    pickString(raw?.channelTitle) ??
    pickString(raw?.channel) ??
    pickString(raw?.author) ??
    pickString(raw?.owner) ??
    undefined;

  const thumbnail =
    pickString(raw?.thumbnail) ??
    pickString(raw?.thumbnailUrl) ??
    pickString(raw?.thumbnails?.medium?.url) ??
    pickString(raw?.thumbnails?.high?.url) ??
    pickString(raw?.thumbnails?.default?.url) ??
    undefined;

  const urlCandidates = [
    raw?.streamUrl,
    raw?.audioUrl,
    raw?.playUrl,
    raw?.url,
    raw?.source,
    raw?.source?.url,
  ];
  const streamUrl = urlCandidates.find(
    (u) => typeof u === "string" && /^https?:\/\//.test(u)
  );

  const id =
    pickString(raw?.id) ??
    pickString(raw?.videoId) ??
    pickString(raw?.resourceId?.videoId) ??
    pickString(raw?.url) ??
    `${title}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    id,
    title,
    artist,
    thumbnail,
    streamUrl,
  };
}

export async function fetchProfile() {
  return fetchJson<ApiProfile>("/me");
}

export async function fetchChannel() {
  const data = await fetchJson<any>("/youtube/me/channel");
  if (!data) return null;
  return {
    id: data.id,
    title: data.title ?? data.name,
    description: data.description,
    thumbnail:
      pickString(data.thumbnail) ??
      pickString(data?.thumbnails?.default?.url) ??
      pickString(data?.thumbnails?.high?.url),
  } as ApiChannel;
}

export async function fetchPlaylists() {
  const data = await fetchJson<any[]>("/youtube/me/playlists");
  if (!Array.isArray(data)) return [];
  return data.map((item) => ({
    id: item.id ?? item.playlistId,
    title: item.title ?? item.name,
    itemCount: item.itemCount ?? item.totalItems,
  })) as ApiPlaylist[];
}

export async function fetchLiked() {
  const data = await fetchJson<any[]>("/youtube/me/liked");
  if (!Array.isArray(data)) return [];
  return data.map(normalizeTrack);
}

export async function searchMusic(query: string) {
  const q = encodeURIComponent(query.trim());
  const data = await fetchJson<any[]>(`/youtube/search/music?q=${q}`);
  if (!Array.isArray(data)) return [];
  return data.map(normalizeTrack);
}
