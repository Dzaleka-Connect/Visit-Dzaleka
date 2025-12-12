/**
 * Simple in-memory cache with TTL support.
 * Used for caching frequently accessed, rarely changing data.
 */

interface CacheEntry<T> {
    value: T;
    expiresAt: number;
}

class SimpleCache {
    private cache: Map<string, CacheEntry<any>> = new Map();
    private cleanupInterval: ReturnType<typeof setInterval> | null = null;

    constructor() {
        // Cleanup expired entries every 60 seconds
        this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    }

    /**
     * Get a cached value
     */
    get<T>(key: string): T | undefined {
        const entry = this.cache.get(key);
        if (!entry) return undefined;

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return undefined;
        }

        return entry.value as T;
    }

    /**
     * Set a cached value with TTL in milliseconds
     */
    set<T>(key: string, value: T, ttlMs: number): void {
        this.cache.set(key, {
            value,
            expiresAt: Date.now() + ttlMs
        });
    }

    /**
     * Invalidate a specific cache key
     */
    invalidate(key: string): boolean {
        return this.cache.delete(key);
    }

    /**
     * Invalidate all keys with a specific prefix
     */
    invalidatePrefix(prefix: string): number {
        let count = 0;
        for (const key of Array.from(this.cache.keys())) {
            if (key.startsWith(prefix)) {
                this.cache.delete(key);
                count++;
            }
        }
        return count;
    }

    /**
     * Clear all cached entries
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Get cache stats
     */
    stats(): { size: number; keys: string[] } {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }

    private cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of Array.from(this.cache.entries())) {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
            }
        }
    }

    destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.cache.clear();
    }
}

// TTL constants (in milliseconds)
export const CACHE_TTL = {
    SHORT: 1 * 60 * 1000,      // 1 minute
    MEDIUM: 5 * 60 * 1000,     // 5 minutes
    LONG: 15 * 60 * 1000,      // 15 minutes
    HOUR: 60 * 60 * 1000,      // 1 hour
};

// Singleton instance
export const cache = new SimpleCache();

// Cache key prefixes
export const CACHE_KEYS = {
    ZONES: 'zones',
    PRICING: 'pricing',
    CONTENT_BLOCKS: 'content_blocks',
    STATS: 'stats',
};

/**
 * Generic cache wrapper function
 */
export async function withCache<T>(
    key: string,
    ttlMs: number,
    fetchFn: () => Promise<T>
): Promise<T> {
    const cached = cache.get<T>(key);
    if (cached !== undefined) {
        return cached;
    }

    const value = await fetchFn();
    cache.set(key, value, ttlMs);
    return value;
}
