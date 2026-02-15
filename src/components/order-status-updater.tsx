"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ORDER_STATUSES, getOrderStatusStyles } from "@/lib/order-status";

export default function OrderStatusUpdater({
    orderId,
    currentStatus,
}: {
    orderId: string;
    currentStatus: string;
}) {
    const [status, setStatus] = useState(currentStatus);
    const [courierName, setCourierName] = useState("");
    const [trackingNumber, setTrackingNumber] = useState("");
    const [isPending, startTransition] = useTransition();
    const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
    const router = useRouter();

    function handleUpdate() {
        if (status === currentStatus) return;
        setFeedback(null);

        startTransition(async () => {
            try {
                const body: {
                    status: string;
                    courier_name?: string;
                    tracking_number?: string;
                } = { status };

                if (status === "shipping") {
                    body.courier_name = courierName;
                    body.tracking_number = trackingNumber;
                }

                const res = await fetch(`/api/admin/orders/${orderId}/status`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });

                const json = await res.json();

                if (!res.ok) {
                    setFeedback({ ok: false, msg: json.error ?? "Update failed" });
                    return;
                }

                setFeedback({ ok: true, msg: "Status updated" });
                router.refresh();
            } catch {
                setFeedback({ ok: false, msg: "Network error" });
            }
        });
    }

    const styles = getOrderStatusStyles(status);

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-3">
                <select
                    value={status}
                    onChange={(e) => {
                        setStatus(e.target.value);
                        setFeedback(null);
                    }}
                    disabled={isPending}
                    className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400"
                >
                    {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                    ))}
                </select>

                <button
                    onClick={handleUpdate}
                    disabled={isPending || status === currentStatus}
                    className="h-10 rounded-xl bg-zinc-900 px-4 text-sm font-medium text-zinc-50 transition hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isPending ? "Updating…" : "Update"}
                </button>
            </div>

            {status === "shipping" ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <input
                        value={courierName}
                        onChange={(e) => setCourierName(e.target.value)}
                        disabled={isPending}
                        placeholder="Courier name"
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
            ) : null}

            {/* Preview badge */}
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${styles.bg} ${styles.text}`}>
                {status}
            </span>

            {feedback && (
                <div className={`text-xs ${feedback.ok ? "text-emerald-600" : "text-red-600"}`}>
                    {feedback.msg}
                </div>
            )}
        </div>
    );
}
