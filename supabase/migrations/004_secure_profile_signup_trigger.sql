-- Harden the existing auth trigger for projects that already applied 001.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name, age, gender)
  values (
    new.id,
    new.raw_user_meta_data ->> 'name',
    nullif(new.raw_user_meta_data ->> 'age', '')::integer,
    new.raw_user_meta_data ->> 'gender'
  )
  on conflict (id) do update
    set name = excluded.name,
        age = excluded.age,
        gender = excluded.gender,
        updated_at = now();

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
