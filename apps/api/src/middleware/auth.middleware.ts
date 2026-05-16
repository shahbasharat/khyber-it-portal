import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import logger from "../lib/logger";

export const requireAuth = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  const secret = process.env.JWT_ACCESS_SECRET;

  if (!secret) {
    logger.error("JWT_ACCESS_SECRET is missing from environment variables");
    return res.status(500).json({ error: "Internal Server Error: Security configuration missing" });
  }

  try {
    const payload = jwt.verify(token, secret) as { userId: string };
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token invalid or expired" });
  }
};
