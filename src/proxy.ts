import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// ── IP Rate Limiter (Layer 2) ──────────────────────────────────────
interface RateLimitEntry {
  count: number;
  resetAt: number;
}
const ipMap = new Map<string, RateLimitEntry>();
const FREE_IP_LIMIT = 3;

function getMidnight(): number {
  const now = new Date();
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
  ).getTime();
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function proxy(request: NextRequest) {
  // [Layer 2] /api/saju POST + X-Request-Type: free 에 IP rate limit 적용
  if (
    request.nextUrl.pathname === "/api/saju" &&
    request.method === "POST" &&
    request.headers.get("x-request-type") === "free"
  ) {
    const ip = getClientIp(request);
    const now = Date.now();
    const entry = ipMap.get(ip);

    if (!entry || entry.resetAt <= now) {
      ipMap.set(ip, { count: 1, resetAt: getMidnight() });
    } else if (entry.count >= FREE_IP_LIMIT) {
      return NextResponse.json(
        { error: "ip_rate_limit_exceeded" },
        { status: 429 },
      );
    } else {
      entry.count += 1;
    }
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // 세션 갱신 (중요: 이 호출을 삭제하지 마세요)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 보호된 라우트 설정 (로그인 필요한 페이지)
  const protectedPaths: string[] = [];
  // TODO: 로그인 기능 활성화 시 아래 주석 해제
  // const protectedPaths = ["/saju/result"];
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );

  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
