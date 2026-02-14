import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/product-card";
import { getProductImagePublicUrl } from "@/lib/product-images";
import { PRODUCT_CATEGORIES } from "@/lib/categories";
import { SectionTitle } from "@/components/ui";
import { FadeIn, StaggerGrid, StaggerItem } from "@/components/fade-in";

type ProductRow = {
  id: string;
  title: string;
  price_cents: number;
  currency: string;
  image_path: string | null;
  active: boolean;
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: { category?: string };
}) {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const filterCategory = searchParams?.category;

  let query = supabase
    .from("products")
    .select("id,title,price_cents,currency,image_path,active")
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (filterCategory) {
    query = query.eq("category", filterCategory);
  }

  const { data } = await query;
  const products = (data ?? []) as ProductRow[];

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

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="mx-auto w-full max-w-[1280px] px-6 py-16">
        <FadeIn>
          <SectionTitle
            subtitle="Browse"
            title="Our Collection"
            description="Handcrafted couture for every moment."
          />
        </FadeIn>

        <div className="mt-16 flex gap-12">
          {/* Filter Sidebar */}
          <aside className="hidden md:block w-56 flex-shrink-0">
            <div className="sticky top-24 glass rounded-[20px] p-6">
              <div className="text-[11px] font-medium tracking-[0.2em] text-gold uppercase">Categories</div>
              <div className="mt-5 space-y-1">
                <a
                  href="/products"
                  className={`block rounded-full px-4 py-2.5 text-[14px] transition ${!filterCategory
                    ? "bg-accent text-white font-medium"
                    : "text-muted hover:text-heading"
                    }`}
                >
                  All
                </a>
                {PRODUCT_CATEGORIES.map((c) => (
                  <a
                    key={c.value}
                    href={`/products?category=${encodeURIComponent(c.value)}`}
                    className={`block rounded-full px-4 py-2.5 text-[14px] transition ${filterCategory === c.value
                      ? "bg-accent text-white font-medium"
                      : "text-muted hover:text-heading"
                      }`}
                  >
                    {c.label}
                  </a>
                ))}
              </div>
            </div>
          </aside>

          <div className="flex-1">
            {/* Mobile pills */}
            <div className="flex flex-wrap gap-2 md:hidden mb-10">
              <a
                href="/products"
                className={`inline-flex h-10 items-center rounded-full px-5 text-[14px] transition ${!filterCategory
                  ? "bg-accent text-white font-medium"
                  : "border border-[rgba(0,0,0,0.08)] text-muted hover:border-[rgba(0,0,0,0.15)]"
                  }`}
              >
                All
              </a>
              {PRODUCT_CATEGORIES.map((c) => (
                <a
                  key={c.value}
                  href={`/products?category=${encodeURIComponent(c.value)}`}
                  className={`inline-flex h-10 items-center rounded-full px-5 text-[14px] transition ${filterCategory === c.value
                    ? "bg-accent text-white font-medium"
                    : "border border-[rgba(0,0,0,0.08)] text-muted hover:border-[rgba(0,0,0,0.15)]"
                    }`}
                >
                  {c.label}
                </a>
              ))}
            </div>

            {products.length === 0 ? (
              <FadeIn>
                <div className="rounded-[20px] border border-[rgba(0,0,0,0.06)] bg-bg-card p-12 text-center text-[15px] text-muted">
                  No products found{filterCategory ? " in this category" : ""}.
                </div>
              </FadeIn>
            ) : (
              <StaggerGrid className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" stagger={0.08}>
                {products.map((p) => (
                  <StaggerItem key={p.id}>
                    <ProductCard
                      product={p}
                      imageUrl={getProductImagePublicUrl(supabase, p.image_path)}
                      initialInWishlist={user ? wishlistProductIds.has(p.id) : undefined}
                    />
                  </StaggerItem>
                ))}
              </StaggerGrid>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
