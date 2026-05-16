import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { LoginSchema } from "@khyber/schemas";
import { prisma } from "../lib/prisma";

const generateTokens = (userId: string) => {
  const secretAccess = (process.env.JWT_ACCESS_SECRET || "default_access_secret") as jwt.Secret;
  const accessToken = jwt.sign(
    { userId },
    secretAccess,
    { expiresIn: "15m" } as jwt.SignOptions
  );

  const secretRefresh = (process.env.JWT_REFRESH_SECRET || "default_refresh_secret") as jwt.Secret;
  const refreshTokenValue = jwt.sign(
    { userId },
    secretRefresh,
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
      console.log(`Login Failed: User not found for email: ${email}`);
      return res.status(401).json({ error: "Incorrect username or password" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      console.log(`Login Failed: Password mismatch for user: ${email}`);
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
      jwt.verify(refreshTokenValue, process.env.JWT_REFRESH_SECRET || "default_refresh_secret");
    } catch {
      return res.status(401).json({ error: "Invalid refresh token signature" });
    }

    // Generate new access token
    const secretAccess = (process.env.JWT_ACCESS_SECRET || "default_access_secret") as jwt.Secret;
    const accessToken = jwt.sign(
      { userId: tokenRecord.userId },
      secretAccess,
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
