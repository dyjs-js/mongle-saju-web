"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const isDev = process.env.NODE_ENV === "development";

// ── 소셜 버튼 ─────────────────────────────────────────────────────
function SocialButton({
  onClick,
  icon,
  label,
  bg,
  color,
  disabled,
}: {
  onClick?: () => void;
  icon: React.ReactNode;
  label: string;
  bg: string;
  color: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center gap-3 w-full rounded-2xl py-3.5 text-sm font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ background: bg, color }}
    >
      {icon}
      {label}
    </button>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const tabParam = searchParams.get("tab");

  const [tab, setTab] = useState<"social" | "email">(
    isDev || tabParam === "signup" ? "email" : "social",
  );
  const [email, setEmail] = useState(isDev ? "test@mongle.kr" : "");
  const [password, setPassword] = useState(isDev ? "test1234!" : "");
  const [isSignUp, setIsSignUp] = useState(tabParam === "signup");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  const supabase = createClient();
  const redirectTo = `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback?next=${encodeURIComponent(next)}`;

  // ── 소셜 로그인 ────────────────────────────────────────────────
  async function handleOAuth(provider: "google" | "kakao" | "apple") {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
  }

  // ── 이메일 로그인 / 회원가입 ────────────────────────────────────
  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectTo },
      });
      if (error) {
        setMessage({ type: "error", text: error.message });
      } else {
        setMessage({
          type: "success",
          text: "📧 확인 메일을 발송했어요. 메일함을 확인해주세요!",
        });
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setMessage({
          type: "error",
          text: "이메일 또는 비밀번호가 올바르지 않아요.",
        });
      } else {
        router.push(next);
      }
    }
    setLoading(false);
  }

  // ── 비밀번호 재설정 ────────────────────────────────────────────
  async function handleResetPassword() {
    if (!email) {
      setMessage({ type: "error", text: "이메일을 입력해주세요." });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    setLoading(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({
        type: "success",
        text: "📧 비밀번호 재설정 링크를 이메일로 보냈어요.",
      });
    }
  }

  const inputClass =
    "w-full rounded-xl px-4 py-3 text-sm outline-none transition-all bg-white" +
    " border border-[rgba(196,160,255,0.4)] focus:border-[#A57CFF] focus:ring-2 focus:ring-[rgba(165,124,255,0.2)]" +
    " text-[#2D3142] placeholder:text-[#C0B4D8]";

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-5 py-10"
      style={{
        background:
          "linear-gradient(160deg, #F3EEFF 0%, #F8F9FF 50%, #EEF3FF 100%)",
      }}
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
            🌙
          </div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: "#2D3142" }}>
            몽글사주
          </h1>
          <p className="text-sm" style={{ color: "#9B8ABE" }}>
            로그인하고 나만의 운명 풀이를 저장하세요
          </p>
        </div>

        {/* 탭 */}
        <div
          className="flex rounded-2xl p-1 mb-5"
          style={{ background: "rgba(196,160,255,0.12)" }}
        >
          {(["social", "email"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: tab === t ? "#fff" : "transparent",
                color: tab === t ? "#A57CFF" : "#9B8ABE",
                boxShadow:
                  tab === t ? "0 1px 6px rgba(165,124,255,0.15)" : "none",
              }}
            >
              {t === "social" ? "소셜 로그인" : "이메일"}
            </button>
          ))}
        </div>

        <div
          className="rounded-3xl p-6 flex flex-col gap-3"
          style={{
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(196,160,255,0.3)",
            boxShadow: "0 4px 24px rgba(165,124,255,0.10)",
          }}
        >
          {/* ── 소셜 탭 ── */}
          {tab === "social" && (
            <>
              <SocialButton
                onClick={() => handleOAuth("google")}
                bg="#fff"
                color="#3C3C3C"
                label="Google로 계속하기"
                icon={
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                }
              />
              <SocialButton
                onClick={() => handleOAuth("kakao")}
                bg="#FEE500"
                color="#3A1D1D"
                label="카카오로 계속하기"
                icon={<span className="text-lg">💬</span>}
              />
              <SocialButton
                onClick={() => handleOAuth("apple")}
                bg="#000"
                color="#fff"
                label="Apple로 계속하기"
                icon={
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                }
              />
              <div className="flex items-center gap-3 my-1">
                <div
                  className="flex-1 h-px"
                  style={{ background: "rgba(196,160,255,0.3)" }}
                />
                <span className="text-xs" style={{ color: "#C0B4D8" }}>
                  또는
                </span>
                <div
                  className="flex-1 h-px"
                  style={{ background: "rgba(196,160,255,0.3)" }}
                />
              </div>
              <button
                type="button"
                onClick={() => setTab("email")}
                className="text-sm font-medium py-2 transition-all"
                style={{ color: "#9B8ABE" }}
              >
                이메일로 로그인 →
              </button>
            </>
          )}

          {/* ── 이메일 탭 ── */}
          {tab === "email" && (
            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일"
                required
                className={inputClass}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호 (8자 이상)"
                required
                minLength={8}
                className={inputClass}
              />

              {/* 에러/성공 메시지 */}
              {message && (
                <p
                  className="text-xs px-3 py-2 rounded-xl"
                  style={{
                    background:
                      message.type === "error"
                        ? "rgba(255,100,100,0.08)"
                        : "rgba(100,200,100,0.08)",
                    color: message.type === "error" ? "#E05252" : "#3A9E5A",
                    border: `1px solid ${message.type === "error" ? "rgba(255,100,100,0.2)" : "rgba(100,200,100,0.2)"}`,
                  }}
                >
                  {message.text}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full font-bold py-3.5 rounded-2xl transition-all active:scale-95 disabled:opacity-60"
                style={{
                  background:
                    "linear-gradient(135deg, #B98EFF 0%, #A57CFF 100%)",
                  color: "#fff",
                  boxShadow: "0 4px 16px rgba(165,124,255,0.30)",
                }}
              >
                {loading ? "처리 중..." : isSignUp ? "회원가입" : "로그인"}
              </button>

              <div
                className="flex items-center justify-between text-xs"
                style={{ color: "#9B8ABE" }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setMessage(null);
                  }}
                >
                  {isSignUp ? "이미 계정이 있어요 →" : "처음이에요, 회원가입 →"}
                </button>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    className="underline"
                  >
                    비밀번호 찾기
                  </button>
                )}
              </div>
            </form>
          )}
        </div>

        <p className="mt-5 text-center text-xs" style={{ color: "#C0B4D8" }}>
          로그인하면 <span className="underline cursor-pointer">이용약관</span>{" "}
          및 <span className="underline cursor-pointer">개인정보처리방침</span>
          에 동의하게 됩니다
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
