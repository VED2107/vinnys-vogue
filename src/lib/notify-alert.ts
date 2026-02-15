import { transporter } from "@/lib/email";

function formatAlertMessage(title: string, details: unknown) {
  const detailsJson = (() => {
    try {
      return JSON.stringify(details, null, 2);
    } catch {
      return String(details);
    }
  })();

  return [
    "🚨 Vinnys Vogue Critical Alert",
    "",
    title,
    "",
    detailsJson,
  ].join("\n");
}

export async function notifyCriticalAlert(title: string, details: unknown) {
  const message = formatAlertMessage(title, details);

  const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (slackWebhookUrl) {
    try {
      await fetch(slackWebhookUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ text: message }),
      });
    } catch (err) {
      console.error("notifyCriticalAlert: slack notify failed", err);
    }
  }

  const alertEmail = process.env.ALERT_EMAIL;
  if (alertEmail) {
    try {
      await transporter.sendMail({
        to: alertEmail,
        from: process.env.FROM_EMAIL ?? process.env.SMTP_USER ?? alertEmail,
        subject: `Critical Alert: ${title}`,
        text: message,
      });
    } catch (err) {
      console.error("notifyCriticalAlert: email notify failed", err);
    }
  }
}
