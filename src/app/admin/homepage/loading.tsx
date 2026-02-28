export default function Loading() {
    return (
        <div className="min-h-screen bg-bg-admin p-6 lg:p-10">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="h-8 w-48 rounded bg-[#E8E3DA] animate-pulse" />
                <div className="space-y-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="rounded-2xl bg-white/50 border border-[rgba(0,0,0,0.06)] p-6 space-y-4">
                            <div className="h-4 w-24 rounded bg-[#E8E3DA] animate-pulse" />
                            <div className="h-32 w-full rounded-xl bg-[#E8E3DA] animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
