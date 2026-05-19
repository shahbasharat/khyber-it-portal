import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import logger from "../lib/logger";

export const getEscalations = async (req: Request, res: Response) => {
  try {
    const escalations = await prisma.escalation.findMany({
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
    logger.error(error, "Failed to fetch escalations");
    res.status(500).json({ error: "Failed to fetch escalations" });
  }
};

export const updateEscalationStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = (req as any).user.userId;

    const VALID_STATUSES = ["ACTIVE", "RESOLVED"];
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` });
    }

    const currentEscalation = await prisma.escalation.findUnique({
      where: { id: id as string }
    });

    if (!currentEscalation) {
      return res.status(404).json({ error: "Escalation not found" });
    }

    const parentIssueStatus = status === "RESOLVED" ? "RESOLVED" : "ESCALATED";

    const [escalation] = await prisma.$transaction([
      prisma.escalation.update({
        where: { id: id as string },
        data: { status }
      }),
      prisma.issue.update({
        where: { id: currentEscalation.issueId },
        data: { status: parentIssueStatus }
      }),
      ...(status === "RESOLVED"
        ? [
            prisma.issueNote.create({
              data: {
                content: "Vendor resolved the escalated issue successfully.",
                issueId: currentEscalation.issueId,
                authorId: userId
              }
            })
          ]
        : [])
    ]);

    res.json(escalation);
  } catch (error) {
    logger.error(error, "Failed to update escalation");
    res.status(500).json({ error: "Failed to update escalation" });
  }
};
