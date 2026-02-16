import nodemailer, { type Transporter } from "nodemailer";

let cachedTransporter: Transporter | null = null;

export const smtpConfigured =
  !!process.env.SMTP_HOST &&
  !!process.env.SMTP_PORT &&
  !!process.env.SMTP_USER &&
  !!process.env.SMTP_PASS;

export const FROM_EMAIL = process.env.FROM_EMAIL ?? "";

export function getTransporter(): Transporter | null {
  if (!smtpConfigured) return null;

  if (cachedTransporter) return cachedTransporter;

  try {
    const port = Number(process.env.SMTP_PORT);

    cachedTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    return cachedTransporter;
  } catch (err) {
    console.error("Failed to create SMTP transporter:", err);
    return null;
  }
}
