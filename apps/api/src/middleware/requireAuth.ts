import { NextFunction, Request, Response } from "express";
import { verifyAppToken } from "../auth/jwt";

export type AuthedRequest = Request & { userId?: string };

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;

  if (!token) {
    res.status(401).json({ error: "Falta el token de autenticación" });
    return;
  }

  try {
    const payload = verifyAppToken(token);
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: "Token inválido o vencido" });
  }
}
