const nodemailer = require("nodemailer");
const { smtp } = require("../config/env");
const logger = require("../config/logger");

const transporter = nodemailer.createTransport({
  host: smtp.host,
  port: smtp.port,
  secure: smtp.port === 465,
  auth: { user: smtp.user, pass: smtp.pass },
});

async function sendEmail({ to, subject, html, text }) {
  try {
    const info = await transporter.sendMail({
      from: smtp.from,
      to,
      subject,
      text,
      html,
    });
    logger.debug(`Email sent: ${info.messageId}`);
    return info;
  } catch (err) {
    logger.error(`Failed to send email to ${to}: ${err.message}`);
    // Email failures should not crash the request flow in most cases;
    // callers decide whether to surface this as a hard failure.
    throw err;
  }
}

async function sendOtpEmail(to, otp, purpose = "verification") {
  const subject =
    purpose === "reset"
      ? "GoTogether - Password Reset OTP"
      : "GoTogether - Verify Your Email";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
      <h2 style="color:#0f766e;">GoTogether 🚗</h2>
      <p>Your one-time password (OTP) is:</p>
      <h1 style="letter-spacing:4px;">${otp}</h1>
      <p>This code expires in a few minutes. If you did not request this, please ignore this email.</p>
    </div>`;
  return sendEmail({ to, subject, html, text: `Your OTP is ${otp}` });
}

module.exports = { sendEmail, sendOtpEmail };
