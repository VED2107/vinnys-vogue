import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import { getProductImagePublicUrl } from "@/lib/product-images";
import { getOrderStatusStyles } from "@/lib/order-status";
import { getPaymentStatusStyles } from "@/lib/payment-status";
import OrderStatusUpdater from "@/components/order-status-updater";
import PaymentStatusUpdater from "@/components/payment-status-updater";

type OrderItemProduct = {
    id: string;
    title: string;
    image_path: string | null;
};

type OrderItemRow = {
    id: string;
    quantity: number;
    price: number;
    products: OrderItemProduct;
};

type OrderRow = {
    id: string;
    user_id: string;
    status: string;
    payment_status: string;
    total_amount: number;
    created_at: string;
    delivered_at: string | null;
    full_name: string | null;
    phone: string | null;
    address_line1: string | null;
    address_line2: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    country: string | null;
    order_items: OrderItemRow[];
};

export default async function AdminOrderDetailPage({
    params,
}: {
    params: { id: string };
}) {
    const supabase = createSupabaseServerClient();

    async function markDelivered() {
        "use server";

        const supabase = createSupabaseServerClient();
        const orderId = params.id;

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            throw new Error("Unauthorized");
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();

        if (!profile || profile.role !== "admin") {
            throw new Error("Forbidden");
        }

        const { error } = await supabase
            .from("orders")
            .update({
                status: "delivered",
                delivered_at: new Date().toISOString(),
            })
            .eq("id", orderId);

        if (error) throw new Error("Failed to mark delivered");

        const { error: eventError } = await supabase.from("order_events").insert({
            order_id: orderId,
            event_type: "DELIVERED",
        });

        if (eventError) throw new Error("Failed to write delivered event");

        revalidatePath(`/admin/orders/${orderId}`);
    }

    async function reconfirmPayment() {
        "use server";

        const supabase = createSupabaseServerClient();
        const orderId = params.id;

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) throw new Error("Unauthorized");

        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();

        if (!profile || profile.role !== "admin") {
            throw new Error("Forbidden");
        }

        const { error } = await supabase.rpc("confirm_order_payment", {
            p_order_id: orderId,
        });

        if (error) throw new Error("Reconfirmation failed");

        revalidatePath(`/admin/orders/${orderId}`);
    }

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

    const { data, error } = await supabase
        .from("orders")
        .select(
            "id, user_id, status, payment_status, total_amount, created_at, delivered_at, full_name, phone, address_line1, address_line2, city, state, postal_code, country, order_items(id, quantity, price, products(id, title, image_path))",
        )
        .eq("id", params.id)
        .maybeSingle();

    if (error) {
        throw new Error(error.message);
    }

    if (!data) {
        redirect("/admin/orders");
    }

    const order: OrderRow = JSON.parse(JSON.stringify(data));

    const orderDate = new Date(order.created_at).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    const statusStyles = getOrderStatusStyles(order.status);

    const addressParts = [
        order.address_line1,
        order.address_line2,
        order.city,
        order.state,
        order.postal_code,
        order.country,
    ].filter(Boolean);
    const fullAddress = addressParts.length > 0 ? addressParts.join(", ") : "—";

    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-900">
            <div className="mx-auto w-full max-w-4xl px-6 py-12">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-medium tracking-tight">
                            Order {order.id.slice(0, 8).toUpperCase()}
                        </h1>
                        <p className="text-sm text-zinc-600">{orderDate}</p>
                    </div>
                    <a
                        href="/admin/orders"
                        className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 inline-flex items-center"
                    >
                        Back to Orders
                    </a>
                </div>

                <div className="mt-4">
                    <a
                        href={`/api/admin/orders/${order.id}/invoice`}
                        className="inline-flex h-10 items-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50"
                    >
                        Download Invoice
                    </a>
                </div>

                <div className="mt-3 flex gap-3">
                    <form action={markDelivered}>
                        <button className="px-4 py-2 bg-black text-white rounded-xl">
                            Mark as Delivered
                        </button>
                    </form>
                    {order.payment_status !== "paid" && (
                        <form action={reconfirmPayment}>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-neutral-900 text-white rounded-xl"
                            >
                                Reconfirm Payment
                            </button>
                        </form>
                    )}
                </div>

                {/* Order meta */}
                <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Status with updater */}
                    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                        <div className="text-xs text-zinc-500 mb-3">Status</div>
                        <OrderStatusUpdater
                            orderId={order.id}
                            currentStatus={order.status}
                        />
                    </div>
                    {/* Payment status with updater */}
                    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                        <div className="text-xs text-zinc-500 mb-3">Payment</div>
                        <PaymentStatusUpdater
                            orderId={order.id}
                            currentPaymentStatus={order.payment_status}
                        />
                    </div>
                    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                        <div className="text-xs text-zinc-500">Customer</div>
                        <div className="mt-2 text-sm font-medium text-zinc-900">
                            {order.full_name ?? "—"}
                        </div>
                        <div className="mt-0.5 text-xs text-zinc-600">{order.phone ?? "—"}</div>
                    </div>
                    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                        <div className="text-xs text-zinc-500">Total</div>
                        <div className="mt-2 text-lg font-medium text-zinc-900">
                            {formatMoney(order.total_amount)}
                        </div>
                    </div>
                </div>

                {/* Shipping address */}
                <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                    <div className="text-xs text-zinc-500">Shipping Address</div>
                    <div className="mt-2 text-sm leading-6 text-zinc-900">{fullAddress}</div>
                </div>

                {/* Items */}
                <div className="mt-6 rounded-2xl border border-zinc-200 bg-white shadow-sm">
                    <div className="border-b border-zinc-200 px-6 py-4">
                        <div className="text-sm font-medium text-zinc-900">
                            Items ({order.order_items.length})
                        </div>
                    </div>
                    <div className="divide-y divide-zinc-200">
                        {order.order_items.map((item) => {
                            const prod = item.products;
                            const lineTotal = item.quantity * item.price;
                            const imageUrl = getProductImagePublicUrl(supabase, prod.image_path);

                            return (
                                <div key={item.id} className="flex items-center gap-4 px-6 py-4">
                                    <div className="h-14 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={imageUrl}
                                            alt={prod.title}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                    <div className="flex flex-1 items-center justify-between gap-4">
                                        <div>
                                            <div className="text-sm font-medium text-zinc-900">{prod.title}</div>
                                            <div className="mt-0.5 text-xs text-zinc-500">
                                                {formatMoney(item.price)} &times; {item.quantity}
                                            </div>
                                        </div>
                                        <div className="text-sm font-medium text-zinc-900">
                                            {formatMoney(lineTotal)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex items-center justify-between border-t border-zinc-200 px-6 py-4">
                        <span className="text-sm font-medium text-zinc-900">Order Total</span>
                        <span className="text-lg font-medium text-zinc-900">
                            {formatMoney(order.total_amount)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
