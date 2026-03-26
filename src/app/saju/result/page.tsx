"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AccordionResult } from "@/components/saju/SajuRenderer";
import { createClient } from "@/lib/supabase/client";

const BG = "linear-gradient(160deg, #F3EEFF 0%, #F8F9FF 50%, #EEF3FF 100%)";

export default function SajuResultPage() {
  const router = useRouter();

  const [freeContent, setFreeContent] = useState<string | null>(null);
  const [freeLoading, setFreeLoading] = useState(true);
  const [freeError, setFreeError] = useState<string | null>(null);

  const [isPaid, setIsPaid] = useState(false);
  const [paidContent, setPaidContent] = useState<string | null>(null);
  const [paidLoading, setPaidLoading] = useState(false);
  const [paidError, setPaidError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [loginToast, setLoginToast] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const inputRaw = sessionStorage.getItem("saju_input");
    if (!inputRaw) {
      router.replace("/saju/input");
      return;
    }
    const input = JSON.parse(inputRaw);

    // [Layer 1] localStorage 캐시 확인 — 오늘 날짜 기준
    const CACHE_KEY = "mongle_free_result";
    const today = new Date().toISOString().slice(0, 10);
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as { date: string; content: string };
        if (parsed.date === today && parsed.content) {
          setFreeContent(parsed.content);
          setFreeLoading(false);
          return; // API 호출 없이 즉시 렌더링
        }
      }
    } catch {
      /* localStorage 접근 실패 무시 */
    }

    fetch("/api/saju", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Request-Type": "free", // [Layer 2] IP rate limit 헤더
      },
      body: JSON.stringify({ input, type: "free" }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error === "daily_limit_exceeded") {
          throw new Error("daily_limit_exceeded");
        }
        if (data.error === "ip_rate_limit_exceeded") {
          throw new Error("ip_rate_limit_exceeded");
        }
        if (data.error) throw new Error(data.error);

        // [Layer 1] 결과를 localStorage에 저장
        try {
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ date: today, content: data.content }),
          );
        } catch {
          /* 무시 */
        }

        setFreeContent(data.content);
      })
      .catch((err) => setFreeError(err.message ?? "오류가 발생했습니다."))
      .finally(() => setFreeLoading(false));
  }, [router]);

  async function handleUpgrade() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoginToast(true);
      setTimeout(() => {
        setLoginToast(false);
        router.push("/login?next=/saju/result");
      }, 2000);
      return;
    }
    fetchPremium();
  }

  function fetchPremium() {
    const inputRaw = sessionStorage.getItem("saju_input");
    if (!inputRaw) return;
    const input = JSON.parse(inputRaw);
    setIsPaid(true);
    setPaidLoading(true);
    setPaidError(null);
    fetch("/api/saju", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input, type: "premium" }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setPaidContent(data.content);
      })
      .catch((err) => setPaidError(err.message ?? "오류가 발생했습니다."))
      .finally(() => setPaidLoading(false));
  }

  function handleKakaoShare() {
    const url = window.location.href;
    const kakaoLink = `https://story.kakao.com/share?url=${encodeURIComponent(url)}`;
    const w = window as unknown as {
      Kakao?: {
        isInitialized: () => boolean;
        Share: { sendDefault: (o: unknown) => void };
      };
    };
    if (w.Kakao?.isInitialized()) {
      w.Kakao.Share.sendDefault({
        objectType: "feed",
        content: {
          title: "🌙 몽글사주 — 나의 운명 풀이",
          description: "AI가 분석한 나의 사주풀이를 확인해보세요!",
          imageUrl: `${window.location.origin}/og-image.png`,
          link: { mobileWebUrl: url, webUrl: url },
        },
        buttons: [
          { title: "나도 사주 보기", link: { mobileWebUrl: url, webUrl: url } },
        ],
      });
    } else {
      window.open(kakaoLink, "_blank");
    }
  }

  async function handleSaveImage() {
    if (!resultRef.current) return;
    setSaving(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(resultRef.current, {
        backgroundColor: "#F8F4FF",
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = "몽글사주_결과.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      alert("이미지 저장 중 오류가 발생했어요.");
    } finally {
      setSaving(false);
    }
  }

  if (freeLoading) {
    return (
      <main
        className="min-h-screen flex flex-col items-center justify-center gap-5 px-6"
        style={{ background: BG }}
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-lg"
          style={{
            background: "linear-gradient(135deg, #C4A0FF 0%, #A57CFF 100%)",
            animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
          }}
        >
          🌙
        </div>
        <div className="text-center">
          <p
            className="font-semibold text-base mb-1"
            style={{ color: "#2D3142" }}
          >
            AI가 사주를 읽고 있어요...
          </p>
          <p className="text-sm" style={{ color: "#9B8ABE" }}>
            잠시만 기다려 주세요 ✨
          </p>
        </div>
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full"
              style={{
                background: "#A57CFF",
                opacity: 0.6,
                animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </main>
    );
  }

  if (freeError) {
    const isDailyLimit = freeError === "daily_limit_exceeded";
    const isIpLimit = freeError === "ip_rate_limit_exceeded";
    const isLimit = isDailyLimit || isIpLimit;

    return (
      <main
        className="min-h-screen flex flex-col items-center justify-center px-6 gap-5"
        style={{ background: BG }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
          style={{
            background: isLimit ? "#FFF8E0" : "#FFF0F0",
            border: `1px solid ${isLimit ? "#FFE066" : "#FFD0D0"}`,
          }}
        >
          {isLimit ? "�" : "�😢"}
        </div>
        <div className="text-center max-w-xs">
          <p className="font-semibold mb-1" style={{ color: "#2D3142" }}>
            {isDailyLimit
              ? "오늘의 무료 체험이 모두 마감됐어요"
              : isIpLimit
                ? "오늘 무료 체험 횟수를 모두 사용했어요"
                : "풀이 중 오류가 발생했어요"}
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "#9B8ABE" }}>
            {isDailyLimit
              ? "오늘 준비된 500개의 무료 궤도가 모두 소진됐어요.\n내일 오전 00시에 다시 열려요!"
              : isIpLimit
                ? "하루 3회까지 무료로 확인할 수 있어요."
                : freeError}
          </p>
        </div>

        {isLimit ? (
          <div className="flex flex-col gap-2 w-full max-w-xs">
            <button
              onClick={handleUpgrade}
              className="font-bold px-8 py-3.5 rounded-2xl transition-all active:scale-95 text-sm"
              style={{
                background: "linear-gradient(135deg, #B98EFF 0%, #A57CFF 100%)",
                color: "#fff",
                boxShadow: "0 4px 16px rgba(165,124,255,0.30)",
              }}
            >
              기다리기 싫어요, 지금 바로 보기 →
            </button>
            <p className="text-center text-xs" style={{ color: "#C0B4D8" }}>
              프리미엄 풀이는 제한 없이 언제든지 이용 가능해요
            </p>
          </div>
        ) : (
          <button
            onClick={() => router.push("/saju/input")}
            className="font-medium px-8 py-3 rounded-full transition-all active:scale-95"
            style={{
              background: "linear-gradient(135deg, #B98EFF 0%, #A57CFF 100%)",
              color: "#fff",
              boxShadow: "0 4px 16px rgba(165,124,255,0.30)",
            }}
          >
            다시 시도하기
          </button>
        )}
      </main>
    );
  }

  const displayContent = isPaid ? paidContent : freeContent;
  const isLoadingPaid = isPaid && paidLoading;

  return (
    <main
      className="min-h-screen flex flex-col items-center px-4 py-10"
      style={{ background: BG }}
    >
      {/* 로그인 필요 토스트 */}
      <div
        style={{
          position: "fixed",
          bottom: 32,
          left: "50%",
          transform: `translateX(-50%) translateY(${loginToast ? "0" : "20px"})`,
          opacity: loginToast ? 1 : 0,
          transition: "opacity 0.3s ease, transform 0.3s ease",
          pointerEvents: "none",
          zIndex: 9999,
          background: "rgba(45,49,66,0.92)",
          backdropFilter: "blur(8px)",
          color: "#fff",
          borderRadius: 16,
          padding: "12px 20px",
          fontSize: 13,
          fontWeight: 600,
          whiteSpace: "nowrap",
          boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        🔐 결제를 위해서는 로그인이 필요해요! 로그인 화면으로 이동할게요
      </div>

      <div className="w-full max-w-md">
        <Link
          href="/saju/input"
          className="inline-flex items-center gap-1.5 text-sm mb-6 transition-colors"
          style={{ color: "#9B8ABE" }}
        >
          ← 다시 입력하기
        </Link>

        <div className="text-center mb-6">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3 shadow-md"
            style={{
              background: "linear-gradient(135deg, #C4A0FF 0%, #A57CFF 100%)",
            }}
          >
            🌙
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "#2D3142" }}>
            {isPaid ? "나의 완전한 사주풀이" : "나의 사주 미리보기"}
          </h1>
          <p className="text-sm mt-1" style={{ color: "#9B8ABE" }}>
            {isPaid
              ? "AI 수석 상담사가 분석한 인생 리포트"
              : "AI가 들려주는 당신의 핵심 기운"}
          </p>
        </div>

        <div
          ref={resultRef}
          className="rounded-3xl p-6 mb-5"
          style={{
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(196,160,255,0.3)",
            boxShadow: "0 4px 24px rgba(165,124,255,0.10)",
          }}
        >
          <div className="flex items-center gap-1.5 mb-4">
            <span className="text-lg">🌙</span>
            <span className="text-xs font-bold" style={{ color: "#A57CFF" }}>
              몽글사주
            </span>
            {isPaid && (
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

          {isLoadingPaid ? (
            <div className="flex flex-col items-center gap-4 py-10">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
                style={{
                  background:
                    "linear-gradient(135deg, #C4A0FF 0%, #A57CFF 100%)",
                  animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                }}
              >
                🔮
              </div>
              <p className="text-sm font-semibold" style={{ color: "#2D3142" }}>
                수석 상담사가 인생 리포트를 작성 중이에요
              </p>
              <p className="text-xs" style={{ color: "#9B8ABE" }}>
                약 30~60초 정도 소요됩니다 ☕
              </p>
              <div className="flex gap-2">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-2 h-2 rounded-full"
                    style={{
                      background: "#A57CFF",
                      opacity: 0.6,
                      animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          ) : paidError ? (
            <div className="text-center py-6">
              <p className="text-sm" style={{ color: "#9B8ABE" }}>
                {paidError}
              </p>
              <button
                onClick={fetchPremium}
                className="mt-3 text-sm font-medium underline"
                style={{ color: "#A57CFF" }}
              >
                다시 시도하기
              </button>
            </div>
          ) : (
            displayContent && (
              <AccordionResult content={displayContent} isPaid={isPaid} />
            )
          )}
        </div>

        {!isPaid && !isLoadingPaid && (
          <div
            className="rounded-3xl p-5 mb-5 text-center"
            style={{
              background:
                "linear-gradient(135deg, rgba(196,160,255,0.15) 0%, rgba(165,124,255,0.10) 100%)",
              border: "1px solid rgba(165,124,255,0.35)",
            }}
          >
            <p
              className="text-base font-bold mb-1"
              style={{ color: "#2D3142" }}
            >
              🔒 더 자세한 인생 서사와 3년 치 미래운이 궁금하다면?
            </p>
            <p className="text-xs mb-4" style={{ color: "#9B8ABE" }}>
              초년운 · 현재운 · 미래 3년 · 연애/재회 · 운의 경고까지
              <br />
              수석 상담사의 <strong>완전한 인생 리포트</strong>를 확인하세요
            </p>
            <div className="flex items-center justify-center gap-2 mb-4">
              <span
                className="text-sm line-through"
                style={{ color: "#C0B4D8" }}
              >
                3,900
              </span>
              <span
                className="text-2xl font-black"
                style={{ color: "#A57CFF" }}
              >
                990
              </span>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: "#A57CFF", color: "#fff" }}
              >
                60% 할인
              </span>
            </div>
            <button
              onClick={handleUpgrade}
              className="w-full font-bold py-4 rounded-2xl text-base transition-all active:scale-95 hover:brightness-105"
              style={{
                background: "linear-gradient(135deg, #B98EFF 0%, #A57CFF 100%)",
                color: "#fff",
                boxShadow: "0 4px 20px rgba(165,124,255,0.40)",
              }}
            >
              ✨ 완전한 사주풀이 보기 · 990원
            </button>
            <p className="text-xs mt-2" style={{ color: "#C0B4D8" }}>
              1회 결제 · 평생 열람 · 환불 불가
            </p>
          </div>
        )}

        {isPaid && !isLoadingPaid && paidContent && (
          <>
            <div
              className="w-full h-px mb-5"
              style={{
                background:
                  "linear-gradient(to right, transparent, #D6C5FF, transparent)",
              }}
            />
            <div className="flex gap-2 mb-3">
              <button
                onClick={handleKakaoShare}
                className="flex-1 flex items-center justify-center gap-2 font-bold py-4 rounded-2xl transition-all active:scale-95"
                style={{
                  background: "#FEE500",
                  color: "#3A1D1D",
                  boxShadow: "0 2px 12px rgba(254,229,0,0.40)",
                }}
              >
                <span className="text-lg">💬</span>카카오톡 공유
              </button>
              <button
                onClick={handleSaveImage}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 font-bold py-4 rounded-2xl transition-all active:scale-95 disabled:opacity-60"
                style={{
                  background:
                    "linear-gradient(135deg, #C4A0FF 0%, #A57CFF 100%)",
                  color: "#fff",
                  boxShadow: "0 2px 12px rgba(165,124,255,0.35)",
                }}
              >
                <span className="text-lg">🖼️</span>
                {saving ? "저장 중..." : "이미지 저장"}
              </button>
            </div>
          </>
        )}

        <div className="flex flex-col gap-3 pb-12">
          <button
            onClick={() => router.push("/saju/input")}
            className="w-full font-bold py-4 rounded-2xl transition-all active:scale-95 hover:brightness-105"
            style={{
              background: isPaid
                ? "linear-gradient(135deg, #B98EFF 0%, #A57CFF 100%)"
                : "rgba(255,255,255,0.80)",
              color: isPaid ? "#fff" : "#7C5CBF",
              border: isPaid ? "none" : "1px solid rgba(196,160,255,0.4)",
              boxShadow: isPaid ? "0 4px 20px rgba(165,124,255,0.30)" : "none",
            }}
          >
            다시 분석하기
          </button>
          <button
            onClick={() => router.push("/")}
            className="w-full font-medium py-4 rounded-2xl transition-all hover:brightness-95"
            style={{
              background: "rgba(255,255,255,0.80)",
              color: "#7C5CBF",
              border: "1px solid rgba(196,160,255,0.4)",
            }}
          >
            홈으로
          </button>
        </div>
      </div>
    </main>
  );
}
