import dotenv from "dotenv";
import { Resend } from "resend";

dotenv.config();

const apiKey = process.env.RESEND_API_KEY;
const managerEmail = process.env.MANAGER_EMAIL;

console.log("🔍 Testing Resend Configuration...");
console.log("RESEND_API_KEY:", apiKey ? `Present (Starts with ${apiKey.substring(0, 7)})` : "MISSING!");
console.log("MANAGER_EMAIL:", managerEmail || "MISSING!");

if (!apiKey || !managerEmail) {
  console.error("❌ Error: Missing credentials in your .env file!");
  process.exit(1);
}

const resend = new Resend(apiKey);

async function run() {
  try {
    console.log("📤 Attempting to send test email...");
    const { data, error } = await resend.emails.send({
      from: "Khyber IT Portal <onboarding@resend.dev>",
      to: [managerEmail as string],
      subject: "🧪 Test Shift Handover Connection Success",
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #004d40;">Resend Connection Verified!</h2>
          <p>This is a test shift handover email to confirm that your Resend API Key is working perfectly.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">Khyber IT Operations Portal Autopilot Diagnostics.</p>
        </div>
      `
    });

    if (error) {
      console.error("❌ Resend API Error Details:", error);
    } else {
      console.log("✅ Email sent successfully! Response ID:", data?.id);
    }
  } catch (err) {
    console.error("❌ Unexpected System Error:", err);
  }
}

run();
