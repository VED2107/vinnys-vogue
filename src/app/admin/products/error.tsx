"use client";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-900">
            <div className="mx-auto w-full max-w-3xl px-6 py-12">
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                    <div className="text-sm font-medium text-zinc-900">Something went wrong</div>
                    <div className="mt-2 text-sm text-zinc-600">{error.message}</div>
                    <button
                        onClick={() => reset()}
                        className="mt-5 h-10 rounded-xl bg-zinc-900 px-4 text-sm font-medium text-zinc-50 transition hover:bg-zinc-800"
                    >
                        Try again
                    </button>
                </div>
            </div>
        </div>
    );
}
