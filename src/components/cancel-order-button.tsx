"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CancelOrderButton({ orderId }: { orderId: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleCancel() {
        if (!confirm("Are you sure you want to cancel this order? This cannot be undone.")) return;

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/orders/${orderId}/cancel`, {
                method: "POST",
            });

            const json = await res.json();

            if (!res.ok) {
                setError(json.error || "Failed to cancel order");
                return;
            }

            router.refresh();
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col items-center gap-2">
            <button
                onClick={handleCancel}
                disabled={loading}
                className="inline-flex h-12 items-center justify-center rounded-full border border-red-200 bg-red-50 px-8 text-[14px] font-medium text-red-700 transition-all duration-300 hover:bg-red-100 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? (
                    <span className="flex items-center gap-2">
                        <svg
                            className="animate-spin h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Cancelling…
                    </span>
                ) : (
                    "Cancel Order"
                )}
            </button>
            {error && (
                <p className="text-[13px] text-red-600">{error}</p>
            )}
        </div>
    );
}
