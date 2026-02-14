import { redirect, notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import { SectionTitle } from "@/components/ui";
import PayNowButton from "@/components/pay-now-button";
import DownloadInvoiceButton from "@/components/download-invoice-button";
import { FadeIn } from "@/components/fade-in";

export const dynamic = "force-dynamic";

type OrderRow = {
    id: string;
    created_at: string;
    total_amount: number;
    status: string;
    payment_status: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    address_line1: string | null;
    razorpay_order_id: string | null;
};

type OrderItemRow = {
    id: string;
    quantity: number;
    unit_price: number;
    products: { title: string } | null;
};

export default async function OrderPage({
    params,
}: {
    params: { id: string };
}) {
    const supabase = createSupabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect(`/login?redirect=/order/${params.id}`);
    }

    const { data: order, error: orderError } = await supabase
        .from("orders")
        .select(
            "id,created_at,total_amount,status,payment_status,full_name,email,phone,address_line1,razorpay_order_id",
        )
        .eq("id", params.id)
        .eq("user_id", user.id)
        .maybeSingle();

    if (orderError) {
        console.error("[OrderPage] Supabase query error:", orderError);
        throw new Error("Failed to load order. Please try again.");
    }

    if (!order) notFound();

    const o = order as OrderRow;

    const { data: orderItems } = await supabase
        .from("order_items")
        .select("id,quantity,unit_price,products(title)")
        .eq("order_id", o.id);

    const items = (orderItems ?? []) as unknown as OrderItemRow[];

    const isPaid = o.payment_status === "paid";

    return (
        <div className="min-h-screen bg-bg-primary">
            <div className="mx-auto w-full max-w-3xl px-6 py-16">
                <FadeIn>
                    <div className="flex flex-col items-center text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/10">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C6A756" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>
                        <div className="mt-6">
                            <SectionTitle
                                subtitle={`#${o.id.slice(0, 8).toUpperCase()}`}
                                title="Order Placed"
                            />
                        </div>
                    </div>

                    <div className="mt-14 rounded-[20px] border border-[rgba(0,0,0,0.06)] bg-bg-card p-8">
                        <div className="space-y-4 text-[15px]">
                            <div className="flex justify-between">
                                <span className="text-muted">Name</span>
                                <span className="text-heading">{o.full_name ?? "—"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted">Phone</span>
                                <span className="text-heading">{o.phone ?? "—"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted">Status</span>
                                <span className="font-medium capitalize text-heading">{o.status}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted">Payment</span>
                                <span className={`font-medium capitalize ${isPaid ? "text-heading" : "text-gold"}`}>
                                    {o.payment_status}
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 gold-divider-gradient" />

                        <div className="mt-6 space-y-3">
                            {items.map((item) => (
                                <div key={item.id} className="flex items-center justify-between text-[15px]">
                                    <div className="text-heading">
                                        {(item.products as { title: string } | null)?.title ?? "Product"} × {item.quantity}
                                    </div>
                                    <div className="font-serif font-light text-gold">{formatMoney(Number(item.unit_price) * item.quantity)}</div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 gold-divider-gradient" />

                        <div className="mt-5 flex items-center justify-between">
                            <div className="text-[15px] text-muted">Total</div>
                            <div className="font-serif text-xl font-light text-gold">{formatMoney(Number(o.total_amount))}</div>
                        </div>
                    </div>

                    <div className="mt-8 flex flex-wrap gap-3 justify-center">
                        {o.payment_status === "unpaid" ? (
                            <PayNowButton orderId={o.id} userEmail={o.email ?? undefined} />
                        ) : null}
                        {isPaid ? <DownloadInvoiceButton orderId={o.id} /> : null}
                        <a
                            href="/products"
                            className="inline-flex h-12 items-center rounded-full border border-[rgba(0,0,0,0.1)] px-8 text-[14px] text-heading transition-all duration-400 hover:border-[rgba(0,0,0,0.2)]"
                        >
                            Continue Shopping
                        </a>
                    </div>
                </FadeIn>
            </div>
        </div>
    );
}
