-- =====================================================
-- Migration: 신규 가입 시 랜덤 닉네임 자동 부여
-- Date: 2026-03-26
-- =====================================================

-- 1. handle_new_user 트리거 함수 교체
--    형용사 + 명사 + 3자리 숫자 조합 (예: "신비한여우142")
create or replace function public.handle_new_user()
returns trigger as $$
declare
adjectives text[] := array[
    '신비한','보랏빛','달빛','별빛','구름빛','은하수','새벽빛','노을빛',
    '오묘한','찬란한','따뜻한','포근한','반짝이는','수줍은','고요한','맑은',
    '몽글몽글','아련한','설레는','두근두근','말랑한','동글동글','폭신한',
    '뽀짝한','씩씩한','졸린','배부른','느긋한','행복한','깜찍한','소중한'
  ];
nouns text[] := array[
    '여우','달팽이','두꺼비','고양이','토끼','부엉이','거북이','나비',
    '도깨비','용','봉황','기린','판다','코알라','다람쥐','수달',
    '사주쟁이','점성술사','운명가','별자리','쿼카','해파리','햄스터',
    '병아리','도토리','푸딩','젤리','솜사탕','강아지','망고','낑깡'
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

-- 2. 기존 유저 중 name이 NULL인 경우 랜덤 닉네임 일괄 부여
do $$
declare
adjectives text[] := array[
    '신비한','보랏빛','달빛','별빛','구름빛','은하수','새벽빛','노을빛',
    '오묘한','찬란한','따뜻한','포근한','반짝이는','수줍은','고요한','맑은',
    '몽글몽글','아련한','설레는','두근두근','말랑한','동글동글','폭신한',
    '뽀짝한','씩씩한','졸린','배부른','느긋한','행복한','깜찍한','소중한'
  ];
nouns text[] := array[
    '여우','달팽이','두꺼비','고양이','토끼','부엉이','거북이','나비',
    '도깨비','용','봉황','기린','판다','코알라','다람쥐','수달',
    '사주쟁이','점성술사','운명가','별자리','쿼카','해파리','햄스터',
    '병아리','도토리','푸딩','젤리','솜사탕','강아지','망고','낑깡'
  ];
  r record;
  new_name text;
begin
  for r in select id from public.profiles where name is null or name = '' loop
    new_name :=
      adjectives[1 + floor(random() * array_length(adjectives, 1))::int]
      || nouns[1 + floor(random() * array_length(nouns, 1))::int]
      || lpad((floor(random() * 900) + 100)::text, 3, '0');
    update public.profiles set name = new_name where id = r.id;
  end loop;
end;
$$;
