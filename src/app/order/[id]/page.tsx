import { redirect, notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import { getProductImagePublicUrl } from "@/lib/product-images";
import { SectionTitle } from "@/components/ui";
import PayNowButton from "@/components/pay-now-button";
import DownloadInvoiceButton from "@/components/download-invoice-button";
import CancelOrderButton from "@/components/cancel-order-button";
import { FadeIn } from "@/components/fade-in";
import { getTrackingUrl } from "@/lib/tracking";
import { MandalaBackground } from "@/components/decorative";

export const dynamic = "force-dynamic";

type OrderRow = {
    id: string;
    created_at: string;
    total_amount: number;
    status: string;
    payment_status: string;
    courier_name: string | null;
    tracking_number: string | null;
    shipped_at: string | null;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    address_line1: string | null;
    razorpay_order_id: string | null;
};

type OrderItemRow = {
    id: string;
    quantity: number;
    price: number;
    product_name: string | null;
    image_url: string | null;
    products: { title: string; image_path: string | null } | null;
};

type OrderEventRow = {
    id: string;
    event_type: string;
    created_at: string;
};

function formatEventLabel(type: string) {
    switch (type) {
        case "ORDER_CREATED":
            return "Order Placed";
        case "PAYMENT_CONFIRMED":
            return "Payment Confirmed";
        case "SHIPPED":
            return "Order Shipped";
        case "DELIVERED":
            return "Delivered";
        case "CANCELLED":
        case "ORDER_CANCELLED":
            return "Order Cancelled";
        default:
            return type;
    }
}

export default async function OrderPage({
    params,
}: {
    params: { id: string };
}) {
    const supabase = createSupabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect(`/login?redirect=/order/${params.id}`);
    }

    const { data: order, error: orderError } = await supabase
        .from("orders")
        .select(
            "id,created_at,total_amount,status,payment_status,courier_name,tracking_number,shipped_at,full_name,email,phone,address_line1,razorpay_order_id",
        )
        .eq("id", params.id)
        .maybeSingle();

    if (orderError) {
        console.error("[OrderPage] Supabase query error:", orderError);
        throw new Error("Failed to load order. Please try again.");
    }

    if (!order) notFound();

    const o = order as OrderRow;

    const { data: orderItems } = await supabase
        .from("order_items")
        .select("id,quantity,price,product_name,image_url,products(title,image_path)")
        .eq("order_id", o.id);

    const items = (orderItems ?? []) as unknown as OrderItemRow[];

    const { data: events, error: eventsError } = await supabase
        .from("order_events")
        .select("id,event_type,created_at")
        .eq("order_id", o.id)
        .order("created_at", { ascending: true });

    if (eventsError) {
        console.error("[OrderPage] order_events query error:", eventsError);
    }

    const isPaid = o.payment_status === "paid";

    return (
        <div className="relative min-h-screen overflow-hidden bg-bg-primary">
            <MandalaBackground variant="lotus" position="bottom-left" />
            <div className="relative z-10 mx-auto w-full max-w-3xl px-6 py-16">
                <FadeIn>
                    <div className="flex flex-col items-center text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/10">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C6A756" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>
                        <div className="mt-6">
                            <SectionTitle
                                subtitle={`#${o.id.slice(0, 8).toUpperCase()}`}
                                title={isPaid ? "Order Placed" : "Order Created"}
                            />
                        </div>
                    </div>

                    <div className="mt-14 rounded-[20px] border border-[rgba(0,0,0,0.06)] bg-bg-card p-8">
                        <div className="space-y-4 text-[15px]">
                            <div className="flex justify-between">
                                <span className="text-muted">Name</span>
                                <span className="text-heading">{o.full_name ?? "—"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted">Phone</span>
                                <span className="text-heading">{o.phone ?? "—"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted">Status</span>
                                <span className={`font-medium ${isPaid ? "text-heading" : "text-gold"}`}>
                                    {isPaid ? "Confirmed" : "Awaiting Payment"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted">Payment</span>
                                <span className={`font-medium capitalize ${isPaid ? "text-heading" : "text-gold"}`}>
                                    {o.payment_status}
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 gold-divider-gradient" />

                        <div className="mt-6 space-y-4">
                            {items.map((item) => {
                                const prod = item.products as { title: string; image_path: string | null } | null;
                                const title = item.product_name ?? prod?.title ?? "Product";
                                const imgPath = item.image_url ?? prod?.image_path ?? null;
                                const imageUrl = getProductImagePublicUrl(supabase, imgPath);
                                return (
                                    <div key={item.id} className="flex items-center gap-4 text-[15px]">
                                        <div className="h-[60px] w-[60px] flex-shrink-0 overflow-hidden rounded-xl bg-[#EDE8E0]">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={imageUrl}
                                                alt={title}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <div className="flex flex-1 items-center justify-between gap-3 min-w-0">
                                            <div className="text-heading truncate">
                                                {title} × {item.quantity}
                                            </div>
                                            <div className="font-serif font-light text-gold flex-shrink-0">
                                                {formatMoney(Number(item.price) * item.quantity)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-6 gold-divider-gradient" />

                        <div className="mt-5 flex items-center justify-between">
                            <div className="text-[15px] text-muted">Total</div>
                            <div className="font-serif text-xl font-light text-gold">{formatMoney(Number(o.total_amount))}</div>
                        </div>
                    </div>

                    {o.status === "shipped" && o.tracking_number && (
                        <div className="mt-8 border rounded-xl p-6 bg-neutral-50">
                            <h3 className="text-lg font-semibold mb-4">
                                Shipment Details
                            </h3>

                            <div className="space-y-2 text-sm text-neutral-700">
                                <p>
                                    <span className="font-medium">Courier:</span>{" "}
                                    {o.courier_name}
                                </p>

                                <p>
                                    <span className="font-medium">Tracking Number:</span>{" "}
                                    {o.tracking_number}
                                </p>

                                {o.shipped_at && (
                                    <p>
                                        <span className="font-medium">Shipped On:</span>{" "}
                                        {new Date(o.shipped_at).toLocaleDateString("en-IN", {
                                            timeZone: "Asia/Kolkata",
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                        })}
                                    </p>
                                )}

                                {getTrackingUrl(o.courier_name, o.tracking_number) && (
                                    <a
                                        href={getTrackingUrl(o.courier_name, o.tracking_number)!}
                                        target="_blank"
                                        className="inline-block mt-3 text-black underline font-medium"
                                    >
                                        Track Shipment →
                                    </a>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="mt-10">
                        <h3 className="text-lg font-semibold mb-6">
                            Order Timeline
                        </h3>

                        <div className="space-y-6 border-l pl-6">
                            {(events as OrderEventRow[] | null | undefined)?.map((event) => (
                                <div key={event.id} className="relative">
                                    <div className="absolute -left-[13px] top-1 h-3 w-3 bg-black rounded-full" />

                                    <p className="font-medium text-sm">
                                        {formatEventLabel(event.event_type)}
                                    </p>

                                    <p className="text-xs text-neutral-500">
                                        {new Date(event.created_at).toLocaleString("en-IN", {
                                            timeZone: "Asia/Kolkata",
                                            year: "numeric",
                                            month: "short",
                                            day: "2-digit",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
                        {o.payment_status === "unpaid" ? (
                            <PayNowButton orderId={o.id} userEmail={o.email ?? undefined} />
                        ) : null}
                        <DownloadInvoiceButton orderId={o.id} />
                        {o.status === "confirmed" ? (
                            <CancelOrderButton orderId={o.id} />
                        ) : null}
                        <a
                            href="/products"
                            className="inline-flex h-12 items-center justify-center rounded-full border border-[rgba(0,0,0,0.1)] px-8 text-[14px] text-heading transition-all duration-400 hover:border-[rgba(0,0,0,0.2)] w-full sm:w-auto"
                        >
                            Continue Shopping
                        </a>
                    </div>
                </FadeIn>
            </div>
        </div>
    );
}
