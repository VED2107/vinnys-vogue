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
    handler: (response: RazorpayResponse) => void;
    theme: { color: string };
    prefill?: { email?: string };
}

interface RazorpayInstance {
    open: () => void;
}

interface RazorpayResponse {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
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

        try {
            // Step 1: Create Razorpay order on the server
            const res = await fetch("/api/payments/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId }),
            });

            if (!res.ok) {
                const err = await res.json();
                alert(err.error || "Failed to initiate payment");
                setLoading(false);
                return;
            }

            const data = await res.json();

            // Step 2: Open Razorpay checkout
            const options: RazorpayOptions = {
                key: data.key,
                amount: data.amount,
                currency: data.currency,
                name: "Vinny's Vogue",
                description: `Order ${data.orderId.slice(0, 8).toUpperCase()}`,
                order_id: data.razorpayOrderId,
                handler: async (response: RazorpayResponse) => {
                    // Step 3: Verify on server
                    try {
                        const verifyRes = await fetch("/api/payments/verify", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                orderId: data.orderId,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                            }),
                        });

                        if (verifyRes.ok) {
                            // Reload page to reflect paid status
                            window.location.reload();
                        } else {
                            const err = await verifyRes.json();
                            alert(err.error || "Payment verification failed");
                        }
                    } catch {
                        alert("Payment verification failed. Please contact support.");
                    } finally {
                        setLoading(false);
                    }
                },
                theme: { color: "#18181b" },
                prefill: userEmail ? { email: userEmail } : undefined,
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch {
            alert("Something went wrong. Please try again.");
            setLoading(false);
        }
    }

    return (
        <button
            onClick={handlePay}
            disabled={loading || !scriptReady}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-zinc-900 px-8 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
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
    );
}
