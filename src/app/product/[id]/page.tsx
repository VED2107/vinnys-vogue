import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProductImagePublicUrl } from "@/lib/product-images";
import { formatMoneyFromCents } from "@/lib/format";
import { getCategoryLabel } from "@/lib/categories";
import VariantSelector from "@/components/variant-selector";
import { FadeIn } from "@/components/fade-in";
import { ProductReviewSummary, ProductReviewList } from "@/components/product-reviews";
import type { ReviewItem } from "@/components/product-reviews";
import ProductReviewForm from "@/components/product-review-form";
import { ProductBadges } from "@/components/product-badges";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const supabase = createSupabaseServerClient();
  const { data: product } = await supabase
    .from("products")
    .select("title, description, price_cents, currency, image_path")
    .eq("id", params.id)
    .eq("active", true)
    .maybeSingle();

  if (!product) {
    return { title: "Product Not Found" };
  }

  const p = product as {
    title: string;
    description: string | null;
    price_cents: number;
    currency: string;
    image_path: string | null;
  };

  const imageUrl = p.image_path
    ? getProductImagePublicUrl(supabase, p.image_path)
    : undefined;

  const price = formatMoneyFromCents(p.price_cents, p.currency);
  const desc = p.description
    ? `${p.description.slice(0, 150)}…`
    : `Shop ${p.title} — ${price} at Vinnys Vogue.`;

  return {
    title: p.title,
    description: desc,
    openGraph: {
      title: `${p.title} — Vinnys Vogue`,
      description: desc,
      ...(imageUrl && {
        images: [{ url: imageUrl, width: 800, height: 1000, alt: p.title }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: `${p.title} — Vinnys Vogue`,
      description: desc,
      ...(imageUrl && { images: [imageUrl] }),
    },
  };
}

type ProductRow = {
  id: string;
  title: string;
  description: string | null;
  price_cents: number;
  currency: string;
  image_path: string | null;
  active: boolean;
  category: string | null;
  stock: number;
  is_bestseller: boolean;
  is_new: boolean;
};

type VariantRow = { id: string; size: string; stock: number };

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/product/${params.id}`);
  }

  const { data: product } = await supabase
    .from("products")
    .select("id,title,description,price_cents,currency,image_path,active,category,stock,is_bestseller,is_new")
    .eq("id", params.id)
    .maybeSingle();

  if (!product) notFound();
  if (!(product as { active: boolean }).active) notFound();

  const p = product as ProductRow;
  const imageUrl = getProductImagePublicUrl(supabase, p.image_path);

  const { data: variants } = await supabase
    .from("product_variants")
    .select("id,size,stock")
    .eq("product_id", p.id)
    .order("size", { ascending: true });

  const variantRows = (variants ?? []) as VariantRow[];

  // ── Server-fetch reviews ──────────────────────────────
  const { data: rawReviews } = await supabase
    .from("reviews")
    .select("id, rating, review_text, is_verified, created_at, user_id, profiles(email)")
    .eq("product_id", p.id)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  const approvedReviews: ReviewItem[] = ((rawReviews ?? []) as unknown as {
    id: string;
    rating: number;
    review_text: string | null;
    is_verified: boolean;
    created_at: string;
    user_id: string;
    profiles: { email: string | null } | null;
  }[]).map((r) => ({
    id: r.id,
    rating: r.rating,
    review_text: r.review_text,
    is_verified: r.is_verified,
    created_at: r.created_at,
    reviewer: r.profiles?.email
      ? r.profiles.email.replace(/(.{2}).*(@.*)/, "$1***$2")
      : "Anonymous",
  }));

  const reviewCount = approvedReviews.length;
  const avgRating =
    reviewCount > 0
      ? Math.round(
          (approvedReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount) * 10,
        ) / 10
      : 0;

  // ── Eligibility: has reviewed? eligible to review? ───
  let hasReviewed = false;
  let showForm = false;

  if (user) {
    const { data: existingReview } = await supabase
      .from("reviews")
      .select("id")
      .eq("product_id", p.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingReview) {
      hasReviewed = true;
    } else {
      // Check if user has a delivered order with this product
      const { data: deliveredItem } = await supabase
        .from("order_items")
        .select("id, orders!inner(status)")
        .eq("product_id", p.id)
        .eq("orders.user_id", user.id)
        .eq("orders.status", "delivered")
        .limit(1);

      showForm = (deliveredItem ?? []).length > 0;
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="w-full px-6 lg:px-16 xl:px-24 py-16">
        <FadeIn>
          <div className="grid grid-cols-1 gap-20 md:grid-cols-2">
            <div className="relative overflow-hidden rounded-[20px] bg-[#EDE8E0] aspect-[3/4]">
              <Image
                src={imageUrl}
                alt={p.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="img-matte object-cover"
                priority
              />
            </div>

            <div className="flex flex-col justify-center space-y-8">
              {p.category ? (
                <div className="text-[11px] font-medium tracking-[0.25em] text-gold uppercase">
                  {getCategoryLabel(p.category)}
                </div>
              ) : null}

              <ProductBadges
                stock={p.stock}
                isBestseller={p.is_bestseller}
                isNew={p.is_new}
              />

              <h1 className="font-serif text-[clamp(28px,4vw,42px)] font-light tracking-[-0.02em] leading-[1.15] text-heading">
                {p.title}
              </h1>

              {reviewCount > 0 && (
                <ProductReviewSummary
                  avgRating={avgRating}
                  reviewCount={reviewCount}
                />
              )}

              <div className="gold-divider" />

              <div className="font-serif text-[24px] font-light text-gold">
                {formatMoneyFromCents(p.price_cents, p.currency)}
              </div>

              {p.description ? (
                <p className="text-[15px] leading-[1.7] text-muted whitespace-pre-line">
                  {p.description}
                </p>
              ) : null}

              <VariantSelector
                productId={p.id}
                variants={variantRows}
              />
            </div>
          </div>

          <div className="mt-16">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl font-light text-heading">
                Customer Reviews
              </h2>
              {reviewCount > 0 && (
                <ProductReviewSummary avgRating={avgRating} reviewCount={reviewCount} />
              )}
            </div>

            <div className="gold-divider-gradient mt-4" />

            {showForm && (
              <ProductReviewForm productId={p.id} hasReviewed={false} />
            )}

            {hasReviewed && (
              <ProductReviewForm productId={p.id} hasReviewed={true} />
            )}

            <ProductReviewList reviews={approvedReviews} />
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
