"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function CheckoutForm() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);

        const form = e.currentTarget;
        const formData = new FormData(form);

        startTransition(async () => {
            try {
                const res = await fetch("/api/checkout", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        full_name: String(formData.get("full_name") || "").trim(),
                        email: String(formData.get("email") || "").trim(),
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

                router.replace(`/order/${json.orderId}`);
                router.refresh();
            } catch {
                setError("Something went wrong. Please try again.");
            }
        });
    }

    const inputClass =
        "h-12 w-full rounded-full border border-[rgba(0,0,0,0.1)] bg-bg-card px-5 text-[15px] text-heading outline-none transition-all duration-300 focus:border-gold focus:ring-1 focus:ring-gold/15 placeholder:text-[rgba(0,0,0,0.25)]";

    const labelClass = "text-[11px] font-medium tracking-[0.2em] text-muted uppercase";

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                    <label htmlFor="checkout_full_name" className={labelClass}>Full Name</label>
                    <input id="checkout_full_name" name="full_name" required className={inputClass} placeholder="Jane Doe" />
                </div>
                <div className="space-y-2">
                    <label htmlFor="checkout_phone" className={labelClass}>Phone</label>
                    <input id="checkout_phone" name="phone" required className={inputClass} placeholder="+91 98765 43210" />
                </div>
            </div>

            <div className="space-y-2">
                <label htmlFor="checkout_email" className={labelClass}>Email</label>
                <input id="checkout_email" name="email" type="email" required className={inputClass} placeholder="jane@example.com" />
            </div>

            <div className="space-y-2">
                <label htmlFor="checkout_address1" className={labelClass}>Address Line 1</label>
                <input id="checkout_address1" name="address_line1" required className={inputClass} placeholder="House / Flat / Apartment" />
            </div>

            <div className="space-y-2">
                <label htmlFor="checkout_address2" className={labelClass}>Address Line 2</label>
                <input id="checkout_address2" name="address_line2" className={inputClass} placeholder="Street / Area (optional)" />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div className="space-y-2">
                    <label htmlFor="checkout_city" className={labelClass}>City</label>
                    <input id="checkout_city" name="city" required className={inputClass} placeholder="Mumbai" />
                </div>
                <div className="space-y-2">
                    <label htmlFor="checkout_state" className={labelClass}>State</label>
                    <input id="checkout_state" name="state" required className={inputClass} placeholder="Maharashtra" />
                </div>
                <div className="space-y-2">
                    <label htmlFor="checkout_pincode" className={labelClass}>Pincode</label>
                    <input id="checkout_pincode" name="pincode" required className={inputClass} placeholder="400001" />
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
                className="h-12 w-full rounded-full bg-accent text-[14px] font-medium tracking-wide text-white hover-lift hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isPending ? "Placing Order…" : "Place Order"}
            </button>
        </form>
    );
}
