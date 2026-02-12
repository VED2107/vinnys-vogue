import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatMoneyFromCents } from "@/lib/format";
import { getProductImagePublicUrl } from "@/lib/product-images";
import { CartItemControls } from "@/components/cart-item-controls";

type CartProduct = {
    id: string;
    title: string;
    price_cents: number;
    currency: string;
    image_path: string | null;
};

type CartItemRow = {
    id: string;
    quantity: number;
    variant_id: string | null;
    product: CartProduct;
    product_variants: { size: string }[] | { size: string } | null;
};

type CartRow = {
    id: string;
    cart_items: CartItemRow[];
};

export default async function CartPage() {
    const supabase = createSupabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login?redirect=/cart");
    }

    // Single query — no N+1. Joins carts → cart_items → products.
    const { data: cart, error } = await supabase
        .from("carts")
        .select(
            "id, cart_items(id, quantity, variant_id, product:products(id, title, price_cents, currency, image_path), product_variants(size))",
        )
        .eq("user_id", user.id)
        .maybeSingle();

    if (error) {
        return (
            <div className="min-h-screen bg-zinc-50 text-zinc-900">
                <div className="mx-auto w-full max-w-4xl px-6 py-12">
                    <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-700">
                        Something went wrong loading your cart.
                    </div>
                </div>
            </div>
        );
    }

    // Sanitize Supabase result to strip non-serializable methods (e.g. .map)
    // that cause "Functions cannot be passed directly to Client Components" errors.
    const rawItems: CartItemRow[] =
        JSON.parse(JSON.stringify((cart as CartRow | null)?.cart_items ?? []));

    // Normalize product_variants — Supabase may return an array or single object
    const items = rawItems.map((item) => {
        let variantInfo: { size: string } | null = null;
        if (Array.isArray(item.product_variants) && item.product_variants.length > 0) {
            variantInfo = item.product_variants[0];
        } else if (item.product_variants && !Array.isArray(item.product_variants)) {
            variantInfo = item.product_variants;
        }
        return { ...item, product_variants: variantInfo };
    });

    // Compute cart total from price_cents — never stored in DB
    const cartTotal = items.reduce(
        (sum, item) => sum + item.quantity * item.product.price_cents,
        0,
    );

    const currency = items[0]?.product.currency ?? "INR";

    // Empty cart state
    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-zinc-50 text-zinc-900">
                <div className="mx-auto w-full max-w-4xl px-6 py-12">
                    <h1 className="text-2xl font-medium tracking-tight">Your Cart</h1>
                    <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-10 text-center shadow-sm">
                        <p className="text-zinc-500">Your cart is empty.</p>
                        <a
                            href="/products"
                            className="mt-4 inline-block rounded-xl bg-zinc-900 px-6 py-2.5 text-sm font-medium text-zinc-50 transition hover:bg-zinc-800"
                        >
                            Continue Shopping
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-900">
            <div className="mx-auto w-full max-w-4xl px-6 py-12">
                <h1 className="text-2xl font-medium tracking-tight">Your Cart</h1>

                <div className="mt-8 space-y-4">
                    {items.map((item) => {
                        const lineTotal = item.quantity * item.product.price_cents;
                        const imageUrl = getProductImagePublicUrl(
                            supabase,
                            item.product.image_path,
                        );

                        return (
                            <div
                                key={item.id}
                                className="flex items-center gap-5 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
                            >
                                {/* Product image */}
                                <a
                                    href={`/product/${item.product.id}`}
                                    className="h-24 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-zinc-100"
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={imageUrl}
                                        alt={item.product.title}
                                        className="h-full w-full object-cover"
                                    />
                                </a>

                                {/* Details */}
                                <div className="flex flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="space-y-0.5">
                                        <a
                                            href={`/product/${item.product.id}`}
                                            className="text-sm font-medium text-zinc-900 hover:underline"
                                        >
                                            {item.product.title}
                                        </a>
                                        {item.product_variants?.size && (
                                            <div className="text-xs font-medium text-zinc-600">
                                                Size: {item.product_variants.size}
                                            </div>
                                        )}
                                        <div className="text-xs text-zinc-500">
                                            {formatMoneyFromCents(
                                                item.product.price_cents,
                                                item.product.currency,
                                            )}{" "}
                                            each
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <CartItemControls
                                            cartItemId={item.id}
                                            quantity={item.quantity}
                                        />
                                        <div className="min-w-[5rem] text-right text-sm font-medium text-zinc-900">
                                            {formatMoneyFromCents(lineTotal, item.product.currency)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Cart summary + Checkout */}
                <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-zinc-600">Total</span>
                        <span className="text-lg font-medium text-zinc-900">
                            {formatMoneyFromCents(cartTotal, currency)}
                        </span>
                    </div>
                    <div className="mt-5">
                        <a
                            href="/checkout"
                            className="flex h-12 w-full items-center justify-center rounded-2xl bg-gold text-sm font-medium tracking-wide text-zinc-950 transition hover:brightness-95"
                        >
                            Proceed to Checkout
                        </a>
                    </div>
                    <a
                        href="/products"
                        className="mt-3 block text-center text-sm text-warm-gray transition hover:text-zinc-900"
                    >
                        Continue Shopping
                    </a>
                </div>
            </div>
        </div>
    );
}
