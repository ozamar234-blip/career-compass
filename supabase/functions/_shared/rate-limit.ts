// Simple in-memory rate limiter for Edge Functions
// In production, use Redis or Supabase table for distributed rate limiting

const requestCounts = new Map<string, { count: number; resetAt: number }>()

const WINDOW_MS = 60_000 // 1 minute
const MAX_REQUESTS = 10  // 10 requests per minute per user

export function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const entry = requestCounts.get(userId)

  if (!entry || now > entry.resetAt) {
    requestCounts.set(userId, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, remaining: MAX_REQUESTS - 1 }
  }

  if (entry.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0 }
  }

  entry.count++
  return { allowed: true, remaining: MAX_REQUESTS - entry.count }
}

export function rateLimitResponse() {
  return new Response(
    JSON.stringify({ error: "יותר מדי בקשות. נסה שוב בעוד דקה." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": "60",
        "Access-Control-Allow-Origin": "*",
      },
    }
  )
}
