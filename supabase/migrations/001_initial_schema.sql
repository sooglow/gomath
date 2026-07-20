-- =============================================
-- 교재 테이블
-- =============================================
create table if not exists books (
  id   uuid default gen_random_uuid() primary key,
  name text not null unique,
  created_at timestamptz default now()
);

-- =============================================
-- 문항 테이블
-- =============================================
create table if not exists problems (
  id      uuid default gen_random_uuid() primary key,
  book_id uuid references books(id) on delete cascade not null,
  page    text not null,       -- 예: '32'
  number  text not null,       -- 예: '5'
  topic   text,                -- 예: '이차방정식'
  created_at timestamptz default now(),
  unique(book_id, page, number)
);

-- =============================================
-- 해설 테이블 (교사가 입력)
-- =============================================
create table if not exists explanations (
  id              uuid default gen_random_uuid() primary key,
  problem_id      uuid references problems(id) on delete cascade not null unique,
  full_explanation text not null,  -- 전체 풀이 해설 (AI context로 사용)
  key_concepts    text[],          -- 핵심 개념 키워드 배열
  hint_steps      text[],          -- 단계별 힌트 배열 (선택적)
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- updated_at 자동 갱신 트리거
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger explanations_updated_at
  before update on explanations
  for each row execute function update_updated_at();

-- =============================================
-- RLS (Row Level Security)
-- =============================================
alter table books        enable row level security;
alter table problems     enable row level security;
alter table explanations enable row level security;

-- 학생: books, problems 읽기 허용
create policy "public read books"    on books        for select using (true);
create policy "public read problems" on problems     for select using (true);

-- 학생: explanations 읽기 허용 (AI context용, 직접 노출 X)
create policy "public read explanations" on explanations for select using (true);

-- 쓰기는 service_role(서버) 또는 authenticated 유저(교사) 만 허용
-- (실제 배포 시 auth.role() = 'authenticated' 조건 추가 권장)
create policy "authenticated insert books"        on books        for insert with check (true);
create policy "authenticated insert problems"     on problems     for insert with check (true);
create policy "authenticated insert explanations" on explanations for insert with check (true);
create policy "authenticated update explanations" on explanations for update using (true);
create policy "authenticated delete books"        on books        for delete using (true);
create policy "authenticated delete problems"     on problems     for delete using (true);
create policy "authenticated delete explanations" on explanations for delete using (true);

-- =============================================
-- 샘플 데이터 (초기 테스트용)
-- =============================================
insert into books (name) values
  ('개념원리 중3-1'),
  ('쎈 수학 중3-1'),
  ('일품 수학 중3-1'),
  ('최상위 수학 중3')
on conflict (name) do nothing;
