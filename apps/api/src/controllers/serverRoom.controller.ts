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
    logger.error(error, "Failed to fetch server room logs");
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
    logger.error(error, "Failed to create server room log");
    res.status(500).json({ error: "Failed to create server room log" });
  }
};

export const getServerHeartbeats = async (req: Request, res: Response) => {
  try {
    const devices = await (prisma as any).networkDevice.findMany({
      orderBy: { createdAt: "asc" }
    });

    // Run dynamic simulated latency on all registered devices in the database!
    const heartbeats = devices.map((device: any) => {
      let latencyBase = 3;
      if (device.category === "INTERNET") latencyBase = 18;
      else if (device.category === "DATABASE") latencyBase = 4;
      const latency = Math.floor(Math.random() * 8) + latencyBase;

      return {
        id: device.id,
        name: device.name,
        ip: device.ip,
        latency,
        status: "ONLINE",
        uptime: device.uptime,
        category: device.category
      };
    });

    res.json(heartbeats);
  } catch (error) {
    logger.error(error, "Failed to fetch server heartbeats");
    res.status(500).json({ error: "Failed to fetch server heartbeats" });
  }
};

const CreateNetworkDeviceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  ip: z.string().min(1, "IP address is required"),
  category: z.string().min(1, "Category is required")
});

export const createNetworkDevice = async (req: Request, res: Response) => {
  try {
    // Strict Role authorization check
    if ((req as any).user?.role !== "MANAGER") {
      return res.status(403).json({ error: "Access Denied: Only IT Managers can register network devices." });
    }

    const validatedData = CreateNetworkDeviceSchema.parse(req.body);
    const device = await (prisma as any).networkDevice.create({
      data: validatedData
    });
    res.status(201).json(device);
  } catch (error: any) {
    if (error.name === "ZodError") return res.status(400).json({ error: error.errors });
    logger.error(error, "Failed to create network device");
    res.status(500).json({ error: "Failed to create network device" });
  }
};

export const deleteNetworkDevice = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    // Strict Role authorization check
    if ((req as any).user?.role !== "MANAGER") {
      return res.status(403).json({ error: "Access Denied: Only IT Managers can remove network devices." });
    }

    await (prisma as any).networkDevice.delete({
      where: { id }
    });
    res.json({ success: true, message: "Network device removed successfully." });
  } catch (error) {
    logger.error({ err: error, id }, "Failed to delete network device");
    res.status(500).json({ error: "Failed to delete network device" });
  }
};
