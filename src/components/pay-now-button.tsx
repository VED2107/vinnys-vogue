"use client";

import { useState, useEffect } from "react";

/* Declare Razorpay on the window object for TypeScript */
declare global {
    interface Window {
        Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
    }
}

interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    order_id: string;
    handler: () => void;
    theme: { color: string };
    prefill?: { email?: string };
}

interface RazorpayInstance {
    open: () => void;
}

export default function PayNowButton({
    orderId,
    userEmail,
}: {
    orderId: string;
    userEmail?: string;
}) {
    const [loading, setLoading] = useState(false);
    const [scriptReady, setScriptReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load the Razorpay checkout script once
    useEffect(() => {
        if (typeof window !== "undefined" && window.Razorpay) {
            setScriptReady(true);
            return;
        }

        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => setScriptReady(true);
        document.body.appendChild(script);

        return () => {
            // Cleanup only if we appended it
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        };
    }, []);

    async function handlePay() {
        if (loading || !scriptReady) return;
        setLoading(true);
        setError(null);

        try {
            // Step 1: Create Razorpay order on the server
            const res = await fetch("/api/payments/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId }),
            });

            if (!res.ok) {
                const err = await res.json();
                setError(err.error || "Failed to initiate payment");
                setLoading(false);
                return;
            }

            const data = await res.json();

            // Step 2: Open Razorpay checkout
            const options: RazorpayOptions = {
                key: data.key,
                amount: data.amount,
                currency: data.currency,
                name: "Vinnys Vogue",
                description: `Order ${data.orderId.slice(0, 8).toUpperCase()}`,
                order_id: data.razorpayOrderId,
                handler: function () {
                    window.location.href = `/order/${orderId}`;
                },
                theme: { color: "#1C1A18" },
                prefill: userEmail ? { email: userEmail } : undefined,
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch {
            setError("Something went wrong. Please try again.");
            setLoading(false);
        }
    }

    return (
        <div className="inline-flex flex-col items-stretch gap-2 w-full sm:w-auto">
            <button
                onClick={handlePay}
                disabled={loading || !scriptReady}
                className="inline-flex h-12 items-center justify-center rounded-full bg-accent px-8 text-[14px] font-medium tracking-wide text-white hover-lift hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? (
                    <span className="flex items-center gap-2">
                        <svg
                            className="animate-spin h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                        </svg>
                        Processing…
                    </span>
                ) : (
                    "Pay Now"
                )}
            </button>
            {error && (
                <div className="rounded-[14px] border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] text-red-700 text-center animate-[fadeInSoft_0.3s_ease-out]">
                    {error}
                </div>
            )}
        </div>
    );
}
