"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [identifier, setIdentifier] = useState("");
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
      const isEmail = identifier.includes("@");
      const origin = window.location.origin;

      const { data, error: signUpError } = await supabase.auth.signUp(
        isEmail
          ? {
              email: identifier,
              password,
              options: {
                emailRedirectTo: `${origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
              },
            }
          : {
              phone: identifier,
              password,
            },
      );

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      const user = data.user;
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

      if (isEmail && !data.session) {
        setNotice("Account created. Please check your email to confirm, then sign in.");
        return;
      }

      router.replace(redirect);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-6 py-16">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="space-y-2">
            <h1 className="text-2xl font-medium tracking-tight">Create account</h1>
            <p className="text-sm leading-6 text-zinc-600">
              Your profile is auto-created on first login/signup and defaults to
              role <span className="font-medium text-zinc-900">user</span>.
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
                autoComplete="new-password"
              />
            </div>

            {error ? (
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
                {error}
              </div>
            ) : null}

            {notice ? (
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
                {notice}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-xl bg-zinc-900 text-sm font-medium text-zinc-50 transition hover:bg-zinc-800 disabled:opacity-60"
            >
              {loading ? "Creating…" : "Create account"}
            </button>

            <div className="pt-4 text-center text-sm text-zinc-600">
              Already have an account?{" "}
              <a
                className="font-medium text-zinc-900 underline underline-offset-4"
                href={`/login?redirect=${encodeURIComponent(redirect)}`}
              >
                Sign in
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
