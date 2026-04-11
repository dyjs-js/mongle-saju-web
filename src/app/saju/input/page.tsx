"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { SajuInputForm, SajuConcern, RelationshipStatus } from "@/types";
import MarkdownContent from "@/components/ui/MarkdownContent";

const CONCERN_OPTIONS: {
  value: SajuConcern;
  emoji: string;
  label: string;
  sub: string;
}[] = [
  { value: "전체운", emoji: "🔮", label: "전체운", sub: "종합 운세 풀이" },
  { value: "연애운", emoji: "💕", label: "연애운", sub: "썸·밀당·남자복" },
  { value: "재회운", emoji: "🌹", label: "재회운", sub: "전남친·헤어진 사람" },
  { value: "결혼운", emoji: "💍", label: "결혼운", sub: "결혼 시기·궁합" },
  {
    value: "이직·취업운",
    emoji: "✨",
    label: "이직·취업운",
    sub: "직장·커리어·돈",
  },
];

const LOVE_CONCERNS: SajuConcern[] = ["연애운", "재회운", "결혼운"];

const RELATIONSHIP_STATUS_OPTIONS: {
  value: RelationshipStatus;
  emoji: string;
}[] = [
  { value: "솔로예요", emoji: "🌱" },
  { value: "연애 중이에요", emoji: "💑" },
  { value: "짝사랑 중이에요", emoji: "🥺" },
  { value: "기혼이에요", emoji: "💍" },
];

const INITIAL_FORM: SajuInputForm = {
  name: "",
  birth_date: "",
  birth_time: "11:10",
  is_solar: true,
  gender: "female",
  birth_time_unknown: false,
  concerns: ["전체운"],
};

const DEV_FORM: SajuInputForm = {
  name: "연지수",
  birth_date: "1992-09-29",
  birth_time: "11:10",
  is_solar: true,
  gender: "female",
  birth_time_unknown: false,
  concerns: ["전체운"],
};

const DEFAULT_FORM: SajuInputForm =
  process.env.NODE_ENV === "development" ? DEV_FORM : INITIAL_FORM;

// 공통 인풋 스타일
const inputClass =
  "w-full rounded-xl px-4 py-3 text-sm outline-none transition-all bg-white/80" +
  " border border-[rgba(196,160,255,0.4)] focus:border-[#A57CFF] focus:ring-2 focus:ring-[rgba(165,124,255,0.2)]" +
  " text-[#2D3142] placeholder:text-[#C0B4D8]";

