"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { SajuInputForm, SajuConcern, RelationshipStatus } from "@/types";

const BIRTH_TIME_OPTIONS = [
  { value: "00:00", label: "자시 (23:00 ~ 01:00)" },
  { value: "01:00", label: "축시 (01:00 ~ 03:00)" },
  { value: "03:00", label: "인시 (03:00 ~ 05:00)" },
  { value: "05:00", label: "묘시 (05:00 ~ 07:00)" },
  { value: "07:00", label: "진시 (07:00 ~ 09:00)" },
  { value: "09:00", label: "사시 (09:00 ~ 11:00)" },
  { value: "11:00", label: "오시 (11:00 ~ 13:00)" },
  { value: "13:00", label: "미시 (13:00 ~ 15:00)" },
  { value: "15:00", label: "신시 (15:00 ~ 17:00)" },
  { value: "17:00", label: "유시 (17:00 ~ 19:00)" },
  { value: "19:00", label: "술시 (19:00 ~ 21:00)" },
  { value: "21:00", label: "해시 (21:00 ~ 23:00)" },
];

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
  birth_time: "11:00",
  is_solar: true,
  gender: "female",
  birth_time_unknown: false,
  concerns: ["전체운"],
};

const DEV_FORM: SajuInputForm = {
  name: "연지수",
  birth_date: "1992-09-29",
  birth_time: "11:00",
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

  // 입력 페이지 진입 시 항상 폼을 초기값으로 리셋
  useEffect(() => {
    sessionStorage.removeItem("saju_input");
    setForm(DEFAULT_FORM);
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
              placeholder="홍길동"
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
              type="date"
              value={form.birth_date}
              onChange={(e) => handleChange("birth_date", e.target.value)}
              required
              max={new Date().toISOString().split("T")[0]}
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
              <select
                value={form.birth_time}
                onChange={(e) => handleChange("birth_time", e.target.value)}
                className={inputClass}
              >
                {BIRTH_TIME_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
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
          <button
            type="submit"
            className="mt-2 font-bold py-4 rounded-2xl text-base transition-all active:scale-95 hover:brightness-105"
            style={{
              background: "linear-gradient(135deg, #B98EFF 0%, #A57CFF 100%)",
              color: "#fff",
              boxShadow: "0 4px 20px rgba(165,124,255,0.35)",
            }}
          >
            나의 운명 궤도 확인하기 ✨
          </button>
          <p className="text-center text-xs" style={{ color: "#C0B4D8" }}>
            입력 후 로그인하면 결과를 확인할 수 있어요
          </p>
        </form>
      </div>
    </main>
  );
}
