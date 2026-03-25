# 몽글사주 웹 (Mongle Saju Web)

AI 기반 사주풀이 & 고민상담 서비스  
Next.js + GPT-4o + Supabase

---

## 주요 기능

- **사주 정보 입력**: 이름, 생년월일, 출생시, 양력/음력, 성별, 고민 선택(전체운/연애/재회/결혼/이직)
- **고민 맞춤형 AI 풀이**: GPT-4o가 선택한 고민(예: 전남친/재회/이직 등)에 80% 이상 집중하여 명리학적으로 상세 분석
- **결과 저장 및 조회**: Supabase DB에 풀이 결과 저장, 로그인 시 언제든 재확인 가능
- **카카오톡 공유 & 이미지 저장**: 결과를 카카오톡으로 공유하거나 이미지로 저장 가능 (바이럴 최적화)
- **모바일 퍼스트 UI**: 감성적인 디자인, 반응형 지원

---

## 개발 환경

- **Next.js** (App Router)
- **TypeScript**
- **Supabase** (Auth, DB)
- **OpenAI GPT-4o**
- **html2canvas** (이미지 저장)
- **Tailwind CSS**

---

## 실행 방법

```bash
npm install
npm run dev
```

- [http://localhost:3000](http://localhost:3000) 접속

---

## 폴더 구조

- `src/app/` — 페이지 및 라우트
- `src/components/` — UI 컴포넌트
- `src/services/` — 사주 계산, OpenAI 연동
- `src/lib/supabase/` — Supabase 클라이언트
- `src/types/` — 타입 정의

---

## 배포

- Vercel, Netlify 등 Next.js 지원 플랫폼 권장

---

## 라이선스

MIT
