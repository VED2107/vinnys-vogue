import { StarRating } from "@/components/star-rating";

// ─── Types ───────────────────────────────────────────────

export type ReviewItem = {
  id: string;
  rating: number;
  review_text: string | null;
  is_verified: boolean;
  created_at: string;
  reviewer: string;
};

// ─── ProductReviewSummary (server component) ─────────────

export function ProductReviewSummary({
  avgRating,
  reviewCount,
}: {
  avgRating: number;
  reviewCount: number;
}) {
  if (reviewCount === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <StarRating rating={Math.round(avgRating)} size={14} />
      <span className="text-[13px] text-muted">
        {avgRating.toFixed(1)} ({reviewCount} review{reviewCount !== 1 ? "s" : ""})
      </span>
    </div>
  );
}

// ─── ProductReviewList (server component) ────────────────

export function ProductReviewList({ reviews }: { reviews: ReviewItem[] }) {
  if (reviews.length === 0) {
    return (
      <div className="mt-8 text-[14px] text-muted">
        No reviews yet. Be the first to review!
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      {reviews.map((review) => (
        <div
          key={review.id}
          className="rounded-[16px] border border-[rgba(0,0,0,0.06)] bg-white p-5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <StarRating rating={review.rating} size={14} />
              {review.is_verified && (
                <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
                  Verified Buyer
                </span>
              )}
            </div>
            <div className="text-[12px] text-muted">
              {new Date(review.created_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </div>
          </div>
          {review.review_text && (
            <p className="mt-3 text-[14px] leading-relaxed text-heading">
              {review.review_text}
            </p>
          )}
          <div className="mt-2 text-[12px] text-muted">{review.reviewer}</div>
        </div>
      ))}
    </div>
  );
}
