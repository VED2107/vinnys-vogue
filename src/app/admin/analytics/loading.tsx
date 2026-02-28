export default function Loading() {
    return (
        <div className="min-h-screen bg-bg-admin p-6 lg:p-10">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="h-8 w-48 rounded bg-[#E8E3DA] animate-pulse" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="rounded-2xl bg-white/50 border border-[rgba(0,0,0,0.06)] p-5 space-y-3">
                            <div className="h-3 w-16 rounded bg-[#E8E3DA] animate-pulse" />
                            <div className="h-7 w-24 rounded bg-[#E8E3DA] animate-pulse" />
                        </div>
                    ))}
                </div>
                <div className="rounded-2xl bg-white/50 border border-[rgba(0,0,0,0.06)] p-6">
                    <div className="h-64 w-full rounded bg-[#E8E3DA] animate-pulse" />
                </div>
            </div>
        </div>
    );
}
