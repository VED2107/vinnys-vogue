export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
    try {
        // Rate limit: 5 per minute
        const ip = getClientIp(request);
        const rl = rateLimit(`checkout:${ip}`, 5, 60_000);
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

        let body: {
            full_name?: string;
            email?: string;
            phone?: string;
            address_line1?: string;
            address_line2?: string;
            city?: string;
            state?: string;
            pincode?: string;
        };

        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
        }

        const fullName = String(body.full_name || "").trim();
        const email = String(body.email || "").trim();
        const phone = String(body.phone || "").trim();
        const addressLine1 = String(body.address_line1 || "").trim();
        const addressLine2 = String(body.address_line2 || "").trim();
        const city = String(body.city || "").trim();
        const state = String(body.state || "").trim();
        const pincode = String(body.pincode || "").trim();

        if (!fullName || !phone || !addressLine1 || !city || !state || !pincode) {
            return NextResponse.json(
                { error: "Missing required shipping fields." },
                { status: 400 },
            );
        }

        // Create the order via the atomic RPC
        const { data, error } = await supabase.rpc("checkout_cart", {
            p_user_id: user.id,
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const orderId = data as string;

        // Update order with shipping details
        const { error: updateError } = await supabase
            .from("orders")
            .update({
                full_name: fullName,
                email,
                phone,
                address_line1: addressLine1,
                address_line2: addressLine2 || null,
                postal_code: pincode,
                city,
                state,
                country: "India",
            })
            .eq("id", orderId);

        if (updateError) {
            return NextResponse.json(
                { error: updateError.message },
                { status: 500 },
            );
        }

        return NextResponse.json({ orderId });
    } catch (err) {
        console.error("/api/checkout error:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
