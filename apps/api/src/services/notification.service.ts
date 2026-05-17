import { prisma } from "../lib/prisma";
import { Resend } from "resend";
import { startOfDay, endOfDay } from "date-fns";
import logger from "../lib/logger";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendShiftReminder = async (shiftType: "MORNING" | "AFTERNOON") => {
  const today = new Date();
  const start = startOfDay(today);
  const end = endOfDay(today);

  try {
    // 1. Find the on-duty engineer for this shift
    // For now, we'll find any user who has an active shift started today
    const activeShift = await prisma.shift.findFirst({
      where: {
        startTime: { gte: start, lte: end },
        endTime: null
      },
      include: { user: true }
    });

    if (!activeShift) {
      logger.info(`No active ${shiftType} shift found to send reminder.`);
      return;
    }

    // 2. Check if they already submitted a report today
    const report = await prisma.report.findFirst({
      where: {
        shiftId: activeShift.id,
        createdAt: { gte: start, lte: end }
      }
    });

    if (report) {
      logger.info(`Report already submitted for ${activeShift.user.name}, no reminder needed.`);
      return;
    }

    // 3. Send Reminder Email
    const { error } = await resend.emails.send({
      from: "Khyber IT Portal <onboarding@resend.dev>",
      to: [activeShift.user.email],
      subject: "Reminder: Shift Report Due",
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #d97706;">Shift Handover Reminder</h2>
          <p>Hello ${activeShift.user.name.split(" ")[0]},</p>
          <p>Your <strong>${shiftType}</strong> shift is ending soon. Please remember to submit your end-of-shift report before you leave.</p>
          <p>Submitting your report ensures a smooth handover for the next shift.</p>
          <a href="${process.env.FRONTEND_URL}/dashboard/reports" 
             style="display: inline-block; padding: 10px 20px; background-color: #004d40; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 10px;">
             Submit Report Now
          </a>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">This is an automated reminder from the Khyber IT Operations Portal.</p>
        </div>
      `
    });

    if (error) {
      logger.error({ error }, "Failed to send shift reminder email");
    } else {
      logger.info(`Shift reminder sent to ${activeShift.user.email}`);
    }
  } catch (error) {
    logger.error({ error }, "Error in sendShiftReminder service");
  }
};

export const sendHandoverNotification = async (engineerName: string, content: string) => {
  const managerEmail = process.env.MANAGER_EMAIL;
  if (!managerEmail) return;

  try {
    const recipients = managerEmail.split(",").map(e => e.trim());
    const { error } = await resend.emails.send({
      from: "Khyber IT Portal <onboarding@resend.dev>",
      to: recipients,
      subject: `New Shift Handover Report from ${engineerName}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #004d40;">Shift Handover Report</h2>
          <p><strong>Submitted by:</strong> ${engineerName}</p>
          <div style="margin-top: 20px; padding: 15px; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; white-space: pre-wrap;">
            ${content}
          </div>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">View full stats on the <a href="${process.env.FRONTEND_URL}/dashboard/reports">Khyber IT Portal</a>.</p>
        </div>
      `
    });

    if (error) {
      logger.error({ error }, "Failed to send handover notification email");
    }
  } catch (error) {
    logger.error({ error }, "Error in sendHandoverNotification service");
  }
};

export const sendCriticalIssueEmail = async (issue: any) => {
  const managerEmail = process.env.MANAGER_EMAIL;
  if (!managerEmail) return;

  try {
    const recipients = managerEmail.split(",").map(e => e.trim());
    const { error } = await resend.emails.send({
      from: "Khyber IT Portal <onboarding@resend.dev>",
      to: recipients,
      subject: `🚨 CRITICAL Incident Reported: ${issue.title}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333; border: 1px solid #fee2e2; border-radius: 10px;">
          <h2 style="color: #dc2626; margin-top: 0;">🚨 CRITICAL Alert</h2>
          <p>A new critical IT issue has been reported at the resort.</p>
          <div style="margin: 20px 0; padding: 15px; background-color: #fef2f2; border-radius: 8px; border: 1px solid #fee2e2;">
            <p style="margin: 0 0 10px 0;"><strong>Incident:</strong> ${issue.title}</p>
            <p style="margin: 0 0 10px 0;"><strong>Department/Location:</strong> ${issue.department}</p>
            <p style="margin: 0 0 10px 0;"><strong>Reporter:</strong> ${issue.reporter?.name || "IT Engineer"}</p>
            <p style="margin: 10px 0 0 0; padding-top: 10px; border-top: 1px dashed #fee2e2; white-space: pre-wrap;"><strong>Description:</strong> ${issue.description}</p>
          </div>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">View full details on the <a href="${process.env.FRONTEND_URL || "https://khyber-it-portal-web.vercel.app"}/dashboard/issues">Khyber IT Portal</a>.</p>
        </div>
      `
    });

    if (error) {
      logger.error({ error }, "Failed to send critical issue email");
    }
  } catch (error) {
    logger.error({ error }, "Error in sendCriticalIssueEmail service");
  }
};

export const sendEscalationEmail = async (issueTitle: string, escalation: any, engineerName: string) => {
  const managerEmail = process.env.MANAGER_EMAIL;
  if (!managerEmail) return;

  try {
    const recipients = managerEmail.split(",").map(e => e.trim());
    const { error } = await resend.emails.send({
      from: "Khyber IT Portal <onboarding@resend.dev>",
      to: recipients,
      subject: `⚠️ ESCALATION LOGGED: ${issueTitle}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333; border: 1px solid #fed7aa; border-radius: 10px;">
          <h2 style="color: #ea580c; margin-top: 0;">⚠️ Escalation Logged</h2>
          <p>An IT incident has been formally escalated to a third-party vendor.</p>
          <div style="margin: 20px 0; padding: 15px; background-color: #fff7ed; border-radius: 8px; border: 1px solid #fed7aa;">
            <p style="margin: 0 0 10px 0;"><strong>Incident:</strong> ${issueTitle}</p>
            <p style="margin: 0 0 10px 0;"><strong>Escalated To:</strong> ${escalation.escalatedTo}</p>
            <p style="margin: 0 0 10px 0;"><strong>Contact Details/ETA:</strong> ${escalation.contactDetails || "None"}</p>
            <p style="margin: 0 0 10px 0;"><strong>Escalated By:</strong> ${engineerName}</p>
            <p style="margin: 10px 0 0 0; padding-top: 10px; border-top: 1px dashed #fed7aa; white-space: pre-wrap;"><strong>Remarks:</strong> ${escalation.remarks || "None"}</p>
          </div>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">View full details on the <a href="${process.env.FRONTEND_URL || "https://khyber-it-portal-web.vercel.app"}/dashboard/issues">Khyber IT Portal</a>.</p>
        </div>
      `
    });

    if (error) {
      logger.error({ error }, "Failed to send escalation email");
    }
  } catch (error) {
    logger.error({ error }, "Error in sendEscalationEmail service");
  }
};