export default function SajuInputPage() {
  const router = useRouter();
  const [form, setForm] = useState<SajuInputForm>(DEFAULT_FORM);
  const [relationshipError, setRelationshipError] = useState(false);
  const isDev = process.env.NODE_ENV === "development";
  const [testContent, setTestContent] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  // 잔여 수량 상태
  const [quota, setQuota] = useState<{
    remaining: number;
    max_limit: number;
    loaded: boolean;
  }>({ remaining: 500, max_limit: 500, loaded: false });

  // 입력 페이지 진입 시 항상 폼을 초기값으로 리셋 + 잔여 수량 조회
  useEffect(() => {
    sessionStorage.removeItem("saju_input");
    setForm(DEFAULT_FORM);
    fetch("/api/saju")
      .then((r) => r.json())
      .then((d) =>
        setQuota({
          remaining: d.remaining ?? 500,
          max_limit: d.max_limit ?? 500,
          loaded: true,
        }),
      )
      .catch(() => setQuota({ remaining: 500, max_limit: 500, loaded: true }));
  }, []);

  function handleChange<K extends keyof SajuInputForm>(
    key: K,
    value: SajuInputForm[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleConcern(concern: SajuConcern) {
    setRelationshipError(false);
    setForm((prev) => {
      const has = prev.concerns.includes(concern);
      let nextConcerns: SajuConcern[];

      if (has) {
        nextConcerns = prev.concerns.filter((c) => c !== concern);
      } else if (concern === "전체운") {
        nextConcerns = ["전체운"];
      } else {
        nextConcerns = [
          ...prev.concerns.filter((c) => c !== "전체운"),
          concern,
        ];
      }

      // 인연 관련 concern이 하나도 없으면 relationship_status 초기화
      const hasLove = nextConcerns.some((c) => LOVE_CONCERNS.includes(c));
      return {
        ...prev,
        concerns: nextConcerns,
        relationship_status: hasLove ? prev.relationship_status : undefined,
      };
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // 인연 관련 concern 선택 시 현재 상황 필수
    const hasLoveConcern = form.concerns.some((c) => LOVE_CONCERNS.includes(c));
    if (hasLoveConcern && !form.relationship_status) {
      const el = document.getElementById("relationship-status-section");
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      setRelationshipError(true);
      return;
    }

    sessionStorage.setItem("saju_input", JSON.stringify(form));
    router.push("/saju/result");
  }

  function fetchTest() {
    if (!form.name || !form.birth_date) {
      alert("이름과 생년월일을 입력해주세요.");
      return;
    }
    setTestContent(null);
    setTestLoading(true);
    fetch("/api/saju", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: form, type: "test" }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setTestContent(d.content);
      })
      .catch((err) => alert("테스트 오류: " + err.message))
      .finally(() => setTestLoading(false));
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center px-4 py-10"
      style={{
        background:
          "linear-gradient(160deg, #F3EEFF 0%, #F8F9FF 50%, #EEF3FF 100%)",
      }}
    >
      <div className="w-full max-w-md">
        {/* 뒤로가기 */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm mb-6 transition-colors"
          style={{ color: "#9B8ABE" }}
        >
          ← 홈으로
        </Link>

        {/* 헤더 */}
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3 shadow-md"
            style={{
              background: "linear-gradient(135deg, #C4A0FF 0%, #A57CFF 100%)",
            }}
          >
            🌙
          </div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: "#2D3142" }}>
            사주 정보 입력
          </h1>
          <p className="text-sm" style={{ color: "#9B8ABE" }}>
            정확할수록 더 정확한 풀이를 드려요
          </p>
        </div>

        {/* 폼 카드 */}
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl p-6 flex flex-col gap-5"
          style={{
            background: "rgba(255,255,255,0.75)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(196,160,255,0.3)",
            boxShadow: "0 4px 24px rgba(165,124,255,0.10)",
          }}
        >
          {/* 이름 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: "#2D3142" }}>
              이름 <span style={{ color: "#A57CFF" }}>*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="김몽글"
              required
              className={inputClass}
            />
          </div>

          {/* 성별 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: "#2D3142" }}>
              성별
            </label>
            <div className="flex gap-3">
              {(["female", "male"] as const).map((g) => {
                const selected = form.gender === g;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => handleChange("gender", g)}
                    className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: selected
                        ? "linear-gradient(135deg, #C4A0FF 0%, #A57CFF 100%)"
                        : "rgba(255,255,255,0.8)",
                      color: selected ? "#fff" : "#7A7A9A",
                      border: selected
                        ? "1px solid #A57CFF"
                        : "1px solid rgba(196,160,255,0.4)",
                      boxShadow: selected
                        ? "0 2px 12px rgba(165,124,255,0.30)"
                        : "none",
                    }}
                  >
                    {g === "female" ? "🌸 여성" : "🌿 남성"}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 양력/음력 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: "#2D3142" }}>
              생년월일 기준
            </label>
            <div className="flex gap-3">
              {[
                { label: "양력", value: true },
                { label: "음력", value: false },
              ].map((opt) => {
                const selected = form.is_solar === opt.value;
                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => handleChange("is_solar", opt.value)}
                    className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: selected
                        ? "linear-gradient(135deg, #C4A0FF 0%, #A57CFF 100%)"
                        : "rgba(255,255,255,0.8)",
                      color: selected ? "#fff" : "#7A7A9A",
                      border: selected
                        ? "1px solid #A57CFF"
                        : "1px solid rgba(196,160,255,0.4)",
                      boxShadow: selected
                        ? "0 2px 12px rgba(165,124,255,0.30)"
                        : "none",
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 생년월일 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: "#2D3142" }}>
              생년월일 <span style={{ color: "#A57CFF" }}>*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="예: 1992-09-29"
              value={form.birth_date}
              onChange={(e) => {
                // 숫자만 남기고 자동으로 YYYY-MM-DD 포맷 적용
                const digits = e.target.value.replace(/\D/g, "").slice(0, 8);
                let formatted = digits;
                if (digits.length > 4)
                  formatted = digits.slice(0, 4) + "-" + digits.slice(4);
                if (digits.length > 6)
                  formatted =
                    digits.slice(0, 4) +
                    "-" +
                    digits.slice(4, 6) +
                    "-" +
                    digits.slice(6);
                handleChange("birth_date", formatted);
              }}
              required
              maxLength={10}
              className={inputClass}
            />
          </div>

          {/* 태어난 시간 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: "#2D3142" }}>
              태어난 시간
            </label>
            <label
              className="flex items-center gap-2 text-sm cursor-pointer mb-1 select-none"
              style={{ color: "#9B8ABE" }}
            >
              <input
                type="checkbox"
                checked={form.birth_time_unknown}
                onChange={(e) =>
                  handleChange("birth_time_unknown", e.target.checked)
                }
                className="w-4 h-4 rounded accent-[#A57CFF]"
              />
              시간을 몰라요
            </label>
            {!form.birth_time_unknown && (
              <input
                type="time"
                value={form.birth_time}
                onChange={(e) => handleChange("birth_time", e.target.value)}
                className={inputClass}
                style={{ colorScheme: "light" }}
              />
            )}
          </div>

          {/* 고민 선택 */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" style={{ color: "#2D3142" }}>
              어떤 고민이 가장 깊으신가요?{" "}
              <span
                className="font-normal text-xs"
                style={{ color: "#9B8ABE" }}
              >
                (복수 선택 가능)
              </span>
            </label>

            {/* 전체운 — 풀 width */}
            {(() => {
              const opt = CONCERN_OPTIONS[0]; // 전체운
              const selected = form.concerns.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleConcern(opt.value)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-sm transition-all active:scale-95"
                  style={{
                    background: selected
                      ? "linear-gradient(135deg, #C4A0FF 0%, #A57CFF 100%)"
                      : "rgba(255,255,255,0.8)",
                    color: selected ? "#fff" : "#7A7A9A",
                    border: selected
                      ? "1px solid #A57CFF"
                      : "1px solid rgba(196,160,255,0.4)",
                    boxShadow: selected
                      ? "0 2px 12px rgba(165,124,255,0.30)"
                      : "none",
                  }}
                >
                  <span className="text-xl">{opt.emoji}</span>
                  <span className="font-semibold">{opt.label}</span>
                  <span
                    className="text-xs"
                    style={{
                      color: selected ? "rgba(255,255,255,0.8)" : "#C0B4D8",
                    }}
                  >
                    {opt.sub}
                  </span>
                </button>
              );
            })()}

            {/* 개별 운 — 2열 그리드 */}
            <div className="grid grid-cols-2 gap-2">
              {CONCERN_OPTIONS.slice(1).map((opt) => {
                const selected = form.concerns.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleConcern(opt.value)}
                    className="flex flex-col items-center py-3 px-2 rounded-2xl text-sm transition-all active:scale-95"
                    style={{
                      background: selected
                        ? "linear-gradient(135deg, #C4A0FF 0%, #A57CFF 100%)"
                        : "rgba(255,255,255,0.8)",
                      color: selected ? "#fff" : "#7A7A9A",
                      border: selected
                        ? "1px solid #A57CFF"
                        : "1px solid rgba(196,160,255,0.4)",
                      boxShadow: selected
                        ? "0 2px 12px rgba(165,124,255,0.30)"
                        : "none",
                    }}
                  >
                    <span className="text-xl mb-0.5">{opt.emoji}</span>
                    <span className="font-semibold text-sm">{opt.label}</span>
                    <span
                      className="text-xs mt-0.5"
                      style={{
                        color: selected ? "rgba(255,255,255,0.8)" : "#C0B4D8",
                      }}
                    >
                      {opt.sub}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 현재 연애 상황 — 인연 관련 concern 선택 시만 표시 */}
          {form.concerns.some((c) => LOVE_CONCERNS.includes(c)) && (
            <div
              id="relationship-status-section"
              className="flex flex-col gap-2 rounded-2xl px-4 py-4"
              style={{
                background: relationshipError
                  ? "rgba(255,100,100,0.05)"
                  : "rgba(196,160,255,0.07)",
                border: relationshipError
                  ? "1px solid rgba(255,100,100,0.35)"
                  : "1px solid rgba(196,160,255,0.25)",
                animation: "fadeIn 0.25s ease",
              }}
            >
              <div className="flex items-center justify-between">
                <label
                  className="text-sm font-medium"
                  style={{ color: "#2D3142" }}
                >
                  지금{form.name ? ` ${form.name}님` : ""}의 상황은 어떤가요?{" "}
                  <span style={{ color: "#A57CFF" }}>*</span>
                </label>
                {relationshipError && (
                  <span
                    className="text-xs font-medium"
                    style={{ color: "#E05050" }}
                  >
                    필수 선택이에요
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {RELATIONSHIP_STATUS_OPTIONS.map((opt) => {
                  const selected = form.relationship_status === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setRelationshipError(false);
                        handleChange(
                          "relationship_status",
                          selected ? undefined : opt.value,
                        );
                      }}
                      className="flex items-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all active:scale-95"
                      style={{
                        background: selected
                          ? "linear-gradient(135deg, #C4A0FF 0%, #A57CFF 100%)"
                          : "rgba(255,255,255,0.85)",
                        color: selected ? "#fff" : "#7A7A9A",
                        border: selected
                          ? "1px solid #A57CFF"
                          : "1px solid rgba(196,160,255,0.4)",
                        boxShadow: selected
                          ? "0 2px 10px rgba(165,124,255,0.28)"
                          : "none",
                      }}
                    >
                      <span>{opt.emoji}</span>
                      <span>{opt.value}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 제출 버튼 */}
          {quota.loaded && quota.remaining <= 0 ? (
            // Sold Out UI
            <div
              className="flex flex-col gap-3 p-4 rounded-2xl text-center"
              style={{
                background: "rgba(255,80,80,0.05)",
                border: "1px solid rgba(255,80,80,0.20)",
              }}
            >
              <p className="text-sm font-semibold" style={{ color: "#2D3142" }}>
                오늘 준비된 500개의 무료 궤도가 모두 소진됐어요 😢
              </p>
              <p className="text-xs" style={{ color: "#9B8ABE" }}>
                내일 오전 00시에 다시 열려요!
                <br />
                기다리기 힘들다면 지금 바로 확인하세요.
              </p>
              <button
                type="button"
                onClick={() => {
                  sessionStorage.setItem("saju_input", JSON.stringify(form));
                  router.push("/saju/result");
                }}
                className="font-bold py-3.5 rounded-2xl text-sm transition-all active:scale-95"
                style={{
                  background:
                    "linear-gradient(135deg, #B98EFF 0%, #A57CFF 100%)",
                  color: "#fff",
                  boxShadow: "0 4px 20px rgba(165,124,255,0.35)",
                }}
              >
                프리미엄으로 지금 바로 보기 →
              </button>
            </div>
          ) : (
            <div className="relative mt-2">
              {/* 플로팅 배지 — 버튼 우상단 */}
              <div className="absolute -top-3.5 -right-2 z-10 bg-white px-2.5 py-1 rounded-full shadow-md border border-purple-100 flex items-center gap-1.5">
                {/* 실시간 핑 점 */}
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                </span>
                <span className="text-[11px] font-bold text-gray-800 whitespace-nowrap">
                  {quota.loaded ? (
                    <>
                      오늘 남은 무료:{" "}
                      <strong style={{ color: "#A57CFF" }}>
                        {quota.remaining}
                      </strong>
                      개
                      {quota.remaining <= 50 && (
                        <span className="ml-1 text-red-500">곧 마감!</span>
                      )}
                    </>
                  ) : (
                    "🎁 무료 체험 가능!"
                  )}
                </span>
              </div>

              <button
                type="submit"
                className="w-full font-bold py-4 rounded-2xl text-base transition-all active:scale-95 hover:brightness-105"
                style={{
                  background:
                    "linear-gradient(135deg, #B98EFF 0%, #A57CFF 100%)",
                  color: "#fff",
                  boxShadow: "0 4px 20px rgba(165,124,255,0.35)",
                }}
              >
                내 운명 무료로 확인하기 ✨
              </button>
            </div>
          )}
          <p className="text-center text-xs" style={{ color: "#C0B4D8" }}>
            처음 입력은 무료 · 결제는 나중에
          </p>

          {/* 궁합 보기 아웃라인 버튼 */}
          <Link
            href="/saju/compatibility"
            className="flex items-center justify-center gap-1.5 w-full py-3.5 rounded-2xl text-sm font-bold transition-all active:scale-95"
            style={{
              border: "1.5px solid rgba(165,124,255,0.55)",
              color: "#A57CFF",
              background: "rgba(165,124,255,0.04)",
            }}
          >
            💘 우리 궁합은?{" "}
            <span className="font-normal text-xs opacity-70">
              (무료 체험하기)
            </span>
          </Link>

          {/* 🧪 테스트 패널 (dev only) */}
          {isDev && (
            <div
              className="rounded-2xl p-4 flex flex-col gap-3 mt-1"
              style={{
                background: "rgba(255,230,100,0.12)",
                border: "1.5px dashed rgba(200,160,0,0.4)",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span>🧪</span>
                  <p className="text-sm font-bold" style={{ color: "#7A5F00" }}>
                    테스트 프롬프트
                  </p>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{
                      background: "rgba(255,180,0,0.2)",
                      color: "#7A5F00",
                    }}
                  >
                    dev only
                  </span>
                </div>
                <span className="text-[10px]" style={{ color: "#9B8520" }}>
                  gpt-4o-mini
                </span>
              </div>
              <p className="text-xs" style={{ color: "#9B8520" }}>
                위 폼에 입력된 사주로 물상론·심리학·상담 통찰 포맷 테스트
              </p>
              <button
                type="button"
                onClick={fetchTest}
                disabled={testLoading}
                className="w-full font-bold py-3 rounded-2xl text-sm transition-all active:scale-95 disabled:opacity-60"
                style={{
                  background:
                    "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
                  color: "#3A2A00",
                  boxShadow: "0 2px 12px rgba(255,180,0,0.30)",
                }}
              >
                {testLoading ? "⏳ 생성 중..." : "🧪 테스트 풀이 생성"}
              </button>
              {testContent &&
                (() => {
                  let parsed: Record<string, unknown> | null = null;
                  try {
                    parsed = JSON.parse(testContent);
                  } catch {
                    /* raw 표시 */
                  }
                  if (parsed) {
                    const summary = parsed.saju_summary
                      ? String(parsed.saju_summary)
                      : null;
                    const closing = parsed.closing
                      ? String(parsed.closing)
                      : null;
                    const advice =
                      parsed.advice && typeof parsed.advice === "object"
                        ? (parsed.advice as Record<string, string>)
                        : null;
                    return (
                      <div
                        className="rounded-xl p-3 text-xs leading-relaxed space-y-3"
                        style={{
                          background: "rgba(255,255,255,0.90)",
                          color: "#3A3A3A",
                          border: "1px solid rgba(200,160,0,0.2)",
                          maxHeight: 500,
                          overflowY: "auto",
                        }}
                      >
                        {summary && (
                          <p
                            className="font-bold text-sm"
                            style={{ color: "#9B6E00" }}
                          >
                            ✨ {summary}
                          </p>
                        )}
                        {(
                          ["mulsangron", "psychology", "counseling"] as const
                        ).map((k) =>
                          parsed![k] ? (
                            <div
                              key={k}
                              className="border-t pt-2"
                              style={{ borderColor: "rgba(200,160,0,0.15)" }}
                            >
                              <MarkdownContent content={String(parsed![k])} />
                            </div>
                          ) : null,
                        )}
                        {advice && (
                          <div
                            className="border-t pt-2 space-y-1"
                            style={{ borderColor: "rgba(200,160,0,0.15)" }}
                          >
                            <p className="font-bold">💡 상담 제언</p>
                            {Object.entries(advice).map(([k, v]) => (
                              <p key={k}>• {v}</p>
                            ))}
                          </div>
                        )}
                        {closing && (
                          <div
                            className="border-t pt-2 whitespace-pre-wrap"
                            style={{ borderColor: "rgba(200,160,0,0.15)" }}
                          >
                            <p className="font-bold">💌 마무리</p>
                            <p>{closing}</p>
                          </div>
                        )}
                        <details
                          className="border-t pt-2"
                          style={{ borderColor: "rgba(200,160,0,0.15)" }}
                        >
                          <summary className="cursor-pointer text-[10px] opacity-50">
                            raw JSON 보기
                          </summary>
                          <pre className="text-[10px] mt-1 overflow-x-auto">
                            {JSON.stringify(parsed, null, 2)}
                          </pre>
                        </details>
                      </div>
                    );
                  }
                  return (
                    <div
                      className="rounded-xl p-3 text-xs leading-relaxed whitespace-pre-wrap"
                      style={{
                        background: "rgba(255,255,255,0.90)",
                        color: "#3A3A3A",
                        border: "1px solid rgba(200,160,0,0.2)",
                        maxHeight: 400,
                        overflowY: "auto",
                      }}
                    >
                      {testContent}
                    </div>
                  );
                })()}
            </div>
          )}
        </form>
      </div>
    </main>
  );
}
