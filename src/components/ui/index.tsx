import React from "react";

/* ——— Section Title ——— */
export function SectionTitle({
    subtitle,
    title,
    description,
    align = "center",
}: {
    subtitle?: string;
    title: string;
    description?: string;
    align?: "center" | "left";
}) {
    const textAlign = align === "center" ? "text-center" : "text-left";
    return (
        <div className={`${textAlign}`}>
            <div className={`gold-divider mb-5 ${align === "center" ? "mx-auto" : ""}`} />
            {subtitle ? (
                <div className="text-[11px] font-medium tracking-[0.25em] text-gold uppercase">
                    {subtitle}
                </div>
            ) : null}
            <h2 className="mt-3 font-serif text-[clamp(28px,4vw,42px)] font-light leading-[1.15] text-heading">
                {title}
            </h2>
            {description ? (
                <p className={`mt-4 text-[15px] leading-[1.7] text-muted max-w-md ${align === "center" ? "mx-auto" : ""}`}>
                    {description}
                </p>
            ) : null}
        </div>
    );
}

/* ——— Editorial Page Container ——— */
export function PageContainer({
    children,
    className = "",
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className="min-h-screen bg-bg-primary text-body">
            <div className={`w-full px-6 lg:px-16 xl:px-24 py-16 ${className}`}>
                {children}
            </div>
        </div>
    );
}

/* ——— Primary Button (Green Luxury) ——— */
export function PremiumButton({
    children,
    href,
    type,
    disabled,
    onClick,
    className = "",
}: {
    children: React.ReactNode;
    href?: string;
    type?: "button" | "submit";
    disabled?: boolean;
    onClick?: (e?: React.MouseEvent) => void;
    className?: string;
}) {
    const base =
        "group relative inline-flex items-center justify-center rounded-full bg-[#1C3A2A] px-8 py-3 text-sm font-medium tracking-wide text-white overflow-hidden transition-all duration-300 hover:bg-[#162E22] hover:shadow-[0_4px_16px_rgba(28,58,42,0.25)] disabled:opacity-50 disabled:cursor-not-allowed";
    const glassSpan = <span className="glass-overlay pointer-events-none" />;
    if (href) {
        const disabledClass = disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "";
        const needsHandler = !!(onClick || disabled);
        return (
            <a
                href={disabled ? undefined : href}
                {...(needsHandler ? {
                    onClick: (e: React.MouseEvent) => {
                        if (disabled) { e.preventDefault(); return; }
                        onClick?.(e);
                    },
                } : {})}
                aria-disabled={disabled || undefined}
                tabIndex={disabled ? -1 : undefined}
                className={`${base} ${disabledClass} ${className}`}
            >
                {glassSpan}
                <span className="relative z-10">{children}</span>
            </a>
        );
    }
    return (
        <button
            type={type || "button"}
            disabled={disabled}
            onClick={onClick}
            className={`${base} ${className}`}
        >
            {glassSpan}
            <span className="relative z-10">{children}</span>
        </button>
    );
}

/* ——— Gold Outline Button ——— */
export function GoldOutlineButton({
    children,
    href,
    type,
    disabled,
    onClick,
    className = "",
}: {
    children: React.ReactNode;
    href?: string;
    type?: "button" | "submit";
    disabled?: boolean;
    onClick?: (e?: React.MouseEvent) => void;
    className?: string;
}) {
    const base =
        "inline-flex items-center justify-center rounded-full border border-[#C6A756] px-8 py-3 text-sm font-medium tracking-wide text-[#C6A756] transition-all duration-300 ease-[cubic-bezier(.22,1,.36,1)] hover:bg-[#C6A756] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed";
    if (href) {
        const disabledClass = disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "";
        const needsHandler = !!(onClick || disabled);
        return (
            <a
                href={disabled ? undefined : href}
                {...(needsHandler ? {
                    onClick: (e: React.MouseEvent) => {
                        if (disabled) { e.preventDefault(); return; }
                        onClick?.(e);
                    },
                } : {})}
                aria-disabled={disabled || undefined}
                tabIndex={disabled ? -1 : undefined}
                className={`${base} ${disabledClass} ${className}`}
            >
                {children}
            </a>
        );
    }
    return (
        <button
            type={type || "button"}
            disabled={disabled}
            onClick={onClick}
            className={`${base} ${className}`}
        >
            {children}
        </button>
    );
}

/* ——— Glass Button (Secondary CTA) ——— */
export function GlassButton({
    children,
    href,
    type,
    disabled,
    onClick,
    className = "",
}: {
    children: React.ReactNode;
    href?: string;
    type?: "button" | "submit";
    disabled?: boolean;
    onClick?: (e?: React.MouseEvent) => void;
    className?: string;
}) {
    const base =
        "inline-flex items-center justify-center rounded-full backdrop-blur-md bg-white/20 border border-white/30 px-8 py-3 text-sm font-medium tracking-wide text-[#1C3A2A] shadow-lg transition-all duration-300 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed";
    if (href) {
        return (
            <a href={href} className={`${base} ${className}`}>
                {children}
            </a>
        );
    }
    return (
        <button
            type={type || "button"}
            disabled={disabled}
            onClick={onClick}
            className={`${base} ${className}`}
        >
            {children}
        </button>
    );
}

/* ——— Luxury Card ——— */
export function LuxuryCard({
    children,
    className = "",
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={`rounded-[20px] border border-[rgba(0,0,0,0.06)] bg-bg-card p-6 ${className}`}
        >
            {children}
        </div>
    );
}

/* ——— Gold Divider ——— */
export function GoldDivider({ className = "" }: { className?: string }) {
    return <hr className={`gold-divider ${className}`} />;
}
