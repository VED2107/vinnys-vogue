"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function UpdatePasswordPage() {
    const router = useRouter();
    const supabase = useMemo(() => createSupabaseBrowserClient(), []);

    const [ready, setReady] = useState(false);
    const [noSession, setNoSession] = useState(false);
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === "PASSWORD_RECOVERY") {
                setReady(true);
            }
        });

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setReady(true);
            } else {
                setNoSession(true);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [supabase]);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        if (password !== confirm) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password,
            });

            if (updateError) {
                setError(updateError.message);
                return;
            }

            setSuccess(true);
            setTimeout(() => {
                router.replace("/account");
                router.refresh();
            }, 2000);
        } finally {
            setLoading(false);
        }
    }

    const inputClass =
        "h-12 w-full rounded-full border border-[rgba(0,0,0,0.1)] bg-bg-card px-5 text-[15px] text-heading outline-none transition-all duration-400 focus:border-gold focus:ring-1 focus:ring-gold/15 placeholder:text-[rgba(0,0,0,0.25)]";

    if (!ready && !noSession) {
        return (
            <div className="min-h-screen bg-bg-primary">
                <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-6 py-16 text-center">
                    <p className="text-[15px] text-muted">Verifying recovery link…</p>
                </div>
            </div>
        );
    }

    if (noSession && !ready) {
        return (
            <div className="min-h-screen bg-bg-primary">
                <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-6 py-16">
                    <div className="rounded-[20px] border border-red-200 bg-red-50 p-8 text-center">
                        <div className="font-serif text-xl font-light text-heading">Invalid or Expired Link</div>
                        <p className="mt-3 text-[15px] text-red-700">
                            This password reset link is invalid or has expired. Please request a new one from your account page.
                        </p>
                        <a
                            href="/login"
                            className="mt-6 inline-block rounded-full bg-accent px-6 py-3 text-[14px] font-medium text-white hover-lift hover:bg-accent-hover"
                        >
                            Go to Sign In
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-bg-primary">
                <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-6 py-16">
                    <div className="rounded-[20px] border border-green-200 bg-green-50 p-8 text-center">
                        <div className="font-serif text-xl font-light text-heading">Password Updated</div>
                        <p className="mt-3 text-[15px] text-green-800">
                            Your password has been changed successfully. Redirecting to your account…
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg-primary">
            <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-6 py-16">
                <div className="rounded-[20px] border border-[rgba(0,0,0,0.06)] bg-bg-card p-8">
                    <div className="space-y-3">
                        <div className="gold-divider" />
                        <h1 className="font-serif text-2xl font-light tracking-[-0.02em] text-heading">Set New Password</h1>
                        <p className="text-[15px] leading-[1.7] text-muted">
                            Enter your new password below.
                        </p>
                    </div>

                    <form onSubmit={onSubmit} className="mt-8 space-y-5">
                        <div className="space-y-2">
                            <label className="text-[11px] font-medium tracking-[0.2em] text-muted uppercase">New Password</label>
                            <input
                                type="password"
                                className={inputClass}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="new-password"
                                placeholder="At least 6 characters"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-medium tracking-[0.2em] text-muted uppercase">Confirm Password</label>
                            <input
                                type="password"
                                className={inputClass}
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                autoComplete="new-password"
                                placeholder="Re-enter password"
                            />
                        </div>

                        {error && (
                            <div className="rounded-[20px] border border-red-200 bg-red-50 px-5 py-3 text-[14px] text-red-700">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="h-12 w-full rounded-full bg-accent text-[14px] font-medium tracking-wide text-white hover-lift hover:bg-accent-hover disabled:opacity-60"
                        >
                            {loading ? "Updating…" : "Update Password"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
