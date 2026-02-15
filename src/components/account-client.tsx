"use client";

import { useState, useTransition } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type ProfileData = {
    full_name: string | null;
    phone: string | null;
    address_line1: string | null;
    address_line2: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    country: string | null;
};

export function UpdateProfileForm({ profile }: { profile: ProfileData }) {
    const supabase = createSupabaseBrowserClient();
    const [isPending, startTransition] = useTransition();
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setSuccess(false);
        setError(null);

        const fd = new FormData(e.currentTarget);

        startTransition(async () => {
            const { error: updateError } = await supabase
                .from("profiles")
                .update({
                    full_name: (fd.get("full_name") as string)?.trim() || null,
                    phone: (fd.get("phone") as string)?.trim() || null,
                    address_line1: (fd.get("address_line1") as string)?.trim() || null,
                    address_line2: (fd.get("address_line2") as string)?.trim() || null,
                    city: (fd.get("city") as string)?.trim() || null,
                    state: (fd.get("state") as string)?.trim() || null,
                    postal_code: (fd.get("postal_code") as string)?.trim() || null,
                    country: (fd.get("country") as string)?.trim() || null,
                })
                .eq("id", (await supabase.auth.getUser()).data.user!.id);

            if (updateError) {
                setError(updateError.message);
            } else {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
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
                    <label htmlFor="acc_full_name" className={labelClass}>Full Name</label>
                    <input id="acc_full_name" name="full_name" defaultValue={profile.full_name ?? ""} className={inputClass} placeholder="Jane Doe" />
                </div>
                <div className="space-y-2">
                    <label htmlFor="acc_phone" className={labelClass}>Phone</label>
                    <input id="acc_phone" name="phone" defaultValue={profile.phone ?? ""} className={inputClass} placeholder="+91 98765 43210" />
                </div>
            </div>

            <div className="space-y-2">
                <label htmlFor="acc_address1" className={labelClass}>Address Line 1</label>
                <input id="acc_address1" name="address_line1" defaultValue={profile.address_line1 ?? ""} className={inputClass} placeholder="House / Flat / Apartment" />
            </div>

            <div className="space-y-2">
                <label htmlFor="acc_address2" className={labelClass}>Address Line 2</label>
                <input id="acc_address2" name="address_line2" defaultValue={profile.address_line2 ?? ""} className={inputClass} placeholder="Street / Area (optional)" />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                    <label htmlFor="acc_city" className={labelClass}>City</label>
                    <input id="acc_city" name="city" defaultValue={profile.city ?? ""} className={inputClass} placeholder="Mumbai" />
                </div>
                <div className="space-y-2">
                    <label htmlFor="acc_state" className={labelClass}>State</label>
                    <input id="acc_state" name="state" defaultValue={profile.state ?? ""} className={inputClass} placeholder="Maharashtra" />
                </div>
                <div className="space-y-2">
                    <label htmlFor="acc_postal" className={labelClass}>Postal Code</label>
                    <input id="acc_postal" name="postal_code" defaultValue={profile.postal_code ?? ""} className={inputClass} placeholder="400001" />
                </div>
                <div className="space-y-2">
                    <label htmlFor="acc_country" className={labelClass}>Country</label>
                    <input id="acc_country" name="country" defaultValue={profile.country ?? "India"} className={inputClass} placeholder="India" />
                </div>
            </div>

            {error && (
                <div className="rounded-[20px] border border-red-200 bg-red-50 px-5 py-3 text-[14px] text-red-700">
                    {error}
                </div>
            )}

            {success && (
                <div className="rounded-[20px] border border-green-200 bg-green-50 px-5 py-3 text-[14px] text-green-800">
                    Profile updated successfully.
                </div>
            )}

            <button
                type="submit"
                disabled={isPending}
                className="h-12 rounded-full bg-accent px-8 text-[14px] font-medium tracking-wide text-white hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
            >
                {isPending ? (
                    <>
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                        Saving…
                    </>
                ) : "Save Changes"}
            </button>
        </form>
    );
}

export function ChangePasswordButton({ email }: { email: string }) {
    const supabase = createSupabaseBrowserClient();
    const [isPending, startTransition] = useTransition();
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function handleClick() {
        setSuccess(false);
        setError(null);

        startTransition(async () => {
            const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${siteUrl}/update-password`,
            });

            if (resetError) {
                setError(resetError.message);
            } else {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 5000);
            }
        });
    }

    return (
        <div className="space-y-3">
            <button
                type="button"
                onClick={handleClick}
                disabled={isPending}
                className="h-12 rounded-full border border-[rgba(0,0,0,0.1)] px-8 text-[14px] text-heading transition-all duration-300 hover:border-[rgba(0,0,0,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isPending ? "Sending…" : "Send Password Reset Email"}
            </button>

            {error && (
                <div className="rounded-[20px] border border-red-200 bg-red-50 px-5 py-3 text-[14px] text-red-700">
                    {error}
                </div>
            )}

            {success && (
                <div className="rounded-[20px] border border-green-200 bg-green-50 px-5 py-3 text-[14px] text-green-800">
                    Password reset email sent to {email}. Check your inbox.
                </div>
            )}
        </div>
    );
}
