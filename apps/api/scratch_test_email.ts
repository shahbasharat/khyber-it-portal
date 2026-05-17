import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT || 587);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.SMTP_FROM;
const managerEmail = process.env.MANAGER_EMAIL;

console.log("🔍 Testing Nodemailer SMTP Configuration...");
console.log("SMTP_HOST:", host || "MISSING!");
console.log("SMTP_PORT:", port || "MISSING!");
console.log("SMTP_USER:", user || "MISSING!");
console.log("SMTP_PASS:", pass ? "Present" : "MISSING!");
console.log("SMTP_FROM:", from || "MISSING!");
console.log("MANAGER_EMAIL:", managerEmail || "MISSING!");

if (!host || !user || !pass || !managerEmail) {
  console.error("❌ Error: Missing SMTP credentials in your .env file!");
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: { user, pass },
  tls: { rejectUnauthorized: false }
});

async function run() {
  try {
    console.log("📤 Attempting to send test SMTP email...");
    const info = await transporter.sendMail({
      from: from || `"Khyber IT" <${user}>`,
      to: managerEmail,
      subject: "🧪 Test Nodemailer SMTP Connection Success",
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #004d40;">SMTP Connection Verified!</h2>
          <p>This is a test email to confirm that your Gmail App Password and Nodemailer configuration are working perfectly.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">Khyber IT Operations Portal Autopilot Diagnostics.</p>
        </div>
      `
    });

    console.log("✅ Email sent successfully! Message ID:", info.messageId);
  } catch (err) {
    console.error("❌ SMTP Error Details:", err);
  }
}

run();
