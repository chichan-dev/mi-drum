import "dotenv/config";

export const env = {
  port: Number(process.env.PORT ?? 2700),
  publicUrl: process.env.PUBLIC_URL ?? `http://localhost:${process.env.PORT ?? 2700}`,
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-me",
  spotifyClientId: process.env.SPOTIFY_CLIENT_ID ?? "",
  spotifyClientSecret: process.env.SPOTIFY_CLIENT_SECRET ?? "",
  get spotifyRedirectUri() {
    return process.env.SPOTIFY_REDIRECT_URI ?? `${env.publicUrl}/auth/spotify/callback`;
  },
  jamendoClientId: process.env.JAMENDO_CLIENT_ID ?? "",
};

/**
 * El acceso de developer.spotify.com está cerrado para apps nuevas por
 * ahora (ver README). En vez de tirar el server abajo si falta la config,
 * las rutas de Spotify se montan solo si hay credenciales — así se puede
 * seguir usando Jamendo mientras tanto sin tocar este código.
 */
export function isSpotifyConfigured(): boolean {
  return Boolean(env.spotifyClientId && env.spotifyClientSecret);
}

export function isJamendoConfigured(): boolean {
  return Boolean(env.jamendoClientId);
}
