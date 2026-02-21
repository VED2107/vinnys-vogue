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

export async function sendShippingConfirmation(orderId: string) {
  try {
    const supabase = getServiceRoleSupabase();

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

    if (orderError || !order) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", order.user_id)
      .maybeSingle<{ email: string | null }>();

    const to = String(profile?.email ?? "").trim();
    if (!to) return;

    const courier = String(order.courier_name ?? "").trim();
    const tracking = String(order.tracking_number ?? "").trim();
    const shippedAt = order.shipped_at ? new Date(order.shipped_at) : null;

    if (!courier || !tracking || !shippedAt) return;

    // Build tracking URL (best-effort for common couriers)
    let trackingUrl = "";
    const courierLower = courier.toLowerCase();
    if (courierLower.includes("delhivery")) {
      trackingUrl = `https://www.delhivery.com/track/package/${tracking}`;
    } else if (courierLower.includes("dtdc")) {
      trackingUrl = `https://www.dtdc.in/tracking.asp?strCnno=${tracking}`;
    } else if (courierLower.includes("bluedart")) {
      trackingUrl = `https://www.bluedart.com/tracking?handler=tnt&action=awbquery&awb=${tracking}`;
    } else if (courierLower.includes("india post")) {
      trackingUrl = `https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx`;
    }

    const bodyHtml = `
      <p style="margin:0 0 16px 0;">Great news! Your order has been shipped and is on its way to you.</p>

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#2a2a2a;border-radius:8px;margin-bottom:16px;">
        <tr>
          <td style="padding:16px;">
            <p style="margin:0 0 8px 0;font-size:13px;color:#999;">Order ID</p>
            <p style="margin:0 0 12px 0;font-size:14px;font-weight:600;color:#ccc;">${escapeHtml(order.id)}</p>
            <p style="margin:0 0 4px 0;font-size:13px;color:#999;">Courier</p>
            <p style="margin:0 0 12px 0;font-size:14px;font-weight:600;color:#ccc;">${escapeHtml(courier)}</p>
            <p style="margin:0 0 4px 0;font-size:13px;color:#999;">Tracking Number</p>
            <p style="margin:0 0 12px 0;font-size:14px;font-weight:600;color:#ccc;">${escapeHtml(tracking)}</p>
            <p style="margin:0 0 4px 0;font-size:13px;color:#999;">Shipped On</p>
            <p style="margin:0;font-size:14px;color:#ccc;">${escapeHtml(shippedAt.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" }))}</p>
          </td>
        </tr>
      </table>
    `;

    const html = buildEmailLayout({
      title: "Your Order Has Been Shipped 🚚",
      bodyHtml,
      ctaText: trackingUrl ? "Track Package" : undefined,
      ctaUrl: trackingUrl || undefined,
    });

    const sent = await sendResendEmail(
      {
        to,
        from: "support@vinnysvogue.in",
        subject: "Your Order Has Been Shipped — Vinnys Vogue",
        html,
      },
      "shipping_confirmation",
    );

    await supabase.from("shipping_email_logs").insert({
      order_id: orderId,
      status: sent ? "sent" : "failed",
    });
  } catch (err) {
    console.error("[sendShippingConfirmation] Failed:", err);
    try {
      const supabase = getServiceRoleSupabase();
      await supabase.from("shipping_email_logs").insert({
        order_id: orderId,
        status: "failed",
        error: err instanceof Error ? err.message : String(err),
      });
    } catch {
      /* ignore logging failure */
    }
  }
}
