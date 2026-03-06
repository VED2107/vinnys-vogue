"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CancelOrderButton({ orderId, compact }: { orderId: string; compact?: boolean }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);

    async function handleCancel() {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/orders/${orderId}/cancel`, {
                method: "POST",
            });

            const json = await res.json();

            if (!res.ok) {
                setError(json.error || "Failed to cancel order");
                setShowConfirm(false);
                return;
            }

            setShowConfirm(false);
            router.refresh();
        } catch {
            setError("Something went wrong. Please try again.");
            setShowConfirm(false);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="relative inline-flex flex-col items-center gap-2">
            {/* Confirmation popup — positioned near the button */}
            {showConfirm && (
                <>
                    {/* Click-away backdrop */}
                    <div className="fixed inset-0 z-40" onClick={() => !loading && setShowConfirm(false)} />
                    {/* Dialog positioned above the button */}
                    <div className="absolute bottom-full right-0 z-50 mb-3 w-[320px] rounded-[24px] bg-white p-6 shadow-2xl border border-[rgba(0,0,0,0.08)] animate-[fadeInSoft_0.2s_ease-out]">
                        <div className="flex flex-col items-center text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="15" y1="9" x2="9" y2="15" />
                                    <line x1="9" y1="9" x2="15" y2="15" />
                                </svg>
                            </div>
                            <h3 className="mt-3 font-serif text-lg font-light text-heading">Cancel Order?</h3>
                            <p className="mt-1.5 text-[13px] text-muted leading-relaxed">
                                This action cannot be undone. Your order will be cancelled{" "}
                                and any payment will be refunded.
                            </p>
                            <div className="mt-5 flex w-full gap-3">
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    disabled={loading}
                                    className="flex-1 h-10 rounded-full border border-[rgba(0,0,0,0.1)] text-[13px] font-medium text-heading transition-all duration-200 hover:border-[rgba(0,0,0,0.2)] disabled:opacity-50"
                                >
                                    Keep Order
                                </button>
                                <button
                                    onClick={handleCancel}
                                    disabled={loading}
                                    className="flex-1 h-10 rounded-full bg-red-600 text-[13px] font-medium text-white transition-all duration-200 hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            Cancelling…
                                        </>
                                    ) : "Yes, Cancel"}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Trigger button */}
            <button
                onClick={() => setShowConfirm(true)}
                disabled={loading}
                className={
                    compact
                        ? "inline-flex h-9 items-center justify-center rounded-full border border-red-200 px-4 text-[12px] font-medium text-red-600 transition-all duration-300 hover:bg-red-50 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        : "inline-flex h-12 items-center justify-center rounded-full border border-red-200 bg-red-50 px-8 text-[14px] font-medium text-red-700 transition-all duration-300 hover:bg-red-100 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                }
            >
                Cancel Order
            </button>

            {error && (
                <div className="rounded-[14px] border border-red-200 bg-red-50 px-4 py-2 text-[13px] text-red-700 text-center">
                    {error}
                </div>
            )}
        </div>
    );
}
