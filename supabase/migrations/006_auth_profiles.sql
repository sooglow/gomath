-- 유저 프로필 테이블 (역할 관리)
create table if not exists user_profiles (
  id         uuid references auth.users(id) on delete cascade primary key,
  role       text not null default 'student' check (role in ('student', 'teacher')),
  name       text,
  created_at timestamptz default now()
);

alter table user_profiles enable row level security;
create policy "user read own profile"   on user_profiles for select using (auth.uid() = id);
create policy "user update own profile" on user_profiles for update using (auth.uid() = id);
create policy "user insert own profile" on user_profiles for insert with check (auth.uid() = id);

-- 회원가입 시 자동으로 프로필 생성
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into user_profiles (id, role)
  values (new.id, 'student');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- chat_logs에 user_id 추가
alter table chat_logs add column if not exists user_id uuid references auth.users(id) on delete set null;

-- chat_logs RLS 업데이트 (본인 로그만 읽기)
drop policy if exists "public read chat_logs" on chat_logs;
drop policy if exists "public insert chat_logs" on chat_logs;
create policy "user insert chat_logs" on chat_logs for insert with check (auth.uid() = user_id);
create policy "user read own chat_logs" on chat_logs for select using (auth.uid() = user_id);
create policy "teacher read all chat_logs" on chat_logs for select using (
  exists (select 1 from user_profiles where id = auth.uid() and role = 'teacher')
);
