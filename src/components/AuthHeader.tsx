"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

export default function AuthHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/");
  }

  if (loading) {
    return (
      <header
        className="w-full px-4 pt-5 pb-1 flex justify-end"
        style={{ maxWidth: 448, margin: "0 auto" }}
      >
        <div
          className="w-20 h-8 rounded-full animate-pulse"
          style={{ background: "rgba(165,124,255,0.15)" }}
        />
      </header>
    );
  }

  if (user) {
    return (
      <header
        className="w-full px-4 pt-5 pb-1 flex justify-end items-center gap-2"
        style={{ maxWidth: 448, margin: "0 auto" }}
      >
        <Link
          href="/mypage"
          className="text-xs px-3 py-1.5 rounded-full transition-all flex items-center gap-1 font-medium"
          style={{
            background: "rgba(165,124,255,0.15)",
            color: "#7C5CBF",
            border: "1px solid rgba(165,124,255,0.3)",
          }}
        >
          🌙 마이페이지
        </Link>
        <button
          onClick={handleLogout}
          className="text-xs px-3 py-1.5 rounded-full font-medium transition-all active:scale-95"
          style={{
            background: "linear-gradient(135deg, #B98EFF 0%, #A57CFF 100%)",
            color: "#fff",
            boxShadow: "0 2px 8px rgba(165,124,255,0.35)",
          }}
        >
          로그아웃
        </button>
      </header>
    );
  }

  return (
    <header
      className="w-full px-4 pt-5 pb-1 flex justify-end gap-2"
      style={{ maxWidth: 448, margin: "0 auto" }}
    >
      <Link
        href="/login"
        className="text-xs px-3 py-1.5 rounded-full transition-all font-medium"
        style={{
          background: "rgba(165,124,255,0.12)",
          color: "#7C5CBF",
          border: "1px solid rgba(165,124,255,0.28)",
        }}
      >
        로그인
      </Link>
      <Link
        href="/login?tab=signup"
        className="text-xs px-3 py-1.5 rounded-full font-semibold transition-all"
        style={{
          background: "linear-gradient(135deg, #B98EFF 0%, #A57CFF 100%)",
          color: "#fff",
          boxShadow: "0 2px 8px rgba(165,124,255,0.35)",
        }}
      >
        회원가입
      </Link>
    </header>
  );
}
