import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatMoneyFromCents } from "@/lib/format";
import { getProductImagePublicUrl } from "@/lib/product-images";
import { AddToCartButton } from "@/components/add-to-cart-button";
import VariantSelector from "@/components/variant-selector";
import { getCategoryLabel } from "@/lib/categories";

type VariantRow = {
  id: string;
  size: string;
  stock: number;
};

type ProductRow = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  price_cents: number;
  currency: string;
  image_path: string | null;
  active: boolean;
  has_variants: boolean;
  stock: number;
  product_variants: VariantRow[];
};

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("products")
    .select(
      "id,title,description,category,price_cents,currency,image_path,active,has_variants,stock,product_variants(id,size,stock)",
    )
    .eq("id", params.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    notFound();
  }

  const product: ProductRow = JSON.parse(JSON.stringify(data));
  const imageUrl = getProductImagePublicUrl(supabase, product.image_path);

  return (
    <div className="min-h-screen bg-ivory text-foreground">
      <div className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-zinc-200/60 bg-white shadow-sm">
            <div className="aspect-[4/5] w-full bg-cream">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={product.title}
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="font-serif text-3xl font-light tracking-tight">
                {product.title}
              </h1>
              {product.category ? (
                <div className="text-xs tracking-[0.22em] text-gold uppercase">
                  {getCategoryLabel(product.category)}
                </div>
              ) : null}
              <div className="text-lg text-warm-gray">
                {formatMoneyFromCents(product.price_cents, product.currency)}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200/60 bg-white p-6 text-sm leading-7 text-warm-gray shadow-sm">
              {product.description ? product.description : "Details available on request."}
            </div>

            {product.has_variants && product.product_variants.length > 0 ? (
              <VariantSelector
                productId={product.id}
                variants={product.product_variants}
              />
            ) : (
              <div className="space-y-2">
                {!product.has_variants && product.stock > 0 && (
                  <div className="text-xs text-zinc-500">{product.stock} in stock</div>
                )}
                {!product.has_variants && product.stock <= 0 ? (
                  <button
                    disabled
                    className="h-11 w-full rounded-xl bg-zinc-900 px-5 text-sm font-medium text-zinc-50 opacity-50 cursor-not-allowed md:w-56"
                  >
                    Out of Stock
                  </button>
                ) : (
                  <AddToCartButton productId={product.id} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
