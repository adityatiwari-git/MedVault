-- MedVault database schema for Supabase.
-- All application records belong to the authenticated user.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  age integer,
  gender text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  storage_path text,
  category text,
  uploaded_at timestamptz not null default now(),
  ai_summary text,
  notes text,
  has_file boolean not null default false,
  file_type text,
  file_size bigint
);

create table if not exists public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  medicine_name text not null,
  dosage text,
  frequency text,
  reminder_enabled boolean not null default false,
  start_date date,
  end_date date,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.cycle_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period_start_date date not null,
  period_end_date date,
  notes text,
  ai_prediction text,
  flow_intensity text,
  symptoms text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, age, gender)
  values (
    new.id,
    new.raw_user_meta_data ->> 'name',
    nullif(new.raw_user_meta_data ->> 'age', '')::integer,
    new.raw_user_meta_data ->> 'gender'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.documents enable row level security;
alter table public.prescriptions enable row level security;
alter table public.cycle_entries enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can view own documents" on public.documents;
create policy "Users can view own documents"
  on public.documents for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own documents" on public.documents;
create policy "Users can insert own documents"
  on public.documents for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own documents" on public.documents;
create policy "Users can update own documents"
  on public.documents for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own documents" on public.documents;
create policy "Users can delete own documents"
  on public.documents for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can view own prescriptions" on public.prescriptions;
create policy "Users can view own prescriptions"
  on public.prescriptions for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own prescriptions" on public.prescriptions;
create policy "Users can insert own prescriptions"
  on public.prescriptions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own prescriptions" on public.prescriptions;
create policy "Users can update own prescriptions"
  on public.prescriptions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own prescriptions" on public.prescriptions;
create policy "Users can delete own prescriptions"
  on public.prescriptions for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can view own cycle entries" on public.cycle_entries;
create policy "Users can view own cycle entries"
  on public.cycle_entries for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own cycle entries" on public.cycle_entries;
create policy "Users can insert own cycle entries"
  on public.cycle_entries for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own cycle entries" on public.cycle_entries;
create policy "Users can update own cycle entries"
  on public.cycle_entries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own cycle entries" on public.cycle_entries;
create policy "Users can delete own cycle entries"
  on public.cycle_entries for delete
  using (auth.uid() = user_id);
