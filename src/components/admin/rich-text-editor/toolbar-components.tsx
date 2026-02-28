"use client";

import { useState, useEffect, useRef } from "react";
import { EMOJI_GROUPS } from "./emoji-data";

export function ToolbarBtn({
    children,
    active,
    onClick,
    title,
}: {
    children: React.ReactNode;
    active: boolean;
    onClick: () => void;
    title: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className={`flex h-7 w-7 items-center justify-center rounded text-[12px] transition ${active
                ? "bg-[#0F2E22] text-white"
                : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
                }`}
        >
            {children}
        </button>
    );
}

export function Separator() {
    return <div className="mx-1 h-4 w-px bg-neutral-200" />;
}

export function EmojiPicker({ onSelect }: { onSelect: (emoji: string) => void }) {
    const [open, setOpen] = useState(false);
    const [activeGroup, setActiveGroup] = useState(0);
    const ref = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((p) => !p)}
                title="Emoji"
                className={`flex h-7 w-7 items-center justify-center rounded text-[14px] transition ${open
                    ? "bg-[#0F2E22] text-white"
                    : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
                    }`}
            >
                ☺
            </button>

            {open && (
                <div className="absolute left-0 top-full mt-1.5 z-50 w-[320px] rounded-xl border border-[rgba(0,0,0,0.08)] bg-white shadow-xl">
                    {/* Category tabs */}
                    <div className="flex gap-0.5 border-b border-[rgba(0,0,0,0.06)] px-2 py-1.5 overflow-x-auto">
                        {EMOJI_GROUPS.map((g, i) => (
                            <button
                                key={g.label}
                                type="button"
                                onClick={() => setActiveGroup(i)}
                                className={`flex-shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${activeGroup === i
                                    ? "bg-[#0F2E22]/[0.08] text-heading"
                                    : "text-neutral-400 hover:text-neutral-600"
                                    }`}
                            >
                                {g.label}
                            </button>
                        ))}
                    </div>

                    {/* Emoji grid */}
                    <div className="grid grid-cols-8 gap-0.5 p-2 max-h-[200px] overflow-y-auto">
                        {EMOJI_GROUPS[activeGroup].emojis.map((emoji) => (
                            <button
                                key={emoji}
                                type="button"
                                onClick={() => {
                                    onSelect(emoji);
                                    setOpen(false);
                                }}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-[18px] transition hover:bg-neutral-100"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
