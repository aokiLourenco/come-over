const hits = new Map<string, { count: number; resetAt: number }>();

/** Per-process limiter. Good enough for one server; swap for Redis if you scale out. */
export function allow(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (hits.size > 5000) for (const [k, v] of hits) if (v.resetAt < now) hits.delete(k);
  const h = hits.get(key);
  if (!h || h.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  h.count += 1;
  return h.count <= limit;
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
}
