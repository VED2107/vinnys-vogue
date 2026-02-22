import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { FadeImage } from "@/components/fade-image";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProductImagePublicUrl } from "@/lib/product-images";
import { formatMoney } from "@/lib/format";
import { getCategoryLabel } from "@/lib/categories";
import VariantSelector from "@/components/variant-selector";
import { FadeIn } from "@/components/fade-in";
import { ProductReviewSummary, ProductReviewList } from "@/components/product-reviews";
import type { ReviewItem } from "@/components/product-reviews";
import ProductReviewForm from "@/components/product-review-form";
import { ProductBadges } from "@/components/product-badges";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const supabase = createSupabaseServerClient();
  const { data: product } = await supabase
    .from("products")
    .select("title, description, price, currency, image_path")
    .eq("id", params.id)
    .eq("active", true)
    .maybeSingle();

  if (!product) {
    return { title: "Product Not Found" };
  }

  const p = product as {
    title: string;
    description: string | null;
    price: number;
    currency: string;
    image_path: string | null;
  };

  const imageUrl = p.image_path
    ? getProductImagePublicUrl(supabase, p.image_path)
    : undefined;

  const price = formatMoney(p.price, p.currency);
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
  price: number;
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
    .select("id,title,description,price,currency,image_path,active,category,stock,is_bestseller,is_new")
    .eq("id", params.id)
    .maybeSingle();

  if (!product) notFound();
  if (!(product as { active: boolean }).active) notFound();

  const p = product as ProductRow;
  const imageUrl = getProductImagePublicUrl(supabase, p.image_path);

  // ── Parallel data fetching ──────────────────────────────
  const [
    { data: variants },
    { data: rawReviews },
    { data: existingReview },
  ] = await Promise.all([
    supabase
      .from("product_variants")
      .select("id,size,stock")
      .eq("product_id", p.id)
      .order("size", { ascending: true }),
    supabase
      .from("reviews")
      .select("id, rating, review_text, is_verified, created_at, user_id")
      .eq("product_id", p.id)
      .eq("status", "approved")
      .order("created_at", { ascending: false }),
    supabase
      .from("reviews")
      .select("id")
      .eq("product_id", p.id)
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const variantRows = (variants ?? []) as VariantRow[];

  // Batch-lookup profile emails for review authors
  const reviewRows = (rawReviews ?? []) as unknown as {
    id: string;
    rating: number;
    review_text: string | null;
    is_verified: boolean;
    created_at: string;
    user_id: string;
  }[];

  const reviewUserIds = [...new Set(reviewRows.map((r) => r.user_id).filter(Boolean))];
  let reviewEmailMap: Record<string, string> = {};
  if (reviewUserIds.length > 0) {
    const { data: reviewProfiles } = await supabase
      .from("profiles")
      .select("id, email")
      .in("id", reviewUserIds);
    if (reviewProfiles) {
      reviewEmailMap = Object.fromEntries(
        reviewProfiles.map((pr: { id: string; email: string | null }) => [pr.id, pr.email ?? ""])
      );
    }
  }

  const approvedReviews: ReviewItem[] = reviewRows.map((r) => {
    const email = reviewEmailMap[r.user_id];
    return {
      id: r.id,
      rating: r.rating,
      review_text: r.review_text,
      is_verified: r.is_verified,
      created_at: r.created_at,
      reviewer: email
        ? email.replace(/(.{2}).*(@.*)/, "$1***$2")
        : "Anonymous",
    };
  });

  const reviewCount = approvedReviews.length;
  const avgRating =
    reviewCount > 0
      ? Math.round(
        (approvedReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount) * 10,
      ) / 10
      : 0;

  const hasReviewed = !!existingReview;
  const showForm = !hasReviewed;

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="w-full max-w-[1400px] mx-auto px-6 lg:px-16 xl:px-24 py-16">
        <FadeIn>
          <div className="grid grid-cols-1 gap-10 lg:gap-16 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <div className="md:sticky md:top-24 md:self-start">
              <div className="relative overflow-hidden rounded-[20px] bg-[#EDE8E0] aspect-[4/5] w-full">
                <FadeImage
                  src={imageUrl}
                  alt={p.title}
                  fill
                  sizes="(max-width: 768px) 90vw, (max-width: 1200px) 42vw, 480px"
                  className="img-matte object-cover"
                  priority
                />
              </div>
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
                {formatMoney(p.price, p.currency)}
              </div>

              {p.description ? (
                <div
                  className="text-[15px] leading-[1.7] text-muted [&>p]:m-0 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5"
                  dangerouslySetInnerHTML={{ __html: p.description }}
                />
              ) : null}

              <VariantSelector
                productId={p.id}
                variants={variantRows}
                productStock={p.stock}
                imageUrl={imageUrl}
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
