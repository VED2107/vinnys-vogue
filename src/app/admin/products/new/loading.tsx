export default function Loading() {
    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-900">
            <div className="mx-auto w-full max-w-3xl px-6 py-12 space-y-6">
                <div className="h-8 w-48 rounded bg-zinc-200 animate-pulse" />
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-5">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                            <div className="h-3 w-20 rounded bg-zinc-200 animate-pulse" />
                            <div className="h-11 w-full rounded-xl bg-zinc-100 animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
