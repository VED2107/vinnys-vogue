import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import { getTrackingUrl } from "@/lib/tracking";
import { UpdateProfileForm, ChangePasswordButton } from "@/components/account-client";
import { FadeIn } from "@/components/fade-in";
import { MandalaBackground } from "@/components/decorative";
import { GoldDivider } from "@/components/section-divider";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "My Account",
    description: "Manage your account at Vinnys Vogue.",
};

type ProfileRow = {
    email: string | null;
    phone: string | null;
    full_name: string | null;
    address_line1: string | null;
    address_line2: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    country: string | null;
    created_at: string;
};

type OrderRow = {
    id: string;
    created_at: string;
    status: string;
    payment_status: string;
    total_amount: number;
    currency: string;
    courier_name: string | null;
    tracking_number: string | null;
};

export default async function AccountPage() {
    const supabase = createSupabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login?redirect=/account");

    const { data: profile } = await supabase
        .from("profiles")
        .select("email, phone, full_name, address_line1, address_line2, city, state, postal_code, country, created_at")
        .eq("id", user.id)
        .maybeSingle();

    const p = (profile ?? {
        email: user.email ?? null,
        phone: null,
        full_name: null,
        address_line1: null,
        address_line2: null,
        city: null,
        state: null,
        postal_code: null,
        country: null,
        created_at: user.created_at,
    }) as ProfileRow;

    const { data: orders } = await supabase
        .from("orders")
        .select("id, created_at, status, payment_status, total_amount, currency, courier_name, tracking_number")
        .order("created_at", { ascending: false })
        .limit(10);

    const rows = (orders ?? []) as OrderRow[];

    const statusBadge = (status: string) => {
        const colors: Record<string, string> = {
            confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
            paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
            delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
            pending: "bg-amber-50 text-amber-700 border-amber-200",
            payment_initiated: "bg-sky-50 text-sky-700 border-sky-200",
            shipped: "bg-sky-50 text-sky-700 border-sky-200",
            cancelled: "bg-red-50 text-red-700 border-red-200",
        };
        return colors[status] ?? "bg-neutral-50 text-neutral-600 border-neutral-200";
    };

    const addressParts = [p.address_line1, p.address_line2, p.city, p.state, p.postal_code, p.country].filter(Boolean);

    const initials = p.full_name
        ? p.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
        : (p.email ?? user.email ?? "?")[0].toUpperCase();

    return (
        <div className="relative min-h-screen overflow-hidden bg-bg-primary">
            <MandalaBackground variant="lotus" position="center" />
            <div className="relative z-10 mx-auto w-full max-w-[960px] px-6 py-20">
                <FadeIn>
                    {/* ── Premium Header ── */}
                    <div className="flex flex-col items-center sm:flex-row sm:items-center sm:gap-6">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#C6A75E] to-[#E8D4A2] text-2xl font-serif font-light text-white shadow-lg">
                            {initials}
                        </div>
                        <div className="mt-4 text-center sm:mt-0 sm:text-left">
                            <h1 className="font-serif text-[clamp(24px,3vw,36px)] font-light text-heading tracking-[-0.02em]">
                                {p.full_name ?? "Welcome"}
                            </h1>
                            <p className="mt-1 text-[14px] text-muted">
                                {p.email ?? user.email}
                                <span className="mx-2 text-neutral-300">·</span>
                                Member since {new Date(p.created_at).toLocaleDateString("en-IN", {
                                    timeZone: "Asia/Kolkata",
                                    month: "long",
                                    year: "numeric",
                                })}
                            </p>
                        </div>
                    </div>

                    <div className="gold-divider-gradient mt-8" />

                    {/* ── A) Profile Overview — Glass Card ── */}
                    <section className="mt-10">
                        <div className="flex items-center gap-2.5 mb-6">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/10">
                                <svg className="h-4 w-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                </svg>
                            </span>
                            <h2 className="font-serif text-xl font-light text-heading">Profile</h2>
                        </div>
                        <div className="rounded-3xl border border-[rgba(0,0,0,0.05)] bg-white/60 backdrop-blur-sm p-6 shadow-sm">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <div className="text-[11px] font-medium tracking-[0.2em] text-muted uppercase">Name</div>
                                    <div className="text-[15px] text-heading">{p.full_name ?? "—"}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[11px] font-medium tracking-[0.2em] text-muted uppercase">Email</div>
                                    <div className="text-[15px] text-heading">{p.email ?? user.email ?? "—"}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[11px] font-medium tracking-[0.2em] text-muted uppercase">Phone</div>
                                    <div className="text-[15px] text-heading">{p.phone ?? "—"}</div>
                                </div>
                                {addressParts.length > 0 && (
                                    <div className="space-y-1">
                                        <div className="text-[11px] font-medium tracking-[0.2em] text-muted uppercase">Address</div>
                                        <div className="text-[15px] text-heading">{addressParts.join(", ")}</div>
                                    </div>
                                )}
                            </div>
                            {user.last_sign_in_at && (
                                <div className="mt-4 pt-4 border-t border-[rgba(0,0,0,0.05)] text-[13px] text-muted">
                                    Last login: {new Date(user.last_sign_in_at).toLocaleString("en-IN", {
                                        timeZone: "Asia/Kolkata",
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* ── B) Update Profile — Glass Card ── */}
                    <section className="mt-10">
                        <div className="flex items-center gap-2.5 mb-6">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/10">
                                <svg className="h-4 w-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                </svg>
                            </span>
                            <h2 className="font-serif text-xl font-light text-heading">Edit Profile</h2>
                        </div>
                        <div className="rounded-3xl border border-[rgba(0,0,0,0.05)] bg-white/60 backdrop-blur-sm p-6 shadow-sm">
                            <UpdateProfileForm profile={{
                                full_name: p.full_name,
                                phone: p.phone,
                                address_line1: p.address_line1,
                                address_line2: p.address_line2,
                                city: p.city,
                                state: p.state,
                                postal_code: p.postal_code,
                                country: p.country,
                            }} />
                        </div>
                    </section>

                    {/* ── C) Security — Glass Card ── */}
                    <section className="mt-10">
                        <div className="flex items-center gap-2.5 mb-6">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/10">
                                <svg className="h-4 w-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                </svg>
                            </span>
                            <h2 className="font-serif text-xl font-light text-heading">Security</h2>
                        </div>
                        <div className="rounded-3xl border border-[rgba(0,0,0,0.05)] bg-white/60 backdrop-blur-sm p-6 shadow-sm flex items-center justify-between">
                            <div>
                                <div className="text-[15px] font-medium text-heading">Password</div>
                                <p className="text-[13px] text-muted mt-1">Update your password to keep your account secure.</p>
                            </div>
                            <ChangePasswordButton />
                        </div>
                    </section>

                    {/* ── D) Orders ── */}
                    <section className="mt-10">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2.5">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/10">
                                    <svg className="h-4 w-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                    </svg>
                                </span>
                                <h2 className="font-serif text-xl font-light text-heading">Recent Orders</h2>
                            </div>
                            <Link
                                href="/account/orders"
                                className="text-[13px] font-medium text-gold hover:underline transition"
                            >
                                View All →
                            </Link>
                        </div>

                        {rows.length === 0 ? (
                            <div className="rounded-3xl border border-[rgba(0,0,0,0.05)] bg-white/60 backdrop-blur-sm p-10 text-center shadow-sm">
                                <div className="mx-auto h-12 w-12 rounded-full bg-gold/10 flex items-center justify-center">
                                    <svg className="h-6 w-6 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                    </svg>
                                </div>
                                <p className="mt-4 text-muted text-[15px]">No orders yet.</p>
                                <Link
                                    href="/products"
                                    className="mt-5 inline-flex h-11 items-center rounded-full bg-gradient-to-r from-[#C6A75E] to-[#E8D4A2] px-7 text-[13px] font-medium tracking-wide text-white shadow-md transition hover:shadow-lg hover:-translate-y-0.5"
                                >
                                    Start Shopping
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {rows.map((order) => (
                                    <Link
                                        key={order.id}
                                        href={`/order/${order.id}`}
                                        className="group flex flex-col gap-3 rounded-2xl border border-[rgba(0,0,0,0.05)] bg-white/60 backdrop-blur-sm p-5 transition-all duration-300 hover:shadow-md hover:border-gold/20 sm:flex-row sm:items-center sm:justify-between"
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
                                                className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusBadge(order.status)}`}
                                            >
                                                {order.status.replace(/_/g, " ")}
                                            </span>
                                            <div className="font-serif text-[16px] font-light text-gold whitespace-nowrap">
                                                {formatMoney(Number(order.total_amount), order.currency || "INR")}
                                            </div>
                                            <svg className="h-4 w-4 text-muted transition group-hover:text-gold group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                            </svg>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* ── E) Tracking Section ── */}
                    {rows.some((o) => o.status === "shipped" && o.tracking_number) && (
                        <section className="mt-10">
                            <div className="flex items-center gap-2.5 mb-6">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/10">
                                    <svg className="h-4 w-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                                    </svg>
                                </span>
                                <h2 className="font-serif text-xl font-light text-heading">Shipment Tracking</h2>
                            </div>
                            <div className="space-y-3">
                                {rows
                                    .filter((o) => o.status === "shipped" && o.tracking_number)
                                    .map((order) => (
                                        <div
                                            key={order.id}
                                            className="rounded-2xl border border-[rgba(0,0,0,0.05)] bg-white/60 backdrop-blur-sm p-5 shadow-sm"
                                        >
                                            <div className="text-[14px] font-medium text-heading">
                                                Order #{order.id.slice(0, 8)}
                                            </div>
                                            <div className="mt-3 space-y-2 text-[14px]">
                                                {order.courier_name && (
                                                    <div className="flex justify-between">
                                                        <span className="text-muted">Courier</span>
                                                        <span className="text-heading">{order.courier_name}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between">
                                                    <span className="text-muted">Tracking Number</span>
                                                    <span className="text-heading font-mono text-[13px]">{order.tracking_number}</span>
                                                </div>
                                                {getTrackingUrl(order.courier_name, order.tracking_number) && (
                                                    <a
                                                        href={getTrackingUrl(order.courier_name, order.tracking_number)!}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-gold hover:underline"
                                                    >
                                                        Track Shipment
                                                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                                        </svg>
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </section>
                    )}
                </FadeIn>

                <GoldDivider className="mt-16 mb-4" />
            </div>
        </div>
    );
}
