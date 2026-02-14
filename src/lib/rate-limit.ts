/**
 * Simple in-memory rate limiter for API routes.
 * Sliding window using a Map. Entries auto-expire after `windowMs`.
 * NOTE: This works per-server-instance; for multi-instance deployments,
 * consider an external store like Redis.
 */

type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

// Cleanup stale entries every 60 seconds
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
        if (now > entry.resetAt) store.delete(key);
    }
}, 60_000);

export interface RateLimitResult {
    success: boolean;
    remaining: number;
    resetAt: number;
}

/**
 * Check rate limit for a given key.
 * @param key   - A unique identifier (e.g. IP + route)
 * @param limit - Max requests allowed in the window
 * @param windowMs - Time window in milliseconds (default 60s)
 */
export function rateLimit(
    key: string,
    limit: number = 10,
    windowMs: number = 60_000,
): RateLimitResult {
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now > entry.resetAt) {
        // Start a new window
        store.set(key, { count: 1, resetAt: now + windowMs });
        return { success: true, remaining: limit - 1, resetAt: now + windowMs };
    }

    entry.count += 1;

    if (entry.count > limit) {
        return { success: false, remaining: 0, resetAt: entry.resetAt };
    }

    return {
        success: true,
        remaining: limit - entry.count,
        resetAt: entry.resetAt,
    };
}

/**
 * Extract a client identifier from a Request.
 * Uses x-forwarded-for (Vercel), x-real-ip, or falls back to "unknown".
 */
export function getClientIp(request: Request): string {
    return (
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        request.headers.get("x-real-ip") ??
        "unknown"
    );
}
