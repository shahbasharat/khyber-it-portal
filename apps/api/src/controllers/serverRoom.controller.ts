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
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 50);
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.serverRoomLog.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.serverRoomLog.count(),
    ]);

    res.json({ data: logs, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    logger.error(error, "Failed to fetch server room logs");
    res.status(500).json({ error: "Failed to fetch server room logs" });
  }
};

export const createServerRoomLog = async (req: Request, res: Response) => {
  try {
    const validatedData = CreateServerRoomLogSchema.parse(req.body);

    const log = await prisma.serverRoomLog.create({
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
    const devices = await prisma.networkDevice.findMany({
      orderBy: { createdAt: "asc" }
    });

    // Perform real HTTP/TCP reachability checks for each device
    const heartbeatPromises = devices.map(async (device) => {
      const start = Date.now();
      let status: "ONLINE" | "OFFLINE" = "OFFLINE";
      let latency = 0;

      try {
        // Use a short-timeout fetch to check if the device responds
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);

        // Try HTTP first, fall back gracefully
        const url = device.ip.startsWith("http") ? device.ip : `http://${device.ip}`;
        await fetch(url, { signal: controller.signal, method: "HEAD" });
        clearTimeout(timeout);

        latency = Date.now() - start;
        status = "ONLINE";
      } catch {
        // Device didn't respond via HTTP — mark as offline
        latency = Date.now() - start;
        status = "OFFLINE";
      }

      return {
        id: device.id,
        name: device.name,
        ip: device.ip,
        latency,
        status,
        uptime: device.uptime,
        category: device.category
      };
    });

    const heartbeats = await Promise.all(heartbeatPromises);
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
    if ((req as any).user?.role !== "MANAGER") {
      return res.status(403).json({ error: "Access Denied: Only IT Managers can register network devices." });
    }

    const validatedData = CreateNetworkDeviceSchema.parse(req.body);
    const device = await prisma.networkDevice.create({
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
    if ((req as any).user?.role !== "MANAGER") {
      return res.status(403).json({ error: "Access Denied: Only IT Managers can remove network devices." });
    }

    await prisma.networkDevice.delete({
      where: { id: id as string }
    });
    res.json({ success: true, message: "Network device removed successfully." });
  } catch (error) {
    logger.error({ err: error, id }, "Failed to delete network device");
    res.status(500).json({ error: "Failed to delete network device" });
  }
};
