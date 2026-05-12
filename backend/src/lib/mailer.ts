import nodemailer from "nodemailer";
import { env } from "../config/env.js";

type InvitationEmailInput = {
  to: string;
  name: string;
  invitationUrl: string;
};

function createTransport() {
  if (!env.SMTP_HOST) {
    return nodemailer.createTransport({ jsonTransport: true });
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: env.SMTP_USER && env.SMTP_PASS ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined
  });
}

export async function sendInvitationEmail({ to, name, invitationUrl }: InvitationEmailInput) {
  const transporter = createTransport();
  const result = await transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject: "Your Al Kayan account invitation",
    text: `Hello ${name},\n\nYou have been invited to Al Kayan. Create your password using this secure link:\n${invitationUrl}\n\nThis link expires automatically.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
        <h2>Welcome to Al Kayan</h2>
        <p>Hello ${name},</p>
        <p>You have been invited to access the Al Kayan real estate dashboard.</p>
        <p><a href="${invitationUrl}" style="background:#0f766e;color:white;padding:12px 18px;border-radius:8px;text-decoration:none;display:inline-block">Create password</a></p>
        <p>If the button does not work, open this link:</p>
        <p>${invitationUrl}</p>
      </div>
    `
  });

  if (!env.SMTP_HOST) {
    console.info("Development invitation email:", JSON.stringify(result, null, 2));
    console.info("Invitation URL:", invitationUrl);
  }
}
