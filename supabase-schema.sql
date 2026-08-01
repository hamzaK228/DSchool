-- ============================================================
-- School Portal — Supabase Schema
-- Run this SQL in the Supabase SQL Editor in order
-- ============================================================

-- 1. CLASSES
CREATE TABLE IF NOT EXISTS classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  teacher_id uuid not null references auth.users(id),
  join_code text not null unique,
  created_at timestamptz default now()
);

-- 2. PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('teacher','student')),
  class_id uuid references classes(id),
  created_at timestamptz default now()
);

-- 3. HOMEWORK
CREATE TABLE IF NOT EXISTS homework (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id),
  title text not null,
  description text,
  due_date date,
  attachment_url text,
  created_at timestamptz default now()
);

-- 4. ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS announcements (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id),
  title text not null,
  body text not null,
  created_at timestamptz default now()
);

-- 5. SURVEYS
CREATE TABLE IF NOT EXISTS surveys (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id),
  question text not null,
  options jsonb not null,
  closes_at timestamptz,
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS survey_responses (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references surveys(id),
  student_id uuid not null references profiles(id),
  answer text not null,
  created_at timestamptz default now(),
  unique(survey_id, student_id)
);

-- 6. SUBMISSIONS
CREATE TABLE IF NOT EXISTS submissions (
  id uuid primary key default gen_random_uuid(),
  homework_id uuid not null references homework(id),
  student_id uuid not null references profiles(id),
  submission_type text not null check (submission_type in ('photo','text')),
  file_urls text[],
  text_content text,
  ai_check_label text check (ai_check_label in ('low','medium','high')),
  ai_check_notes text,
  teacher_reviewed boolean default false,
  grade text,
  submitted_at timestamptz default now(),
  unique(homework_id, student_id)
);

-- 7. MESSAGES
CREATE TABLE IF NOT EXISTS messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references profiles(id),
  receiver_id uuid not null references profiles(id),
  class_id uuid not null references classes(id),
  body text not null,
  read_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table classes enable row level security;
alter table profiles enable row level security;
alter table homework enable row level security;
alter table announcements enable row level security;
alter table surveys enable row level security;
alter table survey_responses enable row level security;
alter table submissions enable row level security;
alter table messages enable row level security;

-- classes: teacher can create/read their own class
create policy "teachers create own class" on classes for insert with check (teacher_id = auth.uid());
create policy "teachers read own class" on classes for select using (teacher_id = auth.uid());
create policy "students read own class" on classes for select using (true);

-- profiles: users can read their own row
create policy "read own profile" on profiles for select using (id = auth.uid());

-- profiles: teacher reads class profiles (non-recursive)
create policy "teacher reads class profiles" on profiles for select using (
  (select role from profiles where id = auth.uid()) = 'teacher'
);

-- homework: students read their class's homework
create policy "students read homework" on homework for select using (
  class_id = (select class_id from profiles where id = auth.uid())
);

-- homework: teacher manages their class's homework
create policy "teacher manages homework" on homework for all using (
  class_id in (select id from classes where teacher_id = auth.uid())
);

-- announcements: students read their class's announcements
create policy "students read announcements" on announcements for select using (
  class_id = (select class_id from profiles where id = auth.uid())
);

-- announcements: teacher manages their class's announcements
create policy "teacher manages announcements" on announcements for all using (
  class_id in (select id from classes where teacher_id = auth.uid())
);

-- surveys: students read their class's surveys
create policy "students read surveys" on surveys for select using (
  class_id = (select class_id from profiles where id = auth.uid())
);

-- surveys: teacher manages their class's surveys
create policy "teacher manages surveys" on surveys for all using (
  class_id in (select id from classes where teacher_id = auth.uid())
);

-- survey_responses: students read their class's responses
create policy "students read responses" on survey_responses for select using (
  survey_id in (select id from surveys where class_id = (select class_id from profiles where id = auth.uid()))
);

-- survey_responses: students insert their own responses
create policy "students insert own response" on survey_responses for insert with check (
  student_id = auth.uid()
);

-- survey_responses: teacher reads/manages all responses in class
create policy "teacher manages responses" on survey_responses for all using (
  survey_id in (
    select s.id from surveys s
    join classes c on c.id = s.class_id
    where c.teacher_id = auth.uid()
  )
);

-- submissions: student can insert/read only their own
create policy "student manages own submission" on submissions for all using (
  student_id = auth.uid()
);

-- submissions: teacher can read/update all in their class
create policy "teacher reviews class submissions" on submissions for all using (
  homework_id in (
    select h.id from homework h
    join classes c on c.id = h.class_id
    where c.teacher_id = auth.uid()
  )
);

-- messages: either party can read
create policy "participants read messages" on messages for select using (
  sender_id = auth.uid() or receiver_id = auth.uid()
);

-- messages: only sender can insert as themselves
create policy "send as self" on messages for insert with check (sender_id = auth.uid());

-- ============================================================
-- STORAGE BUCKET (run these in order)
-- ============================================================

-- After running the above, go to Storage in Supabase dashboard and:
-- 1. Create a bucket named "submissions"
-- 2. Set it to private (NOT public)

-- Then run this SQL to set storage policies:
/*
create policy "students upload submissions" on storage.objects
  for insert with check (
    bucket_id = 'submissions'
    and auth.role() = 'authenticated'
    and (select role from profiles where id = auth.uid()) = 'student'
  );

create policy "students read own submissions" on storage.objects
  for select using (
    bucket_id = 'submissions'
    and auth.role() = 'authenticated'
  );

create policy "teacher reads submissions" on storage.objects
  for select using (
    bucket_id = 'submissions'
    and auth.role() = 'authenticated'
    and (select role from profiles where id = auth.uid()) = 'teacher'
  );
*/