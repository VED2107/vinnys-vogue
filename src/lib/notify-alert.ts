import { sendResendEmail } from "@/lib/email";

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

  // Slack webhook (unchanged)
  const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (slackWebhookUrl) {
    try {
      await fetch(slackWebhookUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: message }),
      });
    } catch (err) {
      console.error("notifyCriticalAlert: slack notify failed", err);
    }
  }

  // Email alert via Resend
  const alertEmail = process.env.ALERT_EMAIL;
  if (alertEmail) {
    const escapedMessage = message
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll("\n", "<br/>");

    await sendResendEmail(
      {
        to: alertEmail,
        from: "support@vinnysvogue.in",
        subject: `Critical Alert: ${title}`,
        html: `<div style="font-family:monospace;font-size:13px;padding:16px;background:#fff;color:#111;">${escapedMessage}</div>`,
      },
      "critical_alert",
    );
  }
}
