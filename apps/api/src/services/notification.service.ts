import { prisma } from "../lib/prisma";
import { startOfDay, endOfDay } from "date-fns";
import logger from "../lib/logger";
import nodemailer from "nodemailer";
import { generateSingleReportPDF } from "./pdf.service";

const cleanEnvVar = (val: string | undefined, defaultVal: string = ""): string => {
  if (!val) return defaultVal;
  return val.trim().replace(/^['"]|['"]$/g, ""); // strip leading/trailing single or double quotes and trim whitespace
};

// Unified Email Sender Helper with Dynamic SMTP & Smart Brevo/Gmail Detection
export const sendEmail = async (options: { to: string[]; subject: string; html: string; attachments?: any[] }) => {
  const resendApiKey = cleanEnvVar(process.env.RESEND_API_KEY);
  const smtpUser = cleanEnvVar(process.env.SMTP_USER, "itkhyber@gmail.com");
  const smtpPass = cleanEnvVar(process.env.SMTP_PASS);
  const smtpHost = cleanEnvVar(process.env.SMTP_HOST, "smtp.gmail.com");
  const smtpPort = Number(cleanEnvVar(process.env.SMTP_PORT, "587"));
  const senderName = "Khyber IT Operations";

  const sanitizedTo = options.to.map(email => cleanEnvVar(email)).filter(Boolean);

  // 1. Prioritize Resend HTTPS API (bypasses Railway SMTP port blocking)
  if (resendApiKey) {
    try {
      const formattedAttachments = options.attachments?.map(att => ({
        filename: att.filename,
        content: Buffer.isBuffer(att.content)
          ? att.content.toString("base64")
          : Buffer.from(att.content).toString("base64")
      })) || [];

      // Resend Free Tier Sandbox allows sending to the account owner (itkhyber@gmail.com) via onboarding@resend.dev
      const fromEmail = "onboarding@resend.dev";

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: `"${senderName}" <${fromEmail}>`,
          to: sanitizedTo,
          subject: options.subject,
          html: options.html,
          attachments: formattedAttachments
        })
      });

      const responseBody = await res.json();
      if (!res.ok) {
        throw new Error(responseBody.message || JSON.stringify(responseBody));
      }

      logger.info({ messageId: responseBody.id }, "Email dispatched successfully via Resend HTTPS API");
      return { success: true };
    } catch (error) {
      logger.error(error, "Resend API dispatch failed. Falling back to SMTP if configured.");
    }
  }

  // 2. Fallback to traditional SMTP
  if (!smtpPass) {
    logger.warn("SMTP_PASS is not configured in environment variables. Email dispatch will log to console.");
    logger.info({ to: options.to, subject: options.subject }, "EMAIL LOG (SMTP/Resend Not Configured)");
    return { success: false, error: "Email provider not configured" };
  }

  try {
    // Dynamically configure transporter based on Brevo vs Gmail credentials
    let transporterOptions: any = {
      host: smtpUser.includes("brevo.com") || smtpUser.includes("sendinblue.com") ? "smtp-relay.brevo.com" : smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    };

    // If using Gmail credentials, configure using service: "gmail"
    if ((smtpHost.includes("gmail.com") || smtpUser.includes("gmail.com")) && !smtpUser.includes("brevo.com")) {
      transporterOptions = {
        service: "gmail",
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      };
    }

    const transporter = nodemailer.createTransport(transporterOptions);

    const formattedAttachments = options.attachments?.map(att => ({
      filename: att.filename,
      content: att.content
    })) || [];

    const mailOptions = {
      from: `"${senderName}" <${smtpUser}>`,
      to: sanitizedTo.join(", "),
      subject: options.subject,
      html: options.html,
      attachments: formattedAttachments
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info({ messageId: info.messageId, host: transporterOptions.host || transporterOptions.service || "gmail" }, "Email dispatched successfully via SMTP");
    return { success: true };
  } catch (error) {
    logger.error(error, `SMTP dispatch failed for user ${smtpUser}`);
    return { success: false, error: (error as Error).message || error };
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
    logger.error(error, "Error in sendShiftReminder service");
  }
};

export const sendHandoverNotification = async (engineerName: string, content: string, reportId: string, customRecipients?: string[]) => {
  const managerEmail = cleanEnvVar(process.env.MANAGER_EMAIL);
  if (!managerEmail && (!customRecipients || customRecipients.length === 0)) return;

  try {
    const recipients = customRecipients && customRecipients.length > 0
      ? customRecipients
      : managerEmail.split(",").map(e => e.trim());

    // Generate single PDF report to attach dynamically
    let attachments: any[] = [];
    try {
      const pdfBuffer = await generateSingleReportPDF(reportId);
      attachments = [
        {
          filename: `KHY_Handover_Report_${reportId.substring(0, 6)}.pdf`,
          content: pdfBuffer,
        }
      ];
    } catch (pdfErr) {
      logger.error(pdfErr, "Failed to compile and attach PDF to shift handover email");
    }

    await sendEmail({
      to: recipients,
      subject: `Khyber's Daily IT Flash - ${engineerName}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #004d40;">Khyber's Daily IT Flash</h2>
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
    logger.error(error, "Error in sendHandoverNotification service");
  }
};

export const sendCriticalIssueEmail = async (issue: any) => {
  const managerEmail = cleanEnvVar(process.env.MANAGER_EMAIL);
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
    logger.error(error, "Error in sendCriticalIssueEmail service");
  }
};

export const sendEscalationEmail = async (issueTitle: string, escalation: any, engineerName: string) => {
  const managerEmail = cleanEnvVar(process.env.MANAGER_EMAIL);
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
    logger.error(error, "Error in sendEscalationEmail service");
  }
};
