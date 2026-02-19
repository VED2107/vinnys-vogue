"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function StarInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
          className="p-0.5 transition-transform hover:scale-110"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill={star <= (hover || value) ? "#C6A756" : "none"}
            stroke={star <= (hover || value) ? "#C6A756" : "#D1D5DB"}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>
      ))}
    </div>
  );
}

export default function ProductReviewForm({
  productId,
  hasReviewed,
}: {
  productId: string;
  hasReviewed: boolean;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  if (hasReviewed) {
    return (
      <div className="mt-8 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white px-5 py-3 text-[14px] text-muted">
        You have already reviewed this product.
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="mt-8 rounded-xl border border-green-200 bg-green-50 px-5 py-3 text-[14px] text-green-800">
        Thank you for your review!
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setSubmitError("Please select a rating");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/reviews/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId,
          rating,
          review_text: reviewText.trim() || null,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setSubmitError(json.error ?? "Failed to submit review");
        return;
      }

      setSubmitSuccess(true);
      setRating(0);
      setReviewText("");
      router.refresh();
    } catch {
      setSubmitError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <div className="text-[14px] font-medium text-heading">Write a Review</div>
      <StarInput value={rating} onChange={setRating} />
      <textarea
        value={reviewText}
        onChange={(e) => setReviewText(e.target.value)}
        placeholder="Share your experience with this product..."
        rows={3}
        className="w-full rounded-xl border border-[rgba(0,0,0,0.08)] bg-white px-4 py-3 text-[14px] text-heading outline-none transition focus:border-gold resize-y"
      />
      {submitError && (
        <div className="text-[13px] text-red-600">{submitError}</div>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="h-10 rounded-full bg-accent px-6 text-[13px] font-medium text-white transition hover:bg-accent-hover disabled:opacity-50 flex items-center gap-2"
      >
        {submitting ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Submitting…
          </>
        ) : "Submit Review"}
      </button>
    </form>
  );
}
