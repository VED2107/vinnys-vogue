"use client";

import { useCallback, useMemo, useState, useTransition } from "react";

type Props = {
  productId: string;
  initialInWishlist: boolean;
  onCountChange?: (delta: number) => void;
};

export default function WishlistToggle({
  productId,
  initialInWishlist,
  onCountChange,
}: Props) {
  const [inWishlist, setInWishlist] = useState(initialInWishlist);
  const [isPending, startTransition] = useTransition();

  const ariaLabel = useMemo(
    () => (inWishlist ? "Remove from wishlist" : "Add to wishlist"),
    [inWishlist],
  );

  const toggle = useCallback(() => {
    const next = !inWishlist;

    setInWishlist(next);
    onCountChange?.(next ? 1 : -1);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/wishlist/${next ? "add" : "remove"}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ productId }),
        });

        if (!res.ok) {
          setInWishlist(!next);
          onCountChange?.(next ? -1 : 1);
        }
      } catch {
        setInWishlist(!next);
        onCountChange?.(next ? -1 : 1);
      }
    });
  }, [inWishlist, onCountChange, productId]);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        toggle();
      }}
      aria-label={ariaLabel}
      className={`absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200/60 bg-white/90 text-zinc-700 shadow-sm backdrop-blur transition hover:bg-white ${
        isPending ? "opacity-80" : "opacity-100"
      }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill={inWishlist ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={inWishlist ? "text-rose-600" : "text-zinc-700"}
      >
        <path d="M20.8 4.6c-1.6-1.6-4.2-1.6-5.8 0L12 7.6l-3-3c-1.6-1.6-4.2-1.6-5.8 0s-1.6 4.2 0 5.8l3 3L12 21l5.8-7.6 3-3c1.6-1.6 1.6-4.2 0-5.8Z" />
      </svg>
    </button>
  );
}
