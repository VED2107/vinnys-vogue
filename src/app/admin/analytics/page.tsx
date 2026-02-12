import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";

import AnalyticsCharts from "@/components/admin/analytics-charts";

type OrdersByStatusRow = { status: string; count: number };
type RevenuePoint = { date: string; revenue: number };

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

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfTomorrow = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
    );

    const start30 = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 29,
    );

    const startOfTodayISO = startOfToday.toISOString();
    const startOfTomorrowISO = startOfTomorrow.toISOString();
    const start30ISO = start30.toISOString();

    const [{ data: paidOrders }, { data: paidToday }, { count: ordersTodayCount }] =
        await Promise.all([
            supabase
                .from("orders")
                .select("total_amount")
                .eq("payment_status", "paid"),
            supabase
                .from("orders")
                .select("total_amount")
                .eq("payment_status", "paid")
                .gte("created_at", startOfTodayISO)
                .lt("created_at", startOfTomorrowISO),
            supabase
                .from("orders")
                .select("id", { count: "exact", head: true })
                .gte("created_at", startOfTodayISO)
                .lt("created_at", startOfTomorrowISO),
        ]);

    const totalRevenue = (paidOrders ?? []).reduce(
        (sum, o) => sum + Number((o as { total_amount: number }).total_amount || 0),
        0,
    );
    const revenueToday = (paidToday ?? []).reduce(
        (sum, o) => sum + Number((o as { total_amount: number }).total_amount || 0),
        0,
    );
    const ordersToday = ordersTodayCount ?? 0;

    const { data: statusRows, error: statusError } = await supabase
        .from("orders")
        .select("status");

    if (statusError) {
        return (
            <div className="min-h-screen bg-zinc-50 text-zinc-900">
                <div className="mx-auto w-full max-w-6xl px-6 py-12">
                    <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-700">
                        {statusError.message}
                    </div>
                </div>
            </div>
        );
    }

    const statusMap = new Map<string, number>();
    for (const row of statusRows ?? []) {
        const s = String((row as { status: string }).status || "").trim() || "unknown";
        statusMap.set(s, (statusMap.get(s) ?? 0) + 1);
    }

    const ordersByStatus: OrdersByStatusRow[] = Array.from(statusMap.entries())
        .map(([status, count]) => ({ status, count }))
        .sort((a, b) => b.count - a.count);

    const { data: topProductItems, error: topError } = await supabase
        .from("order_items")
        .select("product_id, quantity")
        .not("product_id", "is", null);

    if (topError) {
        return (
            <div className="min-h-screen bg-zinc-50 text-zinc-900">
                <div className="mx-auto w-full max-w-6xl px-6 py-12">
                    <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-700">
                        {topError.message}
                    </div>
                </div>
            </div>
        );
    }

    const soldMap = new Map<string, number>();
    for (const row of topProductItems ?? []) {
        const pid = String((row as { product_id: string | null }).product_id || "");
        const qty = Number((row as { quantity: number }).quantity || 0);
        if (!pid) continue;
        soldMap.set(pid, (soldMap.get(pid) ?? 0) + qty);
    }

    let topProductId: string | null = null;
    let topProductSold = 0;
    for (const [pid, sold] of soldMap.entries()) {
        if (sold > topProductSold) {
            topProductSold = sold;
            topProductId = pid;
        }
    }

    let topProductTitle: string | null = null;
    if (topProductId) {
        const { data: prod } = await supabase
            .from("products")
            .select("title")
            .eq("id", topProductId)
            .maybeSingle();
        topProductTitle = (prod as { title?: string } | null)?.title ?? null;
    }

    const { data: paid30, error: paid30Error } = await supabase
        .from("orders")
        .select("created_at,total_amount")
        .eq("payment_status", "paid")
        .gte("created_at", start30ISO)
        .lt("created_at", startOfTomorrowISO)
        .order("created_at", { ascending: true });

    if (paid30Error) {
        return (
            <div className="min-h-screen bg-zinc-50 text-zinc-900">
                <div className="mx-auto w-full max-w-6xl px-6 py-12">
                    <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-700">
                        {paid30Error.message}
                    </div>
                </div>
            </div>
        );
    }

    const revenueByDay = new Map<string, number>();
    for (const row of paid30 ?? []) {
        const createdAt = String((row as { created_at: string }).created_at);
        const amount = Number((row as { total_amount: number }).total_amount || 0);
        const day = new Date(createdAt);
        const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(
            day.getDate(),
        ).padStart(2, "0")}`;
        revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + amount);
    }

    const revenueLast30Days: RevenuePoint[] = [];
    for (let i = 0; i < 30; i++) {
        const d = new Date(start30);
        d.setDate(start30.getDate() + i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
            d.getDate(),
        ).padStart(2, "0")}`;
        revenueLast30Days.push({ date: key, revenue: revenueByDay.get(key) ?? 0 });
    }

    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-900">
            <div className="mx-auto w-full max-w-6xl px-6 py-12">
                {/* Header */}
                <div className="flex items-end justify-between gap-6">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-medium tracking-tight">Analytics</h1>
                        <p className="text-sm text-zinc-600">
                            Revenue, order stats, and product insights.
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
                        <div className="text-xs font-medium text-zinc-500">Total Revenue</div>
                        <div className="mt-2 text-3xl font-semibold text-zinc-900">
                            {formatMoney(totalRevenue)}
                        </div>
                    </div>
                    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                        <div className="text-xs font-medium text-zinc-500">Revenue Today</div>
                        <div className="mt-2 text-3xl font-semibold text-zinc-900">
                            {formatMoney(revenueToday)}
                        </div>
                    </div>
                    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                        <div className="text-xs font-medium text-zinc-500">Orders Today</div>
                        <div className="mt-2 text-3xl font-semibold text-zinc-900">
                            {ordersToday}
                        </div>
                    </div>
                    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                        <div className="text-xs font-medium text-zinc-500">Top Product</div>
                        <div className="mt-2 text-lg font-semibold text-zinc-900 line-clamp-2">
                            {topProductTitle ?? "—"}
                        </div>
                        <div className="mt-1 text-xs text-zinc-500">
                            {topProductTitle ? `${topProductSold} sold` : ""}
                        </div>
                    </div>
                </div>

                {/* Charts */}
                <AnalyticsCharts
                    revenueLast30Days={revenueLast30Days}
                    ordersByStatus={ordersByStatus}
                />
            </div>
        </div>
    );
}
