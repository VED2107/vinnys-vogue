"use client";

import { useState, useCallback } from "react";
import { FadeImage } from "@/components/fade-image";

interface ProductImageGalleryProps {
    images: string[];
    title: string;
}

export default function ProductImageGallery({ images, title }: ProductImageGalleryProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isZooming, setIsZooming] = useState(false);
    const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setZoomPosition({ x, y });
    }, []);

    if (images.length === 0) return null;

    return (
        <div className="flex flex-col-reverse md:flex-row gap-3 md:gap-4 md:sticky md:top-24 md:self-start">
            {/* Thumbnails — bottom on mobile, left on desktop */}
            {images.length > 1 && (
                <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:overflow-x-hidden md:max-h-[600px] scrollbar-hide pb-1 md:pb-0 md:w-[72px] flex-shrink-0">
                    {images.map((url, index) => (
                        <button
                            key={index}
                            onMouseEnter={() => setActiveIndex(index)}
                            onClick={() => setActiveIndex(index)}
                            className={`relative flex-shrink-0 w-[60px] h-[72px] md:w-[68px] md:h-[82px] rounded-xl overflow-hidden transition-all duration-300 ${index === activeIndex
                                    ? "ring-2 ring-gold ring-offset-2 shadow-md scale-105"
                                    : "ring-1 ring-[rgba(0,0,0,0.08)] opacity-60 hover:opacity-100 hover:ring-[rgba(0,0,0,0.15)]"
                                }`}
                        >
                            <FadeImage
                                src={url}
                                alt={`${title} - ${index + 1}`}
                                fill
                                sizes="72px"
                                className="object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}

            {/* Main image */}
            <div
                className="relative flex-1 overflow-hidden rounded-[20px] bg-[#EDE8E0] aspect-[4/5] w-full cursor-crosshair"
                onMouseEnter={() => setIsZooming(true)}
                onMouseLeave={() => setIsZooming(false)}
                onMouseMove={handleMouseMove}
            >
                {images.map((url, index) => (
                    <div
                        key={url}
                        className={`absolute inset-0 transition-opacity duration-500 ease-out ${index === activeIndex ? "opacity-100" : "opacity-0"
                            }`}
                    >
                        <FadeImage
                            src={url}
                            alt={`${title} - ${index + 1}`}
                            fill
                            sizes="(max-width: 768px) 90vw, (max-width: 1200px) 42vw, 480px"
                            className={`img-matte object-cover transition-transform duration-500 ease-out ${isZooming && index === activeIndex ? "scale-[2]" : "scale-100"
                                }`}
                            style={
                                isZooming && index === activeIndex
                                    ? { transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%` }
                                    : undefined
                            }
                            priority={index === 0}
                        />
                    </div>
                ))}

                {/* Image counter badge */}
                {images.length > 1 && (
                    <div className="absolute bottom-4 right-4 z-10 rounded-full bg-black/50 backdrop-blur-sm px-3 py-1 text-[11px] font-medium text-white tracking-wide">
                        {activeIndex + 1} / {images.length}
                    </div>
                )}
            </div>
        </div>
    );
}
