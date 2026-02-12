"use client";

export default function Error({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-700">
          {error.message}
        </div>
      </div>
    </div>
  );
}
