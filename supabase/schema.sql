-- ====================================================
-- 몽글사주(Mongle Saju) Supabase 초기 스키마
-- ====================================================

-- 1. profiles: 유저 기본 정보 (auth.users와 1:1 대응)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  birth_date date,
  birth_time time,
  is_solar boolean default true,
  gender text check (gender in ('male', 'female')),
  updated_at timestamptz default now()
);

-- 2. saju_results: AI 생성 결과 저장 (비용 절감 및 재조회용)
create table saju_results (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  category text,                  -- 'total', 'love', 'ex-boyfriend' 등 구분
  content text,                   -- AI 풀이 텍스트 (Markdown)
  input_snapshot jsonb,           -- 분석 당시 입력 데이터 (만세력 결과 등)
  is_public boolean default false, -- 공유하기 기능 대비
  created_at timestamptz default now()
);

-- 3. payments: 결제 이력 (포트원 연동 대비)
create table payments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users,
  amount int4 not null,
  status text check (status in ('pending', 'paid', 'failed', 'cancelled')),
  order_id text unique,           -- 우리 서비스의 주문 고유 번호
  payment_key text,               -- 포트원/토스에서 받은 결제 키
  metadata jsonb,                 -- 카드사 정보, 영수증 URL 등 유연한 저장
  created_at timestamptz default now()
);

-- ====================================================
-- RLS (Row Level Security) 설정
-- ====================================================

alter table profiles enable row level security;
alter table saju_results enable row level security;
alter table payments enable row level security;

-- profiles: 본인 프로필만 조회/수정 가능 (Insert는 트리거가 담당)
create policy "Users can view and update own profile" on profiles
  for all using (auth.uid() = id);

-- saju_results: 본인 데이터만 조회/저장 가능
create policy "Users can view own results" on saju_results
  for select using (auth.uid() = user_id);
create policy "Users can insert own results" on saju_results
  for insert with check (auth.uid() = user_id);

-- payments: 본인 결제 내역만 조회 가능 (생성은 서버측 로직 권장이나 일단 오픈)
create policy "Users can view own payments" on payments
  for select using (auth.uid() = user_id);
create policy "Users can insert own payments" on payments
  for insert with check (auth.uid() = user_id);

-- ====================================================
-- 트리거 (Triggers) 설정
-- ====================================================

-- [Trigger 1] 신규 가입 시 profiles 자동 생성 + 랜덤 닉네임 부여
create or replace function public.handle_new_user()
returns trigger as $$
declare
  adjectives text[] := array[
    '신비한','보랏빛','달빛','별빛','구름빛','은하수','새벽빛','노을빛',
    '오묘한','찬란한','따뜻한','포근한','반짝이는','수줍은','고요한','맑은',
    '몽글몽글','아련한','설레는','두근두근'
  ];
  nouns text[] := array[
    '여우','달팽이','두꺼비','고양이','토끼','부엉이','거북이','나비',
    '도깨비','용','봉황','기린','판다','코알라','다람쥐','수달',
    '사주쟁이','점성술사','운명가','별자리'
  ];
  rand_adj text;
  rand_noun text;
  rand_num text;
  new_name text;
begin
  rand_adj  := adjectives[1 + floor(random() * array_length(adjectives, 1))::int];
  rand_noun := nouns[1 + floor(random() * array_length(nouns, 1))::int];
  rand_num  := lpad((floor(random() * 900) + 100)::text, 3, '0');
  new_name  := rand_adj || rand_noun || rand_num;

  insert into public.profiles (id, name)
  values (new.id, new_name);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- [Trigger 2] 업데이트 시 updated_at 자동 갱신
create or replace function update_modified_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

create trigger update_profiles_modtime
    before update on profiles
    for each row execute procedure update_modified_column();