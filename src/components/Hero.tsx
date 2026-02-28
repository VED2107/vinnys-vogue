"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import { EmbroideryMotif } from "./EmbroideryMotif";

/* ────────────────────────────────────────────
   Hero Component
   ──────────────────────────────────────────── */
const EASE_LUXURY: [number, number, number, number] = [0.22, 1, 0.36, 1];

export interface HeroProps {
  heading?: string;
  highlight?: string;
  subtext?: string;
  cta_primary?: string;
  cta_secondary?: string;
}

export default function Hero({
  heading = "Where Elegance Meets Craft",
  highlight = "Craft",
  subtext = "Handcrafted bridal couture rooted in heritage, designed for the modern Indian bride.",
  cta_primary = "Explore Collection",
  cta_secondary = "Our Story",
}: HeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  // Scroll-driven transforms
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 0.96]);
  const svgY = useTransform(scrollYProgress, [0, 1], [0, -60]); // parallax: slower

  return (
    <motion.section
      ref={sectionRef}
      style={{
        opacity: prefersReduced ? 1 : heroOpacity,
        scale: prefersReduced ? 1 : bgScale,
        backgroundColor: "#F6F1EB",
      }}
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
    >
      {/* Ivory background */}
      <div
        className="absolute inset-0 -z-10"
        style={{ backgroundColor: "#F6F1EB" }}
      />

      {/* SVG motif — behind text, subtle parallax */}
      <motion.div
        style={{ y: prefersReduced ? 0 : svgY }}
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <EmbroideryMotif className="h-[min(80vh,560px)] w-[min(80vh,560px)] opacity-40" />
      </motion.div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        {/* Brand label */}
        <motion.p
          initial={prefersReduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: EASE_LUXURY, delay: 0.2 }}
          className="mb-6 text-[11px] font-medium uppercase tracking-[0.35em]"
          style={{ color: "#C6A75E" }}
        >
          Vinnys Vogue
        </motion.p>

        {/* Headline */}
        <motion.h1
          initial={prefersReduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.8, ease: EASE_LUXURY, delay: 0.4 }}
          className="font-serif font-light leading-[1.08] tracking-[-0.02em]"
          style={{
            fontSize: "clamp(2.2rem, 5.5vw, 5rem)",
            color: "#1C1A18",
          }}
        >
          {highlight && heading.includes(highlight) ? (
            <>
              {heading.split(highlight)[0]}
              <span
                className="italic"
                style={{
                  background: "linear-gradient(135deg, #C6A75E, #E8D4A2)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {highlight}
              </span>
              {heading.split(highlight).slice(1).join(highlight)}
            </>
          ) : (
            heading
          )}
        </motion.h1>

        {/* Gold divider */}
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, scaleX: 0 }}
          animate={{ opacity: 0.7, scaleX: 1 }}
          transition={{ duration: 1.4, ease: EASE_LUXURY, delay: 0.9 }}
          className="my-7 h-px w-12 origin-center"
          style={{
            background: "linear-gradient(90deg, #C6A75E, #E8D4A2)",
          }}
        />

        {/* Subtext */}
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.6, ease: EASE_LUXURY, delay: 1.0 }}
          className="max-w-[420px] text-[15px] leading-[1.75] font-light"
          style={{ color: "#6B6560" }}
        >
          <div dangerouslySetInnerHTML={{ __html: subtext }} className="[&>p]:m-0" />
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, ease: EASE_LUXURY, delay: 1.3 }}
          className="mt-10 flex gap-4"
        >
          <a
            href="/products"
            className="rounded-full px-8 py-3 text-[12px] font-light uppercase tracking-[0.18em] text-white transition-all duration-300 hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(135deg, #C6A75E, #E8D4A2)",
            }}
          >
            {cta_primary}
          </a>
          <a
            href="/about"
            className="rounded-full border px-8 py-3 text-[12px] font-light uppercase tracking-[0.18em] transition-all duration-300 hover:-translate-y-0.5"
            style={{
              borderColor: "#C6A75E",
              color: "#C6A75E",
            }}
          >
            {cta_secondary}
          </a>
        </motion.div>

      </div>

      {/* Scroll indicator — pinned to bottom of section */}
      <motion.div
        initial={prefersReduced ? false : { opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 1, ease: EASE_LUXURY, delay: 2.2 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
      >
        <div
          className="h-9 w-[1px]"
          style={{
            background: "linear-gradient(to bottom, #C6A75E, transparent)",
          }}
        />
      </motion.div>
    </motion.section>
  );
}
