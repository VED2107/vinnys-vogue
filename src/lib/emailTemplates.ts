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
