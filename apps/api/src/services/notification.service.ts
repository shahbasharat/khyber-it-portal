import { prisma } from "../lib/prisma";
import { startOfDay, endOfDay } from "date-fns";
import logger from "../lib/logger";

// Unified Email Sender Helper using Brevo's HTTPS REST API (Port 443 - 100% firewall unblocked!)
export const sendEmail = async (options: { to: string[]; subject: string; html: string; attachments?: any[] }) => {
  const brevoApiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.SMTP_USER || "itkhyber@gmail.com";
  const senderName = "Khyber IT Operations";

  if (!brevoApiKey) {
    logger.warn("BREVO_API_KEY is not configured in .env. Email dispatch will log to console.");
    logger.info({ to: options.to, subject: options.subject }, "EMAIL LOG (SMTP Not Configured)");
    return { success: false, error: "Brevo API Key not configured" };
  }

  try {
    const formattedAttachments = options.attachments?.map(att => ({
      name: att.filename,
      content: att.content.toString("base64")
    })) || [];

    const emailPayload: any = {
      sender: { name: senderName, email: senderEmail },
      to: options.to.map(email => ({ email })),
      subject: options.subject,
      htmlContent: options.html
    };

    if (formattedAttachments.length > 0) {
      emailPayload.attachment = formattedAttachments;
    }

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": brevoApiKey as string,
        "content-type": "application/json"
      } as Record<string, string>,
      body: JSON.stringify(emailPayload)
    });

    if (!response.ok) {
      const errText = await response.text();
      logger.error({ errText, status: response.status }, "Brevo dispatch failed");
      return { success: false, error: errText };
    }

    logger.info("Email dispatched successfully via Brevo HTTPS REST API");
    return { success: true };
  } catch (error) {
    logger.error({ error }, "Brevo dispatch network error");
    return { success: false, error };
  }
};

export const sendShiftReminder = async (shiftType: "MORNING" | "AFTERNOON") => {
  const today = new Date();
  const start = startOfDay(today);
  const end = endOfDay(today);

  try {
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

    // Dispatch Shift Reminder Email
    await sendEmail({
      to: [activeShift.user.email],
      subject: "Reminder: Shift Report Due",
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #d97706;">Shift Handover Reminder</h2>
          <p>Hello ${activeShift.user.name.split(" ")[0]},</p>
          <p>Your <strong>${shiftType}</strong> shift is ending soon. Please remember to submit your end-of-shift report before you leave.</p>
          <p>Submitting your report ensures a smooth handover for the next shift.</p>
          <a href="${process.env.FRONTEND_URL || "https://khyber-it-portal-web.vercel.app"}/dashboard/reports" 
             style="display: inline-block; padding: 10px 20px; background-color: #004d40; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 10px;">
             Submit Report Now
          </a>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">This is an automated reminder from the Khyber IT Operations Portal.</p>
        </div>
      `
    });
  } catch (error) {
    logger.error({ error }, "Error in sendShiftReminder service");
  }
};

export const sendHandoverNotification = async (engineerName: string, content: string, reportId: string, customRecipients?: string[]) => {
  const managerEmail = process.env.MANAGER_EMAIL;
  if (!managerEmail && (!customRecipients || customRecipients.length === 0)) return;

  try {
    const recipients = customRecipients && customRecipients.length > 0
      ? customRecipients
      : managerEmail!.split(",").map(e => e.trim());

    // Generate single PDF report to attach dynamically
    let attachments: any[] = [];
    try {
      const { generateSingleReportPDF } = require("./pdf.service");
      const pdfBuffer = await generateSingleReportPDF(reportId);
      attachments = [
        {
          filename: `KHY_Handover_Report_${reportId.substring(0, 6)}.pdf`,
          content: pdfBuffer,
        }
      ];
    } catch (pdfErr) {
      logger.error({ pdfErr }, "Failed to compile and attach PDF to shift handover email");
    }

    await sendEmail({
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
          <p style="font-size: 12px; color: #666;">A copy of the compiled PDF report is attached to this email. You can also view it on the <a href="${process.env.FRONTEND_URL || "https://khyber-it-portal-web.vercel.app"}/dashboard/reports">Khyber IT Portal</a>.</p>
        </div>
      `,
      attachments
    });
  } catch (error) {
    logger.error({ error }, "Error in sendHandoverNotification service");
  }
};

export const sendCriticalIssueEmail = async (issue: any) => {
  const managerEmail = process.env.MANAGER_EMAIL;
  if (!managerEmail) return;

  try {
    const recipients = managerEmail.split(",").map(e => e.trim());
    await sendEmail({
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
  } catch (error) {
    logger.error({ error }, "Error in sendCriticalIssueEmail service");
  }
};

export const sendEscalationEmail = async (issueTitle: string, escalation: any, engineerName: string) => {
  const managerEmail = process.env.MANAGER_EMAIL;
  if (!managerEmail) return;

  try {
    const recipients = managerEmail.split(",").map(e => e.trim());
    await sendEmail({
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
  } catch (error) {
    logger.error({ error }, "Error in sendEscalationEmail service");
  }
};
