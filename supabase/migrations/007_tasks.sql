-- 과제 테이블
create table if not exists assignments (
  id uuid default gen_random_uuid() primary key,
  problem_id uuid references problems(id) on delete cascade not null,
  due_date date,
  note text,
  created_at timestamptz default now() not null
);

-- 학생별 완료 테이블
create table if not exists assignment_completions (
  id uuid default gen_random_uuid() primary key,
  assignment_id uuid references assignments(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  completed_at timestamptz default now() not null,
  unique(assignment_id, user_id)
);

alter table assignments enable row level security;
alter table assignment_completions enable row level security;

-- 로그인한 모든 사용자 과제 조회
create policy "auth read assignments" on assignments
  for select using (auth.uid() is not null);

-- 선생님만 과제 생성/삭제
create policy "teacher insert assignments" on assignments
  for insert with check (is_teacher());

create policy "teacher delete assignments" on assignments
  for delete using (is_teacher());

-- 학생 자신의 완료 기록 관리
create policy "user read own completions" on assignment_completions
  for select using (auth.uid() = user_id);

create policy "user insert own completions" on assignment_completions
  for insert with check (auth.uid() = user_id);

create policy "user delete own completions" on assignment_completions
  for delete using (auth.uid() = user_id);

-- 선생님 전체 완료 현황 조회
create policy "teacher read all completions" on assignment_completions
  for select using (is_teacher());
