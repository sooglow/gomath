insert into storage.buckets (id, name, public)
values ('pdf-uploads', 'pdf-uploads', false)
on conflict (id) do nothing;

drop policy if exists "auth upload pdf" on storage.objects;
create policy "auth upload pdf"
  on storage.objects for insert
  with check (bucket_id = 'pdf-uploads');

drop policy if exists "auth delete pdf" on storage.objects;
create policy "auth delete pdf"
  on storage.objects for delete
  using (bucket_id = 'pdf-uploads');
