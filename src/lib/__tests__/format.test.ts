import { describe, it, expect } from "@jest/globals";
import { formatMoney } from "@/lib/format";

describe("formatMoney", () => {
    it("formats INR rupee amount correctly", () => {
        expect(formatMoney(2500, "INR")).toBe("₹2,500.00");
    });

    it("formats zero", () => {
        expect(formatMoney(0, "INR")).toBe("₹0.00");
    });

    it("handles small amounts", () => {
        expect(formatMoney(0.99, "INR")).toBe("₹0.99");
    });

    it("handles large amounts", () => {
        const result = formatMoney(15000, "INR");
        expect(result).toContain("15,000");
    });
});
