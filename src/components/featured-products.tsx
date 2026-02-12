import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/product-card";
import { getProductImagePublicUrl } from "@/lib/product-images";

type ProductRow = {
  id: string;
  title: string;
  price_cents: number;
  currency: string;
  image_path: string | null;
  active: boolean;
};

export async function FeaturedProducts() {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const wishlistProductIds = new Set<string>();
  if (user) {
    const { data: wishlistRows } = await supabase
      .from("wishlist")
      .select("product_id")
      .eq("user_id", user.id);

    for (const row of wishlistRows ?? []) {
      const productId = (row as { product_id: string }).product_id;
      if (productId) wishlistProductIds.add(productId);
    }
  }

  const { data } = await supabase
    .from("products")
    .select(
      "id,title,price_cents,currency,image_path,active",
    )
    .eq("active", true)
    .eq("show_on_home", true)
    .order("display_order", { ascending: true })
    .limit(8);

  const products = (data ?? []) as ProductRow[];

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200/60 bg-white p-10 text-center text-sm text-warm-gray shadow-sm">
        No featured products yet. Mark products as &ldquo;Show on Home&rdquo; in the admin panel.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard
          key={p.id}
          product={p}
          imageUrl={getProductImagePublicUrl(supabase, p.image_path)}
          initialInWishlist={user ? wishlistProductIds.has(p.id) : undefined}
        />
      ))}
    </div>
  );
}

export function FeaturedProductsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, idx) => (
        <div
          key={idx}
          className="overflow-hidden rounded-2xl border border-zinc-200/60 bg-white shadow-sm"
        >
          <div className="aspect-[4/5] w-full animate-pulse bg-cream" />
          <div className="space-y-2 p-5">
            <div className="h-4 w-3/4 animate-pulse rounded bg-cream" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-cream" />
          </div>
        </div>
      ))}
    </div>
  );
}
