import { NextResponse } from "next/server";
import { calculateSaju } from "@/services/saju";
import { generateCompatibilityReading } from "@/services/openai";
import { createServiceClient } from "@/lib/supabase/server";
import { checkRateLimit, getIp } from "@/lib/rate-limit";
import type { SajuInputForm } from "@/types";

// 프롬프트 변경 시 이 값을 올리면 기존 캐시 자동 무효화
const PROMPT_VER = "v2";

/**
 * 두 일주를 알파벳순으로 정렬해 합친 캐시 키 생성
 * 예: ("무신", "갑자") → "갑자|무신" (순서 무관 동일 결과 보장)
 */
function makeIljuKey(ilju1: string, ilju2: string): string {
  return [ilju1, ilju2].sort().join("|");
}

export async function POST(request: Request) {
  try {
    // ── IP Rate Limit: 분당 5회 ────────────────────────────────
    const ip = getIp(request);
    const { allowed } = checkRateLimit(`compat:${ip}`, 5, 60_000);
    if (!allowed) {
      return NextResponse.json(
        { error: "요청이 너무 많아요. 잠시 후 다시 시도해주세요." },
        { status: 429 },
      );
    }

    const {
      user1,
      user2,
      relationship,
    }: {
      user1: SajuInputForm;
      user2: SajuInputForm;
      relationship: string;
    } = await request.json();

    if (
      !user1?.name ||
      !user1?.birth_date ||
      !user2?.name ||
      !user2?.birth_date
    ) {
      return NextResponse.json(
        { error: "두 사람의 정보를 모두 입력해주세요." },
        { status: 400 },
      );
    }

    const saju1 = calculateSaju(user1);
    const saju2 = calculateSaju(user2);
    const ilju1 = `${saju1.day_pillar.cheongan}${saju1.day_pillar.jiji}`;
    const ilju2 = `${saju2.day_pillar.cheongan}${saju2.day_pillar.jiji}`;

    const iljuKey = makeIljuKey(ilju1, ilju2);
    const supabase = createServiceClient();

    // ── 캐시 조회 ──────────────────────────────────────────────
    const { data: cached } = await supabase
      .from("compatibility_cache")
      .select("id, content")
      .eq("ilju_key", iljuKey)
      .eq("relationship", relationship)
      .eq("prompt_ver", PROMPT_VER)
      .maybeSingle();

    if (cached) {
      supabase.rpc("increment_compat_hit", { p_id: cached.id }).then(() => {});
      return NextResponse.json({ content: cached.content, cached: true });
    }

    // ── AI 호출 ────────────────────────────────────────────
    const content = await generateCompatibilityReading(
      { name: user1.name, ilju: ilju1 },
      { name: user2.name, ilju: ilju2 },
      relationship,
    );

    // 결과 저장
    supabase
      .from("compatibility_cache")
      .insert({
        ilju_key: iljuKey,
        relationship,
        prompt_ver: PROMPT_VER,
        content,
      })
      .then(() => {});

    return NextResponse.json({ content, cached: false });
  } catch (error) {
    console.error("[API/compatibility]", error);
    return NextResponse.json(
      { error: "궁합 풀이 생성 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
