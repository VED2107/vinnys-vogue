import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import { getTrackingUrl } from "@/lib/tracking";
import { UpdateProfileForm, ChangePasswordButton } from "@/components/account-client";
import { FadeIn } from "@/components/fade-in";

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
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

    const rows = (orders ?? []) as OrderRow[];

    const statusBadge = (status: string) => {
        const colors: Record<string, string> = {
            confirmed: "bg-green-100 text-green-800",
            paid: "bg-green-100 text-green-800",
            delivered: "bg-green-100 text-green-800",
            pending: "bg-yellow-100 text-yellow-800",
            payment_initiated: "bg-blue-100 text-blue-800",
            shipping: "bg-blue-100 text-blue-800",
            cancelled: "bg-red-100 text-red-800",
        };
        return colors[status] ?? "bg-gray-100 text-gray-800";
    };

    const addressParts = [p.address_line1, p.address_line2, p.city, p.state, p.postal_code, p.country].filter(Boolean);

    return (
        <div className="min-h-screen bg-bg-primary">
            <div className="mx-auto w-full max-w-[900px] px-6 py-20">
                <FadeIn>
                    <h1 className="font-serif text-3xl font-light text-heading tracking-[-0.02em]">
                        My Account
                    </h1>
                    <div className="gold-divider-gradient mt-4" />

                    {/* ── A) Profile Info ── */}
                    <section className="mt-12">
                        <h2 className="font-serif text-xl font-light text-heading">Profile Information</h2>
                        <div className="mt-6 rounded-[20px] border border-[rgba(0,0,0,0.06)] bg-bg-card p-6 space-y-3 text-[15px]">
                            <div className="flex justify-between">
                                <span className="text-muted">Name</span>
                                <span className="text-heading">{p.full_name ?? "—"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted">Email</span>
                                <span className="text-heading">{p.email ?? user.email ?? "—"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted">Phone</span>
                                <span className="text-heading">{p.phone ?? "—"}</span>
                            </div>
                            {addressParts.length > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-muted">Address</span>
                                    <span className="text-heading text-right max-w-[60%]">{addressParts.join(", ")}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-muted">Member since</span>
                                <span className="text-heading">
                                    {new Date(p.created_at).toLocaleDateString("en-IN", {
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric",
                                    })}
                                </span>
                            </div>
                            {user.last_sign_in_at && (
                                <div className="flex justify-between">
                                    <span className="text-muted">Last login</span>
                                    <span className="text-heading">
                                        {new Date(user.last_sign_in_at).toLocaleDateString("en-IN", {
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </span>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* ── B) Update Profile ── */}
                    <section className="mt-12">
                        <h2 className="font-serif text-xl font-light text-heading">Update Profile</h2>
                        <div className="mt-6 rounded-[20px] border border-[rgba(0,0,0,0.06)] bg-bg-card p-6">
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

                    {/* ── C) Change Password ── */}
                    <section className="mt-12">
                        <h2 className="font-serif text-xl font-light text-heading">Change Password</h2>
                        <div className="mt-6 rounded-[20px] border border-[rgba(0,0,0,0.06)] bg-bg-card p-6">
                            <ChangePasswordButton email={user.email ?? ""} />
                        </div>
                    </section>

                    {/* ── D) Orders ── */}
                    <section className="mt-12">
                        <div className="flex items-center justify-between">
                            <h2 className="font-serif text-xl font-light text-heading">Recent Orders</h2>
                            <Link
                                href="/account/orders"
                                className="text-[13px] font-medium text-gold hover:underline"
                            >
                                View All
                            </Link>
                        </div>

                        {rows.length === 0 ? (
                            <div className="mt-6 rounded-[20px] border border-[rgba(0,0,0,0.06)] bg-bg-card p-8 text-center">
                                <p className="text-muted text-[15px]">No orders yet.</p>
                                <Link
                                    href="/products"
                                    className="mt-4 inline-block rounded-full bg-accent px-6 py-3 text-[14px] font-medium text-white hover-lift hover:bg-accent-hover"
                                >
                                    Start Shopping
                                </Link>
                            </div>
                        ) : (
                            <div className="mt-6 space-y-4">
                                {rows.map((order) => (
                                    <Link
                                        key={order.id}
                                        href={`/order/${order.id}`}
                                        className="flex flex-col gap-3 rounded-[16px] border border-[rgba(0,0,0,0.06)] p-5 transition-all duration-300 hover:shadow-lg sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[13px] text-muted">
                                                {new Date(order.created_at).toLocaleDateString("en-IN", {
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
                                                {formatMoney(Number(order.total_amount), order.currency || "INR")}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* ── E) Tracking Section ── */}
                    {rows.some((o) => o.status === "shipping" && o.tracking_number) && (
                        <section className="mt-12">
                            <h2 className="font-serif text-xl font-light text-heading">Shipment Tracking</h2>
                            <div className="mt-6 space-y-4">
                                {rows
                                    .filter((o) => o.status === "shipping" && o.tracking_number)
                                    .map((order) => (
                                        <div
                                            key={order.id}
                                            className="rounded-[16px] border border-[rgba(0,0,0,0.06)] bg-bg-card p-5"
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
                                                        className="mt-2 inline-block text-[13px] font-medium text-gold hover:underline"
                                                    >
                                                        Track Shipment →
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </section>
                    )}
                </FadeIn>
            </div>
        </div>
    );
}
