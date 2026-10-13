import type { H3Event } from 'h3'

interface Bucket {
  count: number
  resetAt: number
}

// In-memory fixed-window limiter. Per server instance only — swap for a shared store
// (e.g. Redis via useStorage) if the app runs on multiple instances.
const buckets = new Map<string, Bucket>()

export function assertRateLimit(
  event: H3Event,
  key: string,
  { limit, windowMs }: { limit: number, windowMs: number },
) {
  const now = Date.now()

  if (buckets.size > 10_000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k)
  }

  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return
  }

  bucket.count++
  if (bucket.count > limit) {
    setResponseHeader(event, 'Retry-After', Math.ceil((bucket.resetAt - now) / 1000))
    throw createError({ statusCode: 429, statusMessage: 'Too many attempts. Please try again later.' })
  }
}

export function resetRateLimit(key: string) {
  buckets.delete(key)
}

export function clientIp(event: H3Event): string {
  return getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
}
