export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { isValidPaymentStatus } from "@/lib/payment-status";

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

    let body: { payment_status?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { payment_status } = body;

    if (!payment_status || !isValidPaymentStatus(payment_status)) {
        return NextResponse.json(
            { error: "Invalid payment_status. Allowed: unpaid, paid, failed, refunded" },
            { status: 400 },
        );
    }

    if (payment_status === "paid") {
        // confirm_order_payment is GRANTED ONLY TO service_role
        const serviceClient = createClient(
            process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
        );

        const { error } = await serviceClient.rpc("confirm_order_payment", {
            p_order_id: params.id,
            p_razorpay_payment_id: "admin_override",
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, payment_status });
    }

    const { error } = await supabase
        .from("orders")
        .update({ payment_status })
        .eq("id", params.id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, payment_status });
}
