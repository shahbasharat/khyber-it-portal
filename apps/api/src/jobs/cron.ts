import cron from "node-cron";
import * as reportingService from "../services/reporting.service";
import * as notificationService from "../services/notification.service";
import logger from "../lib/logger";

export const initCronJobs = () => {
  // 1. Weekly Summary Report - Every Sunday at 11:55 PM
  cron.schedule("55 23 * * 0", async () => {
    logger.info("Starting scheduled weekly report generation...");
    try {
      const pdfBuffer = await reportingService.generateWeeklySummary();
      const result = await reportingService.sendWeeklyReportEmail(pdfBuffer as Buffer);
      if (result.success) {
        logger.info("Successfully sent weekly report email.");
      } else {
        logger.error({ error: result.error }, "Failed to send weekly report email via cron.");
      }
    } catch (error) {
      logger.error({ error }, "Error in weekly report cron job.");
    }
  });

  // 2. Shift Reminders
  // Morning Shift End Reminder - 4:45 PM
  cron.schedule("45 16 * * *", async () => {
    logger.info("Triggering Morning Shift reminder...");
    await notificationService.sendShiftReminder("MORNING");
  });

  // Afternoon Shift End Reminder - 9:45 PM
  cron.schedule("45 21 * * *", async () => {
    logger.info("Triggering Afternoon Shift reminder...");
    await notificationService.sendShiftReminder("AFTERNOON");
  });

  logger.info("✅ Cron jobs initialized.");
};
