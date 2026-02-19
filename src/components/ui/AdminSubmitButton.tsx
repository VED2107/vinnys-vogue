"use client";

import { useFormStatus } from "react-dom";
import { Spinner } from "./Spinner";

/**
 * Submit button that automatically shows a spinner and disables itself
 * while the parent `<form>` action is pending.
 *
 * Works with both Server Actions and client-side form submissions
 * that use the `action` prop.
 */
export function AdminSubmitButton({
    children,
    className = "",
    pendingText,
}: {
    children: React.ReactNode;
    className?: string;
    /** Optional text shown while pending. If omitted, children stay visible. */
    pendingText?: string;
}) {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className={`inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
        >
            {pending && <Spinner className="h-4 w-4" />}
            {pending && pendingText ? pendingText : children}
        </button>
    );
}
