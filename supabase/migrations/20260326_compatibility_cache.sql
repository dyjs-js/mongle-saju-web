-- ============================================================
-- compatibility_cache: 궁합 AI 결과 캐시 테이블
-- 동일 (일주조합 + 관계 + 프롬프트버전) 요청 시 AI 재호출 없이 반환
-- ============================================================

create table if not exists compatibility_cache (
  id           uuid default gen_random_uuid() primary key,
  -- 두 일주를 알파벳순 정렬 후 조합한 키 (대칭성 보장)
  -- 예: "갑자-무신" (갑자 < 무신 이면 그대로, 아니면 뒤집어서 저장)
  ilju_key     text        not null,
  relationship text        not null,
  -- 프롬프트 버전: 프롬프트 변경 시 이 값을 올려서 캐시 무효화
  prompt_ver   text        not null default 'v1',
  content      text        not null,
  hit_count    integer     not null default 0,
  created_at   timestamptz not null default now(),

  -- 동일 조합 중복 저장 방지
  unique (ilju_key, relationship, prompt_ver)
);

-- 캐시 조회 성능용 인덱스
create index if not exists idx_compat_cache_lookup
  on compatibility_cache (ilju_key, relationship, prompt_ver);

-- ── RLS ──────────────────────────────────────────────────────
alter table compatibility_cache enable row level security;

-- 누구나 읽기 가능 (캐시 조회)
create policy "cache_select_public"
  on compatibility_cache for select
  using (true);

-- insert / update 는 service_role(서버)만 가능
create policy "cache_insert_service"
  on compatibility_cache for insert
  with check (false);          -- anon/authenticated 차단, service_role은 RLS bypass

create policy "cache_update_service"
  on compatibility_cache for update
  using (false);                -- 동일하게 service_role만 가능

-- ── hit_count 증가 RPC (service_role 없이도 호출 가능하게 SECURITY DEFINER) ──
create or replace function increment_compat_hit(p_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update compatibility_cache
  set hit_count = hit_count + 1
  where id = p_id;
end;
$$;
