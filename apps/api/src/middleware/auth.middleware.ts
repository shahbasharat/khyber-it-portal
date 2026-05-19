import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import logger from "../lib/logger";
import { prisma } from "../lib/prisma";

// Typed request interface so we don't scatter `any` casts everywhere
export interface AuthRequest extends Request {
  user: { userId: string; role: string };
}

export const requireAuth = async (req: any, res: any, next: any) => {
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

  let payload: { userId: string; role?: string };
  try {
    payload = jwt.verify(token, secret) as { userId: string; role?: string };
  } catch {
    return res.status(401).json({ error: "Token invalid or expired" });
  }

  // If the token already carries the role (all tokens issued after the role was added to the payload)
  // use it directly. Otherwise fall back to a DB lookup for legacy tokens.
  if (payload.role) {
    req.user = { userId: payload.userId, role: payload.role };
  } else {
    try {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { role: true },
      });
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      req.user = { userId: payload.userId, role: user.role };
    } catch (err) {
      logger.error(err, "Failed to look up user role in requireAuth");
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // Strict write-prevention for VIEWER (read-only) accounts
  if (["POST", "PUT", "DELETE", "PATCH"].includes(req.method) && req.user.role === "VIEWER") {
    return res.status(403).json({ error: "Forbidden: Viewer account is read-only and cannot modify data" });
  }

  return next();
};

export const requireRole = (roles: string[]) => {
  return async (req: any, res: any, next: any) => {
    try {
      if (!req.user || !req.user.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      if (req.user.role) {
        if (!roles.includes(req.user.role)) {
          return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
        }
        return next();
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { role: true }
      });

      if (!user || !roles.includes(user.role)) {
        return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
      }

      req.user.role = user.role;
      next();
    } catch (error) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  };
};
