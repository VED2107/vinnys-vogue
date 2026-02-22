import Image, { type ImageProps } from "next/image";

/**
 * Next/Image wrapper with CSS-only fade-in on load.
 * ✅ Server component — zero JS shipped to client
 * Default quality: 82 (luxury safe)
 */
export function FadeImage(props: ImageProps) {
    return (
        <Image
            quality={props.quality ?? 82}
            loading={props.priority ? undefined : "lazy"}
            {...props}
            className={props.className ?? ""}
            style={{ ...((props as Record<string, unknown>).style as React.CSSProperties | undefined), animation: "fadeInSoft 0.5s cubic-bezier(0.22,1,0.36,1) forwards" }}
        />
    );
}
