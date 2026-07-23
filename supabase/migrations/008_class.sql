-- user_profiles에 반 추가
alter table user_profiles add column if not exists class_name text;

-- assignments에 반 추가 (null = 전체반)
alter table assignments add column if not exists class_name text;

-- 트리거 업데이트: class_name도 저장
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, name, age, school, grade, class_name)
  values (
    new.id,
    new.raw_user_meta_data ->> 'name',
    (new.raw_user_meta_data ->> 'age')::integer,
    new.raw_user_meta_data ->> 'school',
    new.raw_user_meta_data ->> 'grade',
    new.raw_user_meta_data ->> 'class_name'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;
