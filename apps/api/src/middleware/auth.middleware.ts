import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import logger from "../lib/logger";
import { prisma } from "../lib/prisma";

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
    const payload = jwt.verify(token, secret) as { userId: string; role?: string };
    req.user = payload;

    // Strict write-prevention block for VIEWER (read-only) accounts
    if (["POST", "PUT", "DELETE", "PATCH"].includes(req.method)) {
      if (payload.role) {
        if (payload.role === "VIEWER") {
          return res.status(403).json({ error: "Forbidden: Viewer account is read-only and cannot modify data" });
        }
        return next();
      }

      // Fallback for legacy tokens without role in payload
      prisma.user.findUnique({
        where: { id: payload.userId },
        select: { role: true }
      }).then((user: any) => {
        if (user?.role === "VIEWER") {
          return res.status(403).json({ error: "Forbidden: Viewer account is read-only and cannot modify data" });
        }
        req.user.role = user?.role;
        next();
      }).catch((err: any) => {
        logger.error(err, "Failed to verify VIEWER role write protection");
        res.status(500).json({ error: "Internal Server Error" });
      });
    } else {
      next();
    }
  } catch (error) {
    return res.status(401).json({ error: "Token invalid or expired" });
  }
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
