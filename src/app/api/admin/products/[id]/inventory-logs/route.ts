import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type InventoryLogRow = {
  id: string;
  product_id: string;
  change: number;
  reason: string | null;
  created_at: string;
};

export async function GET(
  _request: Request,
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

    const { data, error } = await supabase
      .from("inventory_logs")
      .select("id, product_id, change, reason, created_at")
      .eq("product_id", params.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ logs: (data ?? []) as InventoryLogRow[] });
  } catch (err) {
    console.error("/api/admin/products/[id]/inventory-logs error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
