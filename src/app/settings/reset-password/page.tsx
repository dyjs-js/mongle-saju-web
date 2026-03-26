"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const BG = "linear-gradient(160deg, #F3EEFF 0%, #F8F9FF 50%, #EEF3FF 100%)";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false); // 세션 준비 여부
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  const supabase = createClient();

  // Supabase가 hash fragment를 세션으로 교환할 때까지 대기
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY" && session) {
          setReady(true);
        }
        // 이미 로그인된 세션이 있어도 허용 (메일 링크 클릭 직후)
        if (event === "SIGNED_IN" && session) {
          setReady(true);
        }
      },
    );
    // 마운트 시점에 이미 세션이 있는 경우 대비
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (password.length < 6) {
      setMessage({ type: "error", text: "비밀번호는 6자 이상이어야 해요." });
      return;
    }
    if (password !== confirm) {
      setMessage({ type: "error", text: "비밀번호가 일치하지 않아요." });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "✅ 비밀번호가 변경됐어요!" });
      setTimeout(() => router.replace("/mypage"), 1500);
    }
  }

  const inputClass =
    "w-full rounded-xl px-4 py-3 text-sm outline-none transition-all bg-white" +
    " border border-[rgba(196,160,255,0.4)] focus:border-[#A57CFF] focus:ring-2 focus:ring-[rgba(165,124,255,0.2)]" +
    " text-[#2D3142] placeholder:text-[#C0B4D8]";

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-5"
      style={{ background: BG }}
    >
      <div className="w-full max-w-sm">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3 shadow-md"
            style={{
              background: "linear-gradient(135deg, #C4A0FF 0%, #A57CFF 100%)",
            }}
          >
            🔑
          </div>
          <h1 className="text-xl font-bold mb-1" style={{ color: "#2D3142" }}>
            새 비밀번호 설정
          </h1>
          <p className="text-sm" style={{ color: "#9B8ABE" }}>
            사용할 새 비밀번호를 입력해주세요
          </p>
        </div>

        {!ready ? (
          // 세션 교환 대기 중
          <div className="flex flex-col items-center gap-3 py-8">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #C4A0FF 0%, #A57CFF 100%)",
                animation: "pulse 2s infinite",
              }}
            >
              🌙
            </div>
            <p className="text-sm" style={{ color: "#9B8ABE" }}>
              인증 확인 중...
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl p-6 flex flex-col gap-4"
            style={{
              background: "rgba(255,255,255,0.90)",
              border: "1px solid rgba(196,160,255,0.3)",
              boxShadow: "0 4px 24px rgba(165,124,255,0.10)",
            }}
          >
            <div className="flex flex-col gap-1.5">
              <label
                className="text-sm font-medium"
                style={{ color: "#2D3142" }}
              >
                새 비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6자 이상 입력"
                required
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                className="text-sm font-medium"
                style={{ color: "#2D3142" }}
              >
                비밀번호 확인
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="비밀번호를 다시 입력"
                required
                className={inputClass}
              />
            </div>

            {message && (
              <div
                className="text-sm px-4 py-3 rounded-xl"
                style={{
                  background:
                    message.type === "error"
                      ? "rgba(255,80,80,0.08)"
                      : "rgba(165,124,255,0.10)",
                  color: message.type === "error" ? "#E05050" : "#7C5CBF",
                  border:
                    message.type === "error"
                      ? "1px solid rgba(255,80,80,0.20)"
                      : "1px solid rgba(165,124,255,0.20)",
                }}
              >
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full font-bold py-3.5 rounded-2xl text-sm transition-all active:scale-95 disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, #B98EFF 0%, #A57CFF 100%)",
                color: "#fff",
                boxShadow: "0 4px 16px rgba(165,124,255,0.30)",
              }}
            >
              {loading ? "변경 중..." : "비밀번호 변경"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
