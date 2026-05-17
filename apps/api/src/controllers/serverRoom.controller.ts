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

export const getServerHeartbeats = async (req: Request, res: Response) => {
  try {
    // Generate realistic luxury resort system pings with small micro-variations
    const heartbeats = [
      {
        name: "Oracle Opera PMS Core",
        ip: "10.200.1.10",
        latency: Math.floor(Math.random() * 8) + 4, // 4-12ms
        status: "ONLINE",
        uptime: "99.98%",
        category: "DATABASE"
      },
      {
        name: "VingCard Key Server",
        ip: "10.200.1.20",
        latency: Math.floor(Math.random() * 6) + 3, // 3-9ms
        status: "ONLINE",
        uptime: "99.95%",
        category: "ACCESS_CONTROL"
      },
      {
        name: "Airtel Primary Fiber Gateway",
        ip: "1.1.1.1",
        latency: Math.floor(Math.random() * 15) + 18, // 18-33ms
        status: "ONLINE",
        uptime: "99.85%",
        category: "INTERNET"
      },
      {
        name: "IPTV Gateway Server",
        ip: "10.200.1.30",
        latency: Math.floor(Math.random() * 4) + 2, // 2-6ms
        status: "ONLINE",
        uptime: "100%",
        category: "ENTERTAINMENT"
      }
    ];

    res.json(heartbeats);
  } catch (error) {
    logger.error({ error }, "Failed to fetch server heartbeats");
    res.status(500).json({ error: "Failed to fetch server heartbeats" });
  }
};
