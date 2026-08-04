-- ============================================================
-- Exams Schema — run me in Supabase SQL Editor
-- ============================================================

-- 1. EXAMS TABLE (if not exists)
CREATE TABLE IF NOT EXISTS exams (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  title text not null,
  questions jsonb not null default '[]',
  time_limit_minutes int,
  visible_from timestamptz default now(),
  closes_at timestamptz,
  created_at timestamptz default now()
);

-- 2. EXAM SUBMISSIONS
CREATE TABLE IF NOT EXISTS exam_submissions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references exams(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  answers jsonb not null default '[]',
  score int default 0,
  total int default 0,
  submitted_at timestamptz default now(),
  unique(exam_id, student_id)
);

-- RLS for exams
alter table exams enable row level security;
alter table exam_submissions enable row level security;

drop policy if exists "students read exams" on exams;
drop policy if exists "teacher manages exams" on exams;

create policy "students read exams" on exams for select using (
  class_id = (select class_id from profiles where id = auth.uid())
);
create policy "teacher manages exams" on exams for all using (
  class_id in (select id from classes where teacher_id = auth.uid())
);

drop policy if exists "students manage exam_submissions" on exam_submissions;
drop policy if exists "teacher reads exam_submissions" on exam_submissions;

create policy "students manage exam_submissions" on exam_submissions for all using (
  student_id = auth.uid()
);
create policy "teacher reads exam_submissions" on exam_submissions for select using (
  exam_id in (
    select e.id from exams e
    join classes c on c.id = e.class_id
    where c.teacher_id = auth.uid()
  )
);