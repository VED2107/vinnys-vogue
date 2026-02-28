/* ────────────────────────────────────────────
   Inline SVG — Lightweight Indian bridal motif
   Thin-stroke gold line art inspired by paisley,
   lotus, and arch embroidery patterns.
   ──────────────────────────────────────────── */
export function EmbroideryMotif({ className = "" }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 600 600"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-hidden="true"
        >
            <defs>
                {/* Gold gradient for strokes */}
                <linearGradient id="gold-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#C6A75E" />
                    <stop offset="100%" stopColor="#E8D4A2" />
                </linearGradient>
                {/* Shimmer sweep gradient */}
                <linearGradient id="shimmer-sweep" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(232,212,162,0)" />
                    <stop offset="40%" stopColor="rgba(232,212,162,0)" />
                    <stop offset="50%" stopColor="rgba(232,212,162,0.45)" />
                    <stop offset="60%" stopColor="rgba(232,212,162,0)" />
                    <stop offset="100%" stopColor="rgba(232,212,162,0)" />
                </linearGradient>
                {/* Animated mask for shimmer */}
                <mask id="shimmer-mask">
                    <rect
                        x="-600"
                        y="0"
                        width="1200"
                        height="600"
                        fill="url(#shimmer-sweep)"
                    >
                        <animateTransform
                            attributeName="transform"
                            type="translate"
                            values="-600 0; 600 0"
                            dur="5s"
                            repeatCount="indefinite"
                        />
                    </rect>
                </mask>
            </defs>

            <g stroke="url(#gold-stroke)" strokeWidth="0.8" opacity="0.55">
                {/* Central arch — Mughal jharokha inspired */}
                <path d="M300 520 Q300 280 300 200 Q220 200 180 260 Q160 300 180 350 Q200 400 250 420 Q280 430 300 520Z" />
                <path d="M300 520 Q300 280 300 200 Q380 200 420 260 Q440 300 420 350 Q400 400 350 420 Q320 430 300 520Z" />

                {/* Inner arch detail */}
                <path d="M300 480 Q300 320 300 250 Q245 250 215 295 Q200 320 215 355 Q235 385 270 400 Q290 408 300 480Z" />
                <path d="M300 480 Q300 320 300 250 Q355 250 385 295 Q400 320 385 355 Q365 385 330 400 Q310 408 300 480Z" />

                {/* Central lotus */}
                <ellipse cx="300" cy="210" rx="18" ry="10" />
                <path d="M300 195 Q290 175 300 160 Q310 175 300 195Z" />
                <path d="M286 200 Q268 190 262 175 Q278 180 286 200Z" />
                <path d="M314 200 Q332 190 338 175 Q322 180 314 200Z" />
                <path d="M282 208 Q260 210 250 200 Q265 198 282 208Z" />
                <path d="M318 208 Q340 210 350 200 Q335 198 318 208Z" />

                {/* Top finial — kalash inspired */}
                <path d="M300 160 L300 130" />
                <circle cx="300" cy="125" r="5" />
                <path d="M295 120 Q300 108 305 120" />

                {/* Paisley left */}
                <path d="M160 350 Q130 310 150 270 Q170 240 200 250 Q215 258 210 280 Q200 310 160 350Z" />
                <path d="M170 330 Q150 300 165 275 Q178 258 195 265 Q202 272 198 288 Q190 312 170 330Z" />

                {/* Paisley right */}
                <path d="M440 350 Q470 310 450 270 Q430 240 400 250 Q385 258 390 280 Q400 310 440 350Z" />
                <path d="M430 330 Q450 300 435 275 Q422 258 405 265 Q398 272 402 288 Q410 312 430 330Z" />

                {/* Decorative dots — pearl border */}
                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a) => {
                    const r = 245;
                    const cx = 300 + r * Math.cos((a * Math.PI) / 180);
                    const cy = 300 + r * Math.sin((a * Math.PI) / 180);
                    return <circle key={a} cx={cx} cy={cy} r="2" fill="url(#gold-stroke)" stroke="none" />;
                })}

                {/* Outer mandala ring — subtle scallop */}
                <circle cx="300" cy="300" r="260" strokeDasharray="8 16" />
                <circle cx="300" cy="300" r="275" strokeDasharray="3 20" opacity="0.35" />

                {/* Leaf sprigs — left */}
                <path d="M130 420 Q140 390 160 380 Q145 400 130 420Z" />
                <path d="M120 400 Q125 370 145 355 Q130 380 120 400Z" />

                {/* Leaf sprigs — right */}
                <path d="M470 420 Q460 390 440 380 Q455 400 470 420Z" />
                <path d="M480 400 Q475 370 455 355 Q470 380 480 400Z" />

                {/* Base border scallop */}
                <path d="M180 520 Q220 500 260 510 Q300 520 340 510 Q380 500 420 520" />
                <path d="M200 540 Q235 525 270 532 Q300 538 330 532 Q365 525 400 540" />

                {/* Small hanging bells — jhumka inspired */}
                <path d="M220 430 L220 455 Q215 465 220 470 Q225 465 220 455" />
                <path d="M380 430 L380 455 Q375 465 380 470 Q385 465 380 455" />
            </g>

            {/* Shimmer overlay — same paths rendered with mask */}
            <g
                stroke="#E8D4A2"
                strokeWidth="1.5"
                fill="none"
                mask="url(#shimmer-mask)"
                opacity="0.6"
            >
                <path d="M300 520 Q300 280 300 200 Q220 200 180 260 Q160 300 180 350 Q200 400 250 420 Q280 430 300 520Z" />
                <path d="M300 520 Q300 280 300 200 Q380 200 420 260 Q440 300 420 350 Q400 400 350 420 Q320 430 300 520Z" />
                <path d="M300 480 Q300 320 300 250 Q245 250 215 295 Q200 320 215 355 Q235 385 270 400 Q290 408 300 480Z" />
                <path d="M300 480 Q300 320 300 250 Q355 250 385 295 Q400 320 385 355 Q365 385 330 400 Q310 408 300 480Z" />
                <ellipse cx="300" cy="210" rx="18" ry="10" />
                <circle cx="300" cy="300" r="260" strokeDasharray="8 16" />
                <path d="M160 350 Q130 310 150 270 Q170 240 200 250 Q215 258 210 280 Q200 310 160 350Z" />
                <path d="M440 350 Q470 310 450 270 Q430 240 400 250 Q385 258 390 280 Q400 310 440 350Z" />
            </g>
        </svg>
    );
}
