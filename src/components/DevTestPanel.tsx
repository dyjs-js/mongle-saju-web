"use client";

import { useState } from "react";
import MarkdownContent from "@/components/ui/MarkdownContent";

const DEV_INPUT = {
  name: "연지수",
  birth_date: "1992-09-29",
  birth_time: "11:10",
  is_solar: true,
  gender: "female",
  birth_time_unknown: false,
  concerns: ["전체운"],
};

export default function DevTestPanel() {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (process.env.NODE_ENV !== "development") return null;

  function run() {
    setContent(null);
    setLoading(true);
    fetch("/api/saju", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: DEV_INPUT, type: "test" }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setContent(d.content);
      })
      .catch((err) => alert("테스트 오류: " + err.message))
      .finally(() => setLoading(false));
  }

  return (
    <section className="w-full mb-8">
      <div
        className="rounded-3xl p-5 flex flex-col gap-3"
        style={{
          background: "rgba(255,230,100,0.12)",
          border: "1.5px dashed rgba(200,160,0,0.4)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">🧪</span>
            <p className="text-sm font-bold" style={{ color: "#7A5F00" }}>
              테스트 프롬프트{" "}
              <span className="font-normal text-xs opacity-60">(dev only)</span>
            </p>
          </div>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: "rgba(255,180,0,0.2)", color: "#7A5F00" }}
          >
            gpt-4o-mini
          </span>
        </div>
        <p className="text-xs" style={{ color: "#9B8520" }}>
          물상론 · 현대 심리학 · 상담 통찰 포맷 테스트
        </p>
        <button
          onClick={run}
          disabled={loading}
          className="w-full font-bold py-3 rounded-2xl text-sm transition-all active:scale-95 disabled:opacity-60"
          style={{
            background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
            color: "#3A2A00",
            boxShadow: "0 2px 12px rgba(255,180,0,0.30)",
          }}
        >
          {loading ? "⏳ 생성 중..." : "🧪 테스트 풀이 생성"}
        </button>
        {content &&
          (() => {
            let parsed: Record<string, unknown> | null = null;
            try {
              parsed = JSON.parse(content);
            } catch {
              /* raw 표시 */
            }

            if (parsed) {
              const summary = parsed.saju_summary
                ? String(parsed.saju_summary)
                : null;
              const closing = parsed.closing ? String(parsed.closing) : null;
              const advice =
                parsed.advice && typeof parsed.advice === "object"
                  ? (parsed.advice as Record<string, string>)
                  : null;
              return (
                <div
                  className="rounded-2xl p-4 space-y-3"
                  style={{
                    background: "rgba(255,255,255,0.90)",
                    border: "1px solid rgba(200,160,0,0.2)",
                    maxHeight: 560,
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
                  {(["mulsangron", "psychology", "counseling"] as const).map(
                    (k) =>
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
                      <p
                        className="font-bold text-xs"
                        style={{ color: "#7A5F00" }}
                      >
                        💡 상담 제언
                      </p>
                      {Object.entries(advice).map(([k, v]) => (
                        <p
                          key={k}
                          className="text-xs"
                          style={{ color: "#3A3A3A" }}
                        >
                          • {v}
                        </p>
                      ))}
                    </div>
                  )}
                  {closing && (
                    <div
                      className="border-t pt-2"
                      style={{ borderColor: "rgba(200,160,0,0.15)" }}
                    >
                      <p
                        className="font-bold text-xs mb-1"
                        style={{ color: "#7A5F00" }}
                      >
                        💌 마무리
                      </p>
                      <p
                        className="text-xs leading-relaxed"
                        style={{ color: "#3A3A3A" }}
                      >
                        {closing}
                      </p>
                    </div>
                  )}
                </div>
              );
            }

            // JSON 파싱 실패 시 raw 표시
            return (
              <div
                className="rounded-2xl p-4 text-xs leading-relaxed whitespace-pre-wrap"
                style={{
                  background: "rgba(255,255,255,0.90)",
                  color: "#3A3A3A",
                  border: "1px solid rgba(200,160,0,0.2)",
                  maxHeight: 500,
                  overflowY: "auto",
                }}
              >
                {content}
              </div>
            );
          })()}
      </div>
    </section>
  );
}
