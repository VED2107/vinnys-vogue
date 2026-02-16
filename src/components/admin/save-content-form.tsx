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
                <p className="mt-2 text-[12px] text-muted">Saving...</p>
            )}
        </form>
    );
}
