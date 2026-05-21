import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import logger from "../lib/logger";

export const startShift = async (req: any, res: Response) => {
  const userId = req.user.userId;

  try {
    // Check if user already has an active shift
    const existing = await prisma.shift.findFirst({
      where: { userId, endTime: null },
      orderBy: { startTime: "desc" },
    });

    if (existing) {
      return res.status(409).json({
        error: "You already have an active shift",
        shift: existing,
      });
    }

    const shift = await prisma.shift.create({
      data: { userId, startTime: new Date() },
    });

    logger.info({ userId, shiftId: shift.id }, "Shift started");
    res.status(201).json(shift);
  } catch (error) {
    logger.error(error, "Failed to start shift");
    res.status(500).json({ error: "Failed to start shift" });
  }
};

export const getActiveShift = async (req: any, res: Response) => {
  const userId = req.user.userId;

  try {
    const shift = await prisma.shift.findFirst({
      where: { userId, endTime: null },
      orderBy: { startTime: "desc" },
      include: { user: { select: { name: true, role: true } } },
    });

    res.json(shift || null);
  } catch (error) {
    logger.error(error, "Failed to fetch active shift");
    res.status(500).json({ error: "Failed to fetch active shift" });
  }
};
