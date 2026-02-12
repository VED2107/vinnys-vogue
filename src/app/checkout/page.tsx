import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatMoneyFromCents } from "@/lib/format";
import { getProductImagePublicUrl } from "@/lib/product-images";
import CheckoutForm from "@/components/checkout-form";

type CartItemRow = {
    id: string;
    quantity: number;
    product: {
        id: string;
        title: string;
        price_cents: number;
        currency: string;
        image_path: string | null;
    };
};

export default async function CheckoutPage() {
    const supabase = createSupabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login?redirect=/checkout");
    }

    // Fetch cart with items
    const { data: cart } = await supabase
        .from("carts")
        .select(
            "id, cart_items(id, quantity, products(id, title, price_cents, currency, image_path))",
        )
        .eq("user_id", user.id)
        .maybeSingle();

    type RawCartItem = {
        id: string;
        quantity: number;
        products: {
            id: string;
            title: string;
            price_cents: number;
            currency: string;
            image_path: string | null;
        };
    };

    const rawItems = ((cart as unknown as { cart_items: RawCartItem[] })?.cart_items ?? []) as RawCartItem[];

    const items: CartItemRow[] = rawItems.map((r) => ({
        id: r.id,
        quantity: r.quantity,
        product: r.products,
    }));

    if (items.length === 0) {
        redirect("/cart");
    }

    const cartTotal = items.reduce(
        (sum, item) => sum + item.quantity * item.product.price_cents,
        0,
    );

    return (
        <div className="min-h-screen bg-ivory text-foreground">
            <div className="mx-auto w-full max-w-5xl px-6 py-12">
                <h1 className="font-serif text-3xl font-light tracking-tight">
                    Checkout
                </h1>
                <p className="mt-2 text-sm text-warm-gray">
                    Enter your shipping details to place your order.
                </p>

                <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-5">
                    {/* Left: Form */}
                    <div className="lg:col-span-3">
                        <div className="rounded-2xl border border-zinc-200/60 bg-white p-6 shadow-sm">
                            <div className="mb-5 text-sm font-medium text-zinc-900">
                                Shipping Address
                            </div>
                            <CheckoutForm />
                        </div>
                    </div>

                    {/* Right: Order summary */}
                    <div className="lg:col-span-2">
                        <div className="rounded-2xl border border-zinc-200/60 bg-white p-6 shadow-sm">
                            <div className="text-sm font-medium text-zinc-900">
                                Order Summary
                            </div>
                            <div className="mt-4 divide-y divide-zinc-200/60">
                                {items.map((item) => {
                                    const lineTotal = item.quantity * item.product.price_cents;
                                    const imageUrl = getProductImagePublicUrl(
                                        supabase,
                                        item.product.image_path,
                                    );

                                    return (
                                        <div key={item.id} className="flex items-center gap-3 py-3">
                                            <div className="h-12 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-cream">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={imageUrl}
                                                    alt={item.product.title}
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                            <div className="flex flex-1 items-center justify-between gap-2">
                                                <div>
                                                    <div className="text-sm text-zinc-900 line-clamp-1">
                                                        {item.product.title}
                                                    </div>
                                                    <div className="text-xs text-warm-gray">
                                                        Qty: {item.quantity}
                                                    </div>
                                                </div>
                                                <div className="text-sm font-medium text-zinc-900 whitespace-nowrap">
                                                    {formatMoneyFromCents(lineTotal, item.product.currency)}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="mt-4 flex items-center justify-between border-t border-zinc-200/60 pt-4">
                                <span className="text-sm font-medium text-zinc-900">Total</span>
                                <span className="text-lg font-medium text-zinc-900">
                                    {formatMoneyFromCents(cartTotal, "INR")}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
