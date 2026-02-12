export const PAYMENT_STATUSES = [
    "unpaid",
    "paid",
    "failed",
    "refunded",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export function isValidPaymentStatus(value: string): value is PaymentStatus {
    return (PAYMENT_STATUSES as readonly string[]).includes(value);
}

const STYLE_MAP: Record<PaymentStatus, { bg: string; text: string }> = {
    unpaid: { bg: "bg-amber-50", text: "text-amber-700" },
    paid: { bg: "bg-emerald-50", text: "text-emerald-700" },
    failed: { bg: "bg-red-50", text: "text-red-700" },
    refunded: { bg: "bg-violet-50", text: "text-violet-700" },
};

const FALLBACK = { bg: "bg-zinc-100", text: "text-zinc-700" };

export function getPaymentStatusStyles(status: string) {
    return STYLE_MAP[status as PaymentStatus] ?? FALLBACK;
}
