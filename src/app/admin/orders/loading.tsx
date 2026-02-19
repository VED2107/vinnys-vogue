export default function AdminOrdersLoading() {
    return (
        <div className="min-h-screen bg-bg-admin p-6 lg:p-10">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="h-8 w-56 rounded bg-[#E8E3DA] animate-pulse" />

                <div className="space-y-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div
                            key={i}
                            className="rounded-2xl bg-white/50 border border-[rgba(0,0,0,0.06)] p-5 flex items-center gap-4"
                        >
                            <div className="h-4 w-24 rounded bg-[#E8E3DA] animate-pulse" />
                            <div className="h-4 flex-1 rounded bg-[#E8E3DA] animate-pulse" />
                            <div className="h-6 w-20 rounded-full bg-[#E8E3DA] animate-pulse" />
                            <div className="h-4 w-16 rounded bg-[#E8E3DA] animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
