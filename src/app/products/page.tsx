export const revalidate = 60;

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/product-card";
import { getProductImagePublicUrl } from "@/lib/product-images";
import { SectionTitle } from "@/components/ui";
import { FadeIn, StaggerGrid, StaggerItem } from "@/components/fade-in";
import { MandalaBackground } from "@/components/decorative";
import { GoldDivider } from "@/components/section-divider";
import { CollectionSidebar } from "@/components/collection-sidebar";

type ProductRow = {
  id: string;
  title: string;
  price: number;
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

  const filterCategory = searchParams?.category;

  // Parallel fetch: products + user + wishlist
  let query = supabase
    .from("products")
    .select("id,title,price,currency,image_path,active,stock,is_bestseller,is_new")
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (filterCategory) {
    query = query.eq("category", filterCategory);
  }

  const [
    { data },
    { data: { user } },
  ] = await Promise.all([
    query,
    supabase.auth.getUser(),
  ]);

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
      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-16 xl:px-24 py-16 sm:py-24">
        <FadeIn>
          <SectionTitle
            subtitle="Browse"
            title="Our Collection"
            description="Handcrafted couture for every moment."
            align="left"
          />
        </FadeIn>

        <GoldDivider className="my-10" />

        <div className="mt-8 sm:mt-12 flex flex-col md:flex-row gap-6 md:gap-12 lg:gap-16">
          {/* Sidebar */}
          <CollectionSidebar activeCategory={filterCategory} />

          {/* Product Grid */}
          <div className="flex-1 min-w-0">
            {products.length === 0 ? (
              <FadeIn>
                <div className="py-20 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-neutral-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                    />
                  </svg>
                  <div className="mt-4 text-[15px] font-medium text-heading">
                    No products found
                  </div>
                  <div className="mt-1 text-[13px] text-muted">
                    {filterCategory
                      ? "Try browsing a different category."
                      : "New pieces are coming soon."}
                  </div>
                  {filterCategory && (
                    <a
                      href="/products"
                      className="mt-4 inline-flex h-9 items-center rounded-full bg-accent px-5 text-[13px] font-medium text-white transition hover:bg-accent-hover"
                    >
                      View All
                    </a>
                  )}
                </div>
              </FadeIn>
            ) : (
              <StaggerGrid
                className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4 lg:gap-6"
                stagger={0.06}
              >
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

        <GoldDivider className="mt-20 mb-4" />
      </div>
    </div>
  );
}
