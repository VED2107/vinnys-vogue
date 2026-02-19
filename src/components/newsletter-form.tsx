"use client";

import { useState, useTransition } from "react";

export function NewsletterForm() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");
    const [isPending, startTransition] = useTransition();

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!email.trim()) return;

        startTransition(async () => {
            setStatus("loading");
            try {
                const res = await fetch("/api/newsletter", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: email.trim() }),
                });
                const data = await res.json();

                if (!res.ok) {
                    setStatus("error");
                    setMessage(data.error || "Something went wrong.");
                    return;
                }

                setStatus("success");
                setMessage("Welcome to the Vinnys Vogue family ✨");
                setEmail("");
            } catch {
                setStatus("error");
                setMessage("Network error. Please try again.");
            }
        });
    }

    if (status === "success") {
        return (
            <div className="mt-6 rounded-full border border-green-200 bg-green-50 px-5 py-3 text-center text-[14px] text-green-800 font-medium">
                {message}
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="mt-6">
            <div className="flex gap-3">
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email address"
                    required
                    className="flex-1 h-12 rounded-full border border-[rgba(0,0,0,0.08)] bg-transparent px-5 text-[14px] text-heading placeholder:text-muted/50 outline-none transition focus:border-gold"
                />
                <button
                    type="submit"
                    disabled={isPending}
                    className="group relative h-12 rounded-full bg-[#0F2E22] px-6 text-[14px] font-medium text-white overflow-hidden transition-all duration-300 hover:bg-[#1C3A2A] hover:shadow-[0_4px_16px_rgba(15,46,34,0.2)] disabled:opacity-60 flex items-center gap-2"
                >
                    <span className="glass-overlay pointer-events-none" />
                    <span className="relative z-10 flex items-center gap-2">
                        {isPending && (
                            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                            </svg>
                        )}
                        {isPending ? "Subscribing…" : "Subscribe"}
                    </span>
                </button>
            </div>
            {status === "error" && (
                <p className="mt-3 text-[13px] text-red-600">{message}</p>
            )}
        </form>
    );
}
