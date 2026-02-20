"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { MandalaBackground } from "@/components/decorative";
import { GoldDivider } from "@/components/section-divider";

/* ——— Zod Schemas ——— */
const emailSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
});

const otpSchema = z.object({
    otp: z
        .string()
        .length(6, "OTP must be exactly 6 digits")
        .regex(/^\d{6}$/, "OTP must contain only digits"),
});

const passwordSchema = z
    .object({
        password: z.string().min(6, "Password must be at least 6 characters"),
        confirm: z.string(),
    })
    .refine((d) => d.password === d.confirm, {
        message: "Passwords do not match",
        path: ["confirm"],
    });

/* ——— Types ——— */
type Step = "email" | "otp" | "password";

export default function ChangePasswordPage() {
    const router = useRouter();

    const [step, setStep] = useState<Step>("email");
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    /* ——— Resend Timer ——— */
    const [cooldown, setCooldown] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const startCooldown = useCallback(() => {
        setCooldown(60);
        timerRef.current = setInterval(() => {
            setCooldown((prev) => {
                if (prev <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, []);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    /* ——— API Helper ——— */
    const callApi = useMemo(
        () =>
            async (payload: Record<string, string>) => {
                const res = await fetch("/api/password-otp", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Something went wrong");
                return data;
            },
        [],
    );

    /* ——— Handlers ——— */
    async function handleSendOtp(e?: React.FormEvent) {
        e?.preventDefault();
        setError(null);

        const result = emailSchema.safeParse({ email: email.trim().toLowerCase() });
        if (!result.success) {
            setError(result.error.issues[0].message);
            return;
        }

        setLoading(true);
        try {
            await callApi({ action: "generate", email: result.data.email });
            setStep("otp");
            startCooldown();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    }

    async function handleVerifyOtp(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        const otpResult = otpSchema.safeParse({ otp });
        if (!otpResult.success) {
            setError(otpResult.error.issues[0].message);
            return;
        }

        const pwResult = passwordSchema.safeParse({ password, confirm });
        if (!pwResult.success) {
            setError(pwResult.error.issues[0].message);
            return;
        }

        setLoading(true);
        try {
            await callApi({
                action: "verify",
                email: email.trim().toLowerCase(),
                otp: otpResult.data.otp,
                new_password: pwResult.data.password,
            });
            setSuccess(true);
            setTimeout(() => {
                router.replace("/login");
                router.refresh();
            }, 2500);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Verification failed");
        } finally {
            setLoading(false);
        }
    }

    /* ——— Shared Classes ——— */
    const inputClass =
        "h-12 w-full rounded-full border border-[rgba(0,0,0,0.1)] bg-bg-card px-5 text-[15px] text-heading outline-none transition-all duration-300 focus:border-gold focus:ring-1 focus:ring-gold/15 placeholder:text-[rgba(0,0,0,0.25)]";

    const btnPrimary =
        "h-12 w-full rounded-full bg-accent text-[14px] font-medium tracking-wide text-white hover-lift hover:bg-accent-hover disabled:opacity-60 flex items-center justify-center gap-2";

    const Spinner = () => (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
    );

    /* ——— Success State ——— */
    if (success) {
        return (
            <div className="relative min-h-screen overflow-hidden bg-bg-primary">
                <MandalaBackground variant="lotus" position="center" />
                <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-6 py-16">
                    <div className="rounded-[20px] border border-green-200 bg-green-50 p-8 text-center">
                        <div className="font-serif text-xl font-light text-heading">Password Updated</div>
                        <p className="mt-3 text-[15px] text-green-800">
                            Your password has been changed successfully. Redirecting to sign in…
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-bg-primary">
            <MandalaBackground variant="lotus" position="center" />
            <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-6 py-16">
                <div className="rounded-[20px] border border-[rgba(0,0,0,0.06)] bg-white/70 backdrop-blur-md p-8">
                    {/* ——— Header ——— */}
                    <div className="space-y-3">
                        <div className="gold-divider" />
                        <h1 className="font-serif text-2xl font-light tracking-[-0.02em] text-heading">
                            Reset Password
                        </h1>
                        <p className="text-[15px] leading-[1.7] text-muted">
                            {step === "email" && "Enter your account email to receive a 6-digit OTP."}
                            {step === "otp" && `We sent a code to ${email}. Enter it below with your new password.`}
                            {step === "password" && "Choose a new password for your account."}
                        </p>
                    </div>

                    {/* ——— Step Indicator ——— */}
                    <div className="mt-6 flex items-center gap-2">
                        {(["email", "otp", "password"] as Step[]).map((s, i) => (
                            <div key={s} className="flex items-center gap-2">
                                <div
                                    className={`flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-semibold transition-all duration-300 ${step === s
                                        ? "bg-accent text-white"
                                        : (["email", "otp", "password"].indexOf(step) > i)
                                            ? "bg-accent/20 text-accent"
                                            : "bg-[rgba(0,0,0,0.06)] text-muted"
                                        }`}
                                >
                                    {(["email", "otp", "password"].indexOf(step) > i) ? "✓" : i + 1}
                                </div>
                                {i < 2 && (
                                    <div
                                        className={`h-px w-8 transition-colors duration-300 ${(["email", "otp", "password"].indexOf(step) > i) ? "bg-accent/30" : "bg-[rgba(0,0,0,0.06)]"
                                            }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* ——— Error ——— */}
                    {error && (
                        <div className="mt-5 rounded-[20px] border border-red-200 bg-red-50 px-5 py-3 text-[14px] text-red-700">
                            {error}
                        </div>
                    )}

                    {/* ——— Step 1: Email ——— */}
                    {step === "email" && (
                        <form onSubmit={handleSendOtp} className="mt-6 space-y-5">
                            <div className="space-y-2">
                                <label htmlFor="reset_email" className="text-[11px] font-medium tracking-[0.2em] text-muted uppercase">
                                    Email
                                </label>
                                <input
                                    id="reset_email"
                                    type="email"
                                    className={inputClass}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete="email"
                                    placeholder="you@domain.com"
                                    required
                                />
                            </div>

                            <button type="submit" disabled={loading} className={btnPrimary}>
                                {loading ? (<><Spinner /> Sending…</>) : "Send OTP"}
                            </button>

                            <div className="pt-2 text-center text-[14px] text-muted">
                                Remember your password?{" "}
                                <a className="font-medium text-heading underline underline-offset-4" href="/login">
                                    Sign in
                                </a>
                            </div>
                        </form>
                    )}

                    {/* ——— Step 2: OTP + New Password ——— */}
                    {step === "otp" && (
                        <form onSubmit={handleVerifyOtp} className="mt-6 space-y-5">
                            <div className="space-y-2">
                                <label htmlFor="reset_otp" className="text-[11px] font-medium tracking-[0.2em] text-muted uppercase">
                                    6-Digit OTP
                                </label>
                                <input
                                    id="reset_otp"
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    className={`${inputClass} text-center tracking-[0.5em] text-lg font-semibold`}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                    placeholder="• • • • • •"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="reset_password" className="text-[11px] font-medium tracking-[0.2em] text-muted uppercase">
                                    New Password
                                </label>
                                <input
                                    id="reset_password"
                                    type="password"
                                    className={inputClass}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="new-password"
                                    placeholder="At least 6 characters"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="reset_confirm" className="text-[11px] font-medium tracking-[0.2em] text-muted uppercase">
                                    Confirm Password
                                </label>
                                <input
                                    id="reset_confirm"
                                    type="password"
                                    className={inputClass}
                                    value={confirm}
                                    onChange={(e) => setConfirm(e.target.value)}
                                    autoComplete="new-password"
                                    placeholder="Re-enter password"
                                    required
                                />
                            </div>

                            <button type="submit" disabled={loading} className={btnPrimary}>
                                {loading ? (<><Spinner /> Verifying…</>) : "Reset Password"}
                            </button>

                            {/* ——— Resend Timer ——— */}
                            <div className="text-center">
                                {cooldown > 0 ? (
                                    <p className="text-[13px] text-muted">
                                        Resend OTP in{" "}
                                        <span className="font-semibold text-heading">{cooldown}s</span>
                                    </p>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => handleSendOtp()}
                                        disabled={loading}
                                        className="text-[13px] font-medium text-accent underline underline-offset-4 hover:text-accent-hover disabled:opacity-50"
                                    >
                                        Resend OTP
                                    </button>
                                )}
                            </div>

                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setStep("email");
                                        setOtp("");
                                        setPassword("");
                                        setConfirm("");
                                        setError(null);
                                    }}
                                    className="text-[13px] text-muted underline underline-offset-4 hover:text-heading"
                                >
                                    Use a different email
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                <GoldDivider className="mt-8 mb-4" />
            </div>
        </div>
    );
}
