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
    if (m.includes("invalid login credentials")) {
      return "Incorrect email/phone or password.";
    }
    if (m.includes("email not confirmed")) {
      return "Please confirm your email, then try signing in again.";
    }
    return message;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const isEmail = identifier.includes("@");
      const { error: signInError } = await supabase.auth.signInWithPassword(
        isEmail
          ? { email: identifier, password }
          : { phone: identifier, password },
      );

      if (signInError) {
        setError(normalizeAuthError(signInError.message));
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase.from("profiles").upsert(
          {
            id: user.id,
            email: user.email ?? null,
            phone: user.phone ?? null,
            role: "user",
          },
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
      options: {
        redirectTo: `${origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
      },
    });

    if (oauthError) setError(oauthError.message);
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-6 py-16">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="space-y-2">
            <h1 className="text-2xl font-medium tracking-tight">Sign in</h1>
            <p className="text-sm leading-6 text-zinc-600">
              Email + password, phone + password, or continue with Google.
            </p>
          </div>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">
                Email or phone
              </label>
              <input
                className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none ring-0 transition focus:border-zinc-400"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
                placeholder="you@domain.com or +91xxxxxxxxxx"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">
                Password
              </label>
              <input
                type="password"
                className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none ring-0 transition focus:border-zinc-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            {error ? (
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-xl bg-zinc-900 text-sm font-medium text-zinc-50 transition hover:bg-zinc-800 disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>

            <div className="grid grid-cols-1 gap-3 pt-2">
              <button
                type="button"
                onClick={signInWithGoogle}
                className="h-11 w-full rounded-xl border border-zinc-200 bg-white text-sm font-medium text-zinc-900 transition hover:bg-zinc-50"
              >
                Continue with Google
              </button>
            </div>

            <div className="pt-4 text-center text-sm text-zinc-600">
              Don&apos;t have an account?{" "}
              <a
                className="font-medium text-zinc-900 underline underline-offset-4"
                href={`/signup?redirect=${encodeURIComponent(redirect)}`}
              >
                Create one
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
