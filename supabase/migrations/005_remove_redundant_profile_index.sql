-- The primary key on profiles already provides the required index.
drop index if exists public.profiles_id_idx;
