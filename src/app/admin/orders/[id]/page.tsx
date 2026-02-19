import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
// revalidatePath used by reconfirmPayment server action
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { formatMoney } from "@/lib/format";
import { getProductImagePublicUrl } from "@/lib/product-images";
import OrderStatusUpdater from "@/components/order-status-updater";
import PaymentStatusUpdater from "@/components/payment-status-updater";
import { MandalaBackground } from "@/components/decorative";
import { AdminSubmitButton } from "@/components/ui/AdminSubmitButton";

type OrderItemProduct = {
    id: string;
    title: string;
    image_path: string | null;
};

type OrderItemRow = {
    id: string;
    quantity: number;
    price: number;
    product_name: string | null;
    image_url: string | null;
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

        // confirm_order_payment is GRANTED ONLY TO service_role
        const serviceClient = createClient(
            process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
        );

        const { error } = await serviceClient.rpc("confirm_order_payment", {
            p_order_id: orderId,
            p_razorpay_payment_id: "admin_reconfirm",
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
            "id, user_id, status, payment_status, total_amount, created_at, delivered_at, full_name, phone, address_line1, address_line2, city, state, postal_code, country, order_items(id, quantity, price, product_name, image_url, products(id, title, image_path))",
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
        <div className="relative min-h-screen overflow-hidden bg-zinc-50 text-zinc-900">
            <MandalaBackground variant="lotus" position="top-right" />
            <div className="relative z-10 mx-auto w-full max-w-4xl px-6 py-12">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-medium tracking-tight">
                            Order {order.id.slice(0, 8).toUpperCase()}
                        </h1>
                        <p className="text-sm text-zinc-600">{orderDate}</p>
                    </div>
                    <a
                        href="/admin/orders"
                        className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 inline-flex items-center justify-center w-full sm:w-auto"
                    >
                        Back to Orders
                    </a>
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <a
                        href={`/api/admin/orders/${order.id}/invoice`}
                        className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 w-full sm:w-auto"
                    >
                        Download Invoice
                    </a>
                    {order.payment_status !== "paid" && (
                        <form action={reconfirmPayment}>
                            <AdminSubmitButton
                                className="h-10 w-full sm:w-auto px-4 bg-neutral-900 text-white text-sm font-medium rounded-xl transition hover:bg-neutral-800"
                                pendingText="Reconfirming…"
                            >
                                Reconfirm Payment
                            </AdminSubmitButton>
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
                            const title = item.product_name ?? prod.title;
                            const imgPath = item.image_url ?? prod.image_path;
                            const lineTotal = item.quantity * item.price;
                            const imageUrl = getProductImagePublicUrl(supabase, imgPath);

                            return (
                                <div key={item.id} className="flex items-center gap-4 px-6 py-4">
                                    <div className="h-14 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={imageUrl}
                                            alt={title}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                    <div className="flex flex-1 items-center justify-between gap-4">
                                        <div>
                                            <div className="text-sm font-medium text-zinc-900">{title}</div>
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
