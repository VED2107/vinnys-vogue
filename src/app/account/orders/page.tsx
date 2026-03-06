import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";

import { GoldDivider } from "@/components/section-divider";
import DownloadInvoiceButton from "@/components/download-invoice-button";
import CancelOrderButton from "@/components/cancel-order-button";
import PayNowButton from "@/components/pay-now-button";
import { MandalaBackground } from "@/components/decorative";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "My Orders",
    description: "View your order history at Vinnys Vogue.",
};

type OrderItemRow = {
    image_url: string | null;
    product_name: string | null;
    quantity: number;
    price: number;
};

type OrderRow = {
    id: string;
    created_at: string;
    status: string;
    payment_status: string;
    total_amount: number;
    currency: string;
    email: string | null;
    order_items: OrderItemRow[];
};

export default async function AccountOrdersPage() {
    const supabase = createSupabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const { data: orders } = await supabase
        .from("orders")
        .select("*, order_items(image_url, product_name, quantity, price)")
        .order("created_at", { ascending: false });

    const rows = (orders ?? []) as unknown as OrderRow[];

    const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
        confirmed: { label: "Confirmed", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: "✓" },
        delivered: { label: "Delivered", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: "📦" },
        pending: { label: "Awaiting Payment", color: "bg-amber-50 text-amber-700 border-amber-200", icon: "⏳" },
        payment_initiated: { label: "Payment Started", color: "bg-blue-50 text-blue-700 border-blue-200", icon: "💳" },
        shipped: { label: "Shipped", color: "bg-sky-50 text-sky-700 border-sky-200", icon: "🚚" },
        cancelled: { label: "Cancelled", color: "bg-red-50 text-red-600 border-red-200", icon: "✕" },
    };

    return (
        <main className="relative mx-auto w-full max-w-[900px] px-4 sm:px-6 py-20 overflow-hidden min-h-screen">
            <MandalaBackground variant="lotus" position="center" />

            <div className="relative z-10">
                <h1 className="font-serif text-3xl font-light text-heading tracking-[-0.02em]">
                    My Orders
                </h1>
                <div className="gold-divider-gradient mt-4" />

                {rows.length === 0 ? (
                    <div className="mt-16 text-center">
                        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gold/10 mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C6A756" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <path d="M16 10a4 4 0 01-8 0" />
                            </svg>
                        </div>
                        <p className="text-muted text-[15px]">You haven&apos;t placed any orders yet.</p>
                        <a
                            href="/products"
                            className="mt-6 inline-block rounded-full bg-accent px-8 py-3 text-[14px] font-medium text-white hover-lift hover:bg-accent-hover transition-all duration-300"
                        >
                            Start Shopping
                        </a>
                    </div>
                ) : (
                    <div className="mt-10 space-y-5">
                        {rows.map((order) => {
                            const firstItem = order.order_items?.[0];
                            const extraCount = (order.order_items?.length ?? 1) - 1;
                            const cfg = statusConfig[order.status] ?? { label: order.status, color: "bg-gray-100 text-gray-800 border-gray-200", icon: "•" };
                            const isCancellable = ["pending", "confirmed", "payment_initiated"].includes(order.status);
                            const isPaid = order.payment_status === "paid";
                            const needsPayment = order.payment_status === "unpaid" && order.status === "pending";

                            return (
                                <div
                                    key={order.id}
                                    className="group rounded-[20px] border border-[rgba(0,0,0,0.06)] bg-bg-card overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-gold/20"
                                >
                                    {/* Main order card — clickable */}
                                    <a
                                        href={`/order/${order.id}`}
                                        className="flex flex-row gap-4 sm:gap-5 p-4 sm:p-5 items-start"
                                    >
                                        {/* Product image */}
                                        {firstItem?.image_url ? (
                                            <div className="flex-shrink-0 w-[72px] h-[88px] sm:w-24 sm:h-28 rounded-2xl overflow-hidden bg-[#EDE8E0] shadow-sm">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={firstItem.image_url}
                                                    alt={firstItem.product_name ?? "Order item"}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex-shrink-0 w-[72px] h-[88px] sm:w-24 sm:h-28 rounded-2xl bg-[#EDE8E0] flex items-center justify-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C6A756" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
                                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                                    <circle cx="8.5" cy="8.5" r="1.5" />
                                                    <polyline points="21 15 16 10 5 21" />
                                                </svg>
                                            </div>
                                        )}

                                        {/* Order details */}
                                        <div className="flex-1 min-w-0 py-0.5">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="text-[13px] sm:text-[14px] font-medium text-heading truncate">
                                                    {firstItem?.product_name ?? "Order item"}
                                                </div>
                                                <div className="font-serif text-[15px] sm:text-[16px] font-light text-gold whitespace-nowrap flex-shrink-0">
                                                    {formatMoney(Number(order.total_amount), order.currency || "INR")}
                                                </div>
                                            </div>

                                            {firstItem && (
                                                <div className="mt-1 text-[12px] sm:text-[13px] text-muted">
                                                    Qty: {firstItem.quantity} · {formatMoney(Number(firstItem.price), order.currency || "INR")}
                                                </div>
                                            )}

                                            {extraCount > 0 && (
                                                <div className="mt-0.5 text-[11px] text-muted">
                                                    +{extraCount} more item{extraCount > 1 ? "s" : ""}
                                                </div>
                                            )}

                                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                                <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-[3px] text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide ${cfg.color}`}>
                                                    <span className="text-[10px]">{cfg.icon}</span>
                                                    {cfg.label}
                                                </span>
                                                <span className="text-[11px] sm:text-[12px] text-muted">
                                                    #{order.id.slice(0, 8)} · {new Date(order.created_at).toLocaleDateString("en-IN", {
                                                        timeZone: "Asia/Kolkata",
                                                        day: "numeric",
                                                        month: "short",
                                                        year: "numeric",
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    </a>

                                    {/* Action buttons row — only show if there are actions */}
                                    {(needsPayment || isPaid || isCancellable) && (
                                        <div className="border-t border-[rgba(0,0,0,0.05)] px-4 sm:px-5 py-3 flex flex-wrap items-center gap-2">
                                            {/* Pay Now for unpaid orders */}
                                            {needsPayment && (
                                                <div>
                                                    <PayNowButton orderId={order.id} userEmail={order.email ?? undefined} />
                                                </div>
                                            )}

                                            {/* Download Invoice for paid orders */}
                                            {isPaid && (
                                                <div>
                                                    <DownloadInvoiceButton orderId={order.id} />
                                                </div>
                                            )}

                                            {/* Cancel Order for cancellable orders */}
                                            {isCancellable && order.status !== "cancelled" && (
                                                <div className="ml-auto">
                                                    <CancelOrderButton orderId={order.id} />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                <GoldDivider className="mt-16 mb-4" />
            </div>
        </main>
    );
}
