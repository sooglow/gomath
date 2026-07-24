-- solution-pages 버킷 (비공개)
insert into storage.buckets (id, name, public)
values ('solution-pages', 'solution-pages', false)
on conflict (id) do nothing;

-- 해설 PDF 청크 테이블
create table if not exists solution_chunks (
  id         uuid primary key default gen_random_uuid(),
  book_id    uuid references books(id) on delete cascade not null,
  storage_path text not null,
  page_start int not null,
  page_end   int not null,
  created_at timestamptz default now()
);

alter table solution_chunks enable row level security;
drop policy if exists "all access solution_chunks" on solution_chunks;
create policy "all access solution_chunks" on solution_chunks
  using (true) with check (true);

-- problems 에 해설 페이지 번호 추가
alter table problems add column if not exists solution_page int;

-- storage 정책
drop policy if exists "upload solution pages" on storage.objects;
create policy "upload solution pages" on storage.objects
  for insert with check (bucket_id = 'solution-pages');

drop policy if exists "read solution pages" on storage.objects;
create policy "read solution pages" on storage.objects
  for select using (bucket_id = 'solution-pages');

drop policy if exists "delete solution pages" on storage.objects;
create policy "delete solution pages" on storage.objects
  for delete using (bucket_id = 'solution-pages');
