"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  const inputClass =
    "w-full rounded-xl px-4 py-3 text-sm outline-none transition-all bg-white" +
    " border border-[rgba(196,160,255,0.4)] focus:border-[#A57CFF] focus:ring-2 focus:ring-[rgba(165,124,255,0.2)]" +
    " text-[#2D3142] placeholder:text-[#C0B4D8]";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setMessage({ type: "error", text: "비밀번호가 일치하지 않아요." });
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "✅ 비밀번호가 변경되었어요!" });
      setTimeout(() => router.push(next), 1500);
    }
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-5"
      style={{
        background:
          "linear-gradient(160deg, #F3EEFF 0%, #F8F9FF 50%, #EEF3FF 100%)",
      }}
    >
      <div className="w-full max-w-sm">
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
            8자 이상 입력해주세요
          </p>
        </div>

        <div
          className="rounded-3xl p-6 flex flex-col gap-3"
          style={{
            background: "rgba(255,255,255,0.85)",
            border: "1px solid rgba(196,160,255,0.3)",
            boxShadow: "0 4px 24px rgba(165,124,255,0.10)",
          }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="새 비밀번호"
              required
              minLength={8}
              className={inputClass}
            />
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="비밀번호 확인"
              required
              minLength={8}
              className={inputClass}
            />
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
                background: "linear-gradient(135deg, #B98EFF 0%, #A57CFF 100%)",
                color: "#fff",
                boxShadow: "0 4px 16px rgba(165,124,255,0.30)",
              }}
            >
              {loading ? "저장 중..." : "비밀번호 변경"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}
