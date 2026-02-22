"use client";

import { useState } from "react";

type VariantRow = {
    id?: string;
    size: string;
    stock: number;
};

export default function VariantManager({
    initialVariants,
    initialEnabled = false,
}: {
    initialVariants?: VariantRow[];
    initialEnabled?: boolean;
}) {
    const [enabled, setEnabled] = useState(initialEnabled);
    const [variants, setVariants] = useState<VariantRow[]>(
        initialVariants ?? [{ size: "", stock: 0 }],
    );

    function addRow() {
        setVariants((prev) => [...prev, { size: "", stock: 0 }]);
    }

    function removeRow(index: number) {
        setVariants((prev) => prev.filter((_, i) => i !== index));
    }

    function updateRow(index: number, field: "size" | "stock", value: string) {
        setVariants((prev) =>
            prev.map((row, i) =>
                i === index
                    ? { ...row, [field]: field === "stock" ? parseInt(value, 10) || 0 : value }
                    : row,
            ),
        );
    }

    return (
        <div className="space-y-4">
            {/* Has Variants toggle */}
            <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <div>
                    <div className="text-sm font-medium text-zinc-900">Has Variants</div>
                    <div className="text-xs text-zinc-500">
                        Enable size variants with individual stock levels.
                    </div>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                    <input
                        name="has_variants"
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => setEnabled(e.target.checked)}
                        className="peer sr-only"
                    />
                    <div className="h-6 w-11 rounded-full bg-zinc-200 transition peer-checked:bg-zinc-900" />
                    <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition peer-checked:translate-x-5" />
                </label>
            </div>

            {/* Variant rows — only show when enabled */}
            {enabled && (
                <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4">
                    <div className="text-sm font-medium text-zinc-900">Variants</div>
                    <div className="space-y-2">
                        {variants.map((v, i) => (
                            <div key={i} className="flex items-center gap-2">
                                {v.id && (
                                    <input type="hidden" name={`variant_id_${i}`} value={v.id} />
                                )}
                                <input
                                    name={`variant_size_${i}`}
                                    type="text"
                                    placeholder="Size (e.g. S, M, L)"
                                    value={v.size}
                                    onChange={(e) => updateRow(i, "size", e.target.value)}
                                    className="h-10 flex-1 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
                                    required
                                />
                                <input
                                    name={`variant_stock_${i}`}
                                    type="number"
                                    placeholder="Stock"
                                    value={v.stock}
                                    onChange={(e) => updateRow(i, "stock", e.target.value)}
                                    className="h-10 w-24 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
                                    min={0}
                                />
                                <button
                                    type="button"
                                    onClick={() => removeRow(i)}
                                    className="h-10 rounded-xl border border-red-200 bg-red-50 px-3 text-sm font-medium text-red-700 transition hover:bg-red-100"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                    <input type="hidden" name="variant_count" value={variants.length} />
                    <button
                        type="button"
                        onClick={addRow}
                        className="h-9 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50"
                    >
                        + Add Variant
                    </button>
                </div>
            )}

            {/* Always output variant_count so server knows */}
            {!enabled && <input type="hidden" name="variant_count" value="0" />}
        </div>
    );
}
