export function parsePrice(value: string | null | undefined) {
    if (!value || !value.trim()) return 0;
    const normalized = value.replace(/,/g, "").replace(/₹/g, "").trim();
    const numberValue = Number.parseFloat(normalized);

    if (!Number.isFinite(numberValue) || numberValue < 0) {
        return null;
    }

    return Math.round(numberValue * 100) / 100;
}
