import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import { getOrderStatusStyles } from "@/lib/order-status";
import { getPaymentStatusStyles } from "@/lib/payment-status";

type OrderRow = {
    id: string;
    created_at: string;
    total_amount: number;
    status: string;
    payment_status: string;
    full_name: string | null;
    phone: string | null;
};

export default async function AdminOrdersPage({
    searchParams,
}: {
    searchParams?: { from?: string; to?: string };
}) {
    const supabase = createSupabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login?redirect=/admin/orders");
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

    if (!profile || profile.role !== "admin") {
        redirect("/");
    }

    const from = searchParams?.from;
    const to = searchParams?.to;

    let query = supabase
        .from("orders")
        .select("id, created_at, total_amount, status, payment_status, full_name, phone")
        .order("created_at", { ascending: false });

    if (from) {
        query = query.gte("created_at", `${from}T00:00:00`);
    }
    if (to) {
        query = query.lte("created_at", `${to}T23:59:59`);
    }

    const { data, error } = await query;

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

    const orders = (data ?? []) as OrderRow[];

    const csvParams = new URLSearchParams();
    if (from) csvParams.set("from", from);
    if (to) csvParams.set("to", to);
    const csvUrl = `/api/admin/orders/export${csvParams.toString() ? `?${csvParams.toString()}` : ""}`;

    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-900">
            <div className="mx-auto w-full max-w-6xl px-6 py-12">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-medium tracking-tight">Orders</h1>
                        <p className="text-sm text-zinc-600">
                            {orders.length} order{orders.length !== 1 ? "s" : ""}
                            {from || to ? " (filtered)" : ""}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <a
                            href={csvUrl}
                            className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 inline-flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                            Export CSV
                        </a>
                        <a
                            href="/admin"
                            className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 inline-flex items-center"
                        >
                            Back
                        </a>
                    </div>
                </div>

                {/* Date filters */}
                <form className="mt-6 flex flex-wrap items-end gap-3">
                    <div className="space-y-1.5">
                        <label htmlFor="from" className="text-xs font-medium text-zinc-600">From</label>
                        <input
                            id="from"
                            name="from"
                            type="date"
                            defaultValue={from ?? ""}
                            className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label htmlFor="to" className="text-xs font-medium text-zinc-600">To</label>
                        <input
                            id="to"
                            name="to"
                            type="date"
                            defaultValue={to ?? ""}
                            className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400"
                        />
                    </div>
                    <button
                        type="submit"
                        className="h-10 rounded-xl bg-zinc-900 px-4 text-sm font-medium text-zinc-50 transition hover:bg-zinc-800"
                    >
                        Filter
                    </button>
                    {(from || to) ? (
                        <a
                            href="/admin/orders"
                            className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 inline-flex items-center"
                        >
                            Clear
                        </a>
                    ) : null}
                </form>

                {/* Orders table */}
                <div className="mt-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                    <div className="grid grid-cols-12 gap-4 border-b border-zinc-200 px-6 py-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
                        <div className="col-span-2">Order ID</div>
                        <div className="col-span-2">Date</div>
                        <div className="col-span-2">Customer</div>
                        <div className="col-span-1">Total</div>
                        <div className="col-span-1">Status</div>
                        <div className="col-span-1">Payment</div>
                        <div className="col-span-3 text-right">Action</div>
                    </div>

                    {orders.length === 0 ? (
                        <div className="px-6 py-10 text-center text-sm text-zinc-500">
                            No orders found.
                        </div>
                    ) : (
                        <div className="divide-y divide-zinc-200">
                            {orders.map((o) => {
                                const date = new Date(o.created_at).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                });
                                const ss = getOrderStatusStyles(o.status);
                                const ps = getPaymentStatusStyles(o.payment_status);

                                return (
                                    <div key={o.id} className="grid grid-cols-12 gap-4 px-6 py-4">
                                        <div className="col-span-2 flex items-center text-sm font-mono text-zinc-900">
                                            {o.id.slice(0, 8).toUpperCase()}
                                        </div>
                                        <div className="col-span-2 flex items-center text-sm text-zinc-700">
                                            {date}
                                        </div>
                                        <div className="col-span-2 flex items-center text-sm text-zinc-900 line-clamp-1">
                                            {o.full_name ?? "—"}
                                        </div>
                                        <div className="col-span-1 flex items-center text-sm text-zinc-900">
                                            {formatMoney(o.total_amount)}
                                        </div>
                                        <div className="col-span-1 flex items-center">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${ss.bg} ${ss.text}`}>
                                                {o.status}
                                            </span>
                                        </div>
                                        <div className="col-span-1 flex items-center">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${ps.bg} ${ps.text}`}>
                                                {o.payment_status}
                                            </span>
                                        </div>
                                        <div className="col-span-3 flex items-center justify-end">
                                            <a
                                                href={`/admin/orders/${o.id}`}
                                                className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 inline-flex items-center"
                                            >
                                                View
                                            </a>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
