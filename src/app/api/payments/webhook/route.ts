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

        let parsedBody: any;
        try {
            parsedBody = JSON.parse(body);
        } catch {
            console.error("Webhook received invalid JSON");
            return new NextResponse("OK", { status: 200 });
        }

        const eventName = typeof parsedBody?.event === "string" ? parsedBody.event : "";

        if (eventName !== "payment.captured") {
            return new NextResponse("OK", { status: 200 });
        }

        const payment = parsedBody?.payload?.payment?.entity;
        const razorpayOrderId = typeof payment?.order_id === "string" ? payment.order_id : null;

        console.log("Captured order id:", razorpayOrderId);

        if (!razorpayOrderId) {
            console.error("Webhook missing razorpay_order_id");
            return new NextResponse("OK", { status: 200 });
        }

        const { data: order, error: orderError } = await supabase
            .from("orders")
            .select("id")
            .eq("razorpay_order_id", razorpayOrderId)
            .single<{ id: string }>();

        if (orderError || !order) {
            console.error("Order lookup failed:", orderError);
            console.error("Order not found for:", razorpayOrderId);
            return new Response("Order not found", { status: 200 });
        }

        try {
            const { error: rpcError } = await supabase.rpc("confirm_order_payment", {
                p_order_id: order.id,
            });

            if (rpcError) {
                console.error("RPC error:", rpcError);
                return new NextResponse("OK", { status: 200 });
            }

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

        return new NextResponse("OK", { status: 200 });
    } catch (error) {
        console.error("Webhook handler error:", error);
        return new NextResponse("OK", { status: 200 });
    }
}
