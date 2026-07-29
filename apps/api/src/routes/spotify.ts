import { Router } from "express";
import { spotifyFetch } from "../auth/spotify";
import { AuthedRequest, requireAuth } from "../middleware/requireAuth";

export const spotifyRouter = Router();
spotifyRouter.use(requireAuth);

/** Reenvía la respuesta de Spotify tal cual, incluyendo el status. */
async function forward(res: import("express").Response, spotifyRes: Response) {
  if (spotifyRes.status === 204) {
    res.status(204).end();
    return;
  }
  const text = await spotifyRes.text();
  res.status(spotifyRes.status);
  if (!text) {
    res.end();
    return;
  }
  try {
    res.json(JSON.parse(text));
  } catch {
    res.send(text);
  }
}

spotifyRouter.get("/me", async (req: AuthedRequest, res) => {
  const spotifyRes = await spotifyFetch(req.userId!, "/me");
  await forward(res, spotifyRes);
});

spotifyRouter.get("/search", async (req: AuthedRequest, res) => {
  const q = req.query.q;
  if (typeof q !== "string" || !q.trim()) {
    res.status(400).json({ error: "Falta el parámetro q" });
    return;
  }
  const type = typeof req.query.type === "string" ? req.query.type : "track";
  const params = new URLSearchParams({ q, type, limit: "20" });
  const spotifyRes = await spotifyFetch(req.userId!, `/search?${params.toString()}`);
  await forward(res, spotifyRes);
});

spotifyRouter.get("/devices", async (req: AuthedRequest, res) => {
  const spotifyRes = await spotifyFetch(req.userId!, "/me/player/devices");
  await forward(res, spotifyRes);
});

spotifyRouter.get("/player/state", async (req: AuthedRequest, res) => {
  const spotifyRes = await spotifyFetch(req.userId!, "/me/player");
  await forward(res, spotifyRes);
});

spotifyRouter.put("/player/play", async (req: AuthedRequest, res) => {
  const { uri, deviceId } = req.body ?? {};
  const params = deviceId ? `?device_id=${encodeURIComponent(deviceId)}` : "";
  const body = uri ? JSON.stringify({ uris: [uri] }) : undefined;
  const spotifyRes = await spotifyFetch(req.userId!, `/me/player/play${params}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body,
  });
  await forward(res, spotifyRes);
});

spotifyRouter.put("/player/pause", async (req: AuthedRequest, res) => {
  const spotifyRes = await spotifyFetch(req.userId!, "/me/player/pause", { method: "PUT" });
  await forward(res, spotifyRes);
});

spotifyRouter.post("/player/next", async (req: AuthedRequest, res) => {
  const spotifyRes = await spotifyFetch(req.userId!, "/me/player/next", { method: "POST" });
  await forward(res, spotifyRes);
});

spotifyRouter.post("/player/previous", async (req: AuthedRequest, res) => {
  const spotifyRes = await spotifyFetch(req.userId!, "/me/player/previous", { method: "POST" });
  await forward(res, spotifyRes);
});

spotifyRouter.put("/player/seek", async (req: AuthedRequest, res) => {
  const positionMs = req.query.position_ms;
  if (typeof positionMs !== "string") {
    res.status(400).json({ error: "Falta el parámetro position_ms" });
    return;
  }
  const spotifyRes = await spotifyFetch(
    req.userId!,
    `/me/player/seek?position_ms=${encodeURIComponent(positionMs)}`,
    { method: "PUT" }
  );
  await forward(res, spotifyRes);
});

spotifyRouter.put("/player/volume", async (req: AuthedRequest, res) => {
  const volumePercent = req.query.volume_percent;
  if (typeof volumePercent !== "string") {
    res.status(400).json({ error: "Falta el parámetro volume_percent" });
    return;
  }
  const spotifyRes = await spotifyFetch(
    req.userId!,
    `/me/player/volume?volume_percent=${encodeURIComponent(volumePercent)}`,
    { method: "PUT" }
  );
  await forward(res, spotifyRes);
});
