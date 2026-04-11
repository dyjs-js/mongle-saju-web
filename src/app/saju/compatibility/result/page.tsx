"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { CompatibilityResult } from "@/services/openai";
import MarkdownContent from "@/components/ui/MarkdownContent";

const BG = "linear-gradient(160deg, #FFF0F5 0%, #F8F9FF 50%, #F3EEFF 100%)";

interface Person {
  name: string;
  birth_date: string;
  gender: "female" | "male";
}

interface CompatibilityData {
  me: Person;
  partner: Person;
  relationship: string;
  content: string; // JSON.stringify(CompatibilityResult)
}

function getScoreColor(score: number) {
  if (score >= 80) return "#FF6B9D";
  if (score >= 60) return "#A57CFF";
  return "#7BA7FF";
}

function getScoreLabel(score: number) {
  if (score >= 90) return "환상의 케미 ✨";
  if (score >= 80) return "찰떡궁합 💕";
  if (score >= 70) return "꽤 잘 맞아요 💜";
  if (score >= 60) return "노력이 필요해요 🌱";
  return "도전적인 관계 🔥";
}

const WARN_KEYWORDS = [
  "절대",
  "조심",
  "금물",
  "위험",
  "말고",
  "하지 마",
  "그만",
  "제발",
];
function highlightWarn(text: string) {
  const pattern = new RegExp(`(${WARN_KEYWORDS.join("|")})`, "g");
  return text.split(pattern).map((part, i) =>
    WARN_KEYWORDS.includes(part) ? (
      <span key={i} style={{ color: "#FF6B9D", fontWeight: 700 }}>
        {part}
      </span>
    ) : (
      part
    ),
  );
}

