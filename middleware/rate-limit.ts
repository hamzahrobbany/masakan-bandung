import { NextRequest } from "next/server";

import { RateLimitError } from "@/utils/api-errors";

interface RateLimitConfig {
  windowMs: number;
  max: number;
  route: string;
  name?: string;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInMs: number;
  totalHits: number;
}

interface RateLimitStore {
  increment(key: string, windowMs: number): Promise<{ count: number; ttlMs: number }>;
}

class InMemoryStore implements RateLimitStore {
  private buckets = new Map<string, { count: number; expiresAt: number }>();

  async increment(key: string, windowMs: number) {
    const now = Date.now();
    const existing = this.buckets.get(key);
    if (!existing || existing.expiresAt <= now) {
      this.buckets.set(key, { count: 1, expiresAt: now + windowMs });
      return { count: 1, ttlMs: windowMs };
    }

    const updated = { count: existing.count + 1, expiresAt: existing.expiresAt };
    this.buckets.set(key, updated);
    return { count: updated.count, ttlMs: updated.expiresAt - now };
  }
}

class UpstashRedisStore implements RateLimitStore {
  constructor(private url: string, private token: string) {}

  async increment(key: string, windowMs: number) {
    const pipelineBody = JSON.stringify([
      ["INCR", key],
      ["PEXPIRE", key, windowMs, "NX"],
      ["PTTL", key],
    ]);

    const response = await fetch(`${this.url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: pipelineBody,
    });

    if (!response.ok) {
      throw new Error(`Redis request failed with status ${response.status}`);
    }

    const result = (await response.json()) as unknown[];
    const count = this.parseCommandResult(result[0]);
    const ttlMs = this.parseCommandResult(result[2]);

    if (typeof count !== "number" || typeof ttlMs !== "number") {
      throw new Error("Unexpected Redis response shape");
    }

    return { count, ttlMs };
  }

  private parseCommandResult(value: unknown) {
    if (Array.isArray(value)) {
      // Upstash returns [error, data]
      return typeof value[1] === "number" ? value[1] : value[0];
    }
    return value as number | undefined;
  }
}

const fallbackStore = new InMemoryStore();

function resolveStore(): RateLimitStore {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL ?? process.env.REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.REDIS_REST_TOKEN;

  if (redisUrl && redisToken) {
    return new UpstashRedisStore(redisUrl, redisToken);
  }

  return fallbackStore;
}

const store = resolveStore();

function getClientIp(req: NextRequest) {
  return (
    req.ip ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function buildKey(identifier: string, name: string) {
  return `rate-limit:${name}:${identifier}`;
}

async function checkRateLimit(identifier: string, config: RateLimitConfig): Promise<RateLimitResult> {
  const key = buildKey(identifier, config.name ?? config.route);

  try {
    const { count, ttlMs } = await store.increment(key, config.windowMs);
    const allowed = count <= config.max;
    const remaining = Math.max(config.max - count, 0);

    return {
      allowed,
      remaining,
      resetInMs: Math.max(ttlMs, 0),
      totalHits: count,
    };
  } catch (error) {
    console.error("Rate limit store error, falling back to in-memory:", error);
    const { count, ttlMs } = await fallbackStore.increment(key, config.windowMs);
    const allowed = count <= config.max;
    return {
      allowed,
      remaining: Math.max(config.max - count, 0),
      resetInMs: Math.max(ttlMs, 0),
      totalHits: count,
    };
  }
}

function logRateLimitBlocked(identifier: string, config: RateLimitConfig, result: RateLimitResult) {
  console.warn(
    JSON.stringify({
      level: "warn",
      event: "rate_limit_blocked",
      identifier,
      route: config.route,
      windowMs: config.windowMs,
      max: config.max,
      totalHits: result.totalHits,
      retryAfterMs: result.resetInMs,
    })
  );
}

function buildRateLimitError(config: RateLimitConfig, result: RateLimitResult) {
  const retryAfterSeconds = Math.max(Math.ceil(result.resetInMs / 1000), 1);

  return new RateLimitError(
    "Terlalu banyak permintaan, silakan coba lagi nanti.",
    {
      headers: {
        "Retry-After": retryAfterSeconds.toString(),
      },
      details: {
        limit: config.max,
        windowMs: config.windowMs,
        retryAfterMs: result.resetInMs,
      },
    }
  );
}

export async function enforceIpRateLimit(req: NextRequest, config: RateLimitConfig) {
  const identifier = getClientIp(req);
  const result = await checkRateLimit(identifier, config);

  if (!result.allowed) {
    logRateLimitBlocked(identifier, config, result);
    throw buildRateLimitError(config, result);
  }

  return { limited: false, result };
}
