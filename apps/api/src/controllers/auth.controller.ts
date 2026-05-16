import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { LoginSchema } from "@khyber/schemas";
import { prisma } from "../lib/prisma";
import logger from "../lib/logger";

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

const generateTokens = (userId: string) => {
  const accessToken = jwt.sign(
    { userId },
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

    const { accessToken, refreshTokenValue } = generateTokens(user.id);

    // Save refresh token in DB
    await prisma.refreshToken.create({
      data: {
        tokenId: refreshTokenValue,
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
    console.log("Debug: Received Cookies:", req.cookies); // This will show in Railway logs
    
    if (!refreshTokenValue) {
      return res.status(401).json({ error: "No refresh token provided" });
    }

    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { tokenId: refreshTokenValue },
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

    // Generate new access token
    const accessToken = jwt.sign(
      { userId: tokenRecord.userId },
      getAccessSecret(),
      { expiresIn: "15m" } as jwt.SignOptions
    );

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
        where: { tokenId: refreshTokenValue },
      });
    }

    res.clearCookie("refreshToken");
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
    logger.error({ error }, "Failed to fetch user");
    res.status(500).json({ error: "Failed to fetch user" });
  }
};