export default function CompatibilityResultPage() {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<CompatibilityData | null>(null);
  const [saving, setSaving] = useState(false);
  const [animated, setAnimated] = useState(false);
  const [testContent, setTestContent] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const isDev = process.env.NODE_ENV === "development";

  useEffect(() => {
    const raw = sessionStorage.getItem("compatibility_result");
    if (!raw) {
      router.replace("/saju/compatibility");
      return;
    }
    setData(JSON.parse(raw));
    setTimeout(() => setAnimated(true), 200);
  }, [router]);

  async function handleSaveImage() {
    if (!cardRef.current || !data) return;
    setSaving(true);
    try {
      const html2canvas = (await import("html2canvas")).default;

      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 3,
        useCORS: true,
        allowTaint: true,
        // onclone: 캡처용 DOM 복사본에서만 애니메이션 고정 처리
        onclone: (_doc, el) => {
          // 모든 transition/animation 제거
          el.querySelectorAll<HTMLElement>("*").forEach((node) => {
            node.style.transition = "none";
            node.style.animation = "none";
          });

          // 온도계 수은
          const mercury = el.querySelector<HTMLElement>(
            '[data-anim="mercury"]',
          );
          if (mercury) mercury.style.height = `${score ?? 70}%`;

          // 온도 프로그레스 바
          const bar = el.querySelector<HTMLElement>('[data-anim="bar"]');
          if (bar) bar.style.width = `${score ?? 70}%`;

          // 상성 지수 바
          statRows.forEach((s) => {
            const elA = el.querySelector<HTMLElement>(
              `[data-anim="stat-a-${s.label}"]`,
            );
            const elB = el.querySelector<HTMLElement>(
              `[data-anim="stat-b-${s.label}"]`,
            );
            if (elA) elA.style.width = `${s.a}%`;
            if (elB) elB.style.width = `${s.b}%`;
          });

          // 저울: overflow visible 보장
          const scaleEl = el.querySelector<HTMLElement>('[data-anim="scale"]');
          if (scaleEl) {
            scaleEl.style.overflow = "visible";
            if (scaleEl.parentElement)
              scaleEl.parentElement.style.overflow = "visible";
          }
        },
      });

      const link = document.createElement("a");
      link.download = `몽글사주_궁합_${data.me.name}x${data.partner.name}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      alert("이미지 저장에 실패했어요.");
    }
    setSaving(false);
  }

  function fetchTest() {
    if (!data) return;
    setTestContent(null);
    setTestLoading(true);
    // 궁합 결과 데이터를 saju input 형태로 변환해서 test API 호출
    const input = {
      name: `${data.me.name} ❤️ ${data.partner.name}`,
      birth_date: data.me.birth_date,
      gender: data.me.gender,
      is_solar: true,
      birth_time: "11:00",
      birth_time_unknown: false,
      concerns: ["전체운"] as const,
    };
    fetch("/api/saju", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input, type: "test" }),
    })
      .then((res) => res.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setTestContent(d.content);
      })
      .catch((err) => alert("테스트 오류: " + err.message))
      .finally(() => setTestLoading(false));
  }

  if (!data) return null;

  // content는 JSON.stringify(CompatibilityResult) 형태
  let result: CompatibilityResult;
  try {
    result = JSON.parse(data.content);
  } catch {
    result = {
      score: 70,
      patience: { A: 50, B: 50 },
      power: { A: 50, B: 50 },
      stress: { A: 50, B: 50 },
      obsession: { A: 50, B: 50 },
      love: { A: 50, B: 50 },
      filter: { A: 50, B: 50 },
      baby: { A: 50, B: 50 },
      savings: { A: 50, B: 50 },
      cost_eff: { A: 50, B: 50 },
      punchline: "",
    };
  }

  const {
    score,
    patience,
    power,
    stress,
    obsession,
    love,
    filter,
    baby,
    savings,
    cost_eff,
    punchline,
  } = result;

  /** {{A}}님 → me.name님, {{B}}님 → partner.name님 치환
   *  AI가 {{A}}만 보낼 경우도 대비해 {{A}} → name님 으로 fallback */
  function fillNames(text: string) {
    return text
      .replace(/\{\{A\}\}님/g, `${data!.me.name}님`)
      .replace(/\{\{B\}\}님/g, `${data!.partner.name}님`)
      .replace(/\{\{A\}\}/g, `${data!.me.name}님`)
      .replace(/\{\{B\}\}/g, `${data!.partner.name}님`);
  }

  const scoreColor = getScoreColor(score);
  const scoreLabel = getScoreLabel(score);

  // love.A vs love.B 로 저울 기울기 계산
  const meLoves = love.A >= love.B;
  const loveGap = Math.abs(love.A - love.B);
  const tiltDeg = animated
    ? (meLoves ? -1 : 1) * Math.min(14, loveGap * 0.4)
    : 0;

  // 지수 바 목록 — love는 저울로 따로 표시하므로 제외
  const statRows: {
    label: string;
    emoji: string;
    desc: string;
    a: number;
    b: number;
  }[] = [
    {
      label: "인내심",
      emoji: "🧘",
      desc: "상대의 고집을 받아주는 인내심. 높을수록 더 많이 져줘요.",
      a: patience.A,
      b: patience.B,
    },
    {
      label: "주도권",
      emoji: "👑",
      desc: "관계의 주도권과 목소리 크기. 높을수록 자기 페이스로 끌고 가요.",
      a: power.A,
      b: power.B,
    },
    {
      label: "스트레스",
      emoji: "😤",
      desc: "상대로 인해 받는 정신적 피로도. 높을수록 신경 쓸 게 많아요.",
      a: stress.A,
      b: stress.B,
    },
    {
      label: "집착도",
      emoji: "📱",
      desc: "연락 집착 및 소유욕. 높을수록 안달나는 스타일이에요.",
      a: obsession.A,
      b: obsession.B,
    },
    {
      label: "말삼킴",
      emoji: "🤐",
      desc: "하고 싶은 말을 삼키는 정도. 높을수록 속으로 꾹꾹 참아요.",
      a: filter.A,
      b: filter.B,
    },
    {
      label: "응석도",
      emoji: "🍼",
      desc: "상대에게 의지하고 응석부리는 정도. 높을수록 어리광이 많아요.",
      a: baby.A,
      b: baby.B,
    },
    {
      label: "서운함",
      emoji: "🪣",
      desc: "마음속에 쌓인 서운함의 양. 높을수록 참아온 게 많아요.",
      a: savings.A,
      b: savings.B,
    },
    {
      label: "헌신지수",
      emoji: "💸",
      desc: "노력 대비 받는 보람. 낮을수록 손해 보는 관계예요.",
      a: cost_eff.A,
      b: cost_eff.B,
    },
  ];

  return (
    <main className="min-h-screen px-4 py-8" style={{ background: BG }}>
      <div className="w-full max-w-sm mx-auto">
        <Link
          href="/saju/compatibility"
          className="inline-flex items-center gap-1 text-sm mb-5"
          style={{ color: "#9B8ABE" }}
        >
          ← 다시 입력하기
        </Link>

        {/* ── 캡처 대상 카드 ── */}
        <div
          ref={cardRef}
          className="rounded-3xl overflow-hidden"
          style={{
            background: "linear-gradient(145deg, #FFF5FA 0%, #F8F0FF 100%)",
            border: "1px solid rgba(255,133,161,0.25)",
            boxShadow: "0 8px 40px rgba(165,124,255,0.15)",
          }}
        >
          {/* 헤더 */}
          <div
            className="px-5 pt-6 pb-4 text-center"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,182,193,0.4) 0%, rgba(196,160,255,0.3) 100%)",
            }}
          >
            <p
              className="text-[10px] font-bold tracking-[0.2em] uppercase mb-1"
              style={{ color: "#C4A0FF" }}
            >
              몽글사주 · 너랑나랑
            </p>
            <h2
              className="text-lg font-black mb-0.5"
              style={{ color: "#2D3142" }}
            >
              {data.me.name}
              <span style={{ color: "#FF85A1" }}> ❤️ </span>
              {data.partner.name}
            </h2>
            <p className="text-xs font-medium" style={{ color: "#9B8ABE" }}>
              {data.relationship} 궁합 성적표
            </p>
          </div>

          <div className="px-5 py-5 flex flex-col gap-4">
            {/* ① 궁합 온도 */}
            <div
              className="rounded-2xl p-4"
              style={{ background: "rgba(255,255,255,0.85)" }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-wider mb-3"
                style={{ color: "#C4A0FF" }}
              >
                🌡️ 궁합 온도
              </p>
              <div className="flex items-center gap-3 mb-3">
                {/* 세로 온도계 */}
                <div className="flex flex-col items-center shrink-0">
                  <div
                    style={{
                      width: 20,
                      height: 60,
                      borderRadius: "10px 10px 0 0",
                      background: "rgba(196,160,255,0.12)",
                      border: "1.5px solid rgba(196,160,255,0.3)",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-end",
                    }}
                  >
                    <div
                      data-anim="mercury"
                      style={{
                        height: animated ? `${score ?? 70}%` : "0%",
                        background: `linear-gradient(180deg, ${scoreColor} 0%, #FFB6C1 100%)`,
                        transition: "height 1.4s cubic-bezier(0.22,1,0.36,1)",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${scoreColor} 0%, #FFB6C1 100%)`,
                      color: "#fff",
                      fontSize: 9,
                      fontWeight: 900,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {score ?? "?"}
                  </div>
                </div>
                {/* 점수 */}
                <div>
                  <div style={{ lineHeight: 1 }}>
                    <span
                      style={{
                        fontSize: 52,
                        fontWeight: 900,
                        color: scoreColor,
                        lineHeight: 1,
                      }}
                    >
                      {score ?? "?"}
                    </span>
                    <span
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: scoreColor,
                      }}
                    >
                      점
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: scoreColor,
                      marginTop: 5,
                    }}
                  >
                    {scoreLabel}
                  </p>
                </div>
              </div>
              {/* 온도 바 */}
              <div
                className="w-full h-2.5 rounded-full overflow-hidden mb-2.5"
                style={{ background: "rgba(196,160,255,0.15)" }}
              >
                <div
                  className="h-full rounded-full"
                  data-anim="bar"
                  style={{
                    width: animated ? `${score ?? 70}%` : "0%",
                    background: `linear-gradient(90deg, #C4A0FF 0%, ${scoreColor} 100%)`,
                    transition: "width 1.4s cubic-bezier(0.22,1,0.36,1)",
                  }}
                />
              </div>
              <p
                className="text-xs leading-relaxed"
                style={{ color: "#5B4A6E" }}
              >
                {data.me.name}님과 {data.partner.name}님의 종합 궁합 점수예요.
              </p>
            </div>

            {/* ② 상성 지수 */}
            <div
              className="rounded-2xl p-4"
              style={{ background: "rgba(255,255,255,0.85)" }}
            >
              {/* 헤더: 두 사람 이름 */}
              <div className="flex justify-between items-center mb-3">
                <p
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: "#C4A0FF" }}
                >
                  📊 상성 지수
                </p>
                <div className="flex gap-3 text-[10px] font-bold">
                  <span style={{ color: "#FF6B9D" }}>● {data.me.name}</span>
                  <span style={{ color: "#A57CFF" }}>
                    ● {data.partner.name}
                  </span>
                </div>
              </div>

              {/* 8가지 지수 바 */}
              <div className="flex flex-col gap-3 mb-4">
                {statRows.map((s) => (
                  <div key={s.label}>
                    <div className="flex justify-between items-center mb-1">
                      <span
                        title={s.desc}
                        style={{
                          fontSize: 11,
                          color: "#9B8ABE",
                          fontWeight: 600,
                          cursor: "help",
                          borderBottom: "1px dashed rgba(155,138,190,0.4)",
                        }}
                      >
                        {s.emoji} {s.label}
                      </span>
                      <div className="flex gap-2 text-[11px] font-bold">
                        <span style={{ color: "#FF6B9D" }}>{s.a}</span>
                        <span style={{ color: "#A57CFF" }}>{s.b}</span>
                      </div>
                    </div>
                    <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                      <div
                        className="rounded-full"
                        data-anim={`stat-a-${s.label}`}
                        style={{
                          width: animated ? `${s.a}%` : "0%",
                          background: "linear-gradient(90deg,#FFB6C1,#FF6B9D)",
                          transition: "width 1.2s cubic-bezier(0.22,1,0.36,1)",
                        }}
                      />
                      <div
                        className="rounded-full"
                        data-anim={`stat-b-${s.label}`}
                        style={{
                          width: animated ? `${s.b}%` : "0%",
                          background: "linear-gradient(90deg,#C4A0FF,#A57CFF)",
                          transition: "width 1.2s cubic-bezier(0.22,1,0.36,1)",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* 구분선 */}
              <div
                style={{
                  height: 1,
                  background: "rgba(196,160,255,0.15)",
                  marginBottom: 14,
                }}
              />

              {/* 애정 비중 — 저울 */}
              <p
                className="text-[10px] font-bold uppercase tracking-wider mb-2"
                style={{ color: "#FF85A1" }}
              >
                💗 애정 비중
              </p>
              <div
                data-anim="scale"
                style={{
                  transform: `rotate(${tiltDeg}deg)`,
                  transition: "transform 1s cubic-bezier(0.22,1,0.36,1)",
                  transformOrigin: "center center",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingLeft: 8,
                  paddingRight: 8,
                  marginBottom: 14,
                  marginTop: 6,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: meLoves
                        ? "linear-gradient(135deg,#FFB6C1 0%,#FF85A1 100%)"
                        : "rgba(196,160,255,0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                    }}
                  >
                    {data.me.gender === "female" ? "👩" : "👨"}
                  </div>
                  <span
                    style={{ fontSize: 10, fontWeight: 700, color: "#2D3142" }}
                  >
                    {data.me.name}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "1px 7px",
                      borderRadius: 99,
                      background: meLoves
                        ? "rgba(255,133,161,0.15)"
                        : "rgba(196,160,255,0.12)",
                      color: meLoves ? "#FF6B9D" : "#9B8ABE",
                    }}
                  >
                    {love.A}%
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      width: 2,
                      height: 28,
                      background:
                        "linear-gradient(180deg,rgba(196,160,255,0.15) 0%,#C4A0FF 100%)",
                      borderRadius: 2,
                    }}
                  />
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background:
                        "linear-gradient(135deg,#EDE8FF 0%,#D8CCFF 100%)",
                      border: "1.5px solid rgba(196,160,255,0.5)",
                      color: "#A57CFF",
                      fontSize: 8,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    vs
                  </div>
                  <div
                    style={{
                      width: 2,
                      height: 28,
                      background:
                        "linear-gradient(180deg,#C4A0FF 0%,rgba(196,160,255,0.15) 100%)",
                      borderRadius: 2,
                    }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: !meLoves
                        ? "linear-gradient(135deg,#FFB6C1 0%,#FF85A1 100%)"
                        : "rgba(196,160,255,0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                    }}
                  >
                    {data.partner.gender === "female" ? "👩" : "👨"}
                  </div>
                  <span
                    style={{ fontSize: 10, fontWeight: 700, color: "#2D3142" }}
                  >
                    {data.partner.name}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "1px 7px",
                      borderRadius: 99,
                      background: !meLoves
                        ? "rgba(255,133,161,0.15)"
                        : "rgba(196,160,255,0.12)",
                      color: !meLoves ? "#FF6B9D" : "#9B8ABE",
                    }}
                  >
                    {love.B}%
                  </span>
                </div>
              </div>
            </div>

            {/* ③ 팩폭 한마디 */}
            <div
              className="rounded-2xl p-4"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,182,193,0.2) 0%, rgba(196,160,255,0.15) 100%)",
                border: "1px solid rgba(255,133,161,0.2)",
              }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-wider mb-2"
                style={{ color: "#FF85A1" }}
              >
                🔨 몽글사주의 팩폭 한마디
              </p>
              <p
                className="text-sm font-semibold leading-relaxed text-center"
                style={{
                  color: "#7B6E8A",
                  background: "rgba(255,255,255,0.65)",
                  padding: "10px 12px",
                  borderRadius: 12,
                }}
              >
                {highlightWarn(fillNames(punchline))}
              </p>
            </div>

            {/* 해시태그 + 워터마크 */}
            <div className="text-center py-2">
              <p
                className="text-[10px] font-semibold mb-1"
                style={{ color: "rgba(255,133,161,0.6)" }}
              >
                #몽글사주 #너랑나랑궁합{" "}
                <span style={{ color: "rgba(165,124,255,0.65)" }}>
                  #{data.me.name}x{data.partner.name}
                </span>
              </p>
              <p
                className="text-[9px]"
                style={{ color: "rgba(165,124,255,0.35)" }}
              >
                mongle-saju.com · AI 명리 분석
              </p>
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex flex-col gap-2 mt-4">
          <button
            onClick={handleSaveImage}
            disabled={saving}
            className="w-full font-bold py-3.5 rounded-2xl text-sm transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
            style={{
              background: "linear-gradient(135deg, #FFB6C1 0%, #FF85A1 100%)",
              color: "#fff",
              boxShadow: "0 4px 16px rgba(255,133,161,0.35)",
            }}
          >
            {saving ? "저장 중..." : "📸 이미지로 저장하기"}
          </button>
          <Link
            href="/saju/input"
            className="w-full font-bold py-3.5 rounded-2xl text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
            style={{
              background: "linear-gradient(135deg, #B98EFF 0%, #A57CFF 100%)",
              color: "#fff",
              boxShadow: "0 4px 16px rgba(165,124,255,0.30)",
            }}
          >
            ✨ 내 사주 전체 풀이 보기
          </Link>
          <Link
            href="/saju/compatibility"
            className="w-full py-3 rounded-2xl text-sm font-medium text-center transition-all active:scale-95"
            style={{
              border: "1.5px solid rgba(165,124,255,0.4)",
              color: "#A57CFF",
              background: "rgba(165,124,255,0.04)",
            }}
          >
            다른 궁합 보기 →
          </Link>
        </div>

        {/* ── 🧪 테스트 모드 (dev only) ── */}
        {isDev && (
          <div
            className="mt-4 rounded-3xl p-5 flex flex-col gap-3"
            style={{
              background: "rgba(255,230,100,0.12)",
              border: "1.5px dashed rgba(200,160,0,0.35)",
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">🧪</span>
              <p className="text-sm font-bold" style={{ color: "#7A5F00" }}>
                테스트 프롬프트 (dev only)
              </p>
            </div>
            <p className="text-xs" style={{ color: "#9B8520" }}>
              물상론·심리학·상담 통찰 포맷 — gpt-4o-mini
            </p>
            <button
              onClick={fetchTest}
              disabled={testLoading}
              className="w-full font-bold py-3 rounded-2xl text-sm transition-all active:scale-95 disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
                color: "#3A2A00",
                boxShadow: "0 2px 12px rgba(255,180,0,0.30)",
              }}
            >
              {testLoading ? "⏳ 생성 중..." : "🧪 테스트 풀이 생성"}
            </button>
            {testContent && (
              <div
                className="rounded-2xl p-4"
                style={{
                  background: "rgba(255,255,255,0.85)",
                  border: "1px solid rgba(200,160,0,0.2)",
                  maxHeight: 500,
                  overflowY: "auto",
                }}
              >
                <MarkdownContent content={testContent} />
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
