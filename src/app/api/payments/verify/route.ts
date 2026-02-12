import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import crypto from "crypto";

export async function POST(request: Request) {
    try {
        const supabase = createSupabaseServerClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } =
            await request.json();

        if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 },
            );
        }

        // Verify signature server-side
        const secret = process.env.RAZORPAY_KEY_SECRET;
        if (!secret) {
            return NextResponse.json(
                { error: "Server configuration error" },
                { status: 500 },
            );
        }

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(body)
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return NextResponse.json(
                { error: "Invalid payment signature" },
                { status: 400 },
            );
        }

        // Update order as paid + confirmed
        const { error: updateError } = await supabase
            .from("orders")
            .update({
                payment_status: "paid",
                status: "confirmed",
                razorpay_payment_id,
                razorpay_signature,
            })
            .eq("id", orderId)
            .eq("user_id", user.id);

        if (updateError) {
            console.error("Order update error:", updateError);
            return NextResponse.json(
                { error: "Failed to update order" },
                { status: 500 },
            );
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Razorpay verify error:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
