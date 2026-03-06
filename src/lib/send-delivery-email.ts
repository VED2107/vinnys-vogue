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

export async function sendDeliveryConfirmation(orderId: string) {
    try {
        const supabase = getServiceRoleSupabase();

        // Small delay to let the RPC transaction commit before we re-read
        await sleep(1500);

        const { data: order, error: orderError } = await supabase
            .from("orders")
            .select("id,user_id,delivered_at")
            .eq("id", orderId)
            .maybeSingle<{
                id: string;
                user_id: string;
                delivered_at: string | null;
            }>();

        if (orderError || !order) {
            console.error("[sendDeliveryConfirmation] Order fetch error:", orderError?.message ?? "not found");
            return;
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("email")
            .eq("id", order.user_id)
            .maybeSingle<{ email: string | null }>();

        const to = String(profile?.email ?? "").trim();
        if (!to) {
            console.error("[sendDeliveryConfirmation] Missing customer email for order:", orderId);
            return;
        }

        const deliveredAt = order.delivered_at
            ? new Date(order.delivered_at).toLocaleDateString("en-IN")
            : new Date().toLocaleDateString("en-IN");

        const bodyHtml = `
      <p style="margin:0 0 4px 0;font-size:13px;color:#999;">Order ID</p>
      <p style="margin:0 0 16px 0;font-size:15px;font-weight:600;color:#ccc;">${escapeHtml(order.id)}</p>

      <p style="margin:0 0 6px 0;font-size:14px;color:#ccc;">
        Your order has been delivered on <strong style="color:#1C3A2A;">${escapeHtml(deliveredAt)}</strong>.
      </p>
      <p style="margin:0 0 16px 0;font-size:14px;color:#ccc;">
        We hope you love your purchase! If you have any concerns, feel free to reach out to our support team.
      </p>
    `;

        const html = buildEmailLayout({
            title: "Your Order Has Been Delivered ✅",
            bodyHtml,
            footerNote: "Thank you for shopping with Vinnys Vogue!",
        });

        const ok = await sendResendEmail(
            {
                to,
                from: EMAIL_FROM,
                subject: "Your Order Has Been Delivered — Vinnys Vogue",
                html,
            },
            "sendDeliveryConfirmation",
        );

        if (ok) {
            console.warn("[sendDeliveryConfirmation] Sent to", to);
        }
    } catch (err) {
        console.error("[sendDeliveryConfirmation] Failed:", err);
    }
}
