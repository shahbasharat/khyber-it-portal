import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import logger from "../lib/logger";
import { z } from "zod";
import { startOfDay, endOfDay } from "date-fns";

const CreateWifiCodeSchema = z.object({
  fromDate: z.string().or(z.date()),
  toDate: z.string().or(z.date()),
  accessCode: z.string().min(1, "Access code is required"),
  deviceLimit: z.number().int().positive(),
  plan: z.string().min(1, "Plan is required"),
  issuedTo: z.string().min(1, "Issued to is required"),
});

export const getWifiCodes = async (req: Request, res: Response) => {
  try {
    const codes = await (prisma as any).guestWifiCode.findMany({
      orderBy: { fromDate: "desc" },
      take: 20
    });
    res.json(codes);
  } catch (error) {
    logger.error({ error }, "Failed to fetch wifi codes");
    res.status(500).json({ error: "Failed to fetch wifi codes" });
  }
};

export const createWifiCode = async (req: Request, res: Response) => {
  try {
    const validatedData = CreateWifiCodeSchema.parse(req.body);
    
    const code = await (prisma as any).guestWifiCode.create({
      data: {
        ...validatedData,
        fromDate: new Date(validatedData.fromDate),
        toDate: new Date(validatedData.toDate),
      },
    });
    
    res.status(201).json(code);
  } catch (error: any) {
    if (error.name === "ZodError") return res.status(400).json({ error: error.errors });
    logger.error({ error }, "Failed to create wifi code");
    res.status(500).json({ error: "Failed to create wifi code" });
  }
};
