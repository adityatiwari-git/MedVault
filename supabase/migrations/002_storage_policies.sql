insert into storage.buckets (id, name, public)
values ('medical-documents', 'medical-documents', false)
on conflict (id) do update set public = false;

drop policy if exists "Users can upload own medical documents" on storage.objects;
create policy "Users can upload own medical documents"
Users can upload own medical documents"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'medical-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can upload own medical documents" on storage.objects;
create policy "Users can upload own medical documents"
Users can read own medical documents"
on storage.objects for select to authenticated
using (
  bucket_id = 'medical-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can upload own medical documents" on storage.objects;
create policy "Users can upload own medical documents"
Users can update own medical documents"
on storage.objects for update to authenticated
using (
  bucket_id = 'medical-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'medical-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can upload own medical documents" on storage.objects;
create policy "Users can upload own medical documents"
Users can delete own medical documents"
on storage.objects for delete to authenticated
using (
  bucket_id = 'medical-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);
