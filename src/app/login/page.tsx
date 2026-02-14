"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function normalizeAuthError(message: string) {
    const m = message.toLowerCase();
    if (m.includes("invalid login credentials")) return "Incorrect email/phone or password.";
    if (m.includes("email not confirmed")) return "Please confirm your email, then try signing in again.";
    return message;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const isEmail = identifier.includes("@");
      const { error: signInError } = await supabase.auth.signInWithPassword(
        isEmail ? { email: identifier, password } : { phone: identifier, password },
      );

      if (signInError) { setError(normalizeAuthError(signInError.message)); return; }

      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        await supabase.from("profiles").upsert(
          { id: user.id, email: user.email ?? null, phone: user.phone ?? null, role: "user" },
          { onConflict: "id" },
        );
      }

      router.replace(redirect);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle() {
    setError(null);
    const origin = window.location.origin;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/auth/callback?redirect=${encodeURIComponent(redirect)}` },
    });
    if (oauthError) setError(oauthError.message);
  }

  const inputClass =
    "h-12 w-full rounded-full border border-[rgba(0,0,0,0.1)] bg-bg-card px-5 text-[15px] text-heading outline-none transition-all duration-400 focus:border-gold focus:ring-1 focus:ring-gold/15 placeholder:text-[rgba(0,0,0,0.25)]";

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-6 py-16">
        <div className="rounded-[20px] border border-[rgba(0,0,0,0.06)] bg-bg-card p-8">
          <div className="space-y-3">
            <div className="gold-divider" />
            <h1 className="font-serif text-2xl font-light tracking-[-0.02em] text-heading">Sign in</h1>
            <p className="text-[15px] leading-[1.7] text-muted">
              Email + password, phone + password, or continue with Google.
            </p>
          </div>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <label className="text-[11px] font-medium tracking-[0.2em] text-muted uppercase">Email or phone</label>
              <input className={inputClass} value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoComplete="username" placeholder="you@domain.com or +91xxxxxxxxxx" />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-medium tracking-[0.2em] text-muted uppercase">Password</label>
              <input type="password" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            </div>

            {error ? (
              <div className="rounded-[20px] border border-red-200 bg-red-50 px-5 py-3 text-[14px] text-red-700">{error}</div>
            ) : null}

            <button type="submit" disabled={loading} className="h-12 w-full rounded-full bg-accent text-[14px] font-medium tracking-wide text-white hover-lift hover:bg-accent-hover disabled:opacity-60">
              {loading ? "Signing in…" : "Sign in"}
            </button>

            <div className="pt-2">
              <button type="button" onClick={signInWithGoogle} className="h-12 w-full rounded-full border border-[rgba(0,0,0,0.1)] bg-bg-card text-[14px] text-heading transition-all duration-400 hover:border-[rgba(0,0,0,0.2)]">
                Continue with Google
              </button>
            </div>

            <div className="pt-4 text-center text-[14px] text-muted">
              Don&apos;t have an account?{" "}
              <a className="font-medium text-heading underline underline-offset-4" href={`/signup?redirect=${encodeURIComponent(redirect)}`}>
                Create one
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
