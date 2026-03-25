"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { SajuInputForm, SajuConcern } from "@/types";
import { AccordionResult } from "@/components/saju/SajuRenderer";

const BG = "linear-gradient(160deg, #F3EEFF 0%, #F8F9FF 50%, #EEF3FF 100%)";

interface SajuResult {
  id: string;
  category: string;
  content: string;
  input_snapshot: SajuInputForm;
  created_at: string;
}

// ── 사주 결과 상세 모달 ────────────────────────────────────────────
function ResultModal({
  result,
  onClose,
}: {
  result: SajuResult;
  onClose: () => void;
}) {
  const snap = result.input_snapshot;
  const concerns = (snap?.concerns ?? []) as SajuConcern[];

  // 배경 클릭 시 닫기
  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4"
      style={{ background: "rgba(30,20,60,0.45)", backdropFilter: "blur(4px)" }}
      onClick={handleBackdrop}
    >
      <div
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl flex flex-col"
        style={{
          background: "#fff",
          maxHeight: "88vh",
          boxShadow: "0 -8px 40px rgba(165,124,255,0.20)",
        }}
      >
        {/* 모달 헤더 */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: "rgba(196,160,255,0.2)" }}
        >
          <div>
            <p className="font-bold text-base" style={{ color: "#2D3142" }}>
              {snap?.name ?? "이름 없음"}님의 사주풀이
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#9B8ABE" }}>
              {snap?.birth_date} · {snap?.gender === "male" ? "남성" : "여성"} ·{" "}
              {snap?.is_solar ? "양력" : "음력"}
              {concerns.length > 0 && (
                <span className="ml-1">· {concerns.join(", ")}</span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-lg transition-colors hover:bg-gray-100"
            style={{ color: "#9B8ABE" }}
          >
            ✕
          </button>
        </div>

        {/* 본문 스크롤 */}
        <div
          className="overflow-y-auto flex-1 px-4 py-4"
          style={{
            background:
              "linear-gradient(160deg, #F3EEFF 0%, #F8F9FF 50%, #EEF3FF 100%)",
          }}
        >
          {/* 결과 카드 헤더 */}
          <div
            className="rounded-3xl p-5 mb-3"
            style={{
              background: "rgba(255,255,255,0.92)",
              border: "1px solid rgba(196,160,255,0.3)",
              boxShadow: "0 4px 24px rgba(165,124,255,0.10)",
            }}
          >
            <div className="flex items-center gap-1.5 mb-4">
              <span className="text-lg">🌙</span>
              <span className="text-xs font-bold" style={{ color: "#A57CFF" }}>
                몽글사주
              </span>
              {result.category === "premium" && (
                <span
                  className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(165,124,255,0.12)",
                    color: "#A57CFF",
                  }}
                >
                  ✨ PREMIUM
                </span>
              )}
            </div>
            <AccordionResult
              content={result.content}
              isPaid={result.category === "premium"}
            />
          </div>
        </div>

        {/* 하단 버튼 */}
        <div
          className="px-5 py-4 border-t"
          style={{ borderColor: "rgba(196,160,255,0.2)" }}
        >
          <button
            onClick={onClose}
            className="w-full font-bold py-3.5 rounded-2xl text-sm"
            style={{
              background: "linear-gradient(135deg, #B98EFF 0%, #A57CFF 100%)",
              color: "#fff",
            }}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 결과 카드 ────────────────────────────────────────────────────
