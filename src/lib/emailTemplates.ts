const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.vinnysvogue.in";

const CURRENT_YEAR = new Date().getFullYear();

function escapeHtml(input: string): string {
    return input
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

export { escapeHtml, SITE_URL };

/**
 * Central branded email layout builder.
 * Inline-CSS only — Gmail / Outlook safe.
 */
export function buildEmailLayout(opts: {
    title: string;
    bodyHtml: string;
    ctaText?: string;
    ctaUrl?: string;
    footerNote?: string;
}): string {
    const { title, bodyHtml, ctaText, ctaUrl, footerNote } = opts;

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
<body style="margin:0;padding:0;background:#F8F5F0;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F8F5F0;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="520" style="max-width:520px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding:32px 32px 0 32px;">
              <img src="https://www.vinnysvogue.in/icon-512.png" width="72" height="72" alt="Vinnys Vogue" style="display:block;width:72px;height:72px;border-radius:12px;" />
            </td>
          </tr>
          <!-- Title -->
          <tr>
            <td align="center" style="padding:20px 32px 0 32px;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#1C3A2A;line-height:1.3;">${escapeHtml(title)}</h1>
            </td>
          </tr>
          <!-- Divider -->
          <tr>
            <td style="padding:16px 32px 0 32px;">
              <div style="border-top:1px solid #E8E4DF;"></div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:20px 32px 0 32px;font-size:14px;line-height:1.7;color:#333333;">
              ${bodyHtml}
            </td>
          </tr>
          <!-- CTA -->
          <tr>
            <td style="padding:0 32px;">
              ${ctaBlock}
            </td>
          </tr>
          <!-- Footer Note -->
          ${footerNote ? `<tr><td style="padding:24px 32px 0 32px;font-size:12px;color:#999999;line-height:1.5;">${footerNote}</td></tr>` : ""}
          <!-- Footer -->
          <tr>
            <td style="padding:28px 32px 32px 32px;">
              <div style="border-top:1px solid #E8E4DF;padding-top:16px;font-size:11px;color:#AAAAAA;line-height:1.5;text-align:center;">
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
