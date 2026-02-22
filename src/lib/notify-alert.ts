import { sendResendEmail, EMAIL_FROM } from "@/lib/email";
import { buildEmailLayout } from "@/lib/emailTemplates";

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

    const html = buildEmailLayout({
      title: `🚨 Critical Alert`,
      bodyHtml: `<pre style="margin:0;font-family:monospace;font-size:13px;color:#ccc;white-space:pre-wrap;word-break:break-word;">${escapedMessage}</pre>`,
    });

    await sendResendEmail(
      {
        to: alertEmail,
        from: EMAIL_FROM,
        subject: `Critical Alert: ${title}`,
        html,
      },
      "critical_alert",
    );
  }
}
