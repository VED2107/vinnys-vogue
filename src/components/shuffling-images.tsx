"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const SHUFFLE_INTERVAL = 4000;
const EASE_LUXURY: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Fisher-Yates shuffle — returns a new array */
function fisherYates<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface ShufflingImagesProps {
  images: (string | null)[];
  alts?: string[];
}

/**
 * 3-slot image grid (1 tall left + 2 stacked right).
 * Fisher-Yates shuffles image→slot mapping on mount and every 4s.
 * Subtle crossfade via Framer Motion.
 */
export function ShufflingImages({
  images,
  alts = ["Craftsmanship", "Detail", "Artistry"],
}: ShufflingImagesProps) {
  const validImages = images.filter(Boolean) as string[];

  // Start with deterministic order to avoid hydration mismatch (Math.random differs server vs client)
  const [order, setOrder] = useState<number[]>(() =>
    validImages.map((_, i) => i)
  );

  const shuffle = useCallback(() => {
    setOrder((prev) => fisherYates(prev));
  }, []);

  // Shuffle on mount (client only — no hydration mismatch) + interval
  useEffect(() => {
    if (validImages.length < 2) return;
    shuffle(); // initial shuffle on client
    const id = setInterval(shuffle, SHUFFLE_INTERVAL);
    return () => clearInterval(id);
  }, [shuffle, validImages.length]);

  const slotClasses = [
    "relative aspect-[3/4] overflow-hidden rounded-xl bg-[#EDE8E0] row-span-2",
    "relative aspect-[3/4] overflow-hidden rounded-xl bg-[#EDE8E0]",
    "relative aspect-[3/4] overflow-hidden rounded-xl bg-[#EDE8E0]",
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {slotClasses.map((cls, slotIdx) => {
        const hasImages = validImages.length > 0;
        const imgIdx = hasImages ? order[slotIdx % validImages.length] : -1;
        const src = hasImages ? validImages[imgIdx] : null;

        return (
          <div key={slotIdx} className={cls}>
            {src ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${slotIdx}-${src}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 0.8,
                    ease: EASE_LUXURY,
                    delay: slotIdx * 0.12,
                  }}
                  className="absolute inset-0"
                >
                  <Image
                    src={src}
                    alt={alts[slotIdx] ?? "Craftsmanship"}
                    fill
                    sizes="(max-width: 1024px) 45vw, 25vw"
                    className="img-matte object-cover"
                  />
                </motion.div>
              </AnimatePresence>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
