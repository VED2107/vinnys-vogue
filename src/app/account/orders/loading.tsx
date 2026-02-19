export default function OrdersLoading() {
    return (
        <div className="min-h-screen bg-bg-primary">
            <div className="w-full px-6 lg:px-16 xl:px-24 py-16 max-w-4xl mx-auto">
                <div className="mb-10">
                    <div className="gold-divider mb-5" />
                    <div className="h-8 w-40 rounded bg-[#E8E3DA] animate-pulse" />
                </div>

                <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div
                            key={i}
                            className="rounded-[20px] border border-[rgba(0,0,0,0.06)] bg-bg-card p-6 flex items-center gap-6"
                        >
                            <div className="h-16 w-16 flex-shrink-0 rounded-xl bg-[#E8E3DA] animate-pulse" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-32 rounded bg-[#E8E3DA] animate-pulse" />
                                <div className="h-3 w-48 rounded bg-[#E8E3DA] animate-pulse" />
                            </div>
                            <div className="h-8 w-24 rounded-full bg-[#E8E3DA] animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
