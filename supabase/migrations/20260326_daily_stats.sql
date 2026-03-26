-- =====================================================
-- Migration: 무료 체험 일일 할당량 관리 테이블
-- Date: 2026-03-26
-- =====================================================

-- 1. daily_stats 테이블 생성
create table if not exists public.daily_stats (
  date date primary key default current_date,
  free_count int4 not null default 0,
  max_limit  int4 not null default 500,
  updated_at timestamptz default now()
);

-- 2. RLS — 읽기는 누구나, 쓰기는 service_role 전용
alter table public.daily_stats enable row level security;

create policy "Anyone can read daily_stats" on public.daily_stats
  for select using (true);

-- service_role은 RLS bypass 되므로 별도 insert/update 정책 불필요

-- 3. 오늘 row가 없으면 자동 생성하는 함수 (upsert 방식)
create or replace function public.increment_free_count()
returns json as $$
declare
  today date := current_date;
  result record;
begin
  -- upsert: 오늘 row 없으면 생성, 있으면 count+1
  insert into public.daily_stats (date, free_count)
  values (today, 1)
  on conflict (date) do update
    set free_count = daily_stats.free_count + 1,
        updated_at = now()
  returning * into result;

  return row_to_json(result);
end;
$$ language plpgsql security definer set search_path = public;

-- 4. 오늘 통계 조회 함수
create or replace function public.get_today_free_stats()
returns json as $$
declare
  today date := current_date;
  result record;
begin
  -- 오늘 row가 없으면 0으로 반환
  select coalesce(free_count, 0) as free_count,
         coalesce(max_limit, 500) as max_limit
  into result
  from public.daily_stats
  where date = today;

  if not found then
    return json_build_object('free_count', 0, 'max_limit', 500);
  end if;

  return row_to_json(result);
end;
$$ language plpgsql security definer set search_path = public;
