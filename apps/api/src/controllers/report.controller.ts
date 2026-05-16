import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { startOfDay, endOfDay } from "date-fns";
import logger from "../lib/logger";
import * as reportingService from "../services/reporting.service";

export const getShiftSummary = async (req: Request, res: Response) => {
  const today = new Date();
  const start = startOfDay(today);
  const end = endOfDay(today);

  try {
    const [
      totalIncidents,
      resolvedIncidents,
      criticalAlerts,
      escalations,
      completedTasks,
      totalTasks
    ] = await Promise.all([
      prisma.issue.count({ where: { createdAt: { gte: start, lte: end } } }),
      prisma.issue.count({ where: { status: "RESOLVED", updatedAt: { gte: start, lte: end } } }),
      prisma.issue.count({ where: { priority: "CRITICAL", createdAt: { gte: start, lte: end } } }),
      prisma.issue.count({ where: { status: "ESCALATED", updatedAt: { gte: start, lte: end } } }),
      prisma.checklistResponse.count({ where: { completed: true, createdAt: { gte: start, lte: end } } }),
      prisma.checklistItem.count(),
    ]);

    res.json({
      date: today,
      summary: {
        totalIncidents,
        resolvedIncidents,
        pendingIncidents: totalIncidents - resolvedIncidents,
        criticalAlerts,
        escalations,
        checklistCompletion: `${completedTasks}/${totalTasks}`,
        usersSupported: 142, // Dummy data as per Excel template placeholder
        downtime: 0, // Placeholder
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate shift summary" });
  }
};

export const createShiftReport = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: "Report content is required" });
    }

    // Find the active shift or create a dummy one for the report
    // In a real app, shifts would be explicitly started/ended
    let shift = await prisma.shift.findFirst({
      where: { userId, endTime: null },
      orderBy: { startTime: "desc" }
    });

    if (!shift) {
      shift = await prisma.shift.create({
        data: { userId, startTime: new Date() }
      });
    }

    const report = await prisma.report.create({
      data: {
        shiftId: shift.id,
        content
      }
    });

    res.status(201).json(report);
  } catch (error) {
    logger.error({ error }, "Failed to create shift report");
    res.status(500).json({ error: "Failed to create shift report" });
  }
};

export const sendTestWeeklyReport = async (req: Request, res: Response) => {
  try {
    const pdfBuffer = await reportingService.generateWeeklySummary();
    const result = await reportingService.sendWeeklyReportEmail(pdfBuffer as Buffer);
    
    if (result.success) {
      res.json({ message: "Test report sent successfully", data: result.data });
    } else {
      res.status(500).json({ error: "Failed to send test report", details: result.error });
    }
  } catch (error) {
    logger.error({ error }, "Error in test report route");
    res.status(500).json({ error: "Failed to generate test report" });
  }
};
