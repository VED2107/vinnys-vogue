export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Razorpay from "razorpay";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: Request) {
    try {
        // Rate limit: 5 requests per minute
        const ip = getClientIp(request);
        const rl = rateLimit(`payments-create:${ip}`, 5, 60_000);
        if (!rl.success) {
            return NextResponse.json(
                { error: "Too many requests. Please try again later." },
                { status: 429 },
            );
        }
        const supabase = createSupabaseServerClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { orderId } = await request.json();
        if (!orderId) {
            return NextResponse.json(
                { error: "orderId is required" },
                { status: 400 },
            );
        }

        // Fetch order
        const { data: order, error: orderError } = await supabase
            .from("orders")
            .select("id, user_id, total_amount, payment_status, status, created_at, razorpay_order_id")
            .eq("id", orderId)
            .maybeSingle();

        if (orderError || !order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // Validate ownership
        if (order.user_id !== user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Validate payment status
        if (order.payment_status !== "unpaid") {
            return NextResponse.json(
                { error: "Order is already paid" },
                { status: 400 },
            );
        }

        // Fraud guard: only allow payment initiation for pending or payment_initiated orders
        if (!["pending", "payment_initiated"].includes(order.status as string)) {
            return NextResponse.json(
                { error: "Order is not eligible for payment" },
                { status: 400 },
            );
        }

        // Fraud guard: block old orders (> 2 hours)
        const createdAtMs = new Date(String(order.created_at ?? "")).getTime();
        if (Number.isFinite(createdAtMs) && Date.now() - createdAtMs > 2 * 60 * 60 * 1000) {
            return NextResponse.json(
                { error: "Order has expired. Please checkout again." },
                { status: 400 },
            );
        }

        // If Razorpay order already exists, return it for retry
        if (order.razorpay_order_id) {
            return NextResponse.json({
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                razorpayOrderId: order.razorpay_order_id,
                amount: Math.round(Number(order.total_amount) * 100),
                currency: "INR",
                orderId: order.id,
            });
        }

        // Stock validation — stock is NOT decremented until payment is confirmed,
        // so we check current stock against order quantities here.
        const { data: items, error: itemsError } = await supabase
            .from("order_items")
            .select("quantity, product_name, products(id, stock)")
            .eq("order_id", order.id);

        if (itemsError) {
            return NextResponse.json(
                { error: "Failed to validate stock" },
                { status: 500 },
            );
        }

        for (const row of (items ?? []) as any[]) {
            const qty = Number(row?.quantity ?? 0);
            const prod = row?.products;
            const stock = Number(prod?.stock ?? 0);
            const name = row?.product_name ?? "Item";

            if (qty > 0 && stock < qty) {
                return NextResponse.json(
                    { error: `"${name}" is out of stock` },
                    { status: 400 },
                );
            }
        }

        // Create Razorpay order — amount in paise (total_amount is in rupees)
        const amountInPaise = Math.round(Number(order.total_amount) * 100);

        const razorpayOrder = await razorpay.orders.create({
            amount: amountInPaise,
            currency: "INR",
            receipt: order.id,
        });

        // Save razorpay_order_id to the orders table
        const { error: updateError } = await supabase
            .from("orders")
            .update({
                razorpay_order_id: razorpayOrder.id,
                status: "payment_initiated",
            })
            .eq("id", order.id);

        if (updateError) {
            return NextResponse.json(
                { error: "Failed to save Razorpay order" },
                { status: 500 },
            );
        }

        return NextResponse.json({
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            razorpayOrderId: razorpayOrder.id,
            amount: amountInPaise,
            currency: "INR",
            orderId: order.id,
        });
    } catch (err) {
        console.error("Razorpay create order error:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
