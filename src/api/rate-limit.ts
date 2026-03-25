interface RateLimitOptions {
  maxAttempts: number;
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  expiresAt: number;
}

/**
 * Sweep expired entries from the map to prevent unbounded memory growth.
 * Called automatically every `sweepIntervalMs` during `check()`.
 */
function sweepExpired(entries: Map<string, RateLimitEntry>) {
  const now = Date.now();

  for (const [key, entry] of entries) {
    if (entry.expiresAt <= now) {
      entries.delete(key);
    }
  }
}

const DEFAULT_SWEEP_INTERVAL_MS = 60_000;

export function createRateLimiter({ maxAttempts, windowMs }: RateLimitOptions) {
  const entries = new Map<string, RateLimitEntry>();
  let lastSweepAt = Date.now();

  function maybeSweep() {
    const now = Date.now();

    if (now - lastSweepAt >= DEFAULT_SWEEP_INTERVAL_MS) {
      lastSweepAt = now;
      sweepExpired(entries);
    }
  }

  return {
    check(key: string) {
      maybeSweep();

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
