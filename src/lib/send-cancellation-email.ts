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

export async function sendOrderCancellationEmail(orderId: string) {
  try {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn("[sendOrderCancellationEmail] SMTP disabled — skipping email");
    return;
  }

  const supabase = getServiceRoleSupabase();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id,user_id,total_amount")
    .eq("id", orderId)
    .maybeSingle<{ id: string; user_id: string; total_amount: number }>();

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

  await transporter.sendMail({
      to,
      from: FROM_EMAIL,
      subject: "Your Order Has Been Cancelled — Vinnys Vogue",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
          <h2 style="margin:0 0 8px 0;">Your order has been cancelled</h2>
          <p style="margin:0 0 10px 0;">Order #${escapeHtml(order.id)}</p>
          <p style="margin:0 0 16px 0;">No refund was initiated automatically. If you need assistance, please contact support.</p>
          <hr style="border:none;border-top:1px solid #eee;margin:16px 0;"/>
          <p style="margin:0;color:#666;font-size:12px;">© Vinnys Vogue — Where fashion meets elegance</p>
        </div>
      `,
    });

  } catch (err) {
    console.error("[sendOrderCancellationEmail] Failed:", err);
  }
}
