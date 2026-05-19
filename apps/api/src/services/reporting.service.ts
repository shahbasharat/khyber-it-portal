import { prisma } from "../lib/prisma";
import { subDays, startOfDay, endOfDay, format } from "date-fns";
import PDFDocument from "pdfkit";
import logger from "../lib/logger";
import { sendEmail } from "./notification.service";
import path from "path";
import fs from "fs";

let cachedLogoPath: string | null = null;
const getLogoPath = () => {
  if (cachedLogoPath !== null) return cachedLogoPath;
  const possibleLogoPaths = [
    path.join(process.cwd(), "Public/Logo Green.png"),
    path.join(process.cwd(), "../../Public/Logo Green.png"),
    path.join(__dirname, "../../../../Public/Logo Green.png"),
    path.join(process.cwd(), "Public/logo.jpg"),
    path.join(process.cwd(), "../../Public/logo.jpg"),
    path.join(__dirname, "../../../../Public/logo.jpg")
  ];
  cachedLogoPath = possibleLogoPaths.find((p) => fs.existsSync(p)) || "";
  return cachedLogoPath;
};

export const generateWeeklySummary = async () => {
  const today = new Date();
  const lastWeek = subDays(today, 7);
  const start = startOfDay(lastWeek);
  const end = endOfDay(today);

  try {
    // 1. Fetch Data
    const [issues, serverLogs, checklistResponses] = await Promise.all([
      prisma.issue.findMany({
        where: { createdAt: { gte: start, lte: end } },
        include: { reporter: { select: { name: true } } }
      }),
      prisma.serverRoomLog.findMany({
        where: { createdAt: { gte: start, lte: end } }
      }),
      prisma.checklistResponse.findMany({
        where: { createdAt: { gte: start, lte: end } },
        include: { checklistItem: true, user: { select: { name: true } } }
      })
    ]);

    // 2. Aggregate Stats
    const totalIssues = issues.length;
    const resolvedIssues = issues.filter(i => i.status === "RESOLVED").length;
    const criticalIssues = issues.filter(i => i.priority === "CRITICAL").length;
    const serverEntries = serverLogs.length;

    // 3. Create PDF (A4 size, clean margins)
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 40, bottom: 40, left: 40, right: 40 }
    });
    const chunks: any[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));

    return new Promise<Buffer>((resolve, reject) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // --- BRAND LOGO / LETTERHEAD COMPILER ---
      const logoPath = getLogoPath();

      if (logoPath) {
        // Draw crisp luxury logo image
        doc.image(logoPath, 40, 40, { width: 50 });
        
        // Branded title
        doc.fillColor("#19433E").fontSize(14).font("Helvetica-Bold").text("THE KHYBER HIMALAYAN RESORT & SPA", 100, 45, { align: "left" });
        doc.fontSize(12).font("Helvetica-Bold").fillColor("#C5A880").text("Khyber's Weekly IT Operations Flash", 100, 65, { align: "left" });
        
        // Date Meta
        doc.fillColor("#333333").fontSize(9).font("Helvetica-Bold").text("WEEKLY REPORT", 400, 45, { align: "right", width: 140 });
        doc.fontSize(8).font("Helvetica").fillColor("#777777").text(`${format(start, "dd MMM")} - ${format(end, "dd MMM yyyy")}`, 400, 59, { align: "right", width: 140 });
      } else {
        // Fallback banner if logo not present in workspace
        doc.rect(40, 40, 515, 60).fill("#19433E");
        
        doc.fillColor("#FDFBF7").fontSize(14).font("Helvetica-Bold").text("THE KHYBER HIMALAYAN RESORT & SPA", 55, 48, { align: "left" });
        doc.fontSize(12).font("Helvetica-Bold").fillColor("#C5A880").text("Khyber's Weekly IT Operations Flash", 55, 68, { align: "left" });
        
        doc.fillColor("#FDFBF7").fontSize(9).font("Helvetica-Bold").text("WEEKLY REPORT", 400, 48, { align: "right", width: 140 });
        doc.fontSize(8).font("Helvetica").text(`${format(start, "dd MMM")} - ${format(end, "dd MMM yyyy")}`, 400, 64, { align: "right", width: 140 });
      }

      // Gold Divider lines
      doc.moveDown(2);
      doc.strokeColor("#D4AF37").lineWidth(1.5).moveTo(40, 110).lineTo(555, 110).stroke();
      doc.strokeColor("#D4AF37").lineWidth(0.5).moveTo(40, 114).lineTo(555, 114).stroke();

      // --- SECTION 1: EXECUTIVE SUMMARY ---
      doc.moveDown(1.5);
      doc.fillColor("#19433E").fontSize(12).font("Helvetica-Bold").text("1. Executive Summary", 40, 125);
      
      // Clean grey box for stats
      doc.rect(40, 142, 515, 70).fill("#F4F4F0");
      doc.fillColor("#333333").fontSize(9);

      // Grid Layout values
      const leftColX = 55;
      const rightColX = 300;
      doc.font("Helvetica-Bold").text("Total Incidents Logged:", leftColX, 152);
      doc.font("Helvetica").text(String(totalIssues), leftColX + 130, 152);

      doc.font("Helvetica-Bold").text("Issues Resolved:", leftColX, 172);
      doc.font("Helvetica").text(String(resolvedIssues), leftColX + 130, 172);

      doc.font("Helvetica-Bold").text("Critical Alerts:", leftColX, 192);
      doc.font("Helvetica").text(String(criticalIssues), leftColX + 130, 192);

      doc.font("Helvetica-Bold").text("Server Room Entries:", rightColX, 152);
      doc.font("Helvetica").text(String(serverEntries), rightColX + 130, 152);

      doc.font("Helvetica-Bold").text("Report Period:", rightColX, 172);
      doc.font("Helvetica").text(`${format(start, "dd MMM yyyy")} - ${format(end, "dd MMM yyyy")}`, rightColX + 130, 172);

      // --- SECTION 2: RECENT ISSUES TRACKER ---
      doc.moveDown(1.5);
      doc.fillColor("#19433E").fontSize(12).font("Helvetica-Bold").text("2. Recent Issues Tracker", 40, 227);
      
      // Draw grid headers
      doc.rect(40, 245, 515, 18).fill("#19433E");
      doc.fillColor("#FDFBF7").fontSize(8).font("Helvetica-Bold");
      doc.text("ISSUE TITLE", 50, 250);
      doc.text("PRIORITY", 300, 250);
      doc.text("STATUS", 420, 250);
      doc.text("REPORTER", 490, 250);

      let currentY = 263;
      doc.fillColor("#333333").fontSize(8);

      issues.slice(0, 15).forEach((issue, index) => {
        if (currentY > 730) {
          doc.addPage();
          
          // Re-draw headers on new page
          doc.rect(40, 40, 515, 18).fill("#19433E");
          doc.fillColor("#FDFBF7").fontSize(8).font("Helvetica-Bold");
          doc.text("ISSUE TITLE", 50, 45);
          doc.text("PRIORITY", 300, 45);
          doc.text("STATUS", 420, 45);
          doc.text("REPORTER", 490, 45);
          
          currentY = 63;
        }

        if (index % 2 === 0) {
          doc.rect(40, currentY, 515, 16).fill("#FAF9F6");
        }
        
        doc.fillColor("#333333").font("Helvetica").fontSize(8).text(issue.title.length > 45 ? issue.title.substring(0, 42) + "..." : issue.title, 50, currentY + 4);
        
        // Priority color
        let priorityColor = "#333333";
        if (issue.priority === "CRITICAL") priorityColor = "#C62828";
        else if (issue.priority === "HIGH") priorityColor = "#EF6C00";
        doc.fillColor(priorityColor).font("Helvetica-Bold").text(issue.priority, 300, currentY + 4);
        
        // Status color
        let statusColor = "#333333";
        if (issue.status === "RESOLVED") statusColor = "#2E7D32";
        else if (issue.status === "OPEN") statusColor = "#C62828";
        doc.fillColor(statusColor).font("Helvetica-Bold").text(issue.status, 420, currentY + 4);

        doc.fillColor("#333333").font("Helvetica").text(issue.reporter.name, 490, currentY + 4);

        currentY += 16;
      });

      if (issues.length > 15) {
        doc.fillColor("#666666").font("Helvetica-Oblique").text(`... and ${issues.length - 15} more issues.`, 50, currentY + 4);
        currentY += 16;
      }

      // --- SECTION 3: SERVER ROOM ACCESS LOG ---
      doc.moveDown(1.5);
      if (currentY > 650) {
        doc.addPage();
        currentY = 40;
      } else {
        currentY += 15;
      }

      doc.fillColor("#19433E").fontSize(12).font("Helvetica-Bold").text("3. Server Room Access Log", 40, currentY);
      currentY += 18;

      // Draw grid headers
      doc.rect(40, currentY, 515, 18).fill("#19433E");
      doc.fillColor("#FDFBF7").fontSize(8).font("Helvetica-Bold");
      doc.text("DATE / TIME", 50, currentY + 5);
      doc.text("USER NAME", 200, currentY + 5);
      doc.text("REASON", 350, currentY + 5);

      currentY += 18;
      doc.fillColor("#333333").fontSize(8);

      serverLogs.slice(0, 15).forEach((log: any, index) => {
        if (currentY > 730) {
          doc.addPage();
          
          doc.rect(40, 40, 515, 18).fill("#19433E");
          doc.fillColor("#FDFBF7").fontSize(8).font("Helvetica-Bold");
          doc.text("DATE / TIME", 50, 45);
          doc.text("USER NAME", 200, 45);
          doc.text("REASON", 350, 45);
          
          currentY = 63;
        }

        if (index % 2 === 0) {
          doc.rect(40, currentY, 515, 16).fill("#FAF9F6");
        }
        
        const dateStr = `${format(new Date(log.entryDate), "dd MMM yyyy")} ${log.entryTime}`;
        doc.fillColor("#333333").font("Helvetica").fontSize(8).text(dateStr, 50, currentY + 4);
        doc.text(log.userName, 200, currentY + 4);
        doc.text(log.reason.length > 40 ? log.reason.substring(0, 37) + "..." : log.reason, 350, currentY + 4);

        currentY += 16;
      });

      if (serverLogs.length > 15) {
        doc.fillColor("#666666").font("Helvetica-Oblique").text(`... and ${serverLogs.length - 15} more entries.`, 50, currentY + 4);
        currentY += 16;
      }

      // --- Footer ---
      const footerY = 750;
      doc.strokeColor("#E0E0E0").lineWidth(0.5).moveTo(40, footerY).lineTo(555, footerY).stroke();
      doc.fontSize(7).font("Helvetica").fillColor("#999999").text(
        "Khyber IT Operations Portal • Confidential • Weekly Summary Report",
        40,
        footerY + 10,
        { align: "center", width: 515 }
      );

      doc.end();
    });
  } catch (error) {
    logger.error(error, "Failed to generate weekly summary");
    throw error;
  }
};

export const sendWeeklyReportEmail = async (pdfBuffer: Buffer) => {
  const managerEmail = process.env.MANAGER_EMAIL || "itkhy@example.com";
  
  try {
    const recipients = managerEmail.split(",").map(e => e.trim());
    const res = await sendEmail({
      to: recipients,
      subject: `Weekly IT Operations Report - ${format(new Date(), "PP")}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #004d40;">Weekly Summary Report</h2>
          <p>Hello Manager,</p>
          <p>Please find attached the weekly IT operations summary for the Khyber Resort IT Department.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">This is an automated report generated by the Khyber IT Operations Portal.</p>
        </div>
      `,
      attachments: [
        {
          filename: `Weekly_Report_${format(new Date(), "yyyy-MM-dd")}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    if (!res.success) {
      logger.error(res.error, "Failed to send weekly report email");
      return { success: false, error: res.error };
    }

    return { success: true };
  } catch (error) {
    logger.error(error, "Unexpected error sending weekly report");
    return { success: false, error };
  }
};
