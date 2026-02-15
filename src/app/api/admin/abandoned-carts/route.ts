export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

function getServiceRoleSupabase() {
  return createClient(
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
}

export async function GET() {
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

    const admin = getServiceRoleSupabase();

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Get carts older than 24h that have items
    const { data: carts, error: cartsError } = await admin
      .from("carts")
      .select("id, user_id, created_at, cart_items(id, quantity, products(title, price_cents))")
      .lt("created_at", cutoff);

    if (cartsError) {
      return NextResponse.json({ error: cartsError.message }, { status: 500 });
    }

    // Filter: must have items
    const cartsWithItems = (carts ?? []).filter(
      (c: any) => Array.isArray(c.cart_items) && c.cart_items.length > 0,
    );

    // Get user IDs that have orders (any status) — these are not truly abandoned
    const userIds = cartsWithItems.map((c: any) => c.user_id as string);
    const uniqueUserIds = [...new Set(userIds)];

    const usersWithOrders = new Set<string>();
    if (uniqueUserIds.length > 0) {
      const { data: orderUsers } = await admin
        .from("orders")
        .select("user_id")
        .in("user_id", uniqueUserIds);

      for (const row of orderUsers ?? []) {
        usersWithOrders.add((row as { user_id: string }).user_id);
      }
    }

    // Filter out users who have placed orders
    const abandonedCarts = cartsWithItems.filter(
      (c: any) => !usersWithOrders.has(c.user_id),
    );

    // Get emails for these users
    const abandonedUserIds = abandonedCarts.map((c: any) => c.user_id as string);
    const emailMap = new Map<string, string>();

    if (abandonedUserIds.length > 0) {
      const { data: profiles } = await admin
        .from("profiles")
        .select("id, email")
        .in("id", abandonedUserIds);

      for (const p of profiles ?? []) {
        const row = p as { id: string; email: string | null };
        if (row.email) emailMap.set(row.id, row.email);
      }
    }

    // Get already-sent reminder logs
    const cartIds = abandonedCarts.map((c: any) => c.id as string);
    const sentSet = new Set<string>();

    if (cartIds.length > 0) {
      const { data: logs } = await admin
        .from("abandoned_cart_email_logs")
        .select("cart_id")
        .in("cart_id", cartIds)
        .eq("status", "sent");

      for (const l of logs ?? []) {
        sentSet.add((l as { cart_id: string }).cart_id);
      }
    }

    const result = abandonedCarts.map((c: any) => ({
      cart_id: c.id,
      user_id: c.user_id,
      email: emailMap.get(c.user_id) ?? null,
      created_at: c.created_at,
      item_count: c.cart_items.length,
      items: c.cart_items.map((i: any) => ({
        quantity: i.quantity,
        product_title: i.products?.title ?? "Unknown",
        price_cents: i.products?.price_cents ?? 0,
      })),
      reminder_sent: sentSet.has(c.id),
    }));

    return NextResponse.json({ abandonedCarts: result });
  } catch (err) {
    console.error("/api/admin/abandoned-carts GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
