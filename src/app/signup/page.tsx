"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { PageMandala } from "@/components/decorative";
import { z } from "zod";

const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters");

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  // ── state ──
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [verifyPassword, setVerifyPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // ── resend countdown ──
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(
      () => setResendTimer((t) => t - 1),
      1000,
    );
    return () => clearInterval(interval);
  }, [resendTimer]);

  // ── API helper ──
  const callApi = useMemo(
    () =>
      async (payload: Record<string, string>) => {
        const res = await fetch("/api/signup-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        return res.json() as Promise<{
          success?: boolean;
          error?: string;
        }>;
      },
    [],
  );

  // ── Step 1: send OTP ──
  const handleSendOTP = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      const parsed = passwordSchema.safeParse(password);
      if (!parsed.success) {
        setError(parsed.error.issues[0].message);
        return;
      }

      setLoading(true);
      try {
        const data = await callApi({
          action: "generate",
          email: email.trim().toLowerCase(),
        });
        if (data.error) {
          setError(data.error);
          return;
        }
        setStep(2);
        setResendTimer(60);
      } finally {
        setLoading(false);
      }
    },
    [email, password, callApi],
  );

  // ── Step 2: verify OTP + create account ──
  const handleVerify = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (otp.length !== 6) {
        setError("Please enter the 6-digit OTP");
        return;
      }

      const parsed = passwordSchema.safeParse(verifyPassword);
      if (!parsed.success) {
        setError(parsed.error.issues[0].message);
        return;
      }

      if (verifyPassword !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      setLoading(true);
      try {
        const data = await callApi({
          action: "verify",
          email: email.trim().toLowerCase(),
          otp,
          password: verifyPassword,
        });

        if (data.error) {
          setError(data.error);
          return;
        }

        // Account created — auto sign in
        const { error: signInError } =
          await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password: verifyPassword,
          });

        if (signInError) {
          setError(signInError.message);
          return;
        }

        router.replace(redirect);
        router.refresh();
      } finally {
        setLoading(false);
      }
    },
    [email, otp, verifyPassword, confirmPassword, callApi, supabase, router, redirect],
  );

  // ── resend OTP ──
  const handleResend = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await callApi({
        action: "generate",
        email: email.trim().toLowerCase(),
      });
      if (data.error) {
        setError(data.error);
      } else {
        setResendTimer(60);
        setOtp("");
      }
    } finally {
      setLoading(false);
    }
  }, [email, callApi]);

  const inputClass =
    "h-12 w-full rounded-full border border-[rgba(0,0,0,0.1)] bg-bg-card px-5 text-[15px] text-heading outline-none transition-all duration-300 focus:border-gold focus:ring-1 focus:ring-gold/15 placeholder:text-[rgba(0,0,0,0.25)]";
  const labelClass =
    "text-[11px] font-medium tracking-[0.2em] text-muted uppercase";

  return (
    <div className="relative min-h-screen overflow-hidden bg-bg-primary">
      <PageMandala />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-6 py-16">
        <div className="rounded-[20px] border border-[rgba(0,0,0,0.06)] bg-white/70 backdrop-blur-md p-8">
          {/* ── step indicator ── */}
          <div className="flex items-center gap-2 mb-6">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-semibold ${step >= 1
                ? "bg-accent text-white"
                : "border border-[rgba(0,0,0,0.12)] text-muted"
                }`}
            >
              {step > 1 ? "✓" : "1"}
            </span>
            <span className="h-px w-6 bg-[rgba(0,0,0,0.1)]" />
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-semibold ${step === 2
                ? "bg-accent text-white"
                : "border border-[rgba(0,0,0,0.12)] text-muted"
                }`}
            >
              2
            </span>
          </div>

          <div className="space-y-3">
            <div className="gold-divider" />
            <h1 className="font-serif text-2xl font-light tracking-[-0.02em] text-heading">
              Create Account
            </h1>
            <p className="text-[15px] leading-[1.7] text-muted">
              {step === 1
                ? "Enter your email and password to get started."
                : `We sent a code to ${email.toUpperCase()}. Enter it below with your password.`}
            </p>
          </div>

          {error && (
            <div className="mt-4 rounded-[20px] border border-red-200 bg-red-50 px-5 py-3 text-[14px] text-red-700">
              {error}
            </div>
          )}

          {/* ── Step 1: Email + Password ── */}
          {step === 1 && (
            <form
              onSubmit={handleSendOTP}
              className="mt-8 space-y-5"
            >
              <div className="space-y-2">
                <label
                  htmlFor="signup_email"
                  className={labelClass}
                >
                  Email
                </label>
                <input
                  id="signup_email"
                  type="email"
                  className={inputClass}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  placeholder="you@domain.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="signup_password"
                  className={labelClass}
                >
                  Password
                </label>
                <input
                  id="signup_password"
                  type="password"
                  className={inputClass}
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-full bg-accent text-[14px] font-medium tracking-wide text-white hover-lift hover:bg-accent-hover disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="3"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    Sending OTP…
                  </>
                ) : (
                  "Send Verification Code"
                )}
              </button>

              <div className="pt-4 text-center text-[14px] text-muted">
                Already have an account?{" "}
                <a
                  className="font-medium text-heading underline underline-offset-4"
                  href={`/login?redirect=${encodeURIComponent(redirect)}`}
                >
                  Sign in
                </a>
              </div>
            </form>
          )}

          {/* ── Step 2: OTP + Password ── */}
          {step === 2 && (
            <form
              onSubmit={handleVerify}
              className="mt-8 space-y-5"
            >
              <div className="space-y-2">
                <label
                  htmlFor="signup_otp"
                  className={labelClass}
                >
                  6-Digit OTP
                </label>
                <input
                  id="signup_otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  className={`${inputClass} text-center tracking-[0.4em] text-lg font-semibold`}
                  value={otp}
                  onChange={(e) =>
                    setOtp(
                      e.target.value.replace(/\D/g, ""),
                    )
                  }
                  placeholder="• • • • • •"
                  autoFocus
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="verify_password"
                  className={labelClass}
                >
                  Password
                </label>
                <input
                  id="verify_password"
                  type="password"
                  className={inputClass}
                  value={verifyPassword}
                  onChange={(e) =>
                    setVerifyPassword(e.target.value)
                  }
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="confirm_password"
                  className={labelClass}
                >
                  Confirm Password
                </label>
                <input
                  id="confirm_password"
                  type="password"
                  className={inputClass}
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  autoComplete="new-password"
                  placeholder="Re-enter password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-full bg-accent text-[14px] font-medium tracking-wide text-white hover-lift hover:bg-accent-hover disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="3"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    Creating account…
                  </>
                ) : (
                  "Create Account"
                )}
              </button>

              <div className="flex flex-col items-center gap-2 pt-2 text-[14px] text-muted">
                {resendTimer > 0 ? (
                  <span>
                    Resend OTP in{" "}
                    <strong>{resendTimer}s</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={loading}
                    className="font-medium text-heading underline underline-offset-4 disabled:opacity-50"
                  >
                    Resend OTP
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setOtp("");
                    setVerifyPassword("");
                    setConfirmPassword("");
                    setError(null);
                  }}
                  className="font-medium text-heading underline underline-offset-4"
                >
                  Use a different email
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
