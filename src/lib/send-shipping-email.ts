import { createClient } from "@supabase/supabase-js";
import { sendResendEmail, EMAIL_FROM } from "@/lib/email";
import { buildEmailLayout, escapeHtml } from "@/lib/emailTemplates";

function getServiceRoleSupabase() {
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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Send a shipping confirmation email.
 * Accepts optional shipping data to avoid a DB timing race — when the
 * caller already has courier/tracking info, pass it directly instead of
 * relying on a re-read that may execute before the RPC transaction commits.
 */
export async function sendShippingConfirmation(
  orderId: string,
  opts?: {
    courierName?: string;
    trackingNumber?: string;
  },
) {
  try {
    const supabase = getServiceRoleSupabase();

    // Small delay to let the RPC transaction commit before we re-read
    await sleep(1500);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id,user_id,courier_name,tracking_number,shipped_at")
      .eq("id", orderId)
      .maybeSingle<{
        id: string;
        user_id: string;
        courier_name: string | null;
        tracking_number: string | null;
        shipped_at: string | null;
      }>();

    if (orderError || !order) {
      console.error("[sendShippingConfirmation] Order fetch error:", orderError?.message ?? "not found");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", order.user_id)
      .maybeSingle<{ email: string | null }>();

    const to = String(profile?.email ?? "").trim();
    if (!to) {
      console.error("[sendShippingConfirmation] Missing customer email for order:", orderId);
      return;
    }

    // Prefer caller-provided data, fall back to DB values
    const courier = String(opts?.courierName || order.courier_name || "").trim();
    const tracking = String(opts?.trackingNumber || order.tracking_number || "").trim();
    const shippedAt = order.shipped_at ? new Date(order.shipped_at) : new Date();

    if (!courier || !tracking) {
      console.error("[sendShippingConfirmation] Missing courier/tracking for order:", orderId);
      return;
    }

    const bodyHtml = `
      <p style="margin:0 0 4px 0;font-size:13px;color:#999;">Order ID</p>
      <p style="margin:0 0 16px 0;font-size:15px;font-weight:600;color:#ccc;">${escapeHtml(order.id)}</p>

      <p style="margin:0 0 6px 0;font-size:14px;color:#ccc;"><strong style="color:#1C3A2A;">Courier:</strong> ${escapeHtml(courier)}</p>
      <p style="margin:0 0 6px 0;font-size:14px;color:#ccc;"><strong style="color:#1C3A2A;">Tracking Number:</strong> ${escapeHtml(tracking)}</p>
      <p style="margin:0 0 16px 0;font-size:14px;color:#ccc;"><strong style="color:#1C3A2A;">Shipped on:</strong> ${escapeHtml(shippedAt.toLocaleDateString("en-IN"))}</p>
    `;

    const html = buildEmailLayout({
      title: "Your Order Has Been Shipped 🚚",
      bodyHtml,
      footerNote: "You will receive another email when your order is delivered.",
    });

    const ok = await sendResendEmail(
      {
        to,
        from: EMAIL_FROM,
        subject: "Your Order Has Been Shipped — Vinnys Vogue",
        html,
      },
      "sendShippingConfirmation",
    );

    if (ok) {
      console.warn("[sendShippingConfirmation] Sent to", to);
    }
  } catch (err) {
    console.error("[sendShippingConfirmation] Failed:", err);
  }
}
