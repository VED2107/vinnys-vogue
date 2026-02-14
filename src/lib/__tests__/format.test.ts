import { describe, it, expect } from "@jest/globals";
import { formatMoneyFromCents, formatMoney } from "@/lib/format";

describe("formatMoneyFromCents", () => {
    it("formats INR cents correctly", () => {
        expect(formatMoneyFromCents(250000, "INR")).toBe("₹2,500.00");
    });

    it("formats zero cents", () => {
        expect(formatMoneyFromCents(0, "INR")).toBe("₹0.00");
    });

    it("handles small amounts", () => {
        expect(formatMoneyFromCents(99, "INR")).toBe("₹0.99");
    });

    it("handles large amounts", () => {
        const result = formatMoneyFromCents(1500000, "INR");
        expect(result).toContain("15,000");
    });
});

describe("formatMoney", () => {
    it("formats INR amount", () => {
        expect(formatMoney(2500, "INR")).toBe("₹2,500.00");
    });

    it("formats zero", () => {
        expect(formatMoney(0, "INR")).toBe("₹0.00");
    });
});
