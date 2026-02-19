"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";

/**
 * Next/Image wrapper that fades in when the image has loaded.
 * Removes the jarring "image pop-in" effect.
 *
 * Accepts all standard next/image props.
 */
export function FadeImage(props: ImageProps) {
    const [loaded, setLoaded] = useState(false);

    return (
        <Image
            {...props}
            onLoad={(e) => {
                setLoaded(true);
                // Forward original onLoad if provided
                if (typeof props.onLoad === "function") {
                    props.onLoad(e);
                }
            }}
            className={`${props.className ?? ""} transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${loaded ? "opacity-100" : "opacity-0"
                }`}
        />
    );
}
