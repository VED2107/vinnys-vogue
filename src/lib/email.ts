import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST ?? "";
const SMTP_PORT = process.env.SMTP_PORT ?? "587";
const SMTP_USER = process.env.SMTP_USER ?? "";
const SMTP_PASS = process.env.SMTP_PASS ?? "";
const FROM_EMAIL = process.env.FROM_EMAIL ?? "";

const smtpConfigured = !!(SMTP_HOST && SMTP_USER && SMTP_PASS && FROM_EMAIL);

if (!smtpConfigured) {
  console.warn(
    "SMTP configuration missing. Email sending will be disabled. Set SMTP_HOST, SMTP_USER, SMTP_PASS, and FROM_EMAIL.",
  );
}

export const transporter = smtpConfigured
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: false,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    })
  : null;

export { FROM_EMAIL, smtpConfigured };
