/**
 * 인메모리 IP rate limiter
 * - Vercel serverless 환경에서는 인스턴스별로 동작 (완벽하진 않지만 대부분의 어뷰저 차단 가능)
 * - 본격 운영 시 Upstash Redis 기반으로 교체 권장
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

/**
 * @param ip       클라이언트 IP
 * @param limit    windowMs 내 최대 허용 횟수
 * @param windowMs 윈도우 크기 (밀리초), 기본 1분
 * @returns        { allowed: boolean; remaining: number }
 */
export function checkRateLimit(
  ip: string,
  limit: number,
  windowMs = 60_000,
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = store.get(ip);

  // 윈도우 만료 or 첫 요청
  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  // 윈도우 내 한도 초과
  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count };
}

/** Next.js Request 헤더에서 실제 IP 추출 */
export function getIp(request: Request): string {
  const headers = new Headers(request.headers);
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    "unknown"
  );
}
