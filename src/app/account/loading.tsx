export default function AccountLoading() {
    return (
        <div className="min-h-screen bg-bg-primary">
            <div className="w-full px-6 lg:px-16 xl:px-24 py-16 max-w-3xl mx-auto">
                {/* Header skeleton */}
                <div className="mb-10">
                    <div className="gold-divider mb-5" />
                    <div className="h-8 w-48 rounded bg-[#E8E3DA] animate-pulse" />
                    <div className="mt-3 h-4 w-64 rounded bg-[#E8E3DA] animate-pulse" />
                </div>

                {/* Profile card skeleton */}
                <div className="rounded-[20px] border border-[rgba(0,0,0,0.06)] bg-bg-card p-8 space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-[#E8E3DA] animate-pulse" />
                        <div className="space-y-2 flex-1">
                            <div className="h-4 w-40 rounded bg-[#E8E3DA] animate-pulse" />
                            <div className="h-3 w-56 rounded bg-[#E8E3DA] animate-pulse" />
                        </div>
                    </div>
                    <div className="gold-divider" />
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex justify-between">
                            <div className="h-4 w-24 rounded bg-[#E8E3DA] animate-pulse" />
                            <div className="h-4 w-40 rounded bg-[#E8E3DA] animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
