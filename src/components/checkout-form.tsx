"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";

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

interface CheckoutProfile {
    full_name: string;
    email: string;
    phone: string;
    address_line1: string;
    address_line2: string;
    city: string;
    state: string;
    pincode: string;
}

export default function CheckoutForm({ initialProfile }: { initialProfile?: CheckoutProfile }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [scriptReady, setScriptReady] = useState(false);

    // Pre-load Razorpay script while user fills the form
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
            if (script.parentNode) script.parentNode.removeChild(script);
        };
    }, []);

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);

        const form = e.currentTarget;
        const formData = new FormData(form);

        startTransition(async () => {
            try {
                // Step 1: Create the order
                const res = await fetch("/api/checkout", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        full_name: String(formData.get("full_name") || "").trim(),
                        email: String(formData.get("email") || "").trim().toLowerCase(),
                        phone: String(formData.get("phone") || "").trim(),
                        address_line1: String(formData.get("address_line1") || "").trim(),
                        address_line2: String(formData.get("address_line2") || "").trim(),
                        city: String(formData.get("city") || "").trim(),
                        state: String(formData.get("state") || "").trim(),
                        pincode: String(formData.get("pincode") || "").trim(),
                    }),
                });

                const json = await res.json();

                if (!res.ok) {
                    setError(json.error || "Checkout failed");
                    return;
                }

                const orderId = json.orderId;

                // Step 2: Immediately initiate payment
                if (!scriptReady) {
                    // Fallback: if Razorpay didn't load, go to order page
                    router.replace(`/order/${orderId}`);
                    router.refresh();
                    return;
                }

                const payRes = await fetch("/api/payments/create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orderId }),
                });

                if (!payRes.ok) {
                    const payErr = await payRes.json();
                    setError(payErr.error || "Failed to initiate payment");
                    // Redirect to order page so they can retry
                    router.replace(`/order/${orderId}`);
                    return;
                }

                const payData = await payRes.json();

                // Step 3: Open Razorpay checkout
                const email = String(formData.get("email") || "").trim().toLowerCase();
                const options: RazorpayOptions = {
                    key: payData.key,
                    amount: payData.amount,
                    currency: payData.currency,
                    name: "Vinnys Vogue",
                    description: `Order ${payData.orderId.slice(0, 8).toUpperCase()}`,
                    order_id: payData.razorpayOrderId,
                    handler: function () {
                        window.location.href = `/order/${orderId}`;
                    },
                    theme: { color: "#1C1A18" },
                    prefill: email ? { email } : undefined,
                };

                const rzp = new window.Razorpay(options);
                rzp.open();
            } catch {
                setError("Something went wrong. Please try again.");
            }
        });
    }

    const inputClass =
        "h-12 w-full rounded-full border border-[rgba(0,0,0,0.1)] bg-bg-card px-5 text-[15px] text-heading outline-none transition-all duration-300 focus:border-gold focus:ring-1 focus:ring-gold/15 placeholder:text-[rgba(0,0,0,0.25)]";

    const labelClass = "text-[11px] font-medium tracking-[0.2em] text-muted uppercase";

    const p = initialProfile;

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                    <label htmlFor="checkout_full_name" className={labelClass}>Full Name</label>
                    <input id="checkout_full_name" name="full_name" required className={inputClass} placeholder="Jane Doe" defaultValue={p?.full_name} />
                </div>
                <div className="space-y-2">
                    <label htmlFor="checkout_phone" className={labelClass}>Phone</label>
                    <input id="checkout_phone" name="phone" required className={inputClass} placeholder="+91 98765 43210" defaultValue={p?.phone} />
                </div>
            </div>

            <div className="space-y-2">
                <label htmlFor="checkout_email" className={labelClass}>Email</label>
                <input id="checkout_email" name="email" type="email" required className={inputClass} placeholder="jane@example.com" defaultValue={p?.email} />
            </div>

            <div className="space-y-2">
                <label htmlFor="checkout_address1" className={labelClass}>Address Line 1</label>
                <input id="checkout_address1" name="address_line1" required className={inputClass} placeholder="House / Flat / Apartment" defaultValue={p?.address_line1} />
            </div>

            <div className="space-y-2">
                <label htmlFor="checkout_address2" className={labelClass}>Address Line 2</label>
                <input id="checkout_address2" name="address_line2" className={inputClass} placeholder="Street / Area (optional)" defaultValue={p?.address_line2} />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div className="space-y-2">
                    <label htmlFor="checkout_city" className={labelClass}>City</label>
                    <input id="checkout_city" name="city" required className={inputClass} placeholder="Mumbai" defaultValue={p?.city} />
                </div>
                <div className="space-y-2">
                    <label htmlFor="checkout_state" className={labelClass}>State</label>
                    <input id="checkout_state" name="state" required className={inputClass} placeholder="Maharashtra" defaultValue={p?.state} />
                </div>
                <div className="space-y-2">
                    <label htmlFor="checkout_pincode" className={labelClass}>Pincode</label>
                    <input id="checkout_pincode" name="pincode" required className={inputClass} placeholder="400001" defaultValue={p?.pincode} />
                </div>
            </div>

            {error ? (
                <div className="rounded-[20px] border border-red-200 bg-red-50 px-5 py-3 text-[14px] text-red-700">
                    {error}
                </div>
            ) : null}

            <button
                type="submit"
                disabled={isPending}
                className="h-12 w-full rounded-full bg-accent text-[14px] font-medium tracking-wide text-white hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
            >
                {isPending ? (
                    <>
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                        Processing Payment…
                    </>
                ) : "Place Order & Pay"}
            </button>
        </form>
    );
}
