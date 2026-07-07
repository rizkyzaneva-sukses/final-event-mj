interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

function cleanup() {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}

// Cleanup every 5 minutes
setInterval(cleanup, 5 * 60 * 1000).unref();

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  key?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(identifier: string, options: RateLimitOptions): RateLimitResult {
  const { windowMs, max } = options;
  const key = options.key || "global";
  const fullKey = `${key}:${identifier}`;
  const now = Date.now();
  const resetAt = now + windowMs;

  const entry = store.get(fullKey);

  if (!entry || now > entry.resetAt) {
    store.set(fullKey, { count: 1, resetAt });
    return { allowed: true, remaining: max - 1, resetAt };
  }

  if (entry.count >= max) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: max - entry.count, resetAt: entry.resetAt };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

export const RATE_LIMITS = {
  login: { windowMs: 15 * 60 * 1000, max: 5 },
  registration: { windowMs: 60 * 1000, max: 5 },
  payment: { windowMs: 60 * 1000, max: 3 },
  cloudinary: { windowMs: 60 * 1000, max: 10 },
} as const;
