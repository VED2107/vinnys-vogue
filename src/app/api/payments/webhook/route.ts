import crypto from "crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Razorpay webhook handler (App Router, Next.js 14).
 *
 * Razorpay sends the raw body + `x-razorpay-signature` header.
 * We verify with HMAC-SHA256 using RAZORPAY_WEBHOOK_SECRET, then
 * process the event and log it.
 */
export async function POST(req: Request) {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature") ?? "";

    // ── Verify signature ───────────────────────────────────────────
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
        console.error("RAZORPAY_WEBHOOK_SECRET is not configured");
        return new Response("Server configuration error", { status: 500 });
    }

    const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex");

    if (expectedSignature !== signature) {
        console.warn("Webhook signature mismatch");
        return new Response("Invalid signature", { status: 400 });
    }

    // ── Parse payload ──────────────────────────────────────────────
    let payload: Record<string, unknown>;
    try {
        payload = JSON.parse(rawBody);
    } catch {
        return new Response("Invalid JSON", { status: 400 });
    }

    const eventType = payload.event as string | undefined;

    const supabase = createSupabaseServerClient();

    // ── Log every event ────────────────────────────────────────────
    await supabase.from("razorpay_webhook_logs").insert({
        event_type: eventType ?? "unknown",
        payload,
    });

    // ── Handle events ──────────────────────────────────────────────
    // Razorpay nests the entity inside payload.payload.payment.entity
    const entity =
        (
            (payload.payload as Record<string, unknown>)?.payment as Record<
                string,
                unknown
            >
        )?.entity as Record<string, unknown> | undefined;

    const razorpayOrderId = entity?.order_id as string | undefined;

    if (razorpayOrderId) {
        switch (eventType) {
            case "payment.captured": {
                await supabase
                    .from("orders")
                    .update({
                        payment_status: "paid",
                        status: "confirmed",
                        razorpay_payment_id: entity?.id as string,
                    })
                    .eq("razorpay_order_id", razorpayOrderId);
                break;
            }

            case "payment.failed": {
                await supabase
                    .from("orders")
                    .update({ payment_status: "failed" })
                    .eq("razorpay_order_id", razorpayOrderId);
                break;
            }

            case "refund.processed": {
                await supabase
                    .from("orders")
                    .update({ payment_status: "refunded" })
                    .eq("razorpay_order_id", razorpayOrderId);
                break;
            }

            default:
                // Unhandled event — already logged above
                break;
        }
    }

    return new Response("OK", { status: 200 });
}
