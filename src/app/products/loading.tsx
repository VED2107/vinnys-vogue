
export default function ProductsLoading() {
    return (
        <div className="min-h-screen bg-bg-primary">
            <div className="w-full px-6 lg:px-16 xl:px-24 py-16">
                {/* Header skeleton */}
                <div className="text-center mb-12">
                    <div className="gold-divider mx-auto mb-5" />
                    <div className="h-4 w-24 mx-auto rounded bg-[#E8E3DA] animate-pulse" />
                    <div className="mt-3 h-10 w-72 mx-auto rounded bg-[#E8E3DA] animate-pulse" />
                </div>

                {/* Filter bar skeleton */}
                <div className="flex gap-3 mb-8">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-9 w-24 rounded-full bg-[#E8E3DA] animate-pulse" />
                    ))}
                </div>

                {/* Product grid skeleton */}
                <div className="grid grid-cols-2 gap-6 sm:gap-8 lg:grid-cols-4 lg:gap-12">
                    {Array.from({ length: 8 }).map((_, idx) => (
                        <div key={idx} className="overflow-hidden">
                            <div className="aspect-[4/5] w-full rounded-xl animate-pulse bg-[#E8E3DA]" />
                            <div className="space-y-2 py-4">
                                <div className="h-3 w-3/4 animate-pulse rounded bg-[#E8E3DA]" />
                                <div className="h-3 w-1/3 animate-pulse rounded bg-[#E8E3DA]" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
