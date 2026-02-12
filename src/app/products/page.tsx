import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/product-card";
import { getProductImagePublicUrl } from "@/lib/product-images";
import { PRODUCT_CATEGORIES, getCategoryLabel } from "@/lib/categories";

type ProductRow = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  price_cents: number;
  currency: string;
  image_path: string | null;
  active: boolean;
  created_at: string;
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: { category?: string };
}) {
  const category = searchParams?.category;

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

  let query = supabase
    .from("products")
    .select(
      "id,title,description,category,price_cents,currency,image_path,active,created_at",
    )
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error) {
    return (
      <div className="min-h-screen bg-ivory text-foreground">
        <div className="mx-auto w-full max-w-6xl px-6 py-12">
          <div className="rounded-2xl border border-zinc-200/60 bg-white p-6 text-sm text-warm-gray">
            {error.message}
          </div>
        </div>
      </div>
    );
  }

  const products = (data ?? []) as ProductRow[];

  return (
    <div className="min-h-screen bg-ivory text-foreground">
      <div className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h1 className="font-serif text-2xl font-light tracking-tight">
              {category ? getCategoryLabel(category) : "Collection"}
            </h1>
            <p className="text-sm text-warm-gray">
              {category ? "Filtered selection" : "Browse our signature pieces"}
            </p>
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/products"
              className={`inline-flex h-9 items-center rounded-xl px-4 text-sm font-medium transition ${!category
                  ? "bg-zinc-900 text-zinc-50"
                  : "border border-zinc-200/60 bg-white text-zinc-700 hover:bg-zinc-50"
                }`}
            >
              All
            </a>
            {PRODUCT_CATEGORIES.map((c) => (
              <a
                key={c.value}
                href={`/products?category=${encodeURIComponent(c.value)}`}
                className={`inline-flex h-9 items-center rounded-xl px-4 text-sm font-medium transition ${category === c.value
                    ? "bg-zinc-900 text-zinc-50"
                    : "border border-zinc-200/60 bg-white text-zinc-700 hover:bg-zinc-50"
                  }`}
              >
                {c.label}
              </a>
            ))}
          </div>
        </div>

        {products.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-zinc-200/60 bg-white p-10 text-center text-sm text-warm-gray shadow-sm">
            No products found{category ? ` in ${getCategoryLabel(category)}` : ""}.
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                imageUrl={getProductImagePublicUrl(supabase, p.image_path)}
                initialInWishlist={user ? wishlistProductIds.has(p.id) : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
