-- Security and performance hardening for MedVault.
-- Keep public access disabled; authenticated access is controlled by RLS.

revoke all on table public.profiles, public.documents, public.prescriptions, public.cycle_entries from anon;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.documents to authenticated;
grant select, insert, update, delete on public.prescriptions to authenticated;
grant select, insert, update, delete on public.cycle_entries to authenticated;

create index if not exists documents_user_id_idx on public.documents (user_id);
create index if not exists prescriptions_user_id_idx on public.prescriptions (user_id);
create index if not exists cycle_entries_user_id_idx on public.cycle_entries (user_id);
