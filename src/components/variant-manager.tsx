"use client";

import { useState } from "react";

type VariantRow = {
    id?: string;
    size: string;
    stock: number;
};

export default function VariantManager({
    initialVariants,
}: {
    initialVariants?: VariantRow[];
}) {
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
        <div className="space-y-3">
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
    );
}
