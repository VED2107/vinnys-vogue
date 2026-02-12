import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";

// Supabase JS returns Postgres bigint/numeric as string — use string | number
type OrderStatsRaw = {
    total_orders: string | number;
    total_revenue: string | number;
    avg_order_value: string | number;
    pending_count: string | number;
    confirmed_count: string | number;
    shipped_count: string | number;
    delivered_count: string | number;
    cancelled_count: string | number;
    paid_count: string | number;
    unpaid_count: string | number;
    failed_count: string | number;
    refunded_count: string | number;
};

type StatKey =
    | "pending_count"
    | "confirmed_count"
    | "shipped_count"
    | "delivered_count"
    | "cancelled_count"
    | "paid_count"
    | "unpaid_count"
    | "failed_count"
    | "refunded_count";

const STATUS_ITEMS: { key: StatKey; label: string; color: string }[] = [
    { key: "pending_count", label: "Pending", color: "bg-amber-500" },
    { key: "confirmed_count", label: "Confirmed", color: "bg-blue-500" },
    { key: "shipped_count", label: "Shipped", color: "bg-violet-500" },
    { key: "delivered_count", label: "Delivered", color: "bg-emerald-500" },
    { key: "cancelled_count", label: "Cancelled", color: "bg-red-500" },
];

const PAYMENT_ITEMS: { key: StatKey; label: string; color: string }[] = [
    { key: "paid_count", label: "Paid", color: "bg-emerald-500" },
    { key: "unpaid_count", label: "Unpaid", color: "bg-amber-500" },
    { key: "failed_count", label: "Failed", color: "bg-red-500" },
    { key: "refunded_count", label: "Refunded", color: "bg-violet-500" },
];

export default async function AdminAnalyticsPage() {
    const supabase = createSupabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login?redirect=/admin/analytics");
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

    if (!profile || profile.role !== "admin") {
        redirect("/");
    }

    const { data, error } = await supabase
        .from("admin_order_stats")
        .select("*")
        .single();

    if (error) {
        return (
            <div className="min-h-screen bg-zinc-50 text-zinc-900">
                <div className="mx-auto w-full max-w-6xl px-6 py-12">
                    <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-700">
                        {error.message}
                    </div>
                </div>
            </div>
        );
    }

    const raw = data as OrderStatsRaw;

    // Safely coerce all bigint/numeric values to number
    const n = (v: string | number) => Number(v) || 0;

    const maxStatusCount = Math.max(
        ...STATUS_ITEMS.map((s) => n(raw[s.key])),
        1,
    );

    const maxPaymentCount = Math.max(
        ...PAYMENT_ITEMS.map((s) => n(raw[s.key])),
        1,
    );

    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-900">
            <div className="mx-auto w-full max-w-6xl px-6 py-12">
                {/* Header */}
                <div className="flex items-end justify-between gap-6">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-medium tracking-tight">Analytics</h1>
                        <p className="text-sm text-zinc-600">
                            Order stats and revenue overview.
                        </p>
                    </div>
                    <a
                        href="/admin"
                        className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 inline-flex items-center"
                    >
                        Back
                    </a>
                </div>

                {/* KPI Cards */}
                <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                        <div className="text-xs font-medium text-zinc-500">Total Orders</div>
                        <div className="mt-2 text-3xl font-semibold text-zinc-900">
                            {n(raw.total_orders)}
                        </div>
                    </div>
                    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                        <div className="text-xs font-medium text-zinc-500">Total Revenue</div>
                        <div className="mt-2 text-3xl font-semibold text-zinc-900">
                            {formatMoney(n(raw.total_revenue))}
                        </div>
                        <div className="mt-1 text-xs text-zinc-400">Only paid orders</div>
                    </div>
                    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                        <div className="text-xs font-medium text-zinc-500">Avg Order Value</div>
                        <div className="mt-2 text-3xl font-semibold text-zinc-900">
                            {formatMoney(n(raw.avg_order_value))}
                        </div>
                        <div className="mt-1 text-xs text-zinc-400">Only paid orders</div>
                    </div>
                    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                        <div className="text-xs font-medium text-zinc-500">Paid Orders</div>
                        <div className="mt-2 text-3xl font-semibold text-emerald-600">
                            {n(raw.paid_count)}
                        </div>
                    </div>
                </div>

                {/* Charts */}
                <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Order Status Breakdown */}
                    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                        <div className="text-sm font-medium text-zinc-900 mb-6">
                            Order Status Breakdown
                        </div>
                        <div className="space-y-4">
                            {STATUS_ITEMS.map((s) => {
                                const count = n(raw[s.key]);
                                const pct = (count / maxStatusCount) * 100;
                                return (
                                    <div key={s.key}>
                                        <div className="flex items-center justify-between text-sm mb-1.5">
                                            <span className="text-zinc-700">{s.label}</span>
                                            <span className="font-medium text-zinc-900">{count}</span>
                                        </div>
                                        <div className="h-3 w-full rounded-full bg-zinc-100 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${s.color} transition-all duration-700 ease-out`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Payment Status Breakdown */}
                    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                        <div className="text-sm font-medium text-zinc-900 mb-6">
                            Payment Status Breakdown
                        </div>
                        <div className="space-y-4">
                            {PAYMENT_ITEMS.map((s) => {
                                const count = n(raw[s.key]);
                                const pct = (count / maxPaymentCount) * 100;
                                return (
                                    <div key={s.key}>
                                        <div className="flex items-center justify-between text-sm mb-1.5">
                                            <span className="text-zinc-700">{s.label}</span>
                                            <span className="font-medium text-zinc-900">{count}</span>
                                        </div>
                                        <div className="h-3 w-full rounded-full bg-zinc-100 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${s.color} transition-all duration-700 ease-out`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
