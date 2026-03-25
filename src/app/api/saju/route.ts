import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateSaju } from "@/services/saju";
import { generateFreeReading, generatePaidReading } from "@/services/openai";
import type { SajuInputForm } from "@/types";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 로그인 여부 확인 (실패해도 계속 진행)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const {
      input,
      type = "free",
    }: { input: SajuInputForm; type?: "free" | "premium" } =
      await request.json();

    // 입력값 검증
    if (!input.name || !input.birth_date || !input.gender) {
      return NextResponse.json(
        { error: "필수 입력값이 누락되었습니다." },
        { status: 400 },
      );
    }

    // ── 무료 버전: 캐싱 없이 빠르게 반환 ───────────────────────────
    if (type === "free") {
      const saju = calculateSaju(input);
      const content = await generateFreeReading(saju, input);
      return NextResponse.json({ content, type: "free" });
    }

    // ── 유료 버전: 캐싱 조회 후 GPT-4o 생성 ────────────────────────
    // 로그인된 유저만 캐싱 조회 (비로그인은 항상 새로 생성)
    if (user) {
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
        return NextResponse.json({
          content: cached.content,
          type: "premium",
          cached: true,
        });
      }
    }

    const saju = calculateSaju(input);
    const content = await generatePaidReading(saju, input);

    // 로그인된 유저만 DB 저장 (RLS 정책: auth.uid() = user_id)
    if (user) {
      const { error: insertError } = await supabase
        .from("saju_results")
        .insert({
          user_id: user.id,
          category: "premium",
          content,
          input_snapshot: input,
        });

      if (insertError) {
        console.error(
          "[API/saju] DB 저장 실패:",
          insertError.message,
          insertError.code,
        );
      }
    }

    return NextResponse.json({ content, type: "premium", cached: false });
  } catch (error) {
    console.error("[API/saju] 오류:", error);
    return NextResponse.json(
      { error: "사주 풀이 생성 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
