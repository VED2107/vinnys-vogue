"use client";

import { useState, type ReactNode, type FormEvent } from "react";
import { useRouter } from "next/navigation";

interface SaveContentFormProps {
    children: ReactNode;
    className?: string;
}

/**
 * Client-side form that POSTs to /api/admin/save-content
 * instead of using a Server Action (avoids origin mismatch through proxies).
 */
export function SaveContentForm({ children, className = "" }: SaveContentFormProps) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        setError("");

        try {
            const formData = new FormData(e.currentTarget);

            const res = await fetch("/api/admin/save-content", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Save failed");
                return;
            }

            router.push("/admin/homepage?saved=1");
            router.refresh();
        } catch {
            setError("Save failed. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={className}>
            {children}
            {error && (
                <p className="mt-3 text-[13px] text-red-500">{error}</p>
            )}
            {saving && (
                <p className="mt-2 text-[12px] text-muted flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Saving…
                </p>
            )}
        </form>
    );
}
