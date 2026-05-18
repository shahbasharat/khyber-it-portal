import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { startOfDay, endOfDay } from "date-fns";
import logger from "../lib/logger";
import * as reportingService from "../services/reporting.service";
import * as notificationService from "../services/notification.service";
import * as pdfService from "../services/pdf.service";

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
      totalTasks,
      lastReport,
      checklistDetails,
      issuesDetails,
      checklistItemsList
    ] = await Promise.all([
      prisma.issue.count({ where: { createdAt: { gte: start, lte: end } } }),
      prisma.issue.count({ where: { status: "RESOLVED", updatedAt: { gte: start, lte: end } } }),
      prisma.issue.count({ where: { priority: "CRITICAL", createdAt: { gte: start, lte: end } } }),
      prisma.issue.count({ where: { status: "ESCALATED", updatedAt: { gte: start, lte: end } } }),
      prisma.checklistResponse.count({ where: { completed: true, createdAt: { gte: start, lte: end } } }),
      prisma.checklistItem.count(),
      prisma.report.findFirst({
        where: { createdAt: { gte: start, lte: end } },
        orderBy: { createdAt: "desc" }
      }),
      prisma.checklistResponse.findMany({
        where: { createdAt: { gte: start, lte: end } },
        include: { checklistItem: true, user: { select: { name: true } } }
      }),
      prisma.issue.findMany({
        where: { createdAt: { gte: start, lte: end } },
        include: {
          reporter: { select: { name: true } },
          assignee: { select: { name: true } },
          notes: { 
            orderBy: { createdAt: "desc" }, 
            take: 1,
            include: { author: { select: { name: true } } }
          },
          escalation: true
        }
      }),
      prisma.checklistItem.findMany()
    ]);

    // Compute all checklist items (merging actual responses and missed checks)
    const fullChecklist = checklistItemsList.map(item => {
      const response = checklistDetails.find(r => r.checklistItemId === item.id);
      let status = (response as any)?.status || "PENDING";
      if (response?.completed && status === "PENDING") {
        status = "WORKING";
      }
      return {
        id: item.id,
        checklistItem: { name: item.title, category: item.category },
        completed: response ? response.completed : false,
        status,
        remarks: response ? response.remarks : "Not checked during this shift.",
        user: response ? response.user : { name: "System" },
        createdAt: response ? response.createdAt : today
      };
    });

    // Compile active team members on duty
    const activeStaff = new Set<string>();
    checklistDetails.forEach(r => activeStaff.add(r.user.name));
    issuesDetails.forEach(i => {
      activeStaff.add(i.reporter.name);
      if (i.assignee) activeStaff.add(i.assignee.name);
    });
    const teamOnDuty = Array.from(activeStaff).join(", ") || "On-duty IT Team";

    res.json({
      date: today,
      summary: {
        id: lastReport?.id ?? null,
        totalIncidents,
        resolvedIncidents,
        pendingIncidents: totalIncidents - resolvedIncidents,
        criticalAlerts,
        escalations,
        checklistCompletion: `${completedTasks}/${totalTasks}`,
        usersSupported: (lastReport as any)?.usersSupported ?? 0,
        downtime: (lastReport as any)?.downtime ?? 0,
        handoverNotes: lastReport?.content ?? null,
        teamOnDuty
      },
      checklist: fullChecklist,
      issues: issuesDetails
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate shift summary" });
  }
};

export const createShiftReport = async (req: any, res: Response) => {
  const { content, usersSupported, downtime, recipientEmails } = req.body;
  const userId = req.user.userId;

  if (!content) {
    return res.status(400).json({ error: "Report content is required" });
  }

  try {
    // Parse custom recipient emails if passed
    let customRecipients: string[] | undefined = undefined;
    if (recipientEmails && typeof recipientEmails === "string" && recipientEmails.trim().length > 0) {
      customRecipients = recipientEmails.split(",").map(e => e.trim()).filter(e => e.length > 0);
    }

    // Find the active shift or create a dummy one for the report
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
        content,
        usersSupported: Number(usersSupported || 0),
        downtime: Number(downtime || 0)
      }
    });

    // Notify Manager asynchronously
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      notificationService.sendHandoverNotification(user.name, content, report.id, customRecipients).catch(console.error);
    }

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
      res.json({ message: "Test report sent successfully" });
    } else {
      res.status(500).json({ error: "Failed to send test report", details: result.error });
    }
  } catch (error) {
    logger.error({ error }, "Error in test report route");
    res.status(500).json({ error: "Failed to generate test report" });
  }
};

export const downloadReportPDF = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const pdfBuffer = await pdfService.generateSingleReportPDF(id);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=KHY_Handover_Report_${id.substring(0, 6)}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    logger.error({ error, reportId: req.params.id as string }, "Failed to generate report PDF download");
    res.status(500).json({ error: "Failed to generate report PDF" });
  }
};
