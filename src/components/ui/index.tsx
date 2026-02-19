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

/* ——— Shared button props ——— */
interface BtnProps {
    children: React.ReactNode;
    href?: string;
    type?: "button" | "submit";
    disabled?: boolean;
    onClick?: (e?: React.MouseEvent) => void;
    className?: string;
}

function ButtonShell({ children, href, type, disabled, onClick, className = "", base }: BtnProps & { base: string }) {
    const cls = `${base} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`;
    if (href) {
        return (
            <a
                href={disabled ? undefined : href}
                {...(onClick || disabled ? {
                    onClick: (e: React.MouseEvent) => { if (disabled) { e.preventDefault(); return; } onClick?.(e); },
                } : {})}
                aria-disabled={disabled || undefined}
                tabIndex={disabled ? -1 : undefined}
                className={`${cls} ${disabled ? "pointer-events-none" : ""}`}
            >
                {children}
            </a>
        );
    }
    return (
        <button type={type || "button"} disabled={disabled} onClick={onClick} className={cls}>
            {children}
        </button>
    );
}

/* ——— Primary Button (Gold Gradient) ——— */
export function BtnPrimary(props: BtnProps) {
    return (
        <ButtonShell
            {...props}
            base="btn-micro inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#C6A75E] to-[#E8D4A2] px-8 py-3 text-sm font-medium tracking-wide text-white shadow-[0_2px_12px_rgba(198,167,94,0.25)] transition-all duration-300 hover:shadow-[0_4px_20px_rgba(198,167,94,0.35)] hover:-translate-y-0.5"
        />
    );
}

/* ——— Secondary Button (Deep Green) ——— */
export function BtnSecondary(props: BtnProps) {
    return (
        <ButtonShell
            {...props}
            base="btn-micro inline-flex items-center justify-center rounded-full bg-[#0F2E22] px-8 py-3 text-sm font-medium tracking-wide text-white transition-all duration-300 hover:bg-[#1C3A2A] hover:-translate-y-0.5"
        />
    );
}

/* ——— Outline Button (Elegant Gold Border) ——— */
export function BtnOutline(props: BtnProps) {
    return (
        <ButtonShell
            {...props}
            base="btn-micro inline-flex items-center justify-center rounded-full border border-[#C6A75E] px-8 py-3 text-sm font-medium tracking-wide text-[#C6A75E] transition-all duration-300 ease-[cubic-bezier(.22,1,.36,1)] hover:bg-[#C6A75E]/8 hover:-translate-y-0.5"
        />
    );
}

/* ——— Backward-compatible aliases ——— */
export const PremiumButton = BtnSecondary;
export const GoldOutlineButton = BtnOutline;

/* ——— Glass Button (Secondary CTA) ——— */
export function GlassButton({ children, href, type, disabled, onClick, className = "" }: BtnProps) {
    return (
        <ButtonShell
            href={href}
            type={type}
            disabled={disabled}
            onClick={onClick}
            className={className}
            base="btn-micro inline-flex items-center justify-center rounded-full backdrop-blur-md bg-white/20 border border-white/30 px-8 py-3 text-sm font-medium tracking-wide text-[#1C3A2A] shadow-lg transition-all duration-300 hover:bg-white/30"
        >
            {children}
        </ButtonShell>
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
