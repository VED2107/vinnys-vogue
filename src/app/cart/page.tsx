import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatMoneyFromCents } from "@/lib/format";
import { revalidatePath } from "next/cache";
import { getProductImagePublicUrl } from "@/lib/product-images";
import { FadeIn } from "@/components/fade-in";
import { PremiumButton } from "@/components/ui";

type CartItem = {
    id: string;
    quantity: number;
    product_id: string;
    variant_id: string | null;
    products: { title: string; price_cents: number; currency: string; image_path: string | null };
    product_variants: { size: string } | null;
};

export default async function CartPage() {
    const supabase = createSupabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login?redirect=/cart");

    const { data: cart } = await supabase
        .from("carts")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

    let items: CartItem[] = [];
    if (cart) {
        const { data } = await supabase
            .from("cart_items")
            .select("id,quantity,product_id,variant_id,products(title,price_cents,currency,image_path),product_variants(size)")
            .eq("cart_id", cart.id);

        items = (data ?? []) as unknown as CartItem[];
    }

    async function removeItem(formData: FormData) {
        "use server";
        const itemId = String(formData.get("itemId") || "");
        if (!itemId) return;
        const sp = createSupabaseServerClient();
        const { data: { user: currentUser } } = await sp.auth.getUser();
        if (!currentUser) return;

        // Verify ownership via cart → cart_items join
        const { data: item } = await sp
            .from("cart_items")
            .select("id, carts!inner(user_id)")
            .eq("id", itemId)
            .maybeSingle();

        if (!item || (item as unknown as { carts: { user_id: string } }).carts.user_id !== currentUser.id) return;

        await sp.from("cart_items").delete().eq("id", itemId);
        revalidatePath("/cart");
    }

    async function updateQuantity(formData: FormData) {
        "use server";
        const itemId = String(formData.get("itemId") || "");
        const direction = String(formData.get("direction") || "");
        if (!itemId) return;
        const sp = createSupabaseServerClient();
        const { data: { user: currentUser } } = await sp.auth.getUser();
        if (!currentUser) return;

        // Fetch current quantity from DB (avoids TOCTOU) and verify ownership
        const { data: row } = await sp
            .from("cart_items")
            .select("id, quantity, carts!inner(user_id)")
            .eq("id", itemId)
            .maybeSingle();

        if (!row || (row as unknown as { carts: { user_id: string } }).carts.user_id !== currentUser.id) return;

        const current = (row as { quantity: number }).quantity;
        const next = direction === "up" ? current + 1 : current - 1;
        if (next <= 0) {
            await sp.from("cart_items").delete().eq("id", itemId);
        } else {
            await sp.from("cart_items").update({ quantity: next }).eq("id", itemId);
        }
        revalidatePath("/cart");
    }

    // Validate currency consistency
    const currencies = new Set(items.map((i) => i.products.currency));
    if (currencies.size > 1) {
        throw new Error("Mixed currencies in cart are not supported.");
    }

    const totalCents = items.reduce(
        (sum, item) => sum + item.products.price_cents * item.quantity,
        0,
    );

    const currency = items[0]?.products.currency ?? "INR";

    return (
        <div className="min-h-screen bg-bg-primary">
            <div className="mx-auto w-full max-w-[1280px] px-6 py-16">
                <FadeIn>
                    <div className="space-y-3">
                        <div className="gold-divider" />
                        <div className="text-[11px] font-medium tracking-[0.25em] text-gold uppercase">Shopping</div>
                        <h1 className="mt-3 font-serif text-[clamp(28px,4vw,42px)] font-light tracking-[-0.02em] leading-[1.15] text-heading">
                            Your Cart
                        </h1>
                    </div>
                </FadeIn>

                {items.length === 0 ? (
                    <FadeIn delay={0.08}>
                        <div className="mt-16 rounded-[20px] border border-[rgba(0,0,0,0.06)] bg-bg-card p-16 text-center">
                            <div className="font-serif text-xl font-light text-heading">Your cart is empty</div>
                            <p className="mt-3 text-[15px] text-muted">Explore our collection to find something special.</p>
                            <div className="mt-8">
                                <PremiumButton href="/products">Explore Collection</PremiumButton>
                            </div>
                        </div>
                    </FadeIn>
                ) : (
                    <FadeIn delay={0.08}>
                        <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-3">
                            <div className="lg:col-span-2 space-y-4">
                                {items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex gap-8 items-center rounded-[20px] border border-[rgba(0,0,0,0.06)] bg-bg-card p-5"
                                    >
                                        <div className="w-40 flex-shrink-0 overflow-hidden rounded-2xl bg-[#EDE8E0]">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={getProductImagePublicUrl(supabase, item.products.image_path)}
                                                alt={item.products.title}
                                                className="img-matte h-full w-full object-cover aspect-[3/4]"
                                            />
                                        </div>
                                        <div className="flex flex-1 justify-between">
                                            <div className="space-y-2">
                                                <div className="text-[14px] font-medium text-heading">{item.products.title}</div>
                                                {item.product_variants ? (
                                                    <div className="text-[13px] text-muted">Size: {item.product_variants.size}</div>
                                                ) : null}
                                                <div className="font-serif text-[15px] font-light text-gold">
                                                    {formatMoneyFromCents(item.products.price_cents, item.products.currency)}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end justify-between">
                                                <form action={removeItem}>
                                                    <input type="hidden" name="itemId" value={item.id} />
                                                    <button className="text-[13px] text-muted transition hover:text-heading">Remove</button>
                                                </form>
                                                <div className="inline-flex items-center gap-3 rounded-full border border-[rgba(0,0,0,0.08)] bg-white px-4 py-2 shadow-sm">
                                                    <form action={updateQuantity}>
                                                        <input type="hidden" name="itemId" value={item.id} />
                                                        <input type="hidden" name="direction" value="down" />
                                                        <input type="hidden" name="current" value={String(item.quantity)} />
                                                        <button className="flex h-7 w-7 items-center justify-center rounded-full text-[14px] text-heading transition hover:bg-[rgba(0,0,0,0.04)]">
                                                            −
                                                        </button>
                                                    </form>
                                                    <span className="w-6 text-center text-[14px] font-medium text-heading">{item.quantity}</span>
                                                    <form action={updateQuantity}>
                                                        <input type="hidden" name="itemId" value={item.id} />
                                                        <input type="hidden" name="direction" value="up" />
                                                        <input type="hidden" name="current" value={String(item.quantity)} />
                                                        <button className="flex h-7 w-7 items-center justify-center rounded-full text-[14px] text-heading transition hover:bg-[rgba(0,0,0,0.04)]">
                                                            +
                                                        </button>
                                                    </form>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="lg:col-span-1">
                                <div className="sticky top-24 rounded-3xl bg-white/70 backdrop-blur-md p-8 shadow-xl space-y-6">
                                    <h2 className="font-serif text-xl font-light text-heading">Order Summary</h2>
                                    <div className="gold-divider-gradient" />
                                    <div className="flex justify-between text-[15px]">
                                        <span className="text-muted">Subtotal ({items.length} items)</span>
                                        <span className="font-serif font-light text-heading">{formatMoneyFromCents(totalCents, currency)}</span>
                                    </div>
                                    <PremiumButton href="/checkout" className="w-full">
                                        Proceed to Checkout
                                    </PremiumButton>
                                </div>
                            </div>
                        </div>
                    </FadeIn>
                )}
            </div>
        </div>
    );
}
