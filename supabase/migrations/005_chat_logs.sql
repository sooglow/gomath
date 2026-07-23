-- Storage bucket for student photos
insert into storage.buckets (id, name, public)
values ('student-photos', 'student-photos', true)
on conflict (id) do nothing;

drop policy if exists "public upload student photos" on storage.objects;
create policy "public upload student photos"
  on storage.objects for insert
  with check (bucket_id = 'student-photos');

drop policy if exists "public read student photos" on storage.objects;
create policy "public read student photos"
  on storage.objects for select
  using (bucket_id = 'student-photos');

-- Chat logs table
create table if not exists chat_logs (
  id           uuid default gen_random_uuid() primary key,
  problem_id   uuid references problems(id) on delete set null,
  message_type text not null check (message_type in ('image', 'text')),
  image_path   text,
  user_message text,
  ai_response  text,
  created_at   timestamptz default now()
);

alter table chat_logs enable row level security;
drop policy if exists "public insert chat_logs" on chat_logs;
drop policy if exists "public read chat_logs" on chat_logs;
create policy "public insert chat_logs" on chat_logs for insert with check (true);
create policy "public read chat_logs"   on chat_logs for select using (true);
