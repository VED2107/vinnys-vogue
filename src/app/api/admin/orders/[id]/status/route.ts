export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isValidOrderStatus } from "@/lib/order-status";
import { sendShippingConfirmation } from "@/lib/send-shipping-email";

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } },
) {
    const supabase = createSupabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

    if (!profile || profile.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let body: { status?: string; courier_name?: string; tracking_number?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { status } = body;

    if (!status || !isValidOrderStatus(status)) {
        return NextResponse.json(
            { error: "Invalid status. Allowed: pending, confirmed, shipping, shipped, delivered, cancelled" },
            { status: 400 },
        );
    }

    if (status === "shipping") {
        const courier_name = String(body.courier_name ?? "").trim();
        const tracking_number = String(body.tracking_number ?? "").trim();

        if (!courier_name || !tracking_number) {
            return NextResponse.json(
                { error: "Tracking number and courier name required" },
                { status: 400 },
            );
        }

        const { error } = await supabase
            .from("orders")
            .update({
                status: "shipping",
                courier_name,
                tracking_number,
                shipped_at: new Date().toISOString(),
            })
            .eq("id", params.id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const { error: eventError } = await supabase.from("order_events").insert({
            order_id: params.id,
            event_type: "SHIPPED",
        });

        if (eventError) {
            return NextResponse.json({ error: eventError.message }, { status: 500 });
        }

        void sendShippingConfirmation(params.id);

        return NextResponse.json({ success: true, status: "shipping" });
    }

    const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", params.id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (status === "delivered" || status === "cancelled") {
        const { error: eventError } = await supabase.from("order_events").insert({
            order_id: params.id,
            event_type: status.toUpperCase(),
        });

        if (eventError) {
            return NextResponse.json({ error: eventError.message }, { status: 500 });
        }
    }

    return NextResponse.json({ success: true, status });
}
