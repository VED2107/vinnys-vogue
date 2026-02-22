import { createClient } from "@supabase/supabase-js";

/* ── Resend ─────────────────────────────────────────────── */

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";

export const resendConfigured = !!RESEND_API_KEY;

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.vinnysvogue.in";

/** Branded from addresses — use these everywhere instead of raw strings */
export const EMAIL_FROM = "Vinnys Vogue <support@vinnysvogue.in>";
export const EMAIL_FROM_NOREPLY = "Vinnys Vogue <no-reply@vinnysvogue.in>";

/* ── Service-role Supabase (for monitoring_events) ──────── */

function getMonitoringSupabase() {
  return createClient(
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
}

/* ── Central send helper ────────────────────────────────── */

export type ResendEmailPayload = {
  to: string;
  from: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: string }[];
};

/**
 * Send an email via Resend API.
 * - Always wrapped in try/catch — never throws.
 * - Logs failures to `monitoring_events`.
 * - Returns `true` on success, `false` on failure.
 */
export async function sendResendEmail(
  payload: ResendEmailPayload,
  context: string = "unknown",
): Promise<boolean> {
  if (!resendConfigured) {
    console.warn(`[sendResendEmail][${context}] RESEND_API_KEY not set — skipping`);
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: payload.from,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
        attachments: payload.attachments,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.error(`[sendResendEmail][${context}] Resend ${res.status}:`, errBody);

      await logEmailError(context, `Resend HTTP ${res.status}: ${errBody}`, payload.to);
      return false;
    }

    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[sendResendEmail][${context}] Exception:`, message);

    await logEmailError(context, message, payload.to);
    return false;
  }
}

/* ── Error logging to monitoring_events ─────────────────── */

async function logEmailError(context: string, error: string, to: string) {
  try {
    const supabase = getMonitoringSupabase();
    await supabase.from("monitoring_events").insert({
      type: "email_send_failed",
      severity: "warning",
      message: `Email send failed [${context}]`,
      metadata: { context, error, to },
    });
  } catch (logErr) {
    console.error("[sendResendEmail] Failed to log to monitoring_events:", logErr);
  }
}
