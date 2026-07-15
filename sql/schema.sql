-- ============================================================
-- Tuition Center Portal — Supabase schema
-- Run this whole file once in Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. PROFILES (extends Supabase Auth users with role/name/etc.)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','teacher','student')),
  name text not null,
  phone text,
  subject text,           -- used for teachers
  grade text,              -- used for students
  teacher_id uuid references profiles(id), -- used for students, points to their teacher
  created_at timestamptz default now()
);

-- 2. CLASSES
create table classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references profiles(id) not null,
  subject text not null,
  room_name text not null,   -- Jitsi room name
  schedule text,
  created_at timestamptz default now()
);

-- 3. ATTENDANCE
create table attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles(id) not null,
  class_id uuid references classes(id) not null,
  status text not null check (status in ('present','absent')),
  date date not null default current_date,
  created_at timestamptz default now()
);

-- 4. HOMEWORK
create table homework (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references classes(id) not null,
  teacher_id uuid references profiles(id) not null,
  title text not null,
  description text,
  due_date date,
  posted_at timestamptz default now()
);

-- ============================================================
-- Helper function: get current user's role without RLS recursion
-- ============================================================
create or replace function get_my_role() returns text as $$
  select role from profiles where id = auth.uid();
$$ language sql security definer stable;

create or replace function get_my_teacher_id() returns uuid as $$
  select teacher_id from profiles where id = auth.uid();
$$ language sql security definer stable;

-- ============================================================
-- Enable RLS
-- ============================================================
alter table profiles enable row level security;
alter table classes enable row level security;
alter table attendance enable row level security;
alter table homework enable row level security;

-- ============================================================
-- PROFILES policies
-- ============================================================
create policy "profiles_select" on profiles for select using (
  id = auth.uid()                                  -- yourself
  or get_my_role() = 'admin'                        -- admin sees everyone
  or teacher_id = auth.uid()                        -- teacher sees their students
  or id = get_my_teacher_id()                        -- student sees their teacher
);

create policy "profiles_insert_admin" on profiles for insert with check (
  get_my_role() = 'admin'
);

create policy "profiles_update" on profiles for update using (
  id = auth.uid() or get_my_role() = 'admin'
);

create policy "profiles_delete_admin" on profiles for delete using (
  get_my_role() = 'admin'
);

-- ============================================================
-- CLASSES policies
-- ============================================================
create policy "classes_select" on classes for select using (
  get_my_role() = 'admin'
  or teacher_id = auth.uid()
  or teacher_id = get_my_teacher_id()
);

create policy "classes_insert" on classes for insert with check (
  get_my_role() = 'admin' or teacher_id = auth.uid()
);

create policy "classes_update" on classes for update using (
  get_my_role() = 'admin' or teacher_id = auth.uid()
);

create policy "classes_delete" on classes for delete using (
  get_my_role() = 'admin' or teacher_id = auth.uid()
);

-- ============================================================
-- ATTENDANCE policies
-- ============================================================
create policy "attendance_select" on attendance for select using (
  get_my_role() = 'admin'
  or student_id = auth.uid()
  or class_id in (select id from classes where teacher_id = auth.uid())
);

create policy "attendance_insert" on attendance for insert with check (
  get_my_role() = 'admin'
  or class_id in (select id from classes where teacher_id = auth.uid())
);

-- ============================================================
-- HOMEWORK policies
-- ============================================================
create policy "homework_select" on homework for select using (
  get_my_role() = 'admin'
  or teacher_id = auth.uid()
  or class_id in (select id from classes where teacher_id = get_my_teacher_id())
);

create policy "homework_insert" on homework for insert with check (
  get_my_role() = 'admin' or teacher_id = auth.uid()
);

-- ============================================================
-- SEED: create your first admin manually after this script runs:
-- 1. Go to Authentication > Users > Add User (email + password)
-- 2. Copy that user's UUID
-- 3. Run:
--    insert into profiles (id, role, name) values ('<uuid-here>', 'admin', 'Admin Name');
-- ============================================================
