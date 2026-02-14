"use client";

import { useEffect } from "react";

export default function ErrorPage({
    error,
    reset,
}: {
    error: Error;
    reset: () => void;
}) {
    useEffect(() => {
        console.error("[ErrorBoundary]", error);
    }, [error]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-bg-primary">
            <h1 className="font-serif text-3xl font-light tracking-[-0.02em] text-heading">Something went wrong</h1>
            <div className="mt-5 gold-divider" />
            <p className="mt-6 max-w-md text-center text-[15px] text-muted">
                An unexpected error occurred. Please try again.
            </p>
            <button onClick={() => reset()} className="mt-10 inline-flex h-12 items-center rounded-full bg-accent px-8 text-[14px] font-medium text-white hover-lift hover:bg-accent-hover">
                Try Again
            </button>
        </div>
    );
}
