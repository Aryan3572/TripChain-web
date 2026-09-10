// backend/src/utils/emailService.js
import nodemailer from "nodemailer";

const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || "beingaryan5555@gmail.com";

let transporter = null;
let etherealReady = false;

async function getTransporter() {
  if (transporter) return transporter;

  // 1. Gmail App Password support
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
    console.log("[Email Service] Configured with Gmail SMTP.");
    return transporter;
  }

  // 2. Generic SMTP support
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log(`[Email Service] Configured with SMTP host: ${process.env.SMTP_HOST}`);
    return transporter;
  }

  // 3. Fallback: Ethereal test account for development / testing
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    etherealReady = true;
    console.log("[Email Service] Configured with Ethereal test account for local development.");
    return transporter;
  } catch (err) {
    console.warn("[Email Service] Could not initialize Ethereal account:", err.message);
    return null;
  }
}

/**
 * Sends an email notification to beingaryan5555@gmail.com on login
 */
export async function sendLoginAlert({
  userEmail,
  userName = "Traveler",
  loginMethod = "Password Authentication",
  ip = "Unknown IP",
  userAgent = "Unknown Device"
}) {
  const loginTime = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "full",
    timeStyle: "long",
  });

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #FDFCDC; border: 4px solid #14213D; border-radius: 20px; overflow: hidden; box-shadow: 6px 6px 0px #14213D;">
      <div style="background: #14213D; padding: 24px; text-align: center;">
        <h1 style="color: #FFBE0B; margin: 0; font-size: 26px; letter-spacing: -0.5px;">
          Tripchain <span>🛡️</span>
        </h1>
        <p style="color: #FFFFFF; margin: 6px 0 0; font-size: 14px; font-weight: 500;">
          Security Alert: New Login Detected
        </p>
      </div>

      <div style="padding: 28px 24px; background: #FFFFFF;">
        <h2 style="color: #14213D; margin-top: 0; font-size: 20px;">
          User Sign-In Notification
        </h2>
        <p style="color: #4A4E69; font-size: 15px; line-height: 1.5;">
          A user has just successfully logged into their <strong>Tripchain</strong> account. Here are the session details:
        </p>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
          <tbody>
            <tr style="border-bottom: 2px solid #F1F5F9;">
              <td style="padding: 10px 8px; font-weight: bold; color: #14213D; width: 35%;">User Email:</td>
              <td style="padding: 10px 8px; color: #3A86FF; font-weight: 700;">${userEmail}</td>
            </tr>
            <tr style="border-bottom: 2px solid #F1F5F9;">
              <td style="padding: 10px 8px; font-weight: bold; color: #14213D;">User Name:</td>
              <td style="padding: 10px 8px; color: #14213D;">${userName}</td>
            </tr>
            <tr style="border-bottom: 2px solid #F1F5F9;">
              <td style="padding: 10px 8px; font-weight: bold; color: #14213D;">Login Method:</td>
              <td style="padding: 10px 8px; color: #059669; font-weight: 700;">${loginMethod}</td>
            </tr>
            <tr style="border-bottom: 2px solid #F1F5F9;">
              <td style="padding: 10px 8px; font-weight: bold; color: #14213D;">Date & Time:</td>
              <td style="padding: 10px 8px; color: #14213D;">${loginTime} (IST)</td>
            </tr>
            <tr style="border-bottom: 2px solid #F1F5F9;">
              <td style="padding: 10px 8px; font-weight: bold; color: #14213D;">IP Address:</td>
              <td style="padding: 10px 8px; color: #14213D; font-family: monospace;">${ip}</td>
            </tr>
            <tr>
              <td style="padding: 10px 8px; font-weight: bold; color: #14213D;">Device / Browser:</td>
              <td style="padding: 10px 8px; color: #64748B; font-size: 12px; word-break: break-all;">${userAgent}</td>
            </tr>
          </tbody>
        </table>

        <div style="background: #FEF3C7; border: 2px solid #F59E0B; border-radius: 12px; padding: 14px; margin-top: 20px;">
          <p style="margin: 0; color: #92400E; font-size: 13px; font-weight: 600;">
            ℹ️ This automated notification is configured to be delivered directly to <strong>${ADMIN_EMAIL}</strong>.
          </p>
        </div>
      </div>

      <div style="background: #FDFCDC; padding: 16px; text-align: center; border-top: 2px solid #14213D;">
        <p style="margin: 0; color: #4A4E69; font-size: 12px; font-weight: bold;">
          Tripchain Web3 Travel & Eco-Tracker System
        </p>
      </div>
    </div>
  `;

  // Asynchronously execute email sending
  try {
    const mailer = await getTransporter();

    if (!mailer) {
      console.log(`\n================== [LOGIN ALERT] ==================`);
      console.log(`To: ${ADMIN_EMAIL}`);
      console.log(`User Logged In: ${userEmail} (${userName})`);
      console.log(`Method: ${loginMethod}`);
      console.log(`Time: ${loginTime}`);
      console.log(`IP: ${ip}`);
      console.log(`Device: ${userAgent}`);
      console.log(`===================================================\n`);
      return;
    }

    const sender = process.env.GMAIL_USER || process.env.SMTP_FROM || `"Tripchain Security" <no-reply@tripchain.io>`;

    const info = await mailer.sendMail({
      from: sender,
      to: ADMIN_EMAIL,
      subject: `🔐 Tripchain Login Alert: ${userEmail}`,
      html: htmlContent,
      text: `Tripchain Login Alert\n\nUser: ${userEmail} (${userName})\nMethod: ${loginMethod}\nTime: ${loginTime}\nIP: ${ip}\nDevice: ${userAgent}`,
    });

    console.log(`[Email Service] Login alert email sent to ${ADMIN_EMAIL}. Message ID: ${info.messageId}`);
    if (etherealReady) {
      console.log(`[Email Service] Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
  } catch (err) {
    console.error("[Email Service] Failed to send login alert email:", err.message);
  }
}
