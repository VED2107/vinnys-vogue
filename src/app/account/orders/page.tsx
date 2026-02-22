import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";

import { GoldDivider } from "@/components/section-divider";

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

    const statusBadge = (status: string) => {
        const colors: Record<string, string> = {
            confirmed: "bg-green-100 text-green-800",
            paid: "bg-green-100 text-green-800",
            delivered: "bg-green-100 text-green-800",
            pending: "bg-yellow-100 text-yellow-800",
            payment_initiated: "bg-blue-100 text-blue-800",
            shipped: "bg-blue-100 text-blue-800",
            cancelled: "bg-red-100 text-red-800",
        };
        return colors[status] ?? "bg-gray-100 text-gray-800";
    };

    return (
        <main className="relative mx-auto w-full max-w-[900px] px-4 sm:px-6 py-20 overflow-hidden">

            <h1 className="font-serif text-3xl font-light text-heading tracking-[-0.02em]">
                My Orders
            </h1>
            <div className="gold-divider-gradient mt-4" />

            {rows.length === 0 ? (
                <div className="mt-12 text-center">
                    <p className="text-muted text-[15px]">You haven&apos;t placed any orders yet.</p>
                    <a
                        href="/products"
                        className="mt-6 inline-block rounded-full bg-accent px-6 py-3 text-[14px] font-medium text-white hover-lift hover:bg-accent-hover"
                    >
                        Start shopping
                    </a>
                </div>
            ) : (
                <div className="mt-10 space-y-4">
                    {rows.map((order) => {
                        const firstItem = order.order_items?.[0];
                        const extraCount = (order.order_items?.length ?? 1) - 1;

                        return (
                            <a
                                key={order.id}
                                href={`/order/${order.id}`}
                                className="flex flex-row gap-3 sm:gap-5 rounded-[16px] border border-[rgba(0,0,0,0.06)] bg-bg-card p-3 sm:p-5 transition-all duration-300 hover:shadow-lg items-start"
                            >
                                {/* Product image — LEFT */}
                                {firstItem?.image_url ? (
                                    <div className="flex-shrink-0 w-20 h-24 sm:w-24 sm:h-28 rounded-xl overflow-hidden bg-[#EDE8E0]">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={firstItem.image_url}
                                            alt={firstItem.product_name ?? "Order item"}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex-shrink-0 w-20 h-24 sm:w-24 sm:h-28 rounded-xl bg-[#EDE8E0] flex items-center justify-center">
                                        <span className="text-[10px] text-neutral-400">No image</span>
                                    </div>
                                )}

                                {/* Order details — RIGHT */}
                                <div className="flex-1 min-w-0 py-0.5">
                                    <div className="text-[13px] sm:text-[14px] font-medium text-heading truncate">
                                        {firstItem?.product_name ?? "Order item"}
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

                                    <div className="mt-1.5 text-[11px] sm:text-[12px] text-muted">
                                        Order #{order.id.slice(0, 8)} · {new Date(order.created_at).toLocaleDateString("en-IN", {
                                            timeZone: "Asia/Kolkata",
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                        })}
                                    </div>

                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                        <span
                                            className={`rounded-full px-2.5 py-0.5 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide ${statusBadge(order.status)}`}
                                        >
                                            {order.status.replace(/_/g, " ")}
                                        </span>
                                        <div className="font-serif text-[14px] sm:text-[15px] font-light text-gold whitespace-nowrap">
                                            {formatMoney(
                                                Number(order.total_amount),
                                                order.currency || "INR",
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </a>
                        );
                    })}
                </div>
            )}

            <GoldDivider className="mt-16 mb-4" />
        </main>
    );
}
