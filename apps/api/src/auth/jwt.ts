import jwt from "jsonwebtoken";
import { env } from "../env";

export type AppJwtPayload = {
  userId: string;
};

export function signAppToken(payload: AppJwtPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: "30d" });
}

export function verifyAppToken(token: string): AppJwtPayload {
  return jwt.verify(token, env.jwtSecret) as AppJwtPayload;
}
