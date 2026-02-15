import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { processWebhookEvent } from "@/lib/process-webhook-event";

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
            id?: unknown;
            payload?: { payment?: { entity?: { order_id?: unknown } } };
        };

        const razorpayOrderIdRaw = evt.payload?.payment?.entity?.order_id;
        const razorpayOrderId =
            typeof razorpayOrderIdRaw === "string" ? razorpayOrderIdRaw : null;

        const razorpayEventId = typeof evt.id === "string" ? evt.id : null;

        const { data: inserted, error: insertError } = await supabase
            .from("webhook_events")
            .insert({
                razorpay_event_id: razorpayEventId,
                razorpay_order_id: razorpayOrderId,
                payload: event,
                status: "pending",
            })
            .select("id")
            .single<{ id: string }>();

        if (insertError || !inserted) {
            console.error("Webhook enqueue failed:", insertError);
            return new NextResponse("OK", { status: 200 });
        }

        void processWebhookEvent(inserted.id);

        return new NextResponse("OK", { status: 200 });
    } catch (error) {
        console.error("Webhook handler error:", error);
        return new NextResponse("OK", { status: 200 });
    }
}
