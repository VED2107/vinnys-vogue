import Image from "next/image";
import Link from "next/link";
import WishlistToggle from "./wishlist-toggle";
import { ProductCardBadges } from "./product-badges";
import { formatMoneyFromCents } from "@/lib/format";

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
  onWishlistToggle?: (productId: string, inWishlist: boolean) => void;
}

export function ProductCard({ product, imageUrl, initialInWishlist, onWishlistToggle }: ProductCardProps) {
  return (
    <Link href={`/product/${product.id}`} className="group block" prefetch={true}>
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
          <WishlistToggle productId={product.id} initialInWishlist={initialInWishlist} onToggle={onWishlistToggle} />
        ) : null}
      </div>

      <div className="mt-3 space-y-1">
        <div className="font-serif text-[14px] font-light text-heading leading-snug">
          {product.title}
        </div>
        <div className="text-[13px] text-gold">
          {formatMoneyFromCents(product.price_cents, product.currency)}
        </div>
      </div>
    </Link>
  );
}
