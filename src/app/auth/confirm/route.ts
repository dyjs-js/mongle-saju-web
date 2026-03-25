import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Supabase 이메일 인증 링크 / 비밀번호 재설정 링크 처리
// URL 형태: /auth/confirm?token_hash=xxx&type=email&next=/saju/result
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as
    | "email"
    | "recovery"
    | "invite"
    | null;
  const next = searchParams.get("next") ?? "/";

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) {
      // 비밀번호 재설정의 경우 재설정 페이지로
      if (type === "recovery") {
        return NextResponse.redirect(
          `${origin}/auth/reset-password?next=${encodeURIComponent(next)}`,
        );
      }
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error("[auth/confirm] OTP 검증 실패:", error.message);
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
