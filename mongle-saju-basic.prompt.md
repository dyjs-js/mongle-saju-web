mongle-saju-web

mongle-saju-app (추후 앱 출시할 경우 고려)

🚀 AI 개발 프롬프트용 프로젝트 가이드

1. 프로젝트 목표

서비스 이름 : 몽글사주

레포명 : mongle-saju-web

서비스: AI 기반 사주 분석 웹 서비스 (추후 Flutter 앱 확장 고려)

핵심 Flow: 사용자 정보 입력 → 소셜 로그인(카카오/구글) → 결제(포트원) → AI 사주 풀이 → 결과 저장 및 표시

2. 기술 스택 (Tech Stack)

Framework: Next.js (App Router, TypeScript)

Database/Auth: Supabase (PostgreSQL)

Styling: Tailwind CSS

Payment: PortOne SDK (Toss, KakaoPay)

AI: OpenAI API (GPT-4o)

3. 데이터베이스 스키마 (Supabase SQL)

SQL

-- profiles: 유저 기본 정보 및 사주 데이터create table profiles (

id uuid references auth.users on delete cascade primary key,

name text,

birth_date date,

birth_time time,

is_solar boolean default true,

gender text check (gender in ('male', 'female')),

updated_at timestamptz default now()

);-- saju_results: AI 생성 결과 저장 (비용 절감 및 재조회용)create table saju_results (

id uuid default gen_random_uuid() primary key,

user_id uuid references auth.users on delete cascade,

content text, -- AI 풀이 텍스트 (Markdown)

input_snapshot jsonb, -- 분석 당시 사주 데이터

created_at timestamptz default now()

);-- payments: 결제 이력 관리create table payments (

id uuid default gen_random_uuid() primary key,

user_id uuid references auth.users,

amount int4,

status text, -- 'pending', 'paid', 'failed'

order_id text unique,

created_at timestamptz default now()

);

4. 구현 시 주의사항 (AI에게 강조할 점)

비즈니스 로직 분리: Next.js API Routes 내부에 로직을 직접 짜지 말고, services/ 폴더에 사주 계산 및 AI 호출 로직을 분리해서 작성할 것 (Flutter 앱 전환 시 재사용성 확보).

접근성 중심 UX: 정보 입력 후 결과 확인 직전에 로그인을 유도하는 흐름으로 구성.

보안: 결제 검증 로직은 반드시 Server-side(Next.js API Routes)에서 처리할 것.

타겟 : 여자들 2~40대 타겟 + 특히 전남친 남자친구 남편 관련 최적화

src/
app/
(auth)/login/ ← 로그인 페이지
(main)/ ← 메인 흐름
page.tsx ← 랜딩
saju/
input/page.tsx ← 사주 정보 입력
result/page.tsx ← 결과 화면
api/
saju/route.ts ← AI 호출 (서버)
payment/route.ts ← 결제 검증 (서버)
services/
saju.ts ← 사주 계산 로직
openai.ts ← AI 호출 래퍼
payment.ts ← 포트원 검증 로직
lib/
supabase/
client.ts ← 브라우저용
server.ts ← 서버용
components/
ui/ ← 공통 버튼, 인풋 등
saju/ ← 사주 관련 컴포넌트
