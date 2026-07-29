import cors from "cors";
import express from "express";
import { env, isJamendoConfigured, isSpotifyConfigured } from "./env";
import { authRouter } from "./routes/auth";
import { spotifyRouter } from "./routes/spotify";
import { jamendoRouter } from "./routes/jamendo";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, spotify: isSpotifyConfigured(), jamendo: isJamendoConfigured() });
});

app.use("/jamendo", jamendoRouter);

// El acceso a developer.spotify.com está cerrado para apps nuevas por ahora
// (ver README). Estas rutas quedan listas para cuando se pueda volver a dar
// de alta la app; mientras tanto no se montan si falta la config, en vez de
// tirar el server abajo.
if (isSpotifyConfigured()) {
  app.use("/auth", authRouter);
  app.use("/spotify", spotifyRouter);
} else {
  console.warn(
    "[spotify] SPOTIFY_CLIENT_ID/SECRET no configurados: rutas /auth/spotify y /spotify deshabilitadas. Usando Jamendo mientras tanto."
  );
}

if (!isJamendoConfigured()) {
  console.warn(
    "[jamendo] JAMENDO_CLIENT_ID no configurado: /jamendo/search va a devolver 503."
  );
}

app.listen(env.port, () => {
  console.log(`DarkBass API escuchando en ${env.publicUrl} (puerto ${env.port})`);
});
