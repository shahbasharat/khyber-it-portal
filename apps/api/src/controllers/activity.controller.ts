import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import logger from "../lib/logger";

export const getActivityFeed = async (req: Request, res: Response) => {
  try {
    const recentChecklists = await prisma.checklistResponse.findMany({
      where: { completed: true },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        checklistItem: { select: { title: true } },
        user: { select: { name: true } },
      },
    });

    const recentIssues = await prisma.issue.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        reporter: { select: { name: true } },
      },
    });

    const recentReports = await prisma.report.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
      include: {
        shift: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
    });

    // Normalize events into a common Activity interface
    const activityFeed = [
      ...recentChecklists.map((c) => ({
        id: `chk-${c.id}`,
        type: "CHECKLIST_COMPLETED",
        title: `Checklist task completed: ${c.checklistItem.title}`,
        description: `Verified by ${c.user.name}`,
        timestamp: c.createdAt,
      })),
      ...recentIssues.map((i) => ({
        id: `iss-${i.id}`,
        type: i.priority === "CRITICAL" ? "CRITICAL_ISSUE" : "NEW_ISSUE",
        title: `New Issue: ${i.title}`,
        description: `Reported by ${i.reporter.name} [${i.priority} Priority]`,
        timestamp: i.createdAt,
      })),
      ...recentReports.map((r) => ({
        id: `rep-${r.id}`,
        type: "SHIFT_REPORT",
        title: "Shift Handover Report Submitted",
        description: `Submitted by ${r.shift.user.name}`,
        timestamp: r.createdAt,
      })),
    ];

    // Sort by timestamp descending
    activityFeed.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Return the top 10 most recent activities
    res.json(activityFeed.slice(0, 10));
  } catch (error) {
    logger.error({ error }, "Failed to fetch activity feed");
    res.status(500).json({ error: "Failed to fetch activity feed" });
  }
};
