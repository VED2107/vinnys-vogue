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

type OrderRow = {
    id: string;
    created_at: string;
    status: string;
    payment_status: string;
    total_amount: number;
    currency: string;
};

export default async function AccountOrdersPage() {
    const supabase = createSupabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const { data: orders } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

    const rows = (orders ?? []) as OrderRow[];

    const statusBadge = (status: string) => {
        const colors: Record<string, string> = {
            confirmed: "bg-green-100 text-green-800",
            paid: "bg-green-100 text-green-800",
            pending: "bg-yellow-100 text-yellow-800",
            payment_initiated: "bg-blue-100 text-blue-800",
            cancelled: "bg-red-100 text-red-800",
        };
        return colors[status] ?? "bg-gray-100 text-gray-800";
    };

    return (
        <main className="relative mx-auto w-full max-w-[900px] px-6 py-20 overflow-hidden">

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
                    {rows.map((order) => (
                        <a
                            key={order.id}
                            href={`/order/${order.id}`}
                            className="flex flex-col gap-3 rounded-[16px] border border-[rgba(0,0,0,0.06)] p-5 transition-all duration-300 hover:shadow-lg sm:flex-row sm:items-center sm:justify-between"
                        >
                            <div className="flex-1 min-w-0">
                                <div className="text-[13px] text-muted">
                                    {new Date(order.created_at).toLocaleDateString("en-IN", {
                                        timeZone: "Asia/Kolkata",
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric",
                                    })}
                                </div>
                                <div className="mt-1 text-[14px] font-medium text-heading truncate">
                                    Order #{order.id.slice(0, 8)}
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <span
                                    className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusBadge(order.status)}`}
                                >
                                    {order.status.replace(/_/g, " ")}
                                </span>
                                <div className="font-serif text-[16px] font-light text-gold whitespace-nowrap">
                                    {formatMoney(
                                        Number(order.total_amount),
                                        order.currency || "INR",
                                    )}
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            )}

            <GoldDivider className="mt-16 mb-4" />
        </main>
    );
}
