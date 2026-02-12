"use client";

import { useState, useEffect, useTransition } from "react";
import { checkout } from "@/app/cart/actions";

export default function CheckoutForm() {
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [addressLine1, setAddressLine1] = useState("");
    const [addressLine2, setAddressLine2] = useState("");
    const [postalCode, setPostalCode] = useState("");
    const [city, setCity] = useState("");
    const [state, setState] = useState("");
    const [country] = useState("India");
    const [pinLoading, setPinLoading] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    // Auto-fetch city/state when pincode is 6 digits
    useEffect(() => {
        if (postalCode.length !== 6) return;

        let cancelled = false;
        setPinLoading(true);

        fetch(`/api/pincode/${postalCode}`)
            .then((r) => r.json())
            .then((data) => {
                if (cancelled) return;
                if (data.city) setCity(data.city);
                if (data.state) setState(data.state);
            })
            .catch(() => { })
            .finally(() => {
                if (!cancelled) setPinLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [postalCode]);

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);

        if (!fullName.trim() || !phone.trim() || !addressLine1.trim() || !postalCode.trim() || !city.trim() || !state.trim()) {
            setError("Please fill in all required fields.");
            return;
        }

        if (!/^\d{10}$/.test(phone.replace(/\s/g, ""))) {
            setError("Please enter a valid 10-digit phone number.");
            return;
        }

        if (!/^\d{6}$/.test(postalCode)) {
            setError("Please enter a valid 6-digit pincode.");
            return;
        }

        const formData = new FormData();
        formData.set("full_name", fullName.trim());
        formData.set("phone", phone.trim());
        formData.set("address_line1", addressLine1.trim());
        formData.set("address_line2", addressLine2.trim());
        formData.set("postal_code", postalCode.trim());
        formData.set("city", city.trim());
        formData.set("state", state.trim());
        formData.set("country", country);

        startTransition(async () => {
            try {
                await checkout(formData);
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : "Something went wrong.");
            }
        });
    }

    const inputClass =
        "h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 placeholder:text-zinc-400";
    const labelClass = "text-xs font-medium text-zinc-600";

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* Full Name */}
            <div className="space-y-1.5">
                <label htmlFor="full_name" className={labelClass}>
                    Full Name <span className="text-red-400">*</span>
                </label>
                <input
                    id="full_name"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={inputClass}
                    required
                />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
                <label htmlFor="phone" className={labelClass}>
                    Phone Number <span className="text-red-400">*</span>
                </label>
                <input
                    id="phone"
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputClass}
                    required
                />
            </div>

            {/* Address Line 1 */}
            <div className="space-y-1.5">
                <label htmlFor="address_line1" className={labelClass}>
                    Address Line 1 <span className="text-red-400">*</span>
                </label>
                <input
                    id="address_line1"
                    type="text"
                    placeholder="House number, street name"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    className={inputClass}
                    required
                />
            </div>

            {/* Address Line 2 */}
            <div className="space-y-1.5">
                <label htmlFor="address_line2" className={labelClass}>
                    Address Line 2
                </label>
                <input
                    id="address_line2"
                    type="text"
                    placeholder="Apartment, landmark (optional)"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    className={inputClass}
                />
            </div>

            {/* Pincode + City + State in a row */}
            <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                    <label htmlFor="postal_code" className={labelClass}>
                        Pincode <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                        <input
                            id="postal_code"
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="6-digit"
                            value={postalCode}
                            onChange={(e) => {
                                const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                                setPostalCode(v);
                            }}
                            className={inputClass}
                            required
                        />
                        {pinLoading && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label htmlFor="city" className={labelClass}>
                        City <span className="text-red-400">*</span>
                    </label>
                    <input
                        id="city"
                        type="text"
                        placeholder="City"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className={inputClass}
                        required
                    />
                </div>

                <div className="space-y-1.5">
                    <label htmlFor="state" className={labelClass}>
                        State <span className="text-red-400">*</span>
                    </label>
                    <input
                        id="state"
                        type="text"
                        placeholder="State"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className={inputClass}
                        required
                    />
                </div>
            </div>

            {/* Country */}
            <div className="space-y-1.5">
                <label htmlFor="country" className={labelClass}>
                    Country
                </label>
                <input
                    id="country"
                    type="text"
                    value={country}
                    disabled
                    className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-500 outline-none"
                />
            </div>

            {/* Submit */}
            <button
                type="submit"
                disabled={isPending}
                className="mt-2 h-12 w-full rounded-2xl bg-gold text-sm font-medium tracking-wide text-zinc-950 transition hover:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
                {isPending ? "Placing Order…" : "Place Order"}
            </button>
        </form>
    );
}
