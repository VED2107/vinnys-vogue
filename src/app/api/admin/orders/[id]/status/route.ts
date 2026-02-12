import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isValidOrderStatus } from "@/lib/order-status";

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

    let body: { status?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { status } = body;

    if (!status || !isValidOrderStatus(status)) {
        return NextResponse.json(
            { error: "Invalid status. Allowed: pending, confirmed, shipped, delivered, cancelled" },
            { status: 400 },
        );
    }

    const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", params.id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, status });
}
