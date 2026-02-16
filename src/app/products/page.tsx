import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/product-card";
import { getProductImagePublicUrl } from "@/lib/product-images";
import { PRODUCT_CATEGORIES } from "@/lib/categories";
import { SectionTitle } from "@/components/ui";
import { FadeIn, StaggerGrid, StaggerItem } from "@/components/fade-in";
import { MandalaBackground } from "@/components/decorative";
import { GoldDivider } from "@/components/section-divider";

type ProductRow = {
  id: string;
  title: string;
  price_cents: number;
  currency: string;
  image_path: string | null;
  active: boolean;
  stock: number;
  is_bestseller: boolean;
  is_new: boolean;
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
    .select("id,title,price_cents,currency,image_path,active,stock,is_bestseller,is_new")
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
    <div className="relative min-h-screen overflow-hidden bg-bg-primary">
      <MandalaBackground variant="lotus" position="center" />
      <div className="relative z-10 w-full px-6 lg:px-16 xl:px-24 py-24">
        <FadeIn>
          <SectionTitle
            subtitle="Browse"
            title="Our Collection"
            description="Handcrafted couture for every moment."
            align="left"
          />
        </FadeIn>

        <GoldDivider className="my-8" />

        <div className="mt-16 flex gap-12">
          {/* Filter Sidebar */}
          <aside className="hidden md:block w-[240px] flex-shrink-0">
            <div className="sticky top-24 space-y-1">
              <div className="text-[11px] font-medium tracking-[0.25em] text-neutral-400 uppercase mb-4">Categories</div>
              <a
                href="/products"
                className={`block px-3 py-2 text-[13px] transition-opacity ${!filterCategory
                  ? "text-heading font-medium"
                  : "text-neutral-500 hover:opacity-70"
                  }`}
              >
                All
              </a>
              {PRODUCT_CATEGORIES.map((c) => (
                <a
                  key={c.value}
                  href={`/products?category=${encodeURIComponent(c.value)}`}
                  className={`block px-3 py-2 text-[13px] transition-opacity ${filterCategory === c.value
                    ? "text-heading font-medium"
                    : "text-neutral-500 hover:opacity-70"
                    }`}
                >
                  {c.label}
                </a>
              ))}
            </div>
          </aside>

          <div className="flex-1">
            {/* Mobile pills */}
            <div className="flex flex-wrap gap-2 md:hidden mb-10">
              <a
                href="/products"
                className={`inline-flex h-9 items-center rounded-full px-4 text-[13px] transition ${!filterCategory
                  ? "bg-[#0F2E22] text-white"
                  : "border border-neutral-200 text-neutral-500 hover:border-neutral-300"
                  }`}
              >
                All
              </a>
              {PRODUCT_CATEGORIES.map((c) => (
                <a
                  key={c.value}
                  href={`/products?category=${encodeURIComponent(c.value)}`}
                  className={`inline-flex h-9 items-center rounded-full px-4 text-[13px] transition ${filterCategory === c.value
                    ? "bg-[#0F2E22] text-white"
                    : "border border-neutral-200 text-neutral-500 hover:border-neutral-300"
                    }`}
                >
                  {c.label}
                </a>
              ))}
            </div>

            {products.length === 0 ? (
              <FadeIn>
                <div className="p-12 text-[15px] text-neutral-400">
                  No products found{filterCategory ? " in this category" : ""}.
                </div>
              </FadeIn>
            ) : (
              <StaggerGrid className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12" stagger={0.08}>
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

        <GoldDivider className="mt-16 mb-4" />
      </div>
    </div>
  );
}
