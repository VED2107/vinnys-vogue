import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sendOrderConfirmation } from "@/lib/send-order-email";

export const runtime = "nodejs";

const supabase = createClient(
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

export async function POST(req: Request) {
    try {
        // Rate limit: 30 per minute (Razorpay may send bursts)
        const ip = getClientIp(req);
        const rl = rateLimit(`webhook:${ip}`, 30, 60_000);
        if (!rl.success) {
            return new NextResponse("Too many requests", { status: 429 });
        }
        const body = await req.text();
        const signature = req.headers.get("x-razorpay-signature");

        if (!signature) {
            return new NextResponse("No signature", { status: 400 });
        }

        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!webhookSecret) {
            console.error("Webhook misconfigured: missing RAZORPAY_WEBHOOK_SECRET");
            return new NextResponse("OK", { status: 200 });
        }

        const expectedSignature = crypto
            .createHmac("sha256", webhookSecret)
            .update(body)
            .digest("hex");

        if (expectedSignature !== signature) {
            return new NextResponse("Invalid signature", { status: 400 });
        }

        let event: unknown;
        try {
            event = JSON.parse(body) as unknown;
        } catch {
            console.error("Webhook received invalid JSON");
            return new NextResponse("OK", { status: 200 });
        }

        const evt = event as {
            event?: unknown;
            payload?: { payment?: { entity?: { order_id?: unknown } } };
        };

        const eventName = typeof evt.event === "string" ? evt.event : "";
        const razorpayOrderId = (() => {
            const raw = evt.payload?.payment?.entity?.order_id;
            return typeof raw === "string" ? raw : null;
        })();

        if (!razorpayOrderId) {
            console.error("Webhook missing razorpay_order_id");
            return new NextResponse("OK", { status: 200 });
        }

        // Look up internal order
        const { data: order, error: orderError } = await supabase
            .from("orders")
            .select("id, payment_status")
            .eq("razorpay_order_id", razorpayOrderId)
            .maybeSingle<{ id: string; payment_status: string }>();

        if (orderError || !order) {
            console.error("Webhook: order not found for", razorpayOrderId, orderError);
            return new NextResponse("OK", { status: 200 });
        }

        // Idempotency: already paid, nothing to do
        if (order.payment_status === "paid") {
            return new NextResponse("OK", { status: 200 });
        }

        if (eventName === "payment.captured") {
            try {
                await supabase.rpc("confirm_order_payment", {
                    p_order_id: order.id,
                });

                // Send confirmation email (best-effort)
                try {
                    await sendOrderConfirmation(order.id);
                    await supabase.from("order_email_logs").insert({
                        order_id: order.id,
                        status: "sent",
                    });
                } catch (emailErr) {
                    await supabase.from("order_email_logs").insert({
                        order_id: order.id,
                        status: "failed",
                        error: emailErr instanceof Error ? emailErr.message : String(emailErr),
                    });
                }

                return NextResponse.json({ success: true });
            } catch (error) {
                console.error("Payment confirmation failed:", error);
                return NextResponse.json(
                    { error: "Confirmation failed" },
                    { status: 500 },
                );
            }
        }

        if (eventName === "payment.failed") {
            await supabase
                .from("orders")
                .update({ payment_status: "failed" })
                .eq("id", order.id);

            return new NextResponse("OK", { status: 200 });
        }

        return new NextResponse("OK", { status: 200 });
    } catch (error) {
        console.error("Webhook handler error:", error);
        return new NextResponse("OK", { status: 200 });
    }
}
