-- Drop old policies if they exist (from previous runs)
drop policy if exists "students upload submissions" on storage.objects;
drop policy if exists "students read own submissions" on storage.objects;
drop policy if exists "teacher reads submissions" on storage.objects;

-- Create new policies for bucket "School"
create policy "students upload submissions" on storage.objects
  for insert with check (
    bucket_id = 'School'
    and auth.role() = 'authenticated'
    and (select role from profiles where id = auth.uid()) = 'student'
  );

create policy "students read own submissions" on storage.objects
  for select using (
    bucket_id = 'School'
    and auth.role() = 'authenticated'
  );

create policy "teacher reads submissions" on storage.objects
  for select using (
    bucket_id = 'School'
    and auth.role() = 'authenticated'
    and (select role from profiles where id = auth.uid()) = 'teacher'
  );