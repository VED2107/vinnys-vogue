import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type WishlistProductRow = {
  id: string;
  title: string;
  price_cents: number;
  currency: string;
  image_path: string | null;
};

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("wishlist")
      .select("product_id, products(id, title, price_cents, currency, image_path)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const items = (data ?? [])
      .map((row) => {
        const product = (row as { products: WishlistProductRow | null }).products;
        if (!product) return null;
        return {
          id: product.id,
          title: product.title,
          price: product.price_cents,
          currency: product.currency,
          image_path: product.image_path,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ items });
  } catch (err) {
    console.error("/api/wishlist/list error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
