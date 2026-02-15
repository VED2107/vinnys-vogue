import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/product-card";
import { getProductImagePublicUrl } from "@/lib/product-images";
import { SectionTitle, PremiumButton } from "@/components/ui";
import { FadeIn, StaggerGrid, StaggerItem } from "@/components/fade-in";

export default async function WishlistPage() {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/wishlist");
  }

  const { data: rows, error: wishlistError } = await supabase
    .from("wishlist")
    .select("product_id, products(id,title,price_cents,currency,image_path,active)")
    .eq("user_id", user.id);

  if (wishlistError) {
    console.error("[WishlistPage] query error:", wishlistError);
    return (
      <div className="min-h-screen bg-bg-primary">
        <div className="w-full px-6 lg:px-16 xl:px-24 py-16">
          <div className="rounded-[20px] border border-red-200 bg-red-50 p-8 text-center text-[15px] text-red-700">
            Failed to load wishlist. Please try again.
          </div>
        </div>
      </div>
    );
  }

  const products = (rows ?? [])
    .map((r) => (r as unknown as { products: { id: string; title: string; price_cents: number; currency: string; image_path: string | null; active: boolean } | null }).products)
    .filter(Boolean) as { id: string; title: string; price_cents: number; currency: string; image_path: string | null; active: boolean }[];

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="w-full px-6 lg:px-16 xl:px-24 py-16">
        <FadeIn>
          <SectionTitle
            subtitle="Saved"
            title="Your Wishlist"
            description={`${products.length} piece${products.length !== 1 ? "s" : ""} saved for later.`}
          />
        </FadeIn>

        {products.length === 0 ? (
          <FadeIn delay={0.08}>
            <div className="mt-16 rounded-[20px] border border-[rgba(0,0,0,0.06)] bg-bg-card p-16 text-center">
              <div className="font-serif text-xl font-light text-heading">Nothing here yet</div>
              <p className="mt-3 text-[15px] text-muted">Browse our collection and save pieces you love.</p>
              <div className="mt-8">
                <PremiumButton href="/products">Explore Collection</PremiumButton>
              </div>
            </div>
          </FadeIn>
        ) : (
          <StaggerGrid className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4" stagger={0.08}>
            {products.map((p) => (
              <StaggerItem key={p.id}>
                <ProductCard
                  product={p}
                  imageUrl={getProductImagePublicUrl(supabase, p.image_path)}
                  initialInWishlist={true}
                />
              </StaggerItem>
            ))}
          </StaggerGrid>
        )}
      </div>
    </div>
  );
}
