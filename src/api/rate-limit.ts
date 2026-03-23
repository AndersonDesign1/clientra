interface RateLimitOptions {
  maxAttempts: number;
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  expiresAt: number;
}

export function createRateLimiter({ maxAttempts, windowMs }: RateLimitOptions) {
  const entries = new Map<string, RateLimitEntry>();

  return {
    check(key: string) {
      const now = Date.now();
      const current = entries.get(key);

      if (!current || current.expiresAt <= now) {
        entries.set(key, {
          count: 1,
          expiresAt: now + windowMs,
        });

        return {
          ok: true as const,
          remaining: maxAttempts - 1,
        };
      }

      if (current.count >= maxAttempts) {
        return {
          ok: false as const,
          retryAfterSeconds: Math.max(
            1,
            Math.ceil((current.expiresAt - now) / 1000)
          ),
        };
      }

      current.count += 1;
      entries.set(key, current);

      return {
        ok: true as const,
        remaining: maxAttempts - current.count,
      };
    },
    reset(key: string) {
      entries.delete(key);
    },
  };
}
