/**
 * Central motion constants — every animated component imports from here.
 * Values extracted from the reference site's CSS + JS bundles.
 *
 * Easing: cubic-bezier(.22,1,.36,1) — fast deceleration, luxury feel.
 */

export const MOTION = {
    /** Primary easing curve — smooth decelerate */
    ease: [0.22, 1, 0.36, 1] as const,

    /** Duration presets (seconds) */
    duration: {
        fast: 0.3,
        normal: 0.6,
        slow: 0.7,
    },

    /** Stagger delay between sibling elements (seconds) */
    stagger: 0.1,

    /** Button / small-element hover */
    hover: { scale: 1.015, duration: 0.3 },

    /** Card hover */
    card: { scale: 1.02, duration: 0.5 },

    /** Image-inside-card hover */
    image: { scale: 1.05, duration: 0.5 },

    /** Default enter state (before reveal) */
    enter: { y: 20, opacity: 0 },
} as const;
