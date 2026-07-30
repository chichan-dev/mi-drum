import { Router } from "express";
import { env } from "../env";
import { exchangeCodeForTokens, SPOTIFY_SCOPES } from "../auth/spotify";
import { signAppToken } from "../auth/jwt";
import { upsertSpotifyAccount } from "../db";

export const authRouter = Router();

type SpotifyProfile = {
  id: string;
  display_name?: string;
  product?: string;
};

authRouter.get("/spotify/login", (req, res) => {
  const redirectUri = req.query.redirect_uri;
  if (typeof redirectUri !== "string" || redirectUri.length === 0) {
    res.status(400).json({ error: "Falta el parámetro redirect_uri" });
    return;
  }

  const state = Buffer.from(redirectUri, "utf8").toString("base64url");
  const authorizeUrl = new URL("https://accounts.spotify.com/authorize");
  authorizeUrl.searchParams.set("client_id", env.spotifyClientId);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("redirect_uri", env.spotifyRedirectUri);
  authorizeUrl.searchParams.set("scope", SPOTIFY_SCOPES);
  authorizeUrl.searchParams.set("state", state);

  res.redirect(authorizeUrl.toString());
});

authRouter.get("/spotify/callback", async (req, res) => {
  const { code, state, error } = req.query;

  const appRedirectUri =
    typeof state === "string"
      ? Buffer.from(state, "base64url").toString("utf8")
      : undefined;

  const failTo = (message: string) => {
    if (appRedirectUri) {
      const url = new URL(appRedirectUri);
      url.searchParams.set("error", message);
      res.redirect(url.toString());
      return;
    }
    res.status(400).send(message);
  };

  if (error) {
    failTo(String(error));
    return;
  }
  if (typeof code !== "string" || !appRedirectUri) {
    failTo("Faltan parámetros en la respuesta de Spotify");
    return;
  }

  try {
    const tokens = await exchangeCodeForTokens(code);

    const profileRes = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!profileRes.ok) {
      throw new Error(`No se pudo obtener el perfil de Spotify (${profileRes.status})`);
    }
    const profile = (await profileRes.json()) as SpotifyProfile;

    const userId = `spotify:${profile.id}`;
    const expiresAt = Math.floor(Date.now() / 1000) + tokens.expires_in;

    upsertSpotifyAccount({
      user_id: userId,
      spotify_user_id: profile.id,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? "",
      expires_at: expiresAt,
      display_name: profile.display_name ?? null,
      product: profile.product ?? null,
    });

    const appToken = signAppToken({ userId });

    const url = new URL(appRedirectUri);
    url.searchParams.set("token", appToken);
    url.searchParams.set("userId", userId);
    res.redirect(url.toString());
  } catch (err) {
    failTo(err instanceof Error ? err.message : "Error autenticando con Spotify");
  }
});
