import { describe, it, expect } from "@jest/globals";
import crypto from "crypto";

/**
 * Unit tests for the webhook signature verification logic.
 * These tests verify the HMAC-SHA256 signature generation and comparison
 * that protects the Razorpay webhook endpoint.
 */

function verifySignature(body: string, signature: string, secret: string): boolean {
    const expected = crypto
        .createHmac("sha256", secret)
        .update(body)
        .digest("hex");
    return expected === signature;
}

describe("Webhook signature verification", () => {
    const secret = "test-webhook-secret-12345";

    it("accepts a valid signature", () => {
        const body = JSON.stringify({ event: "payment.captured", payload: { id: "pay_123" } });
        const validSig = crypto.createHmac("sha256", secret).update(body).digest("hex");

        expect(verifySignature(body, validSig, secret)).toBe(true);
    });

    it("rejects an invalid signature", () => {
        const body = JSON.stringify({ event: "payment.captured" });
        const invalidSig = "deadbeef0000";

        expect(verifySignature(body, invalidSig, secret)).toBe(false);
    });

    it("rejects a tampered body", () => {
        const originalBody = JSON.stringify({ event: "payment.captured" });
        const sig = crypto.createHmac("sha256", secret).update(originalBody).digest("hex");
        const tamperedBody = JSON.stringify({ event: "payment.failed" });

        expect(verifySignature(tamperedBody, sig, secret)).toBe(false);
    });

    it("rejects a wrong secret", () => {
        const body = JSON.stringify({ event: "payment.captured" });
        const sig = crypto.createHmac("sha256", "wrong-secret").update(body).digest("hex");

        expect(verifySignature(body, sig, secret)).toBe(false);
    });
});
