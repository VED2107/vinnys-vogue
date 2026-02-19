"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = {
    orderId: string;
    status: string;
};

const NEXT_STATUS: Record<string, { label: string; value: string } | null> = {
    pending: { label: "Confirm", value: "confirmed" },
    confirmed: { label: "Ship", value: "shipped" },
    shipped: { label: "Deliver", value: "delivered" },
    delivered: null,
    cancelled: null,
};

export default function AdminOrderRowActions({ orderId, status }: Props) {
    const router = useRouter();
    const [showShipForm, setShowShipForm] = useState(false);
    const [courierName, setCourierName] = useState("");
    const [trackingNumber, setTrackingNumber] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const next = NEXT_STATUS[status] ?? null;

    function updateStatus(newStatus: string, payload?: { courier_name?: string; tracking_number?: string }) {
        setError(null);

        startTransition(async () => {
            try {
                const res = await fetch(`/api/admin/orders/${orderId}/status`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        status: newStatus,
                        courier_name: payload?.courier_name,
                        tracking_number: payload?.tracking_number,
                    }),
                });

                const json = await res.json();

                if (!res.ok) {
                    setError(json.error ?? "Update failed");
                    return;
                }

                setShowShipForm(false);
                setCourierName("");
                setTrackingNumber("");
                router.refresh();
            } catch {
                setError("Network error while updating status");
            }
        });
    }

    if (!next) {
        return null;
    }

    if (next.value === "shipped") {
        return (
            <div className="flex flex-col items-end gap-2">
                {!showShipForm ? (
                    <button
                        onClick={() => {
                            setError(null);
                            setShowShipForm(true);
                        }}
                        disabled={isPending}
                        className="h-9 rounded-full bg-zinc-900 px-4 text-[13px] text-white transition hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                        {isPending ? (
                            <>
                                <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                </svg>
                                Updating…
                            </>
                        ) : "Ship"}
                    </button>
                ) : (
                    <div className="w-[260px] rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
                        <div className="space-y-2">
                            <input
                                value={courierName}
                                onChange={(e) => setCourierName(e.target.value)}
                                disabled={isPending}
                                placeholder="Courier name"
                                className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none focus:border-zinc-400"
                            />
                            <input
                                value={trackingNumber}
                                onChange={(e) => setTrackingNumber(e.target.value)}
                                disabled={isPending}
                                placeholder="Tracking number"
                                className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none focus:border-zinc-400"
                            />
                            <div className="flex items-center justify-end gap-2 pt-1">
                                <button
                                    onClick={() => {
                                        setShowShipForm(false);
                                        setError(null);
                                    }}
                                    disabled={isPending}
                                    className="h-8 rounded-md border border-zinc-200 px-3 text-[12px] text-zinc-700 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        const c = courierName.trim();
                                        const t = trackingNumber.trim();
                                        if (!c || !t) {
                                            setError("Tracking number and courier name required");
                                            return;
                                        }
                                        updateStatus("shipped", {
                                            courier_name: c,
                                            tracking_number: t,
                                        });
                                    }}
                                    disabled={isPending}
                                    className="h-8 rounded-md bg-zinc-900 px-3 text-[12px] text-white disabled:opacity-50 flex items-center gap-1.5"
                                >
                                    {isPending ? (
                                        <>
                                            <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                            </svg>
                                            Saving…
                                        </>
                                    ) : "Confirm Ship"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {error ? <p className="max-w-[260px] text-right text-[12px] text-red-600">{error}</p> : null}
            </div>
        );
    }

    return (
        <div className="flex flex-col items-end gap-2">
            <button
                onClick={() => updateStatus(next.value)}
                disabled={isPending}
                className="h-9 rounded-full bg-zinc-900 px-4 text-[13px] text-white transition hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
                {isPending ? (
                    <>
                        <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                        Updating…
                    </>
                ) : next.label}
            </button>
            {error ? <p className="max-w-[220px] text-right text-[12px] text-red-600">{error}</p> : null}
        </div>
    );
}
