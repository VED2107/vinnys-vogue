export default function Loading() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto w-full max-w-3xl px-6 py-12">
        <div className="h-7 w-40 animate-pulse rounded bg-zinc-100" />

        <div className="mt-8 space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="h-4 w-24 animate-pulse rounded bg-zinc-100" />
          <div className="h-11 w-full animate-pulse rounded-xl bg-zinc-100" />

          <div className="h-4 w-24 animate-pulse rounded bg-zinc-100" />
          <div className="h-11 w-full animate-pulse rounded-xl bg-zinc-100" />

          <div className="h-4 w-28 animate-pulse rounded bg-zinc-100" />
          <div className="h-28 w-full animate-pulse rounded-xl bg-zinc-100" />

          <div className="h-4 w-28 animate-pulse rounded bg-zinc-100" />
          <div className="h-11 w-full animate-pulse rounded-xl bg-zinc-100" />

          <div className="mt-4 h-11 w-40 animate-pulse rounded-xl bg-zinc-100" />
        </div>
      </div>
    </div>
  );
}
