"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { PageMandala } from "@/components/decorative";

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    try {
      const origin = window.location.origin;

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { emailRedirectTo: `${origin}/auth/callback?redirect=${encodeURIComponent(redirect)}` },
      });

      if (signUpError) { setError(signUpError.message); return; }

      if (!data.session) {
        setNotice("Account created. Please check your email to confirm, then sign in.");
        return;
      }

      router.replace(redirect);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "h-12 w-full rounded-full border border-[rgba(0,0,0,0.1)] bg-bg-card px-5 text-[15px] text-heading outline-none transition-all duration-300 focus:border-gold focus:ring-1 focus:ring-gold/15 placeholder:text-[rgba(0,0,0,0.25)]";

  return (
    <div className="relative min-h-screen overflow-hidden bg-bg-primary">
      <PageMandala size="md" />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-6 py-16">
        <div className="rounded-[20px] border border-[rgba(0,0,0,0.06)] bg-white/70 backdrop-blur-md p-8">
          <div className="space-y-3">
            <div className="gold-divider" />
            <h1 className="font-serif text-2xl font-light tracking-[-0.02em] text-heading">Create account</h1>
            <p className="text-[15px] leading-[1.7] text-muted">
              Your profile is auto-created on first login/signup and defaults to
              role <span className="font-medium text-heading">user</span>.
            </p>
          </div>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <label htmlFor="signup_email" className="text-[11px] font-medium tracking-[0.2em] text-muted uppercase">Email</label>
              <input id="signup_email" type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" placeholder="you@domain.com" required />
            </div>

            <div className="space-y-2">
              <label htmlFor="signup_password" className="text-[11px] font-medium tracking-[0.2em] text-muted uppercase">Password</label>
              <input id="signup_password" type="password" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
            </div>

            {error ? (
              <div className="rounded-[20px] border border-red-200 bg-red-50 px-5 py-3 text-[14px] text-red-700">{error}</div>
            ) : null}

            {notice ? (
              <div className="rounded-[20px] border border-gold/20 bg-gold/5 px-5 py-3 text-[14px] text-heading">{notice}</div>
            ) : null}

            <button type="submit" disabled={loading} className="h-12 w-full rounded-full bg-accent text-[14px] font-medium tracking-wide text-white hover-lift hover:bg-accent-hover disabled:opacity-60">
              {loading ? "Creating…" : "Create account"}
            </button>

            <div className="pt-4 text-center text-[14px] text-muted">
              Already have an account?{" "}
              <a className="font-medium text-heading underline underline-offset-4" href={`/login?redirect=${encodeURIComponent(redirect)}`}>
                Sign in
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
