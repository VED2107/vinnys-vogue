import Image from "next/image";
import { formatMoneyFromCents } from "@/lib/format";
import WishlistToggle from "@/components/wishlist-toggle";

type Product = {
  id: string;
  title: string;
  price_cents: number;
  currency: string;
  active: boolean;
};

export function ProductCard({
  product,
  imageUrl,
  initialInWishlist,
}: {
  product: Product;
  imageUrl: string;
  initialInWishlist?: boolean;
}) {
  return (
    <a
      href={`/product/${product.id}`}
      className="group relative block overflow-hidden rounded-[20px] bg-bg-card transition-all duration-500 hover:shadow-xl"
    >
      {typeof initialInWishlist === "boolean" ? (
        <WishlistToggle productId={product.id} initialInWishlist={initialInWishlist} />
      ) : null}
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-t-[20px] bg-[#EDE8E0]">
        <Image
          src={imageUrl}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="img-matte object-cover"
        />
        <div className="glass-overlay pointer-events-none" />
      </div>
      <div className="p-5 text-center space-y-3">
        <div className="font-serif text-lg font-medium text-heading line-clamp-1">
          {product.title}
        </div>
        <div className="gold-divider-gradient mx-auto" />
        <div className="font-serif text-[16px] font-light text-gold">
          {formatMoneyFromCents(product.price_cents, product.currency)}
        </div>
      </div>
    </a >
  );
}
