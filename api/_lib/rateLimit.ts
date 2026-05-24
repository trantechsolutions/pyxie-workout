// Chaos H2: tiny in-memory sliding-window rate limiter.
//
// CAVEAT: this lives at module scope inside a Vercel Function isolate. Each
// isolate has its own Map, so the *effective* limit across the deployment is
// N × `limit` where N is the number of concurrently-warm isolates. For v1
// this is acceptable — it raises the brute-force bar significantly without
// dragging in Upstash/Redis. Move to a shared backing store once family
// abuse becomes a real concern (tracked as a backlog observation).

interface SlidingWindow {
  timestamps: number[];
}

const buckets = new Map<string, SlidingWindow>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs: number;
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): RateLimitResult {
  const cutoff = now - windowMs;
  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { timestamps: [] };
    buckets.set(key, bucket);
  }
  // Drop expired entries first so memory doesn't grow unbounded.
  bucket.timestamps = bucket.timestamps.filter((t) => t > cutoff);

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0];
    const retryAfterMs = Math.max(0, oldest + windowMs - now);
    return { allowed: false, retryAfterMs };
  }

  bucket.timestamps.push(now);
  return { allowed: true, retryAfterMs: 0 };
}

// Test-only hook so suites can isolate buckets across cases.
export function __resetRateLimitForTests(): void {
  buckets.clear();
}
