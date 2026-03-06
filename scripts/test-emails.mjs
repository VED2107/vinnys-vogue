/**
 * Test script — sends all 4 branded email templates to a test address.
 * Run: node scripts/test-emails.mjs
 */

const RESEND_API_KEY = "re_UUgvDQK5_5NTi228t17rCkyfahh2cF2Zn";
const EMAIL_FROM = "Vinnys Vogue <support@vinnysvogue.in>";
const TO = "vedchauhan2107@gmail.com";
const SITE_URL = "https://www.vinnysvogue.in";
const CURRENT_YEAR = new Date().getFullYear();

// ─── Shared layout (mirrors emailTemplates.ts) ──────────────────────

function escapeHtml(input) {
    return input
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function buildEmailLayout({ title, bodyHtml, ctaText, ctaUrl, footerNote }) {
    const ctaBlock =
        ctaText && ctaUrl
            ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px auto 0 auto;">
          <tr>
            <td align="center" style="border-radius:8px;background:#1C3A2A;">
              <a href="${escapeHtml(ctaUrl)}" target="_blank"
                 style="display:inline-block;padding:14px 28px;font-family:Arial,sans-serif;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;background:#1C3A2A;">
                ${escapeHtml(ctaText)}
              </a>
            </td>
          </tr>
        </table>`
            : "";

    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body bgcolor="#000000" style="margin:0;padding:0;background-color:#000000;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#000000" style="background-color:#000000;">
    <tr>
      <td align="center" bgcolor="#000000" style="padding:40px 16px;background-color:#000000;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="520" bgcolor="#1a1a1a" style="max-width:520px;width:100%;background-color:#1a1a1a;border-radius:16px;overflow:hidden;">
          <!-- Logo -->
          <tr>
            <td align="center" bgcolor="#1a1a1a" style="padding:36px 32px 0 32px;background-color:#1a1a1a;">
              <img src="https://www.vinnysvogue.in/icon-512.png" width="72" height="72" alt="Vinnys Vogue" style="display:block;width:72px;height:72px;border-radius:14px;" />
            </td>
          </tr>
          <!-- Title -->
          <tr>
            <td align="center" bgcolor="#1a1a1a" style="padding:24px 32px 0 32px;background-color:#1a1a1a;">
              <h1 style="margin:0;font-size:24px;font-weight:700;color:#1C3A2A;line-height:1.3;">${escapeHtml(title)}</h1>
            </td>
          </tr>
          <!-- Divider -->
          <tr>
            <td bgcolor="#1a1a1a" style="padding:20px 32px 0 32px;background-color:#1a1a1a;">
              <div style="border-top:1px solid #333;"></div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td bgcolor="#1a1a1a" style="padding:24px 32px 0 32px;font-size:15px;line-height:1.7;color:#cccccc;background-color:#1a1a1a;">
              ${bodyHtml}
            </td>
          </tr>
          <!-- CTA -->
          <tr>
            <td bgcolor="#1a1a1a" style="padding:0 32px;background-color:#1a1a1a;">
              ${ctaBlock}
            </td>
          </tr>
          <!-- Footer Note -->
          ${footerNote ? `<tr><td bgcolor="#1a1a1a" style="padding:24px 32px 0 32px;font-size:12px;color:#888;line-height:1.5;background-color:#1a1a1a;">${footerNote}</td></tr>` : ""}
          <!-- Footer -->
          <tr>
            <td bgcolor="#1a1a1a" style="padding:32px 32px 36px 32px;background-color:#1a1a1a;">
              <div style="border-top:1px solid #333;padding-top:16px;font-size:11px;color:#666;line-height:1.5;text-align:center;">
                © ${CURRENT_YEAR} Vinnys Vogue · <a href="${SITE_URL}" style="color:#1C3A2A;text-decoration:none;">vinnysvogue.in</a><br/>
                <a href="mailto:support@vinnysvogue.in" style="color:#1C3A2A;text-decoration:none;">support@vinnysvogue.in</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Send helper ────────────────────────────────────────────────────

async function sendEmail(subject, html, label) {
    const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from: EMAIL_FROM,
            to: [TO],
            subject,
            html,
        }),
    });

    const body = await res.text();
    if (res.ok) {
        console.log(`✅ ${label} sent successfully`);
    } else {
        console.error(`❌ ${label} failed (${res.status}):`, body);
    }
}

// ─── 1. Order Confirmation ──────────────────────────────────────────

const confirmHtml = buildEmailLayout({
    title: "Your Order is Confirmed ✨",
    bodyHtml: `
    <p style="margin:0 0 4px 0;font-size:13px;color:#999;">Order ID</p>
    <p style="margin:0 0 16px 0;font-size:15px;font-weight:600;color:#ccc;">ORD-TEST-12345678</p>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin-bottom:16px;">
      <thead>
        <tr style="background:#2a2a2a;">
          <th style="padding:8px 4px;text-align:left;font-size:12px;font-weight:600;color:#1C3A2A;border-bottom:2px solid #1C3A2A;">Item</th>
          <th style="padding:8px 4px;text-align:center;font-size:12px;font-weight:600;color:#1C3A2A;border-bottom:2px solid #1C3A2A;">Qty</th>
          <th style="padding:8px 4px;text-align:right;font-size:12px;font-weight:600;color:#1C3A2A;border-bottom:2px solid #1C3A2A;">Price</th>
          <th style="padding:8px 4px;text-align:right;font-size:12px;font-weight:600;color:#1C3A2A;border-bottom:2px solid #1C3A2A;">Total</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding:8px 4px;border-bottom:1px solid #333;font-size:13px;color:#ccc;">Silk Saree — Royal Blue</td>
          <td style="padding:8px 4px;border-bottom:1px solid #333;text-align:center;font-size:13px;color:#ccc;">1</td>
          <td style="padding:8px 4px;border-bottom:1px solid #333;text-align:right;font-size:13px;color:#ccc;">₹2,499.00</td>
          <td style="padding:8px 4px;border-bottom:1px solid #333;text-align:right;font-size:13px;color:#ccc;">₹2,499.00</td>
        </tr>
        <tr>
          <td style="padding:8px 4px;border-bottom:1px solid #333;font-size:13px;color:#ccc;">Embroidered Kurti</td>
          <td style="padding:8px 4px;border-bottom:1px solid #333;text-align:center;font-size:13px;color:#ccc;">2</td>
          <td style="padding:8px 4px;border-bottom:1px solid #333;text-align:right;font-size:13px;color:#ccc;">₹899.00</td>
          <td style="padding:8px 4px;border-bottom:1px solid #333;text-align:right;font-size:13px;color:#ccc;">₹1,798.00</td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3" style="padding:10px 4px 0 4px;text-align:right;font-size:14px;font-weight:700;color:#1C3A2A;">Total</td>
          <td style="padding:10px 4px 0 4px;text-align:right;font-size:14px;font-weight:700;color:#1C3A2A;">₹4,297.00</td>
        </tr>
      </tfoot>
    </table>

    <p style="margin:0 0 4px 0;font-size:13px;color:#999;">Shipping Address</p>
    <p style="margin:0 0 16px 0;font-size:13px;color:#ccc;white-space:pre-line;">Ved Chauhan
+91 98765 43210
123 Fashion Street
Mumbai, Maharashtra, 400001
India</p>

    <p style="margin:0 0 4px 0;font-size:13px;color:#999;">Payment ID</p>
    <p style="margin:0;font-size:13px;color:#ccc;">pay_TEST123456</p>
  `,
    footerNote: "Thank you for shopping with us. Your invoice is attached to this email.",
});

// ─── 2. Shipping Confirmation ───────────────────────────────────────

const shippingHtml = buildEmailLayout({
    title: "Your Order Has Been Shipped 🚚",
    bodyHtml: `
    <p style="margin:0 0 4px 0;font-size:13px;color:#999;">Order ID</p>
    <p style="margin:0 0 16px 0;font-size:15px;font-weight:600;color:#ccc;">ORD-TEST-12345678</p>

    <p style="margin:0 0 6px 0;font-size:14px;color:#ccc;"><strong style="color:#1C3A2A;">Courier:</strong> DTDC Express</p>
    <p style="margin:0 0 6px 0;font-size:14px;color:#ccc;"><strong style="color:#1C3A2A;">Tracking Number:</strong> D12345678901</p>
    <p style="margin:0 0 16px 0;font-size:14px;color:#ccc;"><strong style="color:#1C3A2A;">Shipped on:</strong> ${new Date().toLocaleDateString("en-IN")}</p>
  `,
    footerNote: "You will receive another email when your order is delivered.",
});

// ─── 3. Delivery Confirmation ───────────────────────────────────────

const deliveryHtml = buildEmailLayout({
    title: "Your Order Has Been Delivered ✅",
    bodyHtml: `
    <p style="margin:0 0 4px 0;font-size:13px;color:#999;">Order ID</p>
    <p style="margin:0 0 16px 0;font-size:15px;font-weight:600;color:#ccc;">ORD-TEST-12345678</p>

    <p style="margin:0 0 6px 0;font-size:14px;color:#ccc;">
      Your order has been delivered on <strong style="color:#1C3A2A;">${new Date().toLocaleDateString("en-IN")}</strong>.
    </p>
    <p style="margin:0 0 16px 0;font-size:14px;color:#ccc;">
      We hope you love your purchase! If you have any concerns, feel free to reach out to our support team.
    </p>
  `,
    footerNote: "Thank you for shopping with Vinnys Vogue!",
});

// ─── 4. Cancellation ────────────────────────────────────────────────

const cancellationHtml = buildEmailLayout({
    title: "Order Cancelled",
    bodyHtml: `
    <p style="margin:0 0 4px 0;font-size:13px;color:#999;">Order ID</p>
    <p style="margin:0 0 16px 0;font-size:15px;font-weight:600;color:#ccc;">ORD-TEST-12345678</p>

    <p style="margin:0 0 6px 0;font-size:14px;color:#ccc;">
      Your order of <strong style="color:#1C3A2A;">₹4,297.00</strong> has been cancelled.
    </p>
    <p style="margin:0 0 16px 0;font-size:14px;color:#ccc;">
      If a refund is applicable, it will be processed within 5–7 business days. For any queries, please reach out to our support team.
    </p>
  `,
    ctaText: "Contact Support",
    ctaUrl: "mailto:support@vinnysvogue.in",
    footerNote: "If you did not request this cancellation, please contact us immediately.",
});

// ─── Send all ───────────────────────────────────────────────────────

async function main() {
    console.log(`\nSending 4 test emails to ${TO}...\n`);

    await sendEmail("Your Order is Confirmed — Vinnys Vogue", confirmHtml, "Order Confirmation");
    await sendEmail("Your Order Has Been Shipped — Vinnys Vogue", shippingHtml, "Shipping Confirmation");
    await sendEmail("Your Order Has Been Delivered — Vinnys Vogue", deliveryHtml, "Delivery Confirmation");
    await sendEmail("Your Order Has Been Cancelled — Vinnys Vogue", cancellationHtml, "Cancellation");

    console.log("\nDone! Check your inbox at", TO);
}

main().catch(console.error);
