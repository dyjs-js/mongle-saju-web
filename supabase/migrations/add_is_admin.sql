-- profiles 테이블에 is_admin 컬럼 추가
alter table profiles add column if not exists is_admin boolean default false;

-- 어드민 계정 직접 지정 (이메일로 찾아서 설정)
update profiles set is_admin = true where id = (
  select id from auth.users where email = 'dydy11642@gmail.com'
);
