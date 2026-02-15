"use client";

import { useState, useCallback, useOptimistic } from "react";

export default function WishlistToggle({
  productId,
  initialInWishlist,
  onToggle,
}: {
  productId: string;
  initialInWishlist: boolean;
  onToggle?: (productId: string, inWishlist: boolean) => void;
}) {
  const [inWishlist, setInWishlist] = useOptimistic(initialInWishlist);
  const [pending, setPending] = useState(false);

  const toggle = useCallback(async () => {
    if (pending) return;
    setPending(true);
    const next = !inWishlist;
    setInWishlist(next);
    onToggle?.(productId, next);

    try {
      const endpoint = next ? "/api/wishlist/add" : "/api/wishlist/remove";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) {
        setInWishlist(!next);
        onToggle?.(productId, !next);
      }
    } catch {
      setInWishlist(!next);
      onToggle?.(productId, !next);
    } finally {
      setPending(false);
    }
  }, [productId, inWishlist, pending, setInWishlist, onToggle]);

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      }}
      disabled={pending}
      aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
      className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-muted transition-all duration-300 hover:text-gold"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill={inWishlist ? "#C6A756" : "none"}
        stroke={inWishlist ? "#C6A756" : "currentColor"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-all duration-300"
      >
        <path d="M20.8 4.6c-1.6-1.6-4.2-1.6-5.8 0L12 7.6l-3-3c-1.6-1.6-4.2-1.6-5.8 0s-1.6 4.2 0 5.8l3 3L12 21l5.8-7.6 3-3c1.6-1.6 1.6-4.2 0-5.8Z" />
      </svg>
    </button>
  );
}
