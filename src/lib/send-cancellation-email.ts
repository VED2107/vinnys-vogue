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

export async function sendOrderCancellationEmail(orderId: string) {
  try {
    const supabase = getServiceRoleSupabase();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id,user_id,total_amount")
      .eq("id", orderId)
      .maybeSingle<{ id: string; user_id: string; total_amount: number }>();

    if (orderError || !order) {
      console.error("[sendOrderCancellationEmail] Order fetch error:", orderError?.message ?? "not found");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", order.user_id)
      .maybeSingle<{ email: string | null }>();

    const to = String(profile?.email ?? "").trim();
    if (!to) {
      console.error("[sendOrderCancellationEmail] Missing customer email for order:", orderId);
      return;
    }

    const bodyHtml = `
      <p style="margin:0 0 4px 0;font-size:13px;color:#999;">Order ID</p>
      <p style="margin:0 0 16px 0;font-size:15px;font-weight:600;color:#ccc;">${escapeHtml(order.id)}</p>

      <p style="margin:0 0 6px 0;font-size:14px;color:#ccc;">
        Your order of <strong style="color:#1C3A2A;">₹${order.total_amount.toFixed(2)}</strong> has been cancelled.
      </p>
      <p style="margin:0 0 16px 0;font-size:14px;color:#ccc;">
        If a refund is applicable, it will be processed within 5–7 business days. For any queries, please reach out to our support team.
      </p>
    `;

    const html = buildEmailLayout({
      title: "Order Cancelled",
      bodyHtml,
      ctaText: "Contact Support",
      ctaUrl: "mailto:support@vinnysvogue.in",
      footerNote: "If you did not request this cancellation, please contact us immediately.",
    });

    const ok = await sendResendEmail(
      {
        to,
        from: EMAIL_FROM,
        subject: "Your Order Has Been Cancelled — Vinnys Vogue",
        html,
      },
      "sendOrderCancellationEmail",
    );

    if (ok) {
      console.warn("[sendOrderCancellationEmail] Sent to", to);
    }
  } catch (err) {
    console.error("[sendOrderCancellationEmail] Failed:", err);
  }
}

