import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

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

        const ack = new NextResponse("OK", { status: 200 });

        void (async () => {
            try {
                const evt = event as {
                    event?: unknown;
                    payload?: { payment?: { entity?: { id?: unknown; order_id?: unknown } } };
                };

                const eventName = typeof evt.event === "string" ? evt.event : "";
                const paymentEntity = evt.payload?.payment?.entity;
                const paymentId =
                    paymentEntity && typeof paymentEntity.id === "string"
                        ? paymentEntity.id
                        : null;
                const razorpayOrderId =
                    paymentEntity && typeof paymentEntity.order_id === "string"
                        ? paymentEntity.order_id
                        : null;

                if (!razorpayOrderId) {
                    console.error("Webhook missing payment.order_id");
                    return;
                }

                if (eventName === "payment.captured") {
                    const { error } = await supabase
                        .from("orders")
                        .update({
                            status: "confirmed",
                            payment_status: "paid",
                            razorpay_payment_id: paymentId,
                        })
                        .eq("razorpay_order_id", razorpayOrderId);

                    if (error) {
                        console.error("Webhook update failed (payment.captured):", error);
                    }
                } else if (eventName === "payment.failed") {
                    const { error } = await supabase
                        .from("orders")
                        .update({
                            payment_status: "unpaid",
                        })
                        .eq("razorpay_order_id", razorpayOrderId);

                    if (error) {
                        console.error("Webhook update failed (payment.failed):", error);
                    }
                }
            } catch (error) {
                console.error("Webhook background task error:", error);
            }
        })();

        return ack;
    } catch (error) {
        console.error("Webhook handler error:", error);
        return new NextResponse("OK", { status: 200 });
    }
}
