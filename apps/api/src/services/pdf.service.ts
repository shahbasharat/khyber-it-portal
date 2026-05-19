import { prisma } from "../lib/prisma";
import PDFDocument from "pdfkit";
import { format } from "date-fns";
import logger from "../lib/logger";
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

    // 2. Fetch all checklist responses for the day of this report
    const start = new Date(report.createdAt);
    start.setHours(0, 0, 0, 0);
    const end = new Date(report.createdAt);
    end.setHours(23, 59, 59, 999);

    const checklistResponses = await prisma.checklistResponse.findMany({
      where: {
        createdAt: { gte: start, lte: end }
      },
      include: { checklistItem: true }
    });

    // 3. Fetch all issues created on the day of this report or currently outstanding
    const issues = await prisma.issue.findMany({
      where: {
        OR: [{ createdAt: { gte: start, lte: end } }, { status: { in: ["OPEN", "IN_PROGRESS", "ESCALATED"] } }]
      },
      include: {
        reporter: { select: { name: true } },
        assignee: { select: { name: true } },
        escalation: true
      }
    });

    // 3b. Fetch Server Room Logs and Wi-Fi Codes for the day
    const serverLogs = await prisma.serverRoomLog.findMany({
      where: { createdAt: { gte: start, lte: end } },
      orderBy: { createdAt: "desc" }
    });

    const wifiCodes = await prisma.guestWifiCode.findMany({
      where: { createdAt: { gte: start, lte: end } },
      orderBy: { createdAt: "desc" }
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
      const logoPath = getLogoPath();

      if (logoPath) {
        // Draw crisp luxury logo image
        doc.image(logoPath, 40, 40, { width: 50 });
        
        // Branded title
        doc.fillColor("#19433E").fontSize(14).font("Helvetica-Bold").text("THE KHYBER HIMALAYAN RESORT & SPA", 100, 40, { align: "left" });
        doc.fontSize(9).font("Helvetica-Bold").fillColor("#C5A880").text("Professional IT Shift Handover Report", 100, 56, { align: "left" });
        doc.fontSize(11).font("Helvetica-BoldOblique").fillColor("#19433E").text("\"Khyber's Daily IT Flash\"", 100, 70, { align: "left" });
        
        // Date Meta
        doc.fillColor("#333333").fontSize(9).font("Helvetica-Bold").text(format(new Date(report.createdAt), "dd MMM yyyy").toUpperCase(), 400, 40, { align: "right", width: 140 });
        doc.fontSize(8).font("Helvetica").fillColor("#777777").text(format(new Date(report.createdAt), "hh:mm a"), 400, 54, { align: "right", width: 140 });
      } else {
        // Fallback banner if logo not present in workspace
        doc.rect(40, 40, 515, 60).fill("#19433E");
        
        doc.fillColor("#FDFBF7").fontSize(14).font("Helvetica-Bold").text("THE KHYBER HIMALAYAN RESORT & SPA", 55, 45, { align: "left" });
        doc.fontSize(9).font("Helvetica").text("Professional IT Shift Handover Report", 55, 61, { align: "left" });
        doc.fontSize(10).font("Helvetica-BoldOblique").fillColor("#C5A880").text("\"Khyber's Daily IT Flash\"", 55, 75, { align: "left" });
        
        doc.fillColor("#FDFBF7").fontSize(9).font("Helvetica-Bold").text(format(new Date(report.createdAt), "dd MMM yyyy").toUpperCase(), 400, 45, { align: "right", width: 140 });
        doc.fontSize(8).font("Helvetica").text(format(new Date(report.createdAt), "hh:mm a"), 400, 61, { align: "right", width: 140 });
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
      doc.font("Helvetica").text(`${(report as any).downtime} Minutes`, rightColX + 100, 152);

      doc.font("Helvetica-Bold").text("Users Supported:", rightColX, 172);
      doc.font("Helvetica").text(String((report as any).usersSupported), rightColX + 100, 172);

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
        // Dynamic Page Wrap Check
        if (currentY > 730) {
          doc.addPage();
          
          // Re-draw headers on new page
          doc.rect(40, 40, 515, 18).fill("#19433E");
          doc.fillColor("#FDFBF7").fontSize(8).font("Helvetica-Bold");
          doc.text("TASK DESCRIPTION", 50, 45);
          doc.text("CATEGORY", 280, 45);
          doc.text("STATUS", 480, 45);
          
          currentY = 63;
        }

        // Alternating background colors
        if (index % 2 === 0) {
          doc.rect(40, currentY, 515, 16).fill("#FAF9F6");
        }
        
        doc.fillColor("#333333").font("Helvetica").fontSize(8).text(res.checklistItem.title, 50, currentY + 4);
        doc.text(res.checklistItem.category.toUpperCase(), 280, currentY + 4);
        
        let status = (res as any)?.status || "PENDING";
        if (res.completed && status === "PENDING") {
          status = "WORKING";
        }
        if (status === "WORKING") {
          doc.fillColor("#2E7D32").font("Helvetica-Bold").text("WORKING", 480, currentY + 4);
        } else if (status === "NOT_WORKING") {
          doc.fillColor("#C62828").font("Helvetica-Bold").text("NOT WORKING", 480, currentY + 4);
        } else if (status === "PARTIAL") {
          doc.fillColor("#F57F17").font("Helvetica-Bold").text("PARTIAL", 480, currentY + 4);
        } else {
          doc.fillColor("#757575").font("Helvetica-Bold").text("PENDING", 480, currentY + 4);
        }

        currentY += 16;
      });

      // Filter issues into resolved and pending (representing follow-up tasks)
      const resolvedIssues = issues.filter((i) => i.status === "RESOLVED");
      const pendingIssues = issues.filter((i) => i.status !== "RESOLVED");

      // --- SECTION 3: RESOLVED INCIDENTS LOG ---
      if (currentY > 700) {
        doc.addPage();
        currentY = 40;
      }

      doc.fillColor("#19433E").fontSize(12).font("Helvetica-Bold").text("3. Shift Incidents Log (Resolved)", 40, currentY + 15);
      
      const issuesY = currentY + 33;
      doc.rect(40, issuesY, 515, 18).fill("#19433E");
      doc.fillColor("#FDFBF7").fontSize(8).font("Helvetica-Bold");
      doc.text("TICKET NO", 50, issuesY + 5);
      doc.text("TITLE / DESCRIPTION", 130, issuesY + 5);
      doc.text("PRIORITY", 340, issuesY + 5);
      doc.text("STATUS", 440, issuesY + 5);

      let issueY = issuesY + 18;
      doc.fillColor("#333333").fontSize(8);

      if (resolvedIssues.length === 0) {
        doc.font("Helvetica-Oblique").text("No issues resolved during this shift.", 50, issueY + 6);
        issueY += 18;
      } else {
        resolvedIssues.forEach((issue, index) => {
          if (issueY > 730) {
            doc.addPage();
            doc.rect(40, 40, 515, 18).fill("#19433E");
            doc.fillColor("#FDFBF7").fontSize(8).font("Helvetica-Bold");
            doc.text("TICKET NO", 50, 45);
            doc.text("TITLE / DESCRIPTION", 130, 45);
            doc.text("PRIORITY", 340, 45);
            doc.text("STATUS", 440, 45);
            issueY = 63;
          }

          if (index % 2 === 0) {
            doc.rect(40, issueY, 515, 20).fill("#FAF9F6");
          }
          
          doc.fillColor("#333333").font("Helvetica-Bold").text(`KHY-${issue.id.substring(0,4).toUpperCase()}`, 50, issueY + 6);
          doc.font("Helvetica").text(issue.title, 130, issueY + 6, { width: 200, height: 10 });
          
          if (issue.priority === "CRITICAL" || issue.priority === "HIGH") {
            doc.fillColor("#C62828").font("Helvetica-Bold").text(issue.priority, 340, issueY + 6);
          } else {
            doc.fillColor("#333333").font("Helvetica").text(issue.priority, 340, issueY + 6);
          }

          doc.fillColor("#2E7D32").font("Helvetica-Bold").text("RESOLVED", 440, issueY + 6);

          issueY += 20;
        });
      }

      // --- SECTION 4: PENDING FOLLOW-UP ACTIONS ---
      if (issueY > 700) {
        doc.addPage();
        issueY = 40;
      }

      doc.fillColor("#19433E").fontSize(12).font("Helvetica-Bold").text("4. Pending & Follow-up Actions", 40, issueY + 15);
      
      const pendingY = issueY + 33;
      doc.rect(40, pendingY, 515, 18).fill("#19433E");
      doc.fillColor("#FDFBF7").fontSize(8).font("Helvetica-Bold");
      doc.text("TICKET NO", 50, pendingY + 5);
      doc.text("PENDING ISSUE / REMARKS", 130, pendingY + 5);
      doc.text("PRIORITY", 340, pendingY + 5);
      doc.text("CURRENT STATE", 440, pendingY + 5);

      let pY = pendingY + 18;
      doc.fillColor("#333333").fontSize(8);

      if (pendingIssues.length === 0) {
        doc.font("Helvetica-Oblique").text("No pending issues or outstanding follow-ups.", 50, pY + 6);
        pY += 18;
      } else {
        pendingIssues.forEach((issue, index) => {
          if (pY > 730) {
            doc.addPage();
            doc.rect(40, 40, 515, 18).fill("#19433E");
            doc.fillColor("#FDFBF7").fontSize(8).font("Helvetica-Bold");
            doc.text("TICKET NO", 50, 45);
            doc.text("PENDING ISSUE / REMARKS", 130, 45);
            doc.text("PRIORITY", 340, 45);
            doc.text("CURRENT STATE", 440, 45);
            pY = 63;
          }

          if (index % 2 === 0) {
            doc.rect(40, pY, 515, 20).fill("#FAF9F6");
          }
          
          doc.fillColor("#333333").font("Helvetica-Bold").text(`KHY-${issue.id.substring(0,4).toUpperCase()}`, 50, pY + 6);
          
          const followUpText = (issue as any).escalation 
            ? `${issue.title} (Escalated to: ${(issue as any).escalation.escalatedTo})`
            : issue.title;

          doc.font("Helvetica").text(followUpText, 130, pY + 6, { width: 200, height: 10 });
          
          if (issue.priority === "CRITICAL" || issue.priority === "HIGH") {
            doc.fillColor("#C62828").font("Helvetica-Bold").text(issue.priority, 340, pY + 6);
          } else {
            doc.fillColor("#333333").font("Helvetica").text(issue.priority, 340, pY + 6);
          }

          if (issue.status === "ESCALATED") {
            doc.fillColor("#D84315").font("Helvetica-Bold").text("ESCALATED", 440, pY + 6);
          } else {
            doc.fillColor("#F57F17").font("Helvetica-Bold").text(issue.status.replace("_", " "), 440, pY + 6);
          }

          pY += 20;
        });
      }

      // --- SECTION 5: HANDOVER NOTES ---
      if (pY > 670) {
        doc.addPage();
        pY = 40;
      }

      doc.fillColor("#19433E").fontSize(12).font("Helvetica-Bold").text("5. Handover & Shift Notes", 40, pY + 15);
      
      const notesY = pY + 33;
      doc.rect(40, notesY, 515, 75).fill("#FDFBF7").strokeColor("#D4AF37").lineWidth(1).stroke();
      doc.fillColor("#19433E").fontSize(8).font("Helvetica-Bold").text("INCOMING SHIFT HANDOVER REMARKS:", 50, notesY + 8);
      
      doc.fillColor("#333333").fontSize(9).font("Helvetica").text(
        report.content || "No special instructions left for the incoming shift.",
        50,
        notesY + 22,
        { width: 495, lineGap: 2 }
      );

      // --- SECTION 6: SERVER ROOM LOGS ---
      let sY = notesY + 90;
      if (sY > 650) {
        doc.addPage();
        sY = 40;
      }

      doc.fillColor("#19433E").fontSize(12).font("Helvetica-Bold").text("6. Server Room Entry/Exit Logs", 40, sY + 15);
      
      const sHeadY = sY + 33;
      doc.rect(40, sHeadY, 515, 18).fill("#19433E");
      doc.fillColor("#FDFBF7").fontSize(8).font("Helvetica-Bold");
      doc.text("TIME", 50, sHeadY + 5);
      doc.text("PERSON / ENGINEER", 130, sHeadY + 5);
      doc.text("REASON / PURPOSE", 300, sHeadY + 5);

      let sRowY = sHeadY + 18;
      doc.fillColor("#333333").fontSize(8);

      if (serverLogs.length === 0) {
        doc.font("Helvetica-Oblique").text("No server room entries recorded during this shift.", 50, sRowY + 6);
        sRowY += 18;
      } else {
        serverLogs.forEach((log, index) => {
          if (sRowY > 730) {
            doc.addPage();
            doc.rect(40, 40, 515, 18).fill("#19433E");
            doc.fillColor("#FDFBF7").fontSize(8).font("Helvetica-Bold");
            doc.text("TIME", 50, 45);
            doc.text("PERSON / ENGINEER", 130, 45);
            doc.text("REASON / PURPOSE", 300, 45);
            sRowY = 63;
          }

          if (index % 2 === 0) {
            doc.rect(40, sRowY, 515, 20).fill("#FAF9F6");
          }
          
          doc.fillColor("#333333").font("Helvetica-Bold").text(log.entryTime, 50, sRowY + 6);
          doc.font("Helvetica").text(log.userName, 130, sRowY + 6, { width: 160, height: 10 });
          doc.text(log.reason, 300, sRowY + 6, { width: 200, height: 10 });

          sRowY += 20;
        });
      }

      // --- SECTION 7: GUEST WI-FI VOUCHERS ---
      let wY = sRowY + 20;
      if (wY > 650) {
        doc.addPage();
        wY = 40;
      }

      doc.fillColor("#19433E").fontSize(12).font("Helvetica-Bold").text("7. Guest Wi-Fi Vouchers Issued", 40, wY + 15);
      
      const wHeadY = wY + 33;
      doc.rect(40, wHeadY, 515, 18).fill("#19433E");
      doc.fillColor("#FDFBF7").fontSize(8).font("Helvetica-Bold");
      doc.text("ACCESS CODE", 50, wHeadY + 5);
      doc.text("ISSUED TO", 150, wHeadY + 5);
      doc.text("PLAN", 330, wHeadY + 5);
      doc.text("DEVICES", 460, wHeadY + 5);

      let wRowY = wHeadY + 18;
      doc.fillColor("#333333").fontSize(8);

      if (wifiCodes.length === 0) {
        doc.font("Helvetica-Oblique").text("No guest Wi-Fi vouchers issued during this shift.", 50, wRowY + 6);
        wRowY += 18;
      } else {
        wifiCodes.forEach((wifi, index) => {
          if (wRowY > 730) {
            doc.addPage();
            doc.rect(40, 40, 515, 18).fill("#19433E");
            doc.fillColor("#FDFBF7").fontSize(8).font("Helvetica-Bold");
            doc.text("ACCESS CODE", 50, 45);
            doc.text("ISSUED TO", 150, 45);
            doc.text("PLAN", 330, 45);
            doc.text("DEVICES", 460, 45);
            wRowY = 63;
          }

          if (index % 2 === 0) {
            doc.rect(40, wRowY, 515, 20).fill("#FAF9F6");
          }
          
          doc.fillColor("#19433E").font("Helvetica-Bold").text(wifi.accessCode, 50, wRowY + 6);
          doc.fillColor("#333333").font("Helvetica").text(wifi.issuedTo, 150, wRowY + 6, { width: 170, height: 10 });
          doc.text(wifi.plan, 330, wRowY + 6, { width: 120, height: 10 });
          doc.font("Helvetica-Bold").text(`${wifi.deviceLimit} Devices`, 460, wRowY + 6);

          wRowY += 20;
        });
      }

      // --- FOOTER PANEL ---
      let footerY = wRowY + 30;
      if (footerY > 730) {
        doc.addPage();
        footerY = 60;
      }

      doc.strokeColor("#E0E0E0").lineWidth(0.5).moveTo(40, footerY).lineTo(555, footerY).stroke();
      
      doc.fontSize(7).fillColor("#999999").text(
        "Confidential - Internal IT Operations Only - The Khyber Himalayan Resort & Spa, Gulmarg",
        40,
        footerY + 15,
        { align: "center", width: 515 }
      );

      doc.end();
    });
  } catch (error) {
    logger.error({ error, reportId }, "Failed to compile single report PDF");
    throw error;
  }
};