function ResultCard({
  result,
  onClick,
}: {
  result: SajuResult;
  onClick: () => void;
}) {
  const snap = result.input_snapshot;
  const concerns = (snap?.concerns ?? []) as SajuConcern[];
  const date = new Date(result.created_at);
  const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
  // content 앞 80자 미리보기
  const preview = result.content
    .replace(/[#*>\-]/g, "")
    .trim()
    .slice(0, 80);

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl p-4 transition-all active:scale-[0.98] hover:shadow-md"
      style={{
        background: "rgba(255,255,255,0.90)",
        border: "1px solid rgba(196,160,255,0.25)",
        boxShadow: "0 2px 12px rgba(165,124,255,0.07)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* 이름 + 날짜 */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-bold text-sm" style={{ color: "#2D3142" }}>
              {snap?.name ?? "—"}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                background:
                  result.category === "premium"
                    ? "rgba(165,124,255,0.15)"
                    : "rgba(196,160,255,0.10)",
                color: result.category === "premium" ? "#A57CFF" : "#9B8ABE",
              }}
            >
              {result.category === "premium" ? "✨ 완전풀이" : "미리보기"}
            </span>
          </div>

          {/* 생년월일 · 고민 */}
          <p className="text-xs mb-2" style={{ color: "#9B8ABE" }}>
            {snap?.birth_date} · {snap?.gender === "male" ? "남" : "여"} ·{" "}
            {snap?.is_solar ? "양력" : "음력"}
            {concerns.length > 0 && (
              <span className="ml-1 text-[#C4A0FF]">
                · {concerns.join(" · ")}
              </span>
            )}
          </p>

          {/* 내용 미리보기 */}
          <p
            className="text-xs leading-relaxed line-clamp-2"
            style={{ color: "#7B6FA0" }}
          >
            {preview}…
          </p>
        </div>

        {/* 날짜 + 화살표 */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="text-xs" style={{ color: "#C0B4D8" }}>
            {dateStr}
          </span>
          <span style={{ color: "#C4A0FF", fontSize: 16 }}>›</span>
        </div>
      </div>
    </button>
  );
}

// ── 메인 마이페이지 ──────────────────────────────────────────────
export default function MyPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [results, setResults] = useState<SajuResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SajuResult | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/login?next=/mypage");
        return;
      }
      setUser(data.user);
      fetchResults();
    });
  }, [router]);

  async function fetchResults() {
    const res = await fetch("/api/my/results");
    if (!res.ok) return;
    const data = await res.json();
    setResults(data.results ?? []);
    setLoading(false);
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/");
  }

  if (loading) {
    return (
      <main
        className="min-h-screen flex items-center justify-center"
        style={{ background: BG }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
            style={{
              background: "linear-gradient(135deg, #C4A0FF 0%, #A57CFF 100%)",
              animation: "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite",
            }}
          >
            🌙
          </div>
          <p className="text-sm" style={{ color: "#9B8ABE" }}>
            불러오는 중...
          </p>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-screen px-4 py-10" style={{ background: BG }}>
        <div className="w-full max-w-md mx-auto">
          {/* 뒤로가기 */}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm mb-6 transition-colors"
            style={{ color: "#9B8ABE" }}
          >
            ← 홈으로
          </Link>

          {/* 프로필 헤더 */}
          <div
            className="rounded-3xl p-5 mb-5 flex items-center gap-4"
            style={{
              background: "rgba(255,255,255,0.90)",
              border: "1px solid rgba(196,160,255,0.25)",
              boxShadow: "0 4px 20px rgba(165,124,255,0.08)",
            }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0"
              style={{
                background: "linear-gradient(135deg, #C4A0FF 0%, #A57CFF 100%)",
              }}
            >
              🌙
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="font-bold text-sm truncate"
                style={{ color: "#2D3142" }}
              >
                {user?.email}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#9B8ABE" }}>
                총 {results.length}개의 사주풀이
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs px-3 py-1.5 rounded-full border transition-all hover:bg-gray-50 shrink-0"
              style={{
                color: "#9B8ABE",
                borderColor: "rgba(196,160,255,0.4)",
              }}
            >
              로그아웃
            </button>
          </div>

          {/* 섹션 제목 */}
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="font-bold text-base" style={{ color: "#2D3142" }}>
              내 사주 내역
            </h2>
            <Link
              href="/saju/input"
              className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
              style={{
                background: "linear-gradient(135deg, #B98EFF 0%, #A57CFF 100%)",
                color: "#fff",
              }}
            >
              + 새로 보기
            </Link>
          </div>

          {/* 결과 목록 */}
          {results.length === 0 ? (
            <div
              className="rounded-3xl p-10 flex flex-col items-center gap-3 text-center"
              style={{
                background: "rgba(255,255,255,0.80)",
                border: "1px solid rgba(196,160,255,0.2)",
              }}
            >
              <span className="text-4xl">🔮</span>
              <p className="font-semibold text-sm" style={{ color: "#2D3142" }}>
                아직 사주풀이가 없어요
              </p>
              <p className="text-xs" style={{ color: "#9B8ABE" }}>
                나의 운명을 처음으로 풀어볼까요?
              </p>
              <Link
                href="/saju/input"
                className="mt-2 font-bold text-sm px-6 py-3 rounded-2xl"
                style={{
                  background:
                    "linear-gradient(135deg, #B98EFF 0%, #A57CFF 100%)",
                  color: "#fff",
                  boxShadow: "0 4px 16px rgba(165,124,255,0.30)",
                }}
              >
                사주 보러 가기
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3 pb-12">
              {results.map((r) => (
                <ResultCard
                  key={r.id}
                  result={r}
                  onClick={() => setSelected(r)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* 상세 모달 */}
      {selected && (
        <ResultModal result={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
