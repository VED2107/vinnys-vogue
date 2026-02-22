import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import dynamic from "next/dynamic";
import { FadeIn, StaggerGrid, StaggerItem } from "@/components/fade-in";

const AnalyticsCharts = dynamic(
    () => import("@/components/admin/analytics-charts"),
    { ssr: false, loading: () => <div className="mt-14 h-80 animate-pulse rounded-[20px] bg-[rgba(0,0,0,0.03)]" /> }
);
import Link from "next/link";

type OrdersByStatusRow = { status: string; count: number };
type RevenuePoint = { date: string; revenue: number };

export default async function AdminAnalyticsPage() {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login?redirect=/admin/analytics");
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (!profile || profile.role !== "admin") redirect("/");

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const start30 = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);

    const [result1, result2, result3] = await Promise.all([
        supabase.from("orders").select("total_amount").eq("payment_status", "paid"),
        supabase.from("orders").select("total_amount").eq("payment_status", "paid").gte("created_at", startOfToday.toISOString()).lt("created_at", startOfTomorrow.toISOString()),
        supabase.from("orders").select("id", { count: "exact", head: true }).gte("created_at", startOfToday.toISOString()).lt("created_at", startOfTomorrow.toISOString()),
    ]);

    if (result1.error) { console.error("[Analytics] paidOrders error:", result1.error); throw new Error("Failed to load analytics data."); }
    if (result2.error) { console.error("[Analytics] paidToday error:", result2.error); throw new Error("Failed to load analytics data."); }
    if (result3.error) { console.error("[Analytics] ordersTodayCount error:", result3.error); throw new Error("Failed to load analytics data."); }

    const paidOrders = result1.data;
    const paidToday = result2.data;
    const ordersTodayCount = result3.count;

    const totalRevenue = (paidOrders ?? []).reduce((sum, o) => sum + Number((o as { total_amount: number }).total_amount || 0), 0);
    const revenueToday = (paidToday ?? []).reduce((sum, o) => sum + Number((o as { total_amount: number }).total_amount || 0), 0);
    const ordersToday = ordersTodayCount ?? 0;

    const { data: statusRows, error: statusError } = await supabase.from("orders").select("status");
    if (statusError) return <div className="min-h-screen bg-bg-admin"><div className="w-full max-w-[1400px] mx-auto px-6 lg:px-16 xl:px-24 py-16"><div className="rounded-[20px] border border-[rgba(0,0,0,0.06)] bg-white p-6 text-[15px] text-muted">{statusError.message}</div></div></div>;

    const statusMap = new Map<string, number>();
    for (const row of statusRows ?? []) { const s = String((row as { status: string }).status || "").trim() || "unknown"; statusMap.set(s, (statusMap.get(s) ?? 0) + 1); }
    const ordersByStatus: OrdersByStatusRow[] = Array.from(statusMap.entries()).map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count);

    const { data: topProductItems, error: topError } = await supabase.from("order_items").select("product_id, quantity").not("product_id", "is", null);
    if (topError) return <div className="min-h-screen bg-bg-admin"><div className="w-full max-w-[1400px] mx-auto px-6 lg:px-16 xl:px-24 py-16"><div className="rounded-[20px] border border-[rgba(0,0,0,0.06)] bg-white p-6 text-[15px] text-muted">{topError.message}</div></div></div>;

    const soldMap = new Map<string, number>();
    for (const row of topProductItems ?? []) { const pid = String((row as { product_id: string | null }).product_id || ""); const qty = Number((row as { quantity: number }).quantity || 0); if (pid) soldMap.set(pid, (soldMap.get(pid) ?? 0) + qty); }

    let topProductId: string | null = null; let topProductSold = 0;
    for (const [pid, sold] of soldMap.entries()) { if (sold > topProductSold) { topProductSold = sold; topProductId = pid; } }

    let topProductTitle: string | null = null;
    if (topProductId) { const { data: prod } = await supabase.from("products").select("title").eq("id", topProductId).maybeSingle(); topProductTitle = (prod as { title?: string } | null)?.title ?? null; }

    const { data: paid30, error: paid30Error } = await supabase.from("orders").select("created_at,total_amount").eq("payment_status", "paid").gte("created_at", start30.toISOString()).lt("created_at", startOfTomorrow.toISOString()).order("created_at", { ascending: true });
    if (paid30Error) return <div className="min-h-screen bg-bg-admin"><div className="w-full max-w-[1400px] mx-auto px-6 lg:px-16 xl:px-24 py-16"><div className="rounded-[20px] border border-[rgba(0,0,0,0.06)] bg-white p-6 text-[15px] text-muted">{paid30Error.message}</div></div></div>;

    const revenueByDay = new Map<string, number>();
    for (const row of paid30 ?? []) { const d = new Date(String((row as { created_at: string }).created_at)); const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + Number((row as { total_amount: number }).total_amount || 0)); }
    const revenueLast30Days: RevenuePoint[] = [];
    for (let i = 0; i < 30; i++) { const d = new Date(start30); d.setDate(start30.getDate() + i); const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; revenueLast30Days.push({ date: key, revenue: revenueByDay.get(key) ?? 0 }); }

    const kpis = [
        { label: "Total Revenue", value: formatMoney(totalRevenue), highlight: true },
        { label: "Revenue Today", value: formatMoney(revenueToday), highlight: true },
        { label: "Orders Today", value: String(ordersToday), highlight: false },
        { label: "Top Product", value: topProductTitle ?? "—", subtext: topProductTitle ? `${topProductSold} sold` : "", highlight: false },
    ];

    return (
        <div className="min-h-screen bg-bg-admin">
            <div className="w-full max-w-[1400px] mx-auto px-6 lg:px-16 xl:px-24 py-16">
                <FadeIn>
                    <div className="flex items-end justify-between gap-6">
                        <div className="space-y-3">
                            <div className="gold-divider" />
                            <div className="text-[11px] font-medium tracking-[0.25em] text-gold uppercase">Insights</div>
                            <h1 className="font-serif text-[clamp(28px,4vw,42px)] font-light tracking-[-0.02em] leading-[1.15] text-heading">Analytics</h1>
                            <p className="text-[15px] text-muted">Revenue, order stats, and product insights.</p>
                        </div>
                        <Link href="/admin" className="h-10 rounded-full border border-[rgba(0,0,0,0.1)] px-5 text-[14px] text-heading transition hover:border-[rgba(0,0,0,0.2)] inline-flex items-center">Back</Link>
                    </div>
                </FadeIn>

                <StaggerGrid className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" stagger={0.08}>
                    {kpis.map((kpi) => (
                        <StaggerItem key={kpi.label}>
                            <div className="rounded-[20px] border border-[rgba(0,0,0,0.06)] border-t-gold/30 bg-white p-6">
                                <div className="text-[11px] font-medium tracking-[0.15em] text-muted uppercase">{kpi.label}</div>
                                <div className={`mt-3 ${kpi.label === "Top Product" ? "text-lg" : "text-2xl"} font-light ${kpi.highlight ? "text-gold" : "text-heading"} ${kpi.label === "Top Product" ? "line-clamp-2" : ""}`}>{kpi.value}</div>
                                {"subtext" in kpi && kpi.subtext ? <div className="mt-1 text-[13px] text-muted">{kpi.subtext}</div> : null}
                            </div>
                        </StaggerItem>
                    ))}
                </StaggerGrid>

                <FadeIn delay={0.15}>
                    <AnalyticsCharts revenueLast30Days={revenueLast30Days} ordersByStatus={ordersByStatus} />
                </FadeIn>
            </div>
        </div>
    );
}
