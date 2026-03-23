import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateSaju } from "@/services/saju";
import { generateSajuReading } from "@/services/openai";
import type { SajuInputForm } from "@/types";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 },
      );
    }

    const { input }: { input: SajuInputForm } = await request.json();

    // 입력값 검증
    if (!input.name || !input.birth_date || !input.gender) {
      return NextResponse.json(
        { error: "필수 입력값이 누락되었습니다." },
        { status: 400 },
      );
    }

    // 기존 결과 캐싱 조회 (같은 사주 데이터면 DB에서 반환 → GPT 비용 절감)
    const { data: cached } = await supabase
      .from("saju_results")
      .select("content")
      .eq("user_id", user.id)
      .contains("input_snapshot", {
        birth_date: input.birth_date,
        gender: input.gender,
        is_solar: input.is_solar,
        concerns: input.concerns ?? [],
      })
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (cached?.content) {
      return NextResponse.json({ content: cached.content, cached: true });
    }

    // 사주 계산
    const saju = calculateSaju(input);

    // AI 풀이 생성
    const content = await generateSajuReading(saju, input);

    // DB에 저장
    await supabase.from("saju_results").insert({
      user_id: user.id,
      content,
      input_snapshot: input,
    });

    return NextResponse.json({ content, cached: false });
  } catch (error) {
    console.error("[API/saju] 오류:", error);
    return NextResponse.json(
      { error: "사주 풀이 생성 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
