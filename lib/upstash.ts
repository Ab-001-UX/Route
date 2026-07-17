import { Redis } from "@upstash/redis";

const getRedisClient = () => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!url || !token || url.includes("placeholder") || token.includes("placeholder")) {
    // Fallback/log warning in dev when credentials aren't set yet
    console.warn("Upstash Redis credentials are not configured. Rate limiting is currently bypassed.");
    return null;
  }
  
  return new Redis({
    url,
    token,
  });
};

/**
 * Standard fixed-window rate limiter using Upstash Redis.
 * Returns true if the request is within limits, false if rate limited.
 * 
 * @param identifier Unique identifier (e.g. IP address or Clerk User ID)
 * @param action The name of the action (e.g. "plate_search")
 * @param limit Max allowed requests within the window
 * @param windowSeconds Window duration in seconds
 */
export async function checkRateLimit(
  identifier: string,
  action: string,
  limit: number,
  windowSeconds: number
): Promise<{ success: boolean; remaining: number }> {
  const redis = getRedisClient();
  if (!redis) {
    // Fail open in development if Upstash is not fully configured
    return { success: true, remaining: limit };
  }

  const key = `ratelimit:${action}:${identifier}`;
  
  try {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, windowSeconds);
    }
    
    const remaining = Math.max(0, limit - count);
    if (count > limit) {
      return { success: false, remaining };
    }
    return { success: true, remaining };
  } catch (err) {
    console.error(`Upstash Redis rate limit check failed for key ${key}:`, err);
    // Fail open to avoid blocking user interactions during third-party service downtime
    return { success: true, remaining: 0 };
  }
}
