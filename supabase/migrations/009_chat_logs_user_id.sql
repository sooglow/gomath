-- chat_logs에 user_id 추가
alter table chat_logs add column if not exists user_id uuid references auth.users(id) on delete set null;

-- 인덱스
create index if not exists chat_logs_user_id_idx on chat_logs(user_id);
create index if not exists chat_logs_created_at_idx on chat_logs(created_at desc);

-- RLS 재설정 (선생님은 전체 조회, 학생은 본인 것만)
drop policy if exists "public read chat_logs" on chat_logs;
drop policy if exists "public insert chat_logs" on chat_logs;
drop policy if exists "insert chat_logs" on chat_logs;
drop policy if exists "teacher read all chat_logs" on chat_logs;
drop policy if exists "student read own chat_logs" on chat_logs;

create policy "insert chat_logs" on chat_logs
  for insert with check (true);

create policy "teacher read all chat_logs" on chat_logs
  for select using (is_teacher());

create policy "student read own chat_logs" on chat_logs
  for select using (auth.uid() = user_id);
