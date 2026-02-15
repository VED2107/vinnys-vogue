"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import WishlistToggle from "./wishlist-toggle";
import { ProductCardBadges } from "./product-badges";

interface ProductCardProps {
  product: {
    id: string;
    title: string;
    price_cents: number;
    currency: string;
    stock?: number;
    is_bestseller?: boolean;
    is_new?: boolean;
  };
  imageUrl: string;
  initialInWishlist?: boolean;
}

export function ProductCard({ product, imageUrl, initialInWishlist }: ProductCardProps) {
  const router = useRouter();
  const price = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: product.currency || "INR",
    maximumFractionDigits: 0,
  }).format(product.price_cents / 100);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/product/${product.id}`)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") router.push(`/product/${product.id}`); }}
      className="group cursor-pointer"
    >
      <div className="relative overflow-hidden rounded-xl bg-[#EDE8E0] aspect-[4/5]">
        <Image
          src={imageUrl}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="img-matte object-cover"
        />
        <div className="glass-overlay pointer-events-none" />

        <ProductCardBadges
          stock={product.stock ?? 999}
          isBestseller={product.is_bestseller ?? false}
          isNew={product.is_new ?? false}
        />

        {initialInWishlist !== undefined ? (
          <div className="absolute right-3 top-3 z-10">
            <WishlistToggle productId={product.id} initialInWishlist={initialInWishlist} />
          </div>
        ) : null}
      </div>

      <div className="mt-3 space-y-1">
        <div className="font-serif text-[14px] font-light text-heading leading-snug">
          {product.title}
        </div>
        <div className="text-[13px] text-gold">
          {price}
        </div>
      </div>
    </div>
  );
}
