import Link from "next/link";
import AuthHeader from "@/components/AuthHeader";

const FEATURES = [
  {
    icon: "🌸",
    title: "연애운 & 남자복",
    desc: "지금 인연이 올 때인지, 나와 맞는 사람은 어떤 스타일인지 알려드려요.",
  },
  {
    icon: "⭐",
    title: "올해의 운세",
    desc: "2026년 나의 전반적인 운세와 조심해야 할 시기를 알려드려요.",
  },
  {
    icon: "🌿",
    title: "재물운 & 직업운",
    desc: "언제 기회가 오는지, 어떤 분야에서 빛을 발할 수 있는지 분석해드려요.",
  },
];

export default function Home() {
  return (
    <main
      className="flex flex-col items-center min-h-screen"
      style={{
        background:
          "linear-gradient(160deg, #F3EEFF 0%, #F8F9FF 50%, #EEF3FF 100%)",
      }}
    >
      <AuthHeader />
      <div className="container mx-auto max-w-md px-6 py-4 flex flex-col items-center">
        {/* Hero */}
        <section className="w-full flex flex-col items-center text-center pt-6 pb-14">
          {/* 장식 아이콘 */}
          <div className="relative mb-6">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-lg"
              style={{
                background: "linear-gradient(135deg, #C4A0FF 0%, #A57CFF 100%)",
              }}
            >
              🌙
            </div>
            <span className="absolute -top-1 -right-1 text-xl">✦</span>
            <span className="absolute -bottom-1 -left-2 text-lg opacity-60">
              ✦
            </span>
          </div>

          {/* 타이틀 */}
          <h1
            className="text-5xl font-bold mb-3 tracking-tight"
            style={{
              fontFamily: "var(--font-nanum-myeongjo), serif",
              color: "#2D3142",
            }}
          >
            몽글사주
          </h1>
          <p
            className="text-base font-medium mb-2"
            style={{ color: "#7C5CBF" }}
          >
            AI가 풀어주는 나만의 사주풀이
          </p>
          <p
            className="text-sm mb-10 max-w-xs leading-relaxed"
            style={{ color: "#9B8ABE" }}
          >
            생년월일만 입력하면 연애운, 남자복, 올해 운세까지
            <br />딱 3분 안에 알 수 있어요
          </p>

          {/* CTA 버튼 */}
          <div className="flex flex-col items-center gap-3 w-full max-w-xs">
            <Link
              href="/saju/input"
              className="w-full text-center font-semibold px-10 py-4 rounded-full text-base shadow-md transition-all active:scale-95 hover:shadow-lg hover:brightness-105"
              style={{
                background: "linear-gradient(135deg, #B98EFF 0%, #A57CFF 100%)",
                color: "#fff",
                boxShadow: "0 4px 20px rgba(165, 124, 255, 0.35)",
              }}
            >
              나의 운명 궤도 확인하기 ✨
            </Link>
            <div className="relative w-full">
              <Link
                href="/saju/compatibility"
                className="block w-full text-center font-semibold px-10 py-4 rounded-full text-base shadow-md transition-all active:scale-95 hover:shadow-lg hover:brightness-105"
                style={{
                  background:
                    "linear-gradient(135deg, #FFB6C1 0%, #FF85A1 100%)",
                  color: "#fff",
                  boxShadow: "0 4px 20px rgba(255, 133, 161, 0.35)",
                }}
              >
                우리 궁합 성적표 💘
              </Link>
              <span
                className="absolute -top-2.5 -right-1 text-[10px] font-bold px-2 py-0.5 rounded-full shadow"
                style={{
                  background:
                    "linear-gradient(135deg, #FF6B9D 0%, #FF3D6B 100%)",
                  color: "#fff",
                  letterSpacing: "0.03em",
                }}
              >
                무료
              </span>
            </div>
          </div>
          <p className="mt-4 text-xs" style={{ color: "#B8AACF" }}>
            처음 입력은 무료 · 결제는 나중에
          </p>
        </section>

        {/* 구분선 */}
        <div className="w-full flex items-center gap-4 mb-10">
          <div
            className="flex-1 h-px"
            style={{
              background: "linear-gradient(to right, transparent, #D6C5FF)",
            }}
          />
          <span className="text-xs" style={{ color: "#B8AACF" }}>
            몽글이 알려주는 것들
          </span>
          <div
            className="flex-1 h-px"
            style={{
              background: "linear-gradient(to left, transparent, #D6C5FF)",
            }}
          />
        </div>

        {/* Features */}
        <section className="w-full flex flex-col gap-4 mb-14">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl p-5 flex gap-4 items-start transition-all hover:scale-[1.01]"
              style={{
                background: "rgba(255, 255, 255, 0.70)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(196, 160, 255, 0.35)",
                boxShadow: "0 2px 16px rgba(165, 124, 255, 0.08)",
              }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                style={{
                  background:
                    "linear-gradient(135deg, #EDE8FF 0%, #DDD0FF 100%)",
                }}
              >
                {f.icon}
              </div>
              <div>
                <p
                  className="font-semibold mb-1 text-sm"
                  style={{ color: "#2D3142" }}
                >
                  {f.title}
                </p>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "#7A7A9A" }}
                >
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </section>

        {/* CTA 카드 */}
        <section className="w-full mb-12">
          <div
            className="rounded-3xl p-8 text-center"
            style={{
              background: "linear-gradient(135deg, #B98EFF 0%, #8B5CF6 100%)",
              boxShadow: "0 8px 32px rgba(139, 92, 246, 0.30)",
            }}
          >
            <p className="text-lg font-bold mb-2" style={{ color: "#fff" }}>
              지금 바로 나의 사주를 확인해보세요
            </p>
            <p
              className="text-sm mb-6"
              style={{ color: "rgba(255,255,255,0.75)" }}
            >
              단 990원으로 나의 운명을 확인해보세요
            </p>
            <Link
              href="/saju/input"
              className="inline-block font-bold px-8 py-3 rounded-full transition-all active:scale-95 hover:shadow-md"
              style={{
                background: "rgba(255,255,255,0.92)",
                color: "#7C3AED",
              }}
            >
              무료로 입력 시작하기
            </Link>
          </div>
        </section>

        {/* 푸터 */}
        <footer
          className="text-xs text-center pb-8"
          style={{ color: "#C0B4D8" }}
        >
          © 2026 몽글사주 · 문의: dydy11652@gmail.com
        </footer>
      </div>
    </main>
  );
}
