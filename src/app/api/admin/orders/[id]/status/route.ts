export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendShippingConfirmation } from "@/lib/send-shipping-email";
import { sendDeliveryConfirmation } from "@/lib/send-delivery-email";
import { sendOrderConfirmation } from "@/lib/send-order-email";
import { sendOrderCancellationEmail } from "@/lib/send-cancellation-email";

async function handleStatusUpdate(
    request: NextRequest,
    params: { id: string },
) {
    const supabase = createSupabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
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

    const { status, tracking_number, courier_name } = body;

    if (!status) {
        return NextResponse.json({ error: "Missing status" }, { status: 400 });
    }

    const { error } = await supabase.rpc("update_order_status", {
        p_order_id: params.id,
        p_new_status: status,
        p_tracking_number: tracking_number ?? null,
        p_courier_name: courier_name ?? null,
    });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Fire-and-forget email notifications based on the new status.
    // Each email function includes a small delay to let the RPC commit.
    if (status === "confirmed") {
        void sendOrderConfirmation(params.id);
    } else if (status === "shipped") {
        void sendShippingConfirmation(params.id, {
            courierName: courier_name,
            trackingNumber: tracking_number,
        });
    } else if (status === "delivered") {
        void sendDeliveryConfirmation(params.id);
    } else if (status === "cancelled") {
        void sendOrderCancellationEmail(params.id);
    }

    return NextResponse.json({ success: true });
}

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } },
) {
    return handleStatusUpdate(request, params);
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } },
) {
    return handleStatusUpdate(request, params);
}
