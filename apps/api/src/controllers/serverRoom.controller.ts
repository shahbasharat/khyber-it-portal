import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import logger from "../lib/logger";
import { z } from "zod";

const CreateServerRoomLogSchema = z.object({
  userName: z.string().min(1, "User name is required"),
  reason: z.string().min(1, "Reason is required"),
  entryTime: z.string().min(1, "Time is required"),
});

export const getServerRoomLogs = async (req: Request, res: Response) => {
  try {
    const logs = await (prisma as any).serverRoomLog.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(logs);
  } catch (error) {
    logger.error({ error }, "Failed to fetch server room logs");
    res.status(500).json({ error: "Failed to fetch server room logs" });
  }
};

export const createServerRoomLog = async (req: Request, res: Response) => {
  try {
    const validatedData = CreateServerRoomLogSchema.parse(req.body);
    
    const log = await (prisma as any).serverRoomLog.create({
      data: {
        ...validatedData,
        entryDate: new Date(),
      },
    });
    
    res.status(201).json(log);
  } catch (error: any) {
    if (error.name === "ZodError") return res.status(400).json({ error: error.errors });
    logger.error({ error }, "Failed to create server room log");
    res.status(500).json({ error: "Failed to create server room log" });
  }
};
