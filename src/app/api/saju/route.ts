import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateSaju } from "@/services/saju";
import { generateFreeReading, generatePaidReading } from "@/services/openai";
import type { SajuInputForm } from "@/types";

const FREE_DAILY_LIMIT = 500;

export async function GET() {
  // 오늘의 무료 사용량 조회 (input 페이지 실시간 배지용)
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_today_free_stats");
    if (error) throw error;
    const stats = data as { free_count: number; max_limit: number };
    return NextResponse.json({
      free_count: stats.free_count ?? 0,
      max_limit: stats.max_limit ?? FREE_DAILY_LIMIT,
      remaining: Math.max(
        0,
        (stats.max_limit ?? FREE_DAILY_LIMIT) - (stats.free_count ?? 0),
      ),
    });
  } catch {
    return NextResponse.json({
      free_count: 0,
      max_limit: FREE_DAILY_LIMIT,
      remaining: FREE_DAILY_LIMIT,
    });
  }
}

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

    // ── 무료 버전: 글로벌 쿼터 체크 후 생성 ─────────────────────────
    if (type === "free") {
      // [Layer 3] 오늘의 전체 무료 호출 수 확인
      const { data: statsData } = await supabase.rpc("get_today_free_stats");
      const stats = statsData as {
        free_count: number;
        max_limit: number;
      } | null;
      const currentCount = stats?.free_count ?? 0;
      const maxLimit = stats?.max_limit ?? FREE_DAILY_LIMIT;

      if (currentCount >= maxLimit) {
        return NextResponse.json(
          {
            error: "daily_limit_exceeded",
            free_count: currentCount,
            max_limit: maxLimit,
          },
          { status: 429 },
        );
      }

      const saju = calculateSaju(input);
      const content = await generateFreeReading(saju, input);

      // 카운트 증가 (실패해도 결과는 반환)
      try {
        await supabase.rpc("increment_free_count");
      } catch {
        /* ignore */
      }

      return NextResponse.json({
        content,
        type: "free",
        remaining: Math.max(0, maxLimit - currentCount - 1),
      });
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
          ...(input.relationship_status
            ? { relationship_status: input.relationship_status }
            : {}),
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
