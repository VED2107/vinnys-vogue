import { FadeImage } from "./fade-image";
import Link from "next/link";
import WishlistToggle from "./wishlist-toggle";
import { ProductCardBadges } from "./product-badges";
import { formatMoney } from "@/lib/format";

interface ProductCardProps {
  product: {
    id: string;
    title: string;
    price: number;
    currency: string;
    stock?: number;
    is_bestseller?: boolean;
    is_new?: boolean;
  };
  imageUrl: string;
  initialInWishlist?: boolean;
  onWishlistToggle?: (productId: string, inWishlist: boolean) => void;
}

export function ProductCard({ product, imageUrl, initialInWishlist, onWishlistToggle }: ProductCardProps) {
  const isSoldOut = (product.stock ?? 999) <= 0;

  return (
    <Link href={`/product/${product.id}`} className="group block product-card-lift">
      <div className="relative overflow-hidden rounded-xl bg-[#EDE8E0] aspect-[4/5] card-premium">
        <FadeImage
          src={imageUrl}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={`img-matte object-cover ${isSoldOut ? "opacity-50" : ""}`}
        />
        <div className="glass-overlay pointer-events-none" />

        <ProductCardBadges
          stock={product.stock ?? 999}
          isBestseller={product.is_bestseller ?? false}
          isNew={product.is_new ?? false}
        />

        {isSoldOut && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 pointer-events-none">
            <span className="rounded-full bg-white/90 px-4 py-1.5 text-[12px] font-semibold tracking-wide text-red-700 uppercase backdrop-blur-sm">
              Sold Out
            </span>
          </div>
        )}

        {initialInWishlist !== undefined ? (
          <WishlistToggle productId={product.id} initialInWishlist={initialInWishlist} onToggle={onWishlistToggle} />
        ) : null}
      </div>

      <div className="mt-4 space-y-1.5">
        <div className="font-serif text-[14px] font-light text-heading leading-snug">
          {product.title}
        </div>
        <div className="text-[13px] text-gold">
          {formatMoney(product.price, product.currency)}
        </div>
      </div>
    </Link>
  );
}
