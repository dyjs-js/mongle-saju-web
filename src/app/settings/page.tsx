"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const BG = "linear-gradient(160deg, #F3EEFF 0%, #F8F9FF 50%, #EEF3FF 100%)";

export default function SettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [nameLoading, setNameLoading] = useState(false);
  const [nameMsg, setNameMsg] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [isEmailUser, setIsEmailUser] = useState(false);
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login?next=/settings");
        return;
      }
      setEmail(user.email ?? "");
      // 이메일/비밀번호 가입 여부 확인 (소셜 가입자는 비밀번호 변경 불필요)
      const isEmail =
        user.app_metadata?.provider === "email" ||
        (user.identities ?? []).some((i) => i.provider === "email");
      setIsEmailUser(isEmail);

      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .single();
      const currentName = profile?.name ?? "";
      setName(currentName);
      setNameInput(currentName);
      setPageLoading(false);
    })();
  }, [router]);

  async function handlePasswordChange() {
    setPwMsg(null);
    if (pwNew !== pwConfirm) {
      setPwMsg({ type: "err", text: "새 비밀번호가 일치하지 않아요." });
      return;
    }
    if (pwNew.length < 6) {
      setPwMsg({ type: "err", text: "새 비밀번호는 6자 이상이어야 해요." });
      return;
    }
    setPwLoading(true);
    const res = await fetch("/api/user/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: pwCurrent, newPassword: pwNew }),
    });
    const data = await res.json();
    if (res.ok) {
      setPwMsg({ type: "ok", text: "✅ 비밀번호가 변경됐어요!" });
      setPwCurrent("");
      setPwNew("");
      setPwConfirm("");
    } else {
      setPwMsg({ type: "err", text: data.error ?? "변경에 실패했어요." });
    }
    setPwLoading(false);
  }

  async function handleNameSave() {
    if (nameInput.trim() === name) return;
    setNameLoading(true);
    setNameMsg(null);
    const res = await fetch("/api/user/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nameInput }),
    });
    const data = await res.json();
    if (res.ok) {
      setName(nameInput.trim());
      setNameMsg({ type: "ok", text: "닉네임이 변경됐어요 ✨" });
    } else {
      setNameMsg({ type: "err", text: data.error ?? "변경에 실패했어요." });
    }
    setNameLoading(false);
  }

  async function handleDelete() {
    setDeleteLoading(true);
    const res = await fetch("/api/user/settings", { method: "DELETE" });
    if (res.ok) {
      router.replace("/");
    } else {
      alert("탈퇴 처리 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.");
      setDeleteLoading(false);
      setDeleteConfirm(false);
    }
  }

  if (pageLoading) {
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
              animation: "pulse 2s infinite",
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
    <main className="min-h-screen px-4 py-10" style={{ background: BG }}>
      <div className="w-full max-w-md mx-auto">
        {/* 뒤로가기 */}
        <Link
          href="/mypage"
          className="inline-flex items-center gap-1.5 text-sm mb-6"
          style={{ color: "#9B8ABE" }}
        >
          ← 마이페이지
        </Link>

        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
            style={{
              background: "linear-gradient(135deg, #C4A0FF 0%, #A57CFF 100%)",
            }}
          >
            ⚙️
          </div>
          <h1 className="text-xl font-bold" style={{ color: "#2D3142" }}>
            내 정보 설정
          </h1>
        </div>

        {/* 계정 정보 카드 */}
        <div
          className="rounded-3xl p-5 mb-4"
          style={{
            background: "rgba(255,255,255,0.90)",
            border: "1px solid rgba(196,160,255,0.25)",
            boxShadow: "0 4px 20px rgba(165,124,255,0.08)",
          }}
        >
          <p
            className="text-xs font-bold mb-3 tracking-widest uppercase"
            style={{ color: "#C4A0FF" }}
          >
            계정
          </p>
          <div className="flex items-center gap-3 py-2">
            <span className="text-lg">📧</span>
            <div>
              <p className="text-xs" style={{ color: "#9B8ABE" }}>
                이메일
              </p>
              <p className="text-sm font-medium" style={{ color: "#2D3142" }}>
                {email}
              </p>
            </div>
          </div>
        </div>

        {/* 닉네임 변경 카드 */}
        <div
          className="rounded-3xl p-5 mb-4"
          style={{
            background: "rgba(255,255,255,0.90)",
            border: "1px solid rgba(196,160,255,0.25)",
            boxShadow: "0 4px 20px rgba(165,124,255,0.08)",
          }}
        >
          <p
            className="text-xs font-bold mb-3 tracking-widest uppercase"
            style={{ color: "#C4A0FF" }}
          >
            닉네임
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => {
                setNameInput(e.target.value);
                setNameMsg(null);
              }}
              placeholder="사용할 닉네임 입력"
              maxLength={20}
              className="flex-1 rounded-xl px-4 py-3 text-sm outline-none"
              style={{
                border: "1px solid rgba(196,160,255,0.4)",
                background: "rgba(255,255,255,0.8)",
                color: "#2D3142",
              }}
            />
            <button
              onClick={handleNameSave}
              disabled={
                nameLoading ||
                nameInput.trim() === name ||
                nameInput.trim().length === 0
              }
              className="px-4 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-40"
              style={{
                background: "linear-gradient(135deg, #C4A0FF 0%, #A57CFF 100%)",
                color: "#fff",
                minWidth: "64px",
              }}
            >
              {nameLoading ? "…" : "저장"}
            </button>
          </div>
          {nameMsg && (
            <p
              className="text-xs mt-2 pl-1"
              style={{ color: nameMsg.type === "ok" ? "#A57CFF" : "#E05050" }}
            >
              {nameMsg.text}
            </p>
          )}
          <p className="text-xs mt-2 pl-1" style={{ color: "#C0B4D8" }}>
            최대 20자 · 사주풀이 결과에 표시되는 이름이에요
          </p>
        </div>

        {/* 비밀번호 변경 카드 — 이메일 가입자만 표시 */}
        {isEmailUser && (
          <div
            className="rounded-3xl p-5 mb-4"
            style={{
              background: "rgba(255,255,255,0.90)",
              border: "1px solid rgba(196,160,255,0.25)",
              boxShadow: "0 4px 20px rgba(165,124,255,0.08)",
            }}
          >
            <p
              className="text-xs font-bold mb-3 tracking-widest uppercase"
              style={{ color: "#C4A0FF" }}
            >
              비밀번호 변경
            </p>
            <div className="flex flex-col gap-2">
              {[
                {
                  value: pwCurrent,
                  setter: setPwCurrent,
                  placeholder: "현재 비밀번호",
                },
                {
                  value: pwNew,
                  setter: setPwNew,
                  placeholder: "새 비밀번호 (6자 이상)",
                },
                {
                  value: pwConfirm,
                  setter: setPwConfirm,
                  placeholder: "새 비밀번호 확인",
                },
              ].map(({ value, setter, placeholder }) => (
                <input
                  key={placeholder}
                  type="password"
                  value={value}
                  onChange={(e) => {
                    setter(e.target.value);
                    setPwMsg(null);
                  }}
                  placeholder={placeholder}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                  style={{
                    border: "1px solid rgba(196,160,255,0.4)",
                    background: "rgba(255,255,255,0.8)",
                    color: "#2D3142",
                  }}
                />
              ))}
            </div>
            {pwMsg && (
              <p
                className="text-xs mt-2 pl-1"
                style={{ color: pwMsg.type === "ok" ? "#A57CFF" : "#E05050" }}
              >
                {pwMsg.text}
              </p>
            )}
            <button
              onClick={handlePasswordChange}
              disabled={pwLoading || !pwCurrent || !pwNew || !pwConfirm}
              className="mt-3 w-full py-3 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-40"
              style={{
                background: "linear-gradient(135deg, #C4A0FF 0%, #A57CFF 100%)",
                color: "#fff",
              }}
            >
              {pwLoading ? "변경 중..." : "비밀번호 변경"}
            </button>
          </div>
        )}

        {/* 회원 탈퇴 카드 */}
        <div
          className="rounded-3xl p-5"
          style={{
            background: "rgba(255,255,255,0.90)",
            border: "1px solid rgba(196,160,255,0.25)",
            boxShadow: "0 4px 20px rgba(165,124,255,0.08)",
          }}
        >
          <p
            className="text-xs font-bold mb-3 tracking-widest uppercase"
            style={{ color: "#C4A0FF" }}
          >
            계정 삭제
          </p>

          {!deleteConfirm ? (
            <button
              onClick={() => setDeleteConfirm(true)}
              className="w-full py-3 rounded-xl text-sm font-medium transition-all"
              style={{
                background: "rgba(255,80,80,0.06)",
                border: "1px solid rgba(255,80,80,0.20)",
                color: "#E05050",
              }}
            >
              회원 탈퇴
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <div
                className="rounded-xl px-4 py-3 text-sm"
                style={{
                  background: "rgba(255,80,80,0.06)",
                  border: "1px solid rgba(255,80,80,0.20)",
                  color: "#E05050",
                }}
              >
                <p className="font-bold mb-1">정말 탈퇴하시겠어요?</p>
                <p className="text-xs" style={{ color: "#9B8ABE" }}>
                  모든 사주 내역과 계정 정보가 영구 삭제되며 복구할 수 없어요.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-medium"
                  style={{
                    background: "rgba(196,160,255,0.12)",
                    color: "#7C5CBF",
                  }}
                >
                  취소
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="flex-1 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-60"
                  style={{ background: "#E05050", color: "#fff" }}
                >
                  {deleteLoading ? "처리 중..." : "탈퇴 확인"}
                </button>
              </div>
            </div>
          )}
          <p className="text-xs mt-3" style={{ color: "#C0B4D8" }}>
            탈퇴 후 동일 계정으로 재가입해도 기존 데이터는 복구되지 않아요.
          </p>
        </div>
      </div>
    </main>
  );
}
