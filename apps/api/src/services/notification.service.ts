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
