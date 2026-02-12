export default function Loading() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
          <div className="aspect-[4/5] w-full animate-pulse rounded-2xl bg-zinc-100" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 animate-pulse rounded bg-zinc-100" />
            <div className="h-6 w-1/3 animate-pulse rounded bg-zinc-100" />
            <div className="h-4 w-full animate-pulse rounded bg-zinc-100" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-zinc-100" />
            <div className="h-11 w-40 animate-pulse rounded-xl bg-zinc-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
