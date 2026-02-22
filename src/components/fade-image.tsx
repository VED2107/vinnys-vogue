"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";

/**
 * Next/Image wrapper that fades in when loaded.
 * Defaults: quality=75, lazy loading (unless priority set).
 */
export function FadeImage(props: ImageProps) {
    const [loaded, setLoaded] = useState(false);

    return (
        <Image
            quality={props.quality ?? 75}
            loading={props.priority ? undefined : "lazy"}
            {...props}
            onLoad={(e) => {
                setLoaded(true);
                if (typeof props.onLoad === "function") {
                    props.onLoad(e);
                }
            }}
            className={`${props.className ?? ""} transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${loaded ? "opacity-100" : "opacity-0"
                }`}
        />
    );
}
