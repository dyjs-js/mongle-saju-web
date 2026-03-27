"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const BG = "linear-gradient(160deg, #F3EEFF 0%, #F8F9FF 50%, #EEF3FF 100%)";

const RELATIONSHIP_OPTIONS = [
  { value: "연인", emoji: "💑", label: "연인" },
  { value: "친구·가족", emoji: "🤝", label: "친구·가족" },
  { value: "직장동료", emoji: "💼", label: "직장동료" },
];

const inputClass =
  "w-full rounded-xl px-4 py-3 text-sm outline-none transition-all bg-white/80" +
  " border border-[rgba(196,160,255,0.4)] focus:border-[#A57CFF] focus:ring-2 focus:ring-[rgba(165,124,255,0.2)]" +
  " text-[#2D3142] placeholder:text-[#C0B4D8]";

interface Person {
  name: string;
  birth_date: string;
  gender: "female" | "male";
}

const EMPTY: Person = { name: "", birth_date: "", gender: "female" };
const DEFAULT1: Person = {
  name: "연지수",
  birth_date: "1992-09-29",
  gender: "female",
};
const DEFAULT2: Person = {
  name: "유장호",
  birth_date: "1996-09-04",
  gender: "male",
};

export default function CompatibilityPage() {
  const router = useRouter();
  const [me, setMe] = useState<Person>({ ...EMPTY });
  const [partner, setPartner] = useState<Person>({ ...EMPTY });
  const [relationship, setRelationship] = useState("연인");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateMe<K extends keyof Person>(k: K, v: Person[K]) {
    setMe((p) => ({ ...p, [k]: v }));
  }
  function updatePartner<K extends keyof Person>(k: K, v: Person[K]) {
    setPartner((p) => ({ ...p, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/compatibility", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user1: {
          ...me,
          is_solar: true,
          birth_time: "11:00",
          birth_time_unknown: true,
          concerns: [],
        },
        user2: {
          ...partner,
          is_solar: true,
          birth_time: "11:00",
          birth_time_unknown: true,
          concerns: [],
        },
        relationship,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (data.error) {
      setError(data.error);
      return;
    }

    // 결과를 sessionStorage에 저장 후 결과 페이지로 이동
    sessionStorage.setItem(
      "compatibility_result",
      JSON.stringify({ me, partner, relationship, content: data.content }),
    );
    router.push("/saju/compatibility/result");
  }

  const cardStyle = {
    background: "rgba(255,255,255,0.90)",
    border: "1px solid rgba(196,160,255,0.25)",
    boxShadow: "0 4px 20px rgba(165,124,255,0.08)",
  };

  return (
    <main className="min-h-screen px-4 py-8" style={{ background: BG }}>
      <div className="w-full max-w-sm mx-auto">
        {/* 헤더 */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm mb-5"
          style={{ color: "#9B8ABE" }}
        >
          ← 메인으로
        </Link>
        <div className="text-center mb-6">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3 shadow-md"
            style={{
              background: "linear-gradient(135deg, #FFB6C1 0%, #FF85A1 100%)",
            }}
          >
            💘
          </div>
          <h1 className="text-xl font-bold mb-1" style={{ color: "#2D3142" }}>
            우리 궁합 성적표
          </h1>
          <p className="text-sm" style={{ color: "#9B8ABE" }}>
            두 사람의 일주로 보는 찰떡궁합 분석
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* 관계 선택 */}
          <div className="rounded-3xl p-4" style={cardStyle}>
            <p
              className="text-xs font-bold mb-3 tracking-widest uppercase"
              style={{ color: "#C4A0FF" }}
            >
              관계
            </p>
            <div className="flex flex-wrap gap-2">
              {RELATIONSHIP_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRelationship(opt.value)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={{
                    background:
                      relationship === opt.value
                        ? "linear-gradient(135deg, #C4A0FF 0%, #A57CFF 100%)"
                        : "rgba(196,160,255,0.10)",
                    color: relationship === opt.value ? "#fff" : "#9B8ABE",
                  }}
                >
                  {opt.emoji} {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 나 */}
          <div className="rounded-3xl p-4" style={cardStyle}>
            <p
              className="text-xs font-bold mb-3 tracking-widest uppercase"
              style={{ color: "#C4A0FF" }}
            >
              나
            </p>
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={me.name}
                onChange={(e) => updateMe("name", e.target.value)}
                placeholder="이름"
                required
                className={inputClass}
              />
              <input
                type="date"
                value={me.birth_date}
                onChange={(e) => updateMe("birth_date", e.target.value)}
                required
                className={inputClass}
              />
              <div className="flex gap-2">
                {(["female", "male"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => updateMe("gender", g)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      background:
                        me.gender === g
                          ? "linear-gradient(135deg, #C4A0FF 0%, #A57CFF 100%)"
                          : "rgba(196,160,255,0.10)",
                      color: me.gender === g ? "#fff" : "#9B8ABE",
                    }}
                  >
                    {g === "female" ? "👩 여성" : "👨 남성"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 상대방 */}
          <div className="rounded-3xl p-4" style={cardStyle}>
            <p
              className="text-xs font-bold mb-3 tracking-widest uppercase"
              style={{ color: "#C4A0FF" }}
            >
              상대방
            </p>
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={partner.name}
                onChange={(e) => updatePartner("name", e.target.value)}
                placeholder="이름"
                required
                className={inputClass}
              />
              <input
                type="date"
                value={partner.birth_date}
                onChange={(e) => updatePartner("birth_date", e.target.value)}
                required
                className={inputClass}
              />
              <div className="flex gap-2">
                {(["female", "male"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => updatePartner("gender", g)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      background:
                        partner.gender === g
                          ? "linear-gradient(135deg, #C4A0FF 0%, #A57CFF 100%)"
                          : "rgba(196,160,255,0.10)",
                      color: partner.gender === g ? "#fff" : "#9B8ABE",
                    }}
                  >
                    {g === "female" ? "👩 여성" : "👨 남성"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full font-bold py-4 rounded-2xl text-base transition-all active:scale-95 disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, #FFB6C1 0%, #FF85A1 100%)",
              color: "#fff",
              boxShadow: "0 4px 20px rgba(255,133,161,0.35)",
            }}
          >
            {loading ? "궁합 분석 중... 💫" : "우리 궁합 확인하기 💘"}
          </button>
        </form>

        {/* 에러 */}
        {error && (
          <div
            className="mt-4 p-4 rounded-2xl text-sm text-center"
            style={{ background: "rgba(255,80,80,0.07)", color: "#E05050" }}
          >
            {error}
          </div>
        )}
      </div>
    </main>
  );
}
