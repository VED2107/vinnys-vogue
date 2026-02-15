export default function Loading() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="w-full px-6 lg:px-16 xl:px-24 py-16">
        <div className="grid grid-cols-1 gap-20 md:grid-cols-2">
          <div className="aspect-[3/4] w-full animate-pulse rounded-[20px] bg-[#EDE8E0]" />
          <div className="flex flex-col justify-center space-y-6">
            <div className="h-3 w-20 animate-pulse rounded bg-[#E8E3DA]" />
            <div className="h-10 w-3/4 animate-pulse rounded bg-[#E8E3DA]" />
            <div className="h-[1px] w-10 bg-[#E8E3DA]" />
            <div className="h-7 w-1/3 animate-pulse rounded bg-[#E8E3DA]" />
            <div className="h-4 w-full animate-pulse rounded bg-[#E8E3DA]" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-[#E8E3DA]" />
            <div className="h-12 w-48 animate-pulse rounded-full bg-[#E8E3DA]" />
          </div>
        </div>
      </div>
    </div>
  );
}
