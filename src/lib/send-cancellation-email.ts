import { createClient } from "@supabase/supabase-js";
import { sendResendEmail } from "@/lib/email";
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

    if (orderError || !order) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", order.user_id)
      .maybeSingle<{ email: string | null }>();

    const to = String(profile?.email ?? "").trim();
    if (!to) return;

    const bodyHtml = `
      <p style="margin:0 0 4px 0;font-size:13px;color:#666;">Order ID</p>
      <p style="margin:0 0 16px 0;font-size:15px;font-weight:600;color:#1C3A2A;">${escapeHtml(order.id)}</p>

      <p style="margin:0 0 16px 0;">Your order has been cancelled. If a payment was made, any applicable refund will be processed according to our refund policy.</p>

      <p style="margin:0;font-size:13px;color:#666;">If you did not request this cancellation or need assistance, please contact us at <a href="mailto:support@vinnysvogue.in" style="color:#1C3A2A;text-decoration:none;">support@vinnysvogue.in</a>.</p>
    `;

    const html = buildEmailLayout({
      title: "Order Cancelled",
      bodyHtml,
    });

    await sendResendEmail(
      {
        to,
        from: "support@vinnysvogue.in",
        subject: "Your Order Has Been Cancelled — Vinnys Vogue",
        html,
      },
      "order_cancellation",
    );
  } catch (err) {
    console.error("[sendOrderCancellationEmail] Failed:", err);
  }
}
