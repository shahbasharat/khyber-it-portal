import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const smtpUser = process.env.SMTP_USER || "itkhyber@gmail.com";
const smtpPass = process.env.SMTP_PASS;
const managerEmail = process.env.MANAGER_EMAIL;

console.log("🔍 Testing Google Gmail SMTP Configuration...");
console.log("SMTP_USER:", smtpUser || "MISSING!");
console.log("SMTP_PASS:", smtpPass ? "Present (Confidential)" : "MISSING!");
console.log("MANAGER_EMAIL:", managerEmail || "MISSING!");

if (!smtpPass || !managerEmail) {
  console.error("❌ Error: Missing SMTP_PASS or MANAGER_EMAIL in your .env file!");
  process.exit(1);
}

// Initialize standard Gmail SMTP transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: smtpUser,
    pass: smtpPass, // Google App Password
  },
});

async function run() {
  try {
    console.log("📤 Attempting to send test email via Gmail SMTP...");
    const info = await transporter.sendMail({
      from: `"Khyber IT Operations" <${smtpUser}>`,
      to: managerEmail,
      subject: "🧪 Test Google SMTP Connection Success",
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #004d40;">Google SMTP Verified!</h2>
          <p>This is a test email to confirm that your Gmail App Password and SMTP email dispatch are working perfectly.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">Khyber IT Operations Portal Autopilot Diagnostics.</p>
        </div>
      `
    });

    console.log("✅ Email sent successfully via Gmail SMTP!", info.messageId);
  } catch (err) {
    console.error("❌ Gmail SMTP Dispatch failed:", err);
  }
}

run();
