import { prisma } from "../lib/prisma";
import PDFDocument from "pdfkit";
import { format } from "date-fns";
import logger from "../lib/logger";
import path from "path";
import fs from "fs";

export const generateSingleReportPDF = async (reportId: string): Promise<Buffer> => {
  try {
    // 1. Fetch Report with its related Shift and User
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        shift: {
          include: {
            user: { select: { name: true, role: true } }
          }
        }
      }
    });

    if (!report) {
      throw new Error(`Report not found for ID: ${reportId}`);
    }

    // Determine shift type based on start time
    const shiftHour = new Date(report.shift.startTime).getHours();
    const shiftName = shiftHour < 13 ? "Morning Shift" : "Afternoon Shift";

    // 2. Fetch all checklist responses for this specific shift
    const checklistResponses = await prisma.checklistResponse.findMany({
      where: { shiftId: report.shiftId },
      include: { checklistItem: true }
    });

    // 3. Fetch all issues created or resolved on this shift date range
    // We define shift window: start of shift to end of shift (or report creation time)
    const shiftStart = report.shift.startTime;
    const shiftEnd = report.shift.endTime || report.createdAt;

    const issues = await prisma.issue.findMany({
      where: {
        createdAt: { gte: shiftStart, lte: shiftEnd }
      },
      include: {
        reporter: { select: { name: true } },
        assignee: { select: { name: true } }
      }
    });

    // 4. Create PDF Document (A4 size, clean margins)
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
      const possibleLogoPaths = [
        path.join(process.cwd(), "Public/Logo Green.png"),
        path.join(process.cwd(), "../../Public/Logo Green.png"),
        path.join(__dirname, "../../../../Public/Logo Green.png"),
        path.join(process.cwd(), "Public/logo.jpg"),
        path.join(process.cwd(), "../../Public/logo.jpg"),
        path.join(__dirname, "../../../../Public/logo.jpg")
      ];
      const logoPath = possibleLogoPaths.find((p) => fs.existsSync(p));

      if (logoPath) {
        // Draw crisp luxury logo image
        doc.image(logoPath, 40, 40, { width: 50 });
        
        // Branded title
        doc.fillColor("#19433E").fontSize(16).font("Helvetica-Bold").text("THE KHYBER HIMALAYAN RESORT & SPA", 100, 48, { align: "left" });
        doc.fontSize(10).font("Helvetica-Bold").fillColor("#C5A880").text("IT Operations Shift Handover Report", 100, 68, { align: "left" });
        
        // Date Meta
        doc.fillColor("#333333").fontSize(9).font("Helvetica-Bold").text(format(new Date(report.createdAt), "dd MMM yyyy").toUpperCase(), 400, 48, { align: "right", width: 140 });
        doc.fontSize(8).font("Helvetica").fillColor("#777777").text(format(new Date(report.createdAt), "hh:mm a"), 400, 62, { align: "right", width: 140 });
      } else {
        // Fallback banner if logo not present in workspace
        doc.rect(40, 40, 515, 60).fill("#19433E");
        
        doc.fillColor("#FDFBF7").fontSize(18).font("Helvetica-Bold").text("THE KHYBER HIMALAYAN RESORT & SPA", 55, 52, { align: "left" });
        doc.fontSize(12).font("Helvetica").text("IT Operations Shift Handover Report", 55, 75, { align: "left" });
        
        doc.fontSize(10).font("Helvetica-Bold").text(format(new Date(report.createdAt), "dd MMM yyyy").toUpperCase(), 400, 52, { align: "right", width: 140 });
        doc.fontSize(8).font("Helvetica").text(format(new Date(report.createdAt), "hh:mm a"), 400, 68, { align: "right", width: 140 });
      }

      // Gold Divider lines
      doc.moveDown(2);
      doc.strokeColor("#D4AF37").lineWidth(1.5).moveTo(40, 110).lineTo(555, 110).stroke();
      doc.strokeColor("#D4AF37").lineWidth(0.5).moveTo(40, 114).lineTo(555, 114).stroke();

      // --- SECTION 1: SHIFT DETAILS GRID ---
      doc.moveDown(1.5);
      doc.fillColor("#19433E").fontSize(12).font("Helvetica-Bold").text("1. Handover Details", 40, 125);
      
      // Clean grey box for shift details
      doc.rect(40, 142, 515, 70).fill("#F4F4F0");
      doc.fillColor("#333333").fontSize(9);

      // Grid Layout values
      const leftColX = 55;
      const rightColX = 300;
      doc.font("Helvetica-Bold").text("Prepared By:", leftColX, 152);
      doc.font("Helvetica").text(report.shift.user.name, leftColX + 80, 152);

      doc.font("Helvetica-Bold").text("Role:", leftColX, 172);
      doc.font("Helvetica").text(report.shift.user.role, leftColX + 80, 172);

      doc.font("Helvetica-Bold").text("Shift Type:", leftColX, 192);
      doc.font("Helvetica").text(shiftName, leftColX + 80, 192);

      doc.font("Helvetica-Bold").text("Downtime:", rightColX, 152);
      doc.font("Helvetica").text(`${report.downtime} Minutes`, rightColX + 100, 152);

      doc.font("Helvetica-Bold").text("Users Supported:", rightColX, 172);
      doc.font("Helvetica").text(String(report.usersSupported), rightColX + 100, 172);

      doc.font("Helvetica-Bold").text("Shift Duration:", rightColX, 192);
      const startTimeStr = format(new Date(report.shift.startTime), "hh:mm a");
      const endTimeStr = report.shift.endTime ? format(new Date(report.shift.endTime), "hh:mm a") : "Present";
      doc.font("Helvetica").text(`${startTimeStr} - ${endTimeStr}`, rightColX + 100, 192);

      // --- SECTION 2: CHECKLIST TASK STATS ---
      doc.moveDown(1.5);
      doc.fillColor("#19433E").fontSize(12).font("Helvetica-Bold").text("2. Daily Checklist Completion Summary", 40, 227);
      
      // Draw grid headers
      doc.rect(40, 245, 515, 18).fill("#19433E");
      doc.fillColor("#FDFBF7").fontSize(8).font("Helvetica-Bold");
      doc.text("TASK DESCRIPTION", 50, 250);
      doc.text("CATEGORY", 280, 250);
      doc.text("STATUS", 480, 250);

      let currentY = 263;
      doc.fillColor("#333333").fontSize(8);

      checklistResponses.forEach((res, index) => {
        // Alternating background colors
        if (index % 2 === 0) {
          doc.rect(40, currentY, 515, 16).fill("#FAF9F6");
        }
        
        doc.fillColor("#333333").font("Helvetica").text(res.checklistItem.title, 50, currentY + 4);
        doc.text(res.checklistItem.category.toUpperCase(), 280, currentY + 4);
        
        if (res.completed) {
          doc.fillColor("#2E7D32").font("Helvetica-Bold").text("COMPLETED", 480, currentY + 4);
        } else {
          doc.fillColor("#C62828").font("Helvetica-Bold").text("INCOMPLETE", 480, currentY + 4);
        }

        currentY += 16;
      });

      // --- SECTION 3: INCIDENTS LOG ---
      doc.moveDown(1);
      doc.fillColor("#19433E").fontSize(12).font("Helvetica-Bold").text("3. Incident & Issues Log", 40, currentY + 15);
      
      const issuesY = currentY + 33;
      doc.rect(40, issuesY, 515, 18).fill("#19433E");
      doc.fillColor("#FDFBF7").fontSize(8).font("Helvetica-Bold");
      doc.text("TICKET NO", 50, issuesY + 5);
      doc.text("TITLE / DESCRIPTION", 130, issuesY + 5);
      doc.text("PRIORITY", 340, issuesY + 5);
      doc.text("STATUS", 440, issuesY + 5);

      let issueY = issuesY + 18;
      doc.fillColor("#333333").fontSize(8);

      if (issues.length === 0) {
        doc.font("Helvetica-Oblique").text("No issues reported during this shift.", 50, issueY + 6);
        issueY += 18;
      } else {
        issues.forEach((issue, index) => {
          if (index % 2 === 0) {
            doc.rect(40, issueY, 515, 20).fill("#FAF9F6");
          }
          
          doc.fillColor("#333333").font("Helvetica-Bold").text(`KHY-${issue.id.substring(0,4).toUpperCase()}`, 50, issueY + 6);
          doc.font("Helvetica").text(issue.title, 130, issueY + 6, { width: 200, height: 10 });
          
          // Priority Colors
          if (issue.priority === "CRITICAL" || issue.priority === "HIGH") {
            doc.fillColor("#C62828").font("Helvetica-Bold").text(issue.priority, 340, issueY + 6);
          } else {
            doc.fillColor("#333333").font("Helvetica").text(issue.priority, 340, issueY + 6);
          }

          // Status colors
          if (issue.status === "RESOLVED") {
            doc.fillColor("#2E7D32").font("Helvetica-Bold").text("RESOLVED", 440, issueY + 6);
          } else if (issue.status === "ESCALATED") {
            doc.fillColor("#D84315").font("Helvetica-Bold").text("ESCALATED", 440, issueY + 6);
          } else {
            doc.fillColor("#F57F17").font("Helvetica-Bold").text(issue.status.replace("_", " "), 440, issueY + 6);
          }

          issueY += 20;
        });
      }

      // --- SECTION 4: HANDOVER NOTES ---
      doc.moveDown(1);
      doc.fillColor("#19433E").fontSize(12).font("Helvetica-Bold").text("4. Handover & Shift Notes", 40, issueY + 15);
      
      const notesY = issueY + 33;
      doc.rect(40, notesY, 515, 75).fill("#FDFBF7").strokeColor("#D4AF37").lineWidth(1).stroke();
      doc.fillColor("#19433E").fontSize(8).font("Helvetica-Bold").text("INCOMING SHIFT HANDOVER REMARKS:", 50, notesY + 8);
      
      doc.fillColor("#333333").fontSize(9).font("Helvetica").text(
        report.content || "No special instructions left for the incoming shift.",
        50,
        notesY + 22,
        { width: 495, lineGap: 2 }
      );

      // --- SIGNATURE FOOTER PANEL ---
      doc.moveDown(2);
      const footerY = notesY + 115;
      doc.strokeColor("#E0E0E0").lineWidth(0.5).moveTo(40, footerY).lineTo(555, footerY).stroke();
      
      doc.fontSize(8).fillColor("#777777");
      doc.font("Helvetica-Bold").text("Outgoing IT Engineer Signature: ______________________", 40, footerY + 15);
      doc.font("Helvetica-Bold").text("IT Manager Signature: ________________________", 320, footerY + 15);
      
      doc.fontSize(7).fillColor("#999999").text(
        "Confidential - Internal IT Operations Only - The Khyber Himalayan Resort & Spa, Gulmarg",
        40,
        footerY + 35,
        { align: "center", width: 515 }
      );

      doc.end();
    });
  } catch (error) {
    logger.error({ error, reportId }, "Failed to compile single report PDF");
    throw error;
  }
};
