export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
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

    let body: { change?: number; reason?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const change = Number(body.change);
    const reason = String(body.reason || "").trim();

    if (!Number.isInteger(change) || change === 0) {
      return NextResponse.json(
        { error: "change must be a non-zero integer" },
        { status: 400 },
      );
    }

    if (!reason) {
      return NextResponse.json({ error: "reason is required" }, { status: 400 });
    }

    const { error } = await supabase.rpc("admin_adjust_product_stock", {
      p_product_id: params.id,
      p_change: change,
      p_reason: reason,
    });

    if (error) {
      if (
        error.code === "23514" ||
        error.message.includes("stock_non_negative")
      ) {
        return NextResponse.json(
          { error: "Insufficient stock: adjustment would result in negative stock" },
          { status: 409 },
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("/api/admin/products/[id]/adjust-stock error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
