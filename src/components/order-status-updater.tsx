"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getOrderStatusStyles } from "@/lib/order-status";

const NEXT_STATUS: Record<string, { label: string; value: string } | null> = {
    pending: { label: "Confirm Order", value: "confirmed" },
    confirmed: { label: "Mark as Shipped", value: "shipped" },
    shipped: { label: "Mark as Delivered", value: "delivered" },
    delivered: null,
    cancelled: null,
};

export default function OrderStatusUpdater({
    orderId,
    currentStatus,
}: {
    orderId: string;
    currentStatus: string;
}) {
    const [courierName, setCourierName] = useState("");
    const [trackingNumber, setTrackingNumber] = useState("");
    const [showShipForm, setShowShipForm] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
    const router = useRouter();

    const next = NEXT_STATUS[currentStatus] ?? null;
    const styles = getOrderStatusStyles(currentStatus);

    function handleProgress() {
        if (!next) return;

        if (next.value === "shipped" && !showShipForm) {
            setShowShipForm(true);
            return;
        }

        if (next.value === "shipped") {
            if (!courierName.trim() || !trackingNumber.trim()) {
                setFeedback({ ok: false, msg: "Courier name and tracking number are required" });
                return;
            }
        }

        setFeedback(null);

        startTransition(async () => {
            try {
                const body: {
                    status: string;
                    courier_name?: string;
                    tracking_number?: string;
                } = { status: next.value };

                if (next.value === "shipped") {
                    body.courier_name = courierName.trim();
                    body.tracking_number = trackingNumber.trim();
                }

                const res = await fetch(`/api/admin/orders/${orderId}/status`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });

                const json = await res.json();

                if (!res.ok) {
                    setFeedback({ ok: false, msg: json.error ?? "Update failed" });
                    return;
                }

                setFeedback({ ok: true, msg: "Status updated" });
                setShowShipForm(false);
                router.refresh();
            } catch {
                setFeedback({ ok: false, msg: "Network error" });
            }
        });
    }

    return (
        <div className="space-y-3">
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${styles.bg} ${styles.text}`}>
                {currentStatus}
            </span>

            {next && (
                <>
                    {showShipForm && next.value === "shipped" && (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <input
                                value={courierName}
                                onChange={(e) => setCourierName(e.target.value)}
                                disabled={isPending}
                                placeholder="Courier name (e.g. DTDC)"
                                className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400"
                            />
                            <input
                                value={trackingNumber}
                                onChange={(e) => setTrackingNumber(e.target.value)}
                                disabled={isPending}
                                placeholder="Tracking number"
                                className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400"
                            />
                        </div>
                    )}

                    <button
                        onClick={handleProgress}
                        disabled={isPending}
                        className="h-10 rounded-xl bg-zinc-900 px-4 text-sm font-medium text-zinc-50 transition hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isPending ? "Updating…" : next.label}
                    </button>
                </>
            )}

            {feedback && (
                <div className={`text-xs ${feedback.ok ? "text-emerald-600" : "text-red-600"}`}>
                    {feedback.msg}
                </div>
            )}
        </div>
    );
}
