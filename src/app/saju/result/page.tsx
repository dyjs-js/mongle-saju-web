"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const BG = "linear-gradient(160deg, #F3EEFF 0%, #F8F9FF 50%, #EEF3FF 100%)";

// 마크다운 간단 렌더러
function renderMarkdown(text: string) {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("## ")) {
      return (
        <h2
          key={i}
          className="text-base font-bold mt-6 mb-2 flex items-center gap-2"
          style={{ color: "#2D3142" }}
        >
          {line.replace("## ", "")}
        </h2>
      );
    }
    if (line.startsWith("### ")) {
      return (
        <h3
          key={i}
          className="text-sm font-semibold mt-4 mb-1"
          style={{ color: "#7C5CBF" }}
        >
          {line.replace("### ", "")}
        </h3>
      );
    }
    if (line.trim() === "") return <br key={i} />;
    return (
      <p
        key={i}
        className="text-sm leading-relaxed"
        style={{ color: "#4A4A6A" }}
      >
        {line}
      </p>
    );
  });
}

export default function SajuResultPage() {
  const router = useRouter();
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const inputRaw = sessionStorage.getItem("saju_input");
    if (!inputRaw) {
      router.replace("/saju/input");
      return;
    }
    const input = JSON.parse(inputRaw);

    fetch("/api/saju", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setContent(data.content);
      })
      .catch((err) => setError(err.message ?? "오류가 발생했습니다."))
      .finally(() => setLoading(false));
  }, [router]);

  // ── 카카오톡 공유 ────────────────────────────────────────────────
  function handleKakaoShare() {
    const url = window.location.href;
    const kakaoLink = `https://story.kakao.com/share?url=${encodeURIComponent(url)}`;
    // 카카오 SDK 미사용 시 카카오스토리 공유 fallback
    // 실제 배포 시 Kakao SDK를 초기화하면 더 풍부한 공유 가능
    if (
      typeof window !== "undefined" &&
      (
        window as unknown as {
          Kakao?: {
            isInitialized: () => boolean;
            Share: { sendDefault: (opts: unknown) => void };
          };
        }
      ).Kakao?.isInitialized()
    ) {
      const Kakao = (
        window as unknown as {
          Kakao: { Share: { sendDefault: (opts: unknown) => void } };
        }
      ).Kakao;
      Kakao.Share.sendDefault({
        objectType: "feed",
        content: {
          title: "🌙 몽글사주 — 나의 운명 풀이",
          description: "AI가 분석한 나의 사주풀이를 확인해보세요!",
          imageUrl: `${window.location.origin}/og-image.png`,
          link: { mobileWebUrl: url, webUrl: url },
        },
        buttons: [
          {
            title: "나도 사주 보기",
            link: { mobileWebUrl: url, webUrl: url },
          },
        ],
      });
    } else {
      window.open(kakaoLink, "_blank");
    }
  }

  // ── 이미지 저장 ──────────────────────────────────────────────────
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

  // ── 로딩 ────────────────────────────────────────────────────────
  if (loading) {
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
            AI가 사주를 풀이하고 있어요...
          </p>
          <p className="text-sm" style={{ color: "#9B8ABE" }}>
            잠시만 기다려 주세요 ✨
          </p>
        </div>
        {/* 로딩 점 애니메이션 */}
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

  // ── 에러 ────────────────────────────────────────────────────────
  if (error) {
    return (
      <main
        className="min-h-screen flex flex-col items-center justify-center px-6 gap-5"
        style={{ background: BG }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
          style={{ background: "#FFF0F0", border: "1px solid #FFD0D0" }}
        >
          😢
        </div>
        <div className="text-center">
          <p className="font-semibold mb-1" style={{ color: "#2D3142" }}>
            풀이 중 오류가 발생했어요
          </p>
          <p className="text-sm" style={{ color: "#9B8ABE" }}>
            {error}
          </p>
        </div>
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
      </main>
    );
  }

  // ── 결과 ────────────────────────────────────────────────────────
  return (
    <main
      className="min-h-screen flex flex-col items-center px-4 py-10"
      style={{ background: BG }}
    >
      <div className="w-full max-w-md">
        {/* 뒤로가기 */}
        <Link
          href="/saju/input"
          className="inline-flex items-center gap-1.5 text-sm mb-6 transition-colors"
          style={{ color: "#9B8ABE" }}
        >
          ← 다시 입력하기
        </Link>

        {/* 헤더 */}
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
            나의 사주풀이
          </h1>
          <p className="text-sm mt-1" style={{ color: "#9B8ABE" }}>
            AI가 분석한 당신의 운명 궤도예요
          </p>
        </div>

        {/* 결과 카드 — 이미지 저장 대상 영역 */}
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
          {/* 이미지 저장 시 보이는 워터마크 */}
          <div className="flex items-center gap-1.5 mb-4">
            <span className="text-lg">🌙</span>
            <span className="text-xs font-bold" style={{ color: "#A57CFF" }}>
              몽글사주
            </span>
          </div>
          {content && renderMarkdown(content)}
        </div>

        {/* 구분선 */}
        <div
          className="w-full h-px mb-5"
          style={{
            background:
              "linear-gradient(to right, transparent, #D6C5FF, transparent)",
          }}
        />

        {/* 공유 버튼 */}
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
            <span className="text-lg">💬</span>
            카카오톡 공유
          </button>
          <button
            onClick={handleSaveImage}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 font-bold py-4 rounded-2xl transition-all active:scale-95 disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, #C4A0FF 0%, #A57CFF 100%)",
              color: "#fff",
              boxShadow: "0 2px 12px rgba(165,124,255,0.35)",
            }}
          >
            <span className="text-lg">🖼️</span>
            {saving ? "저장 중..." : "이미지 저장"}
          </button>
        </div>

        {/* 하단 버튼 */}
        <div className="flex flex-col gap-3 pb-12">
          <button
            onClick={() => router.push("/saju/input")}
            className="w-full font-bold py-4 rounded-2xl transition-all active:scale-95 hover:brightness-105"
            style={{
              background: "linear-gradient(135deg, #B98EFF 0%, #A57CFF 100%)",
              color: "#fff",
              boxShadow: "0 4px 20px rgba(165,124,255,0.30)",
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
