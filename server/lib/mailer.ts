import nodemailer from "nodemailer";

export type MailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

const requiredSmtpVariables = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "EMAIL_FROM",
] as const;

export async function sendMail(message: MailMessage): Promise<boolean> {
  const missing = requiredSmtpVariables.filter((name) => !process.env[name]?.trim());
  if (missing.length > 0) {
    console.error(`Email not sent: missing SMTP configuration (${missing.join(", ")}).`);
    return false;
  }

  const port = Number(process.env.SMTP_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error("Email not sent: SMTP_PORT must be a valid port number.");
    return false;
  }

  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    await transport.sendMail({
      from: process.env.EMAIL_FROM,
      ...message,
    });
    return true;
  } catch {
    console.error("Email delivery failed. Check the SMTP server configuration and logs.");
    return false;
  }
}
