import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import logger from "../lib/logger";

export const getEscalations = async (req: Request, res: Response) => {
  try {
    const escalations = await (prisma as any).escalation.findMany({
      include: {
        issue: {
          include: {
            reporter: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    
    res.json(escalations);
  } catch (error) {
    logger.error({ error }, "Failed to fetch escalations");
    res.status(500).json({ error: "Failed to fetch escalations" });
  }
};

export const updateEscalationStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const escalation = await (prisma as any).escalation.update({
      where: { id },
      data: { status }
    });

    res.json(escalation);
  } catch (error) {
    logger.error({ error }, "Failed to update escalation");
    res.status(500).json({ error: "Failed to update escalation" });
  }
};
