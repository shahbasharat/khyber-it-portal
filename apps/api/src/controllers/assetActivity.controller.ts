import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import logger from "../lib/logger";

export const getActivities = async (req: Request, res: Response) => {
  try {
    const activities = await prisma.assetActivity.findMany({
      include: {
        engineer: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    res.json(activities);
  } catch (error) {
    logger.error(error, "Failed to fetch asset activities");
    res.status(500).json({ error: "Failed to fetch asset activities" });
  }
};

export const createActivity = async (req: Request, res: Response) => {
  try {
    const { assetId, deviceType, userDepartment, activity, status } = req.body;
    const engineerId = (req as any).user.userId;

    if (!assetId || !deviceType || !userDepartment || !activity) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newActivity = await prisma.assetActivity.create({
      data: {
        assetId,
        deviceType,
        userDepartment,
        activity,
        status: status || "COMPLETED",
        engineerId
      },
      include: {
        engineer: { select: { id: true, name: true } }
      }
    });

    res.status(201).json(newActivity);
  } catch (error) {
    logger.error(error, "Failed to create asset activity");
    res.status(500).json({ error: "Failed to create asset activity" });
  }
};
