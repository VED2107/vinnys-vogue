/** Product category enum values — must match the DB enum `public.product_category` exactly. */
export const PRODUCT_CATEGORIES = [
    { value: "bridal", label: "Bridal" },
    { value: "festive", label: "Festive" },
    { value: "haldi", label: "Haldi" },
    { value: "reception", label: "Reception" },
    { value: "mehendi", label: "Mehendi Ceremony" },
    { value: "sangeet", label: "Sangeet" },
    { value: "stock_clearing", label: "Stock Clearing" },
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]["value"];

export function getCategoryLabel(value: string | null): string {
    if (!value) return "—";
    const found = PRODUCT_CATEGORIES.find((c) => c.value === value);
    return found ? found.label : value;
}
