export default function Loading() {
    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-900">
            <div className="mx-auto w-full max-w-6xl px-6 py-12 space-y-6">
                <div className="h-8 w-48 rounded bg-zinc-200 animate-pulse" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-3">
                            <div className="h-32 w-full rounded-xl bg-zinc-100 animate-pulse" />
                            <div className="h-4 w-3/4 rounded bg-zinc-200 animate-pulse" />
                            <div className="h-3 w-1/2 rounded bg-zinc-200 animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
