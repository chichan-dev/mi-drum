import Database from "better-sqlite3";
import path from "path";

const dbPath = path.resolve(__dirname, "../data.sqlite");
export const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS spotify_accounts (
    user_id TEXT PRIMARY KEY,
    spotify_user_id TEXT NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    display_name TEXT,
    product TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );
`);

export type SpotifyAccountRow = {
  user_id: string;
  spotify_user_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: number;
  display_name: string | null;
  product: string | null;
  created_at: number;
};

export function upsertSpotifyAccount(row: Omit<SpotifyAccountRow, "created_at">) {
  db.prepare(
    `INSERT INTO spotify_accounts (user_id, spotify_user_id, access_token, refresh_token, expires_at, display_name, product)
     VALUES (@user_id, @spotify_user_id, @access_token, @refresh_token, @expires_at, @display_name, @product)
     ON CONFLICT(user_id) DO UPDATE SET
       spotify_user_id = excluded.spotify_user_id,
       access_token = excluded.access_token,
       refresh_token = excluded.refresh_token,
       expires_at = excluded.expires_at,
       display_name = excluded.display_name,
       product = excluded.product`
  ).run(row);
}

export function getSpotifyAccount(userId: string): SpotifyAccountRow | undefined {
  return db
    .prepare(`SELECT * FROM spotify_accounts WHERE user_id = ?`)
    .get(userId) as SpotifyAccountRow | undefined;
}

export function updateSpotifyTokens(
  userId: string,
  accessToken: string,
  expiresAt: number,
  refreshToken?: string
) {
  if (refreshToken) {
    db.prepare(
      `UPDATE spotify_accounts SET access_token = ?, expires_at = ?, refresh_token = ? WHERE user_id = ?`
    ).run(accessToken, expiresAt, refreshToken, userId);
  } else {
    db.prepare(
      `UPDATE spotify_accounts SET access_token = ?, expires_at = ? WHERE user_id = ?`
    ).run(accessToken, expiresAt, userId);
  }
}
