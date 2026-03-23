import type { Metadata } from "next";
import { Noto_Sans_KR, Nanum_Myeongjo } from "next/font/google";
import "./globals.css";

const notoSansKR = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const nanumMyeongjo = Nanum_Myeongjo({
  variable: "--font-nanum-myeongjo",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "몽글사주 | AI 사주풀이",
  description: "AI가 풀어주는 나만의 사주. 연애운, 남자복, 재물운까지 한눈에.",
  openGraph: {
    title: "몽글사주 | AI 사주풀이",
    description:
      "AI가 풀어주는 나만의 사주. 연애운, 남자복, 재물운까지 한눈에.",
    siteName: "몽글사주",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={`${notoSansKR.variable} ${nanumMyeongjo.variable} h-full`}
    >
      <body
        className="min-h-full flex flex-col font-sans antialiased"
        style={{ background: "#F8F9FF", color: "#2D3142" }}
        suppressHydrationWarning={true}
      >
        {children}
      </body>
    </html>
  );
}
