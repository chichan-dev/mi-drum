import { Router } from "express";
import { env } from "../env";

export const jamendoRouter = Router();

const JAMENDO_BASE = "https://api.jamendo.com/v3.0";

type JamendoTrackRaw = {
  id: string;
  name: string;
  artist_name: string;
  album_name?: string;
  album_image?: string;
  image?: string;
  duration: number;
  audio: string;
  audiodownload?: string;
};

export type JamendoTrack = {
  id: string;
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
  durationMs: number;
  streamUrl: string;
};

function normalize(raw: JamendoTrackRaw): JamendoTrack {
  return {
    id: raw.id,
    title: raw.name,
    artist: raw.artist_name,
    album: raw.album_name,
    artwork: raw.album_image || raw.image,
    durationMs: (raw.duration ?? 0) * 1000,
    streamUrl: raw.audio,
  };
}

jamendoRouter.get("/search", async (req, res) => {
  if (!env.jamendoClientId) {
    res.status(503).json({ error: "JAMENDO_CLIENT_ID no configurado en apps/api/.env" });
    return;
  }

  const q = req.query.q;
  if (typeof q !== "string" || !q.trim()) {
    res.status(400).json({ error: "Falta el parámetro q" });
    return;
  }

  const params = new URLSearchParams({
    client_id: env.jamendoClientId,
    format: "json",
    limit: "20",
    search: q,
    audioformat: "mp32",
    include: "musicinfo",
  });

  try {
    const jamendoRes = await fetch(`${JAMENDO_BASE}/tracks/?${params.toString()}`);
    if (!jamendoRes.ok) {
      throw new Error(`Jamendo respondió ${jamendoRes.status}`);
    }
    const data = (await jamendoRes.json()) as { results?: JamendoTrackRaw[] };
    const tracks = (data.results ?? []).map(normalize);
    res.json({ tracks });
  } catch (err) {
    res.status(502).json({
      error: err instanceof Error ? err.message : "Error consultando Jamendo",
    });
  }
});
