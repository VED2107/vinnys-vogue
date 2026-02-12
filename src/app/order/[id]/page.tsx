export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import { getProductImagePublicUrl } from "@/lib/product-images";
import { getPaymentStatusStyles } from "@/lib/payment-status";
import PayNowButton from "@/components/pay-now-button";
import DownloadInvoiceButton from "@/components/download-invoice-button";

type OrderItemProduct = {
    id: string;
    title: string;
    image_path: string | null;
};

type OrderItemRow = {
    id: string;
    quantity: number;
    price: number;
    products: OrderItemProduct;
};

type OrderRow = {
    id: string;
    user_id: string;
    status: string;
    payment_status: string;
    total_amount: number;
    created_at: string;
    order_items: OrderItemRow[];
};

export default async function OrderConfirmationPage({
    params,
}: {
    params: { id: string };
}) {
    const supabase = createSupabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data, error } = await supabase
        .from("orders")
        .select(
            "id, user_id, status, payment_status, total_amount, created_at, order_items(id, quantity, price, products(id, title, image_path))",
        )
        .eq("id", params.id)
        .maybeSingle();

    if (error) {
        throw new Error(error.message);
    }

    if (!data) {
        redirect("/");
    }

    const order: OrderRow = JSON.parse(JSON.stringify(data));

    if (order.user_id !== user.id) {
        redirect("/");
    }

    const orderDate = new Date(order.created_at).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    return (
        <div className="min-h-screen bg-ivory text-foreground">
            <div className="mx-auto w-full max-w-3xl px-6 py-12">
                {/* Thank you header */}
                <div className="text-center animate-fade-in">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="28"
                            height="28"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-emerald-600"
                        >
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </div>
                    <h1 className="mt-5 font-serif text-3xl font-light tracking-tight">
                        Thank you for your order
                    </h1>
                    <p className="mt-2 text-sm text-warm-gray">
                        Your order has been placed successfully.
                    </p>
                </div>

                {/* Order details */}
                <div className="mt-10 rounded-2xl border border-zinc-200/60 bg-white p-6 shadow-sm animate-fade-in">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200/60 pb-4">
                        <div>
                            <div className="text-xs text-warm-gray">Order ID</div>
                            <div className="mt-0.5 text-sm font-medium text-zinc-900 font-mono">
                                {order.id.slice(0, 8).toUpperCase()}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-warm-gray">Date</div>
                            <div className="mt-0.5 text-sm font-medium text-zinc-900">
                                {orderDate}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-warm-gray">Status</div>
                            <div className="mt-0.5">
                                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 capitalize">
                                    {order.status}
                                </span>
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-warm-gray">Payment</div>
                            <div className="mt-0.5">
                                {(() => {
                                    const ps = getPaymentStatusStyles(order.payment_status); return (
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${ps.bg} ${ps.text}`}>
                                            {order.payment_status}
                                        </span>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>

                    {/* Items */}
                    <div className="mt-4 divide-y divide-zinc-200/60">
                        {order.order_items.map((item) => {
                            const prod = item.products;
                            const lineTotal = item.quantity * item.price;
                            const imageUrl = getProductImagePublicUrl(
                                supabase,
                                prod.image_path,
                            );

                            return (
                                <div key={item.id} className="flex items-center gap-4 py-4">
                                    <div className="h-16 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-cream">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={imageUrl}
                                            alt={prod.title}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                    <div className="flex flex-1 items-center justify-between gap-4">
                                        <div>
                                            <div className="text-sm font-medium text-zinc-900">
                                                {prod.title}
                                            </div>
                                            <div className="mt-0.5 text-xs text-warm-gray">
                                                {formatMoney(item.price)} &times; {item.quantity}
                                            </div>
                                        </div>
                                        <div className="text-sm font-medium text-zinc-900">
                                            {formatMoney(lineTotal)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Order total */}
                    <div className="mt-4 flex items-center justify-between border-t border-zinc-200/60 pt-4">
                        <span className="text-sm font-medium text-zinc-900">Order Total</span>
                        <span className="text-lg font-medium text-zinc-900">
                            {formatMoney(order.total_amount)}
                        </span>
                    </div>
                </div>

                {/* Pay Now (only for unpaid orders) */}
                {order.payment_status === "unpaid" && (
                    <div className="mt-8 text-center animate-fade-in">
                        <PayNowButton orderId={order.id} userEmail={user.email} />
                    </div>
                )}

                {/* Invoice download (available after payment) */}
                {order.payment_status === "paid" ? (
                    <div className="mt-6 text-center animate-fade-in">
                        <DownloadInvoiceButton orderId={order.id} />
                    </div>
                ) : null}

                {/* Continue shopping */}
                <div className="mt-8 text-center animate-fade-in">
                    <a
                        href="/products"
                        className="inline-flex h-11 items-center rounded-2xl border border-zinc-200/60 bg-white px-6 text-sm font-medium text-zinc-900 shadow-sm transition hover:bg-zinc-50"
                    >
                        Continue Shopping
                    </a>
                </div>
            </div>
        </div>
    );
}
