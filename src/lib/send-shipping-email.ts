import { createClient } from "@supabase/supabase-js";
import { getTransporter, FROM_EMAIL } from "@/lib/email";

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

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendShippingConfirmation(orderId: string) {
  try {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn("[sendShippingConfirmation] SMTP disabled — skipping email");
    return;
  }

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

  if (orderError || !order) {
    return;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", order.user_id)
    .maybeSingle<{ email: string | null }>();

  if (profileError || !profile?.email) {
    return;
  }

  const to = String(profile.email).trim();
  if (!to) {
    return;
  }

  const courier = String(order.courier_name ?? "").trim();
  const tracking = String(order.tracking_number ?? "").trim();
  const shippedAt = order.shipped_at ? new Date(order.shipped_at) : null;

  if (!courier || !tracking || !shippedAt) {
    return;
  }

  await transporter.sendMail({
      to,
      from: FROM_EMAIL,
      subject: "Your Order Has Been Shipped — Vinnys Vogue",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
          <div style="text-align:center;margin-bottom:24px;">
            <img src="https://www.vinnysvogue.in/favicon.ico" alt="Vinnys Vogue" style="width:32px;height:32px;" />
          </div>
          <h2 style="margin:0 0 8px 0;">Your order is on its way ✨</h2>
          <p style="margin:0 0 10px 0;">Order #${escapeHtml(order.id)}</p>
          <p style="margin:0 0 6px 0;"><strong>Courier:</strong> ${escapeHtml(courier)}</p>
          <p style="margin:0 0 6px 0;"><strong>Tracking Number:</strong> ${escapeHtml(tracking)}</p>
          <p style="margin:0 0 16px 0;"><strong>Shipped on:</strong> ${escapeHtml(
            shippedAt.toLocaleDateString("en-IN"),
          )}</p>
          <hr style="border:none;border-top:1px solid #eee;margin:16px 0;"/>
          <p style="margin:0;color:#666;font-size:12px;">© Vinnys Vogue — Where fashion meets elegance</p>
        </div>
      `,
    });

    await supabase.from("shipping_email_logs").insert({
      order_id: orderId,
      status: "sent",
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
    } catch { /* ignore logging failure */ }
  }
}
