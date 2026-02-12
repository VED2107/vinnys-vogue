import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProductImagePublicUrl } from "@/lib/product-images";
import { formatMoneyFromCents } from "@/lib/format";
import { addToCart } from "@/app/cart/actions";

type WishlistRow = {
  product_id: string;
  products: {
    id: string;
    title: string;
    price_cents: number;
    currency: string;
    image_path: string | null;
  } | null;
};

export default async function WishlistPage() {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/wishlist");
  }

  const { data, error } = await supabase
    .from("wishlist")
    .select("product_id, products(id, title, price_cents, currency, image_path)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="min-h-screen bg-ivory text-foreground">
        <div className="mx-auto w-full max-w-6xl px-6 py-12">
          <div className="rounded-2xl border border-zinc-200/60 bg-white p-6 text-sm text-warm-gray">
            {error.message}
          </div>
        </div>
      </div>
    );
  }

  const rows = (data ?? []) as WishlistRow[];
  const items = rows
    .map((r) => r.products)
    .filter(Boolean) as NonNullable<WishlistRow["products"]>[];

  async function removeItem(formData: FormData) {
    "use server";

    const productId = String(formData.get("product_id") || "").trim();
    if (!productId) return;

    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login?redirect=/wishlist");
    }

    await supabase
      .from("wishlist")
      .delete()
      .eq("user_id", user.id)
      .eq("product_id", productId);

    redirect("/wishlist");
  }

  async function moveToCart(formData: FormData) {
    "use server";

    const productId = String(formData.get("product_id") || "").trim();
    if (!productId) return;

    await addToCart(productId);

    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login?redirect=/wishlist");
    }

    await supabase
      .from("wishlist")
      .delete()
      .eq("user_id", user.id)
      .eq("product_id", productId);

    redirect("/cart");
  }

  return (
    <div className="min-h-screen bg-ivory text-foreground">
      <div className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="flex items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="font-serif text-2xl font-light tracking-tight">Wishlist</h1>
            <p className="text-sm text-warm-gray">
              {items.length} item{items.length !== 1 ? "s" : ""}
            </p>
          </div>
          <a
            href="/products"
            className="h-10 rounded-xl border border-zinc-200/60 bg-white px-4 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 inline-flex items-center"
          >
            Browse
          </a>
        </div>

        {items.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-zinc-200/60 bg-white p-10 text-center text-sm text-warm-gray shadow-sm">
            Your wishlist is empty.
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((p) => {
              const imageUrl = getProductImagePublicUrl(supabase, p.image_path);
              return (
                <div
                  key={p.id}
                  className="overflow-hidden rounded-2xl border border-zinc-200/60 bg-white shadow-sm"
                >
                  <a href={`/product/${p.id}`} className="block">
                    <div className="aspect-[4/5] w-full overflow-hidden bg-cream">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageUrl}
                        alt={p.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="space-y-1.5 p-5">
                      <div className="text-sm font-medium tracking-tight text-zinc-900 line-clamp-1">
                        {p.title}
                      </div>
                      <div className="text-sm text-warm-gray">
                        {formatMoneyFromCents(p.price_cents, p.currency)}
                      </div>
                    </div>
                  </a>

                  <div className="flex items-center gap-2 px-5 pb-5">
                    <form action={moveToCart} className="flex-1">
                      <input type="hidden" name="product_id" value={p.id} />
                      <button className="h-10 w-full rounded-xl bg-zinc-900 px-4 text-sm font-medium text-zinc-50 transition hover:bg-zinc-800">
                        Move to Cart
                      </button>
                    </form>
                    <form action={removeItem}>
                      <input type="hidden" name="product_id" value={p.id} />
                      <button className="h-10 rounded-xl border border-zinc-200/60 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50">
                        Remove
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
