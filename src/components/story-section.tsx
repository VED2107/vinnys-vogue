"use client";

import { useRef, type ReactNode } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  useReducedMotion,
} from "framer-motion";

const EASE_LUXURY: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface StorySectionProps {
  /** Content for the image slot */
  image: ReactNode;
  /** Content for the text slot */
  label: string;
  headline: ReactNode;
  paragraphs: ReactNode;
  cta: ReactNode;
  /** If true, image goes right (RTL layout) */
  reversed?: boolean;
  /** Section index for stagger offset */
  index?: number;
  /** Optional mandala placed behind the text column */
  mandala?: ReactNode;
}

/**
 * Cinematic scroll-reveal story section.
 * - Headline fades in over 1.8s with subtle y-motion
 * - Subtext staggers in after headline
 * - On scroll: section fades + slight scale-down
 * - Image has subtle parallax
 * - Luxury cubic-bezier easing throughout
 */
export function StorySection({
  image,
  label,
  headline,
  paragraphs,
  cta,
  reversed = false,
  index = 0,
  mandala,
}: StorySectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  const isInView = useInView(textRef, { once: true, margin: "-60px" });

  // Scroll-driven transforms for the whole section
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Fade out as section scrolls past
  const sectionOpacity = useTransform(scrollYProgress, [0.6, 0.95], [1, 0]);
  const sectionScale = useTransform(scrollYProgress, [0.6, 0.95], [1, 0.97]);

  // Image parallax — moves slightly slower
  const imageY = useTransform(scrollYProgress, [0, 1], [40, -40]);

  const baseDelay = index * 0.08;

  return (
    <motion.section
      ref={sectionRef}
      style={{
        opacity: prefersReduced ? 1 : sectionOpacity,
        scale: prefersReduced ? 1 : sectionScale,
      }}
      className="w-full py-28 px-6 lg:px-16 xl:px-24"
    >
      <div
        className={`grid lg:grid-cols-2 items-center gap-16 lg:gap-24 ${
          reversed ? "direction-rtl" : ""
        }`}
      >
        {/* Image with parallax */}
        <motion.div
          style={{ y: prefersReduced ? 0 : imageY }}
          className={`relative aspect-[4/5] overflow-hidden rounded-xl bg-[#EDE8E0] ${
            reversed ? "lg:order-2" : ""
          }`}
        >
          {image}
        </motion.div>

        {/* Text with staggered reveal */}
        <div
          ref={textRef}
          className={`relative flex items-center lg:min-h-[560px] ${reversed ? "lg:order-1" : ""}`}
        >
          {mandala}
          <div className="relative z-10 max-w-[480px]">
            {/* Label */}
            <motion.p
              initial={prefersReduced ? false : { opacity: 0, y: 8 }}
              animate={isInView ? { opacity: 1, y: 0 } : undefined}
              transition={{
                duration: 1.2,
                ease: EASE_LUXURY,
                delay: baseDelay,
              }}
              className="text-[11px] tracking-[0.3em] uppercase text-gold font-medium"
            >
              {label}
            </motion.p>

            {/* Headline — 1.8s fade with y-motion */}
            <motion.h2
              initial={prefersReduced ? false : { opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : undefined}
              transition={{
                duration: 1.8,
                ease: EASE_LUXURY,
                delay: baseDelay + 0.15,
              }}
              className="mt-3 font-serif text-3xl lg:text-4xl font-light leading-[1.15] text-heading"
            >
              {headline}
            </motion.h2>

            {/* Paragraphs — delayed after headline */}
            <motion.div
              initial={prefersReduced ? false : { opacity: 0, y: 12 }}
              animate={isInView ? { opacity: 1, y: 0 } : undefined}
              transition={{
                duration: 1.4,
                ease: EASE_LUXURY,
                delay: baseDelay + 0.45,
              }}
              className="mt-5 space-y-3 text-[15px] leading-[1.7] text-neutral-600"
            >
              {paragraphs}
            </motion.div>

            {/* CTA — subtle stagger */}
            <motion.div
              initial={prefersReduced ? false : { opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : undefined}
              transition={{
                duration: 1.2,
                ease: EASE_LUXURY,
                delay: baseDelay + 0.7,
              }}
              className="mt-6"
            >
              {cta}
            </motion.div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
