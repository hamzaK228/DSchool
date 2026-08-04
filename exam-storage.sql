-- Storage policies for exam images bucket
-- Run in Supabase SQL Editor after creating "exam-images" bucket in Storage dashboard

drop policy if exists "authenticated users upload exam images" on storage.objects;
drop policy if exists "authenticated users read exam images" on storage.objects;

create policy "authenticated users upload exam images" on storage.objects
  for insert with check (
    bucket_id = 'exam-images'
    and auth.role() = 'authenticated'
  );

create policy "authenticated users read exam images" on storage.objects
  for select using (
    bucket_id = 'exam-images'
    and auth.role() = 'authenticated'
  );