import Link from "next/link";

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-bg-primary">
            <h1 className="font-serif text-5xl font-light tracking-[-0.02em] text-heading">404</h1>
            <div className="mt-5 gold-divider" />
            <p className="mt-6 text-[15px] text-muted">This page could not be found.</p>
            <Link href="/" className="mt-10 inline-flex h-12 items-center rounded-full bg-accent px-8 text-[14px] font-medium text-white hover-lift hover:bg-accent-hover">
                Return Home
            </Link>
        </div>
    );
}
