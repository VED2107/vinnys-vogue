import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: Request) {
    try {
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
            .select("id, user_id, total_amount, payment_status")
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
            .update({ razorpay_order_id: razorpayOrder.id })
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
