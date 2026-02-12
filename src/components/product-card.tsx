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
      className="group relative block overflow-hidden rounded-2xl border border-zinc-200/60 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      {typeof initialInWishlist === "boolean" ? (
        <WishlistToggle productId={product.id} initialInWishlist={initialInWishlist} />
      ) : null}
      <div className="aspect-[4/5] w-full overflow-hidden bg-cream">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={product.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <div className="space-y-1.5 p-5">
        <div className="text-sm font-medium tracking-tight text-zinc-900 line-clamp-1">
          {product.title}
        </div>
        <div className="text-sm text-warm-gray">
          {formatMoneyFromCents(product.price_cents, product.currency)}
        </div>
      </div>
    </a>
  );
}
