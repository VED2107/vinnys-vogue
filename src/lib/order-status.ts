export const ORDER_STATUSES = [
    "pending",
    "confirmed",
    "shipped",
    "delivered",
    "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export function isValidOrderStatus(value: string): value is OrderStatus {
    return (ORDER_STATUSES as readonly string[]).includes(value);
}

const STYLE_MAP: Record<OrderStatus, { bg: string; text: string }> = {
    pending: { bg: "bg-amber-50", text: "text-amber-700" },
    confirmed: { bg: "bg-blue-50", text: "text-blue-700" },
    shipped: { bg: "bg-violet-50", text: "text-violet-700" },
    delivered: { bg: "bg-emerald-50", text: "text-emerald-700" },
    cancelled: { bg: "bg-red-50", text: "text-red-700" },
};

const FALLBACK = { bg: "bg-zinc-100", text: "text-zinc-700" };

export function getOrderStatusStyles(status: string) {
    return STYLE_MAP[status as OrderStatus] ?? FALLBACK;
}
