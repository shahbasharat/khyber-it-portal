import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { LoginSchema } from "@khyber/schemas";
import { prisma } from "../lib/prisma";
import logger from "../lib/logger";

/** Hash a refresh token value before storing/looking it up in the DB */
const hashToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");

const getAccessSecret = () => {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    logger.error("JWT_ACCESS_SECRET is missing from environment variables");
    throw new Error("Internal Server Error: Security configuration missing");
  }
  return secret as jwt.Secret;
};

const getRefreshSecret = () => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    logger.error("JWT_REFRESH_SECRET is missing from environment variables");
    throw new Error("Internal Server Error: Security configuration missing");
  }
  return secret as jwt.Secret;
};

const generateTokens = (userId: string, role: string) => {
  const accessToken = jwt.sign(
    { userId, role },
    getAccessSecret(),
    { expiresIn: "15m" } as jwt.SignOptions
  );

  const refreshTokenValue = jwt.sign(
    { userId },
    getRefreshSecret(),
    { expiresIn: "7d" } as jwt.SignOptions
  );

  return { accessToken, refreshTokenValue };
};

export const login = async (req: any, res: any, next: any) => {
  try {
    const parseResult = LoginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: "Invalid credentials format" });
    }

    const { email, password } = parseResult.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      logger.warn({ email }, "Login Failed: User not found");
      return res.status(401).json({ error: "Incorrect username or password" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      logger.warn({ email }, "Login Failed: Password mismatch");
      return res.status(401).json({ error: "Incorrect username or password" });
    }

    const { accessToken, refreshTokenValue } = generateTokens(user.id, user.role);

    // Save hashed refresh token in DB (never store raw JWT)
    await prisma.refreshToken.create({
      data: {
        tokenId: hashToken(refreshTokenValue),
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Set HTTP-only cookie for refresh token
    res.cookie("refreshToken", refreshTokenValue, {
      httpOnly: true,
      secure: true, 
      sameSite: "none", // Required for Vercel -> Railway
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: any, res: any, next: any) => {
  try {
    const refreshTokenValue = req.cookies?.refreshToken;

    if (!refreshTokenValue) {
      return res.status(401).json({ error: "No refresh token provided" });
    }

    // Look up by hashed token
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { tokenId: hashToken(refreshTokenValue) },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      return res.status(401).json({ error: "Invalid or expired refresh token" });
    }

    try {
      jwt.verify(refreshTokenValue, getRefreshSecret());
    } catch {
      return res.status(401).json({ error: "Invalid refresh token signature" });
    }

    // --- Refresh token rotation ---
    // Delete the old token and issue a brand-new one so a stolen token can only be used once
    await prisma.refreshToken.delete({ where: { id: tokenRecord.id } });

    const { accessToken, refreshTokenValue: newRefreshTokenValue } = generateTokens(
      tokenRecord.userId,
      tokenRecord.user.role
    );

    await prisma.refreshToken.create({
      data: {
        tokenId: hashToken(newRefreshTokenValue),
        userId: tokenRecord.userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Re-set the cookie with the new refresh token
    res.cookie("refreshToken", newRefreshTokenValue, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: any, res: any, next: any) => {
  try {
    const refreshTokenValue = req.cookies?.refreshToken;
    if (refreshTokenValue) {
      await prisma.refreshToken.deleteMany({
        where: { tokenId: hashToken(refreshTokenValue) },
      });
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: any, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, name: true, email: true, role: true },
    });
    res.json(user);
  } catch (error) {
    logger.error(error, "Failed to fetch user");
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

export const changePassword = async (req: any, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required" });
    }

    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters long" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: "Incorrect current password" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    logger.info({ userId: user.id }, "Password changed successfully");
    res.json({ success: true });
  } catch (error) {
    logger.error(error, "Failed to change password");
    res.status(500).json({ error: "Failed to change password" });
  }
};
