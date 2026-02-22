import Image from "next/image";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import { getProductImagePublicUrl } from "@/lib/product-images";
import CheckoutForm from "@/components/checkout-form";
import { FadeIn } from "@/components/fade-in";
import { MandalaBackground } from "@/components/decorative";
import { GoldDivider } from "@/components/section-divider";

export default async function CheckoutPage() {
    const supabase = createSupabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login?redirect=/checkout");

    const { data: cart } = await supabase
        .from("carts")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

    if (!cart) redirect("/cart");

    const { data } = await supabase
        .from("cart_items")
        .select("id,quantity,product_id,variant_id,products(title,price,currency,image_path),product_variants(size)")
        .eq("cart_id", cart.id);

    // Safely filter: keep only items where the joined product still exists
    const validItems = (data ?? []).filter(
        (row): row is typeof row & { products: { title: string; price: number; currency: string; image_path: string | null } } =>
            row.products != null,
    );

    if (validItems.length === 0) redirect("/cart");

    // Fetch user profile for address pre-fill
    const { data: profileRow } = await supabase
        .from("profiles")
        .select("full_name,phone,address_line1,address_line2,city,state,postal_code,country")
        .eq("id", user.id)
        .maybeSingle();

    const profile = profileRow as {
        full_name: string | null;
        phone: string | null;
        address_line1: string | null;
        address_line2: string | null;
        city: string | null;
        state: string | null;
        postal_code: string | null;
        country: string | null;
    } | null;

    const totalCents = validItems.reduce(
        (sum, item) => sum + (item.products as { price: number }).price * item.quantity,
        0,
    );
    const currency = (validItems[0].products as { currency: string }).currency ?? "INR";

    return (
        <div className="relative min-h-screen overflow-hidden bg-bg-primary">
            <MandalaBackground variant="lotus" position="top-right" />
            <div className="relative z-10 w-full px-6 lg:px-16 xl:px-24 py-16">
                <FadeIn>
                    <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-16">
                        {/* Order Summary — sticky glass card */}
                        <div>
                            <div className="sticky top-24 rounded-3xl bg-white/70 backdrop-blur-md p-8 shadow-xl h-fit">
                                <h2 className="font-serif text-2xl font-light text-heading mb-6">Your Selection</h2>
                                <div className="space-y-4">
                                    {validItems.map((item) => (
                                        <div key={item.id} className="flex gap-4">
                                            <div className="relative h-16 w-14 flex-shrink-0 overflow-hidden rounded-[10px] bg-[#EDE8E0]">
                                                <Image
                                                    src={getProductImagePublicUrl(supabase, (item.products as { image_path: string | null }).image_path)}
                                                    alt={(item.products as { title: string }).title}
                                                    fill
                                                    sizes="56px"
                                                    className="object-cover"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-[14px] font-medium text-heading line-clamp-1">{(item.products as { title: string }).title}</div>
                                                {item.product_variants ? (
                                                    <div className="text-[13px] text-muted">Size: {(item.product_variants as unknown as { size: string }).size}</div>
                                                ) : null}
                                                <div className="mt-1 text-[13px] text-muted">Qty: {item.quantity}</div>
                                            </div>
                                            <div className="font-serif text-[14px] font-light text-gold">
                                                {formatMoney((item.products as { price: number }).price * item.quantity, (item.products as { currency: string }).currency)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 gold-divider-gradient" />
                                <div className="mt-4 flex justify-between text-[15px]">
                                    <span className="font-medium text-heading">Total</span>
                                    <span className="font-serif text-lg font-light text-gold">
                                        {formatMoney(totalCents, currency)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Checkout Form */}
                        <div className="space-y-10">
                            <div className="space-y-3">
                                <div className="gold-divider" />
                                <div className="text-[11px] font-medium tracking-[0.25em] text-gold uppercase">Complete</div>
                                <h1 className="mt-3 font-serif text-3xl font-light tracking-[-0.02em] leading-[1.15] text-heading">
                                    Confirm Your Couture
                                </h1>
                            </div>
                            <div className="gold-divider-anim active mb-6" />
                            <CheckoutForm
                                initialProfile={profile ? {
                                    full_name: profile.full_name ?? "",
                                    email: user.email ?? "",
                                    phone: profile.phone ?? "",
                                    address_line1: profile.address_line1 ?? "",
                                    address_line2: profile.address_line2 ?? "",
                                    city: profile.city ?? "",
                                    state: profile.state ?? "",
                                    pincode: profile.postal_code ?? "",
                                } : undefined}
                            />
                        </div>
                    </div>
                </FadeIn>

                <GoldDivider className="mt-16 mb-4" />
            </div>
        </div>
    );
}
