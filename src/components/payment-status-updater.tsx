"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PAYMENT_STATUSES, getPaymentStatusStyles } from "@/lib/payment-status";

export default function PaymentStatusUpdater({
    orderId,
    currentPaymentStatus,
}: {
    orderId: string;
    currentPaymentStatus: string;
}) {
    const [paymentStatus, setPaymentStatus] = useState(currentPaymentStatus);
    const [isPending, startTransition] = useTransition();
    const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
    const router = useRouter();

    function handleUpdate() {
        if (paymentStatus === currentPaymentStatus) return;
        setFeedback(null);

        startTransition(async () => {
            try {
                const res = await fetch(`/api/admin/orders/${orderId}/payment-status`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ payment_status: paymentStatus }),
                });

                const json = await res.json();

                if (!res.ok) {
                    setFeedback({ ok: false, msg: json.error ?? "Update failed" });
                    return;
                }

                setFeedback({ ok: true, msg: "Payment status updated" });
                router.refresh();
            } catch {
                setFeedback({ ok: false, msg: "Network error" });
            }
        });
    }

    const styles = getPaymentStatusStyles(paymentStatus);

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-3">
                <select
                    value={paymentStatus}
                    onChange={(e) => {
                        setPaymentStatus(e.target.value);
                        setFeedback(null);
                    }}
                    disabled={isPending}
                    className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400"
                >
                    {PAYMENT_STATUSES.map((s) => (
                        <option key={s} value={s}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                    ))}
                </select>

                <button
                    onClick={handleUpdate}
                    disabled={isPending || paymentStatus === currentPaymentStatus}
                    className="h-10 rounded-xl bg-zinc-900 px-4 text-sm font-medium text-zinc-50 transition hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isPending ? (
                        <>
                            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                            </svg>
                            Updating…
                        </>
                    ) : "Update"}
                </button>
            </div>

            {/* Preview badge */}
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${styles.bg} ${styles.text}`}>
                {paymentStatus}
            </span>

            {feedback && (
                <div className={`text-xs ${feedback.ok ? "text-emerald-600" : "text-red-600"}`}>
                    {feedback.msg}
                </div>
            )}
        </div>
    );
}
