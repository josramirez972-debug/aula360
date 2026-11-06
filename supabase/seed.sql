-- ============================================================
-- AULA360: Seed Data for Testing & Demonstration
-- Matches Section 13 Specifications
-- ============================================================

-- Note: In Supabase production, users exist in auth.users.
-- This script inserts corresponding demo profiles, students, subjects, periods, grades, and validations.

-- 1. SCHOOL SETTINGS
INSERT INTO public.school_settings (id, school_name, min_grade, max_grade, passing_grade, active_year)
VALUES ('00000000-0000-0000-0000-000000000001', 'Colegio AULA360', 0.0, 5.0, 3.0, '2025')
ON CONFLICT (id) DO UPDATE SET school_name = EXCLUDED.school_name;

-- 2. ACADEMIC PERIODS
INSERT INTO public.academic_periods (id, name, academic_year, start_date, end_date, status)
VALUES
  ('11111111-1111-1111-1111-111111111101', 'Período 1', '2025', '2025-02-01', '2025-04-15', 'CLOSED'),
  ('11111111-1111-1111-1111-111111111102', 'Período 2', '2025', '2025-04-16', '2025-06-30', 'OPEN'),
  ('11111111-1111-1111-1111-111111111103', 'Período 3', '2025', '2025-07-15', '2025-09-30', 'OPEN'),
  ('11111111-1111-1111-1111-111111111104', 'Período 4', '2025', '2025-10-01', '2025-11-30', 'OPEN')
ON CONFLICT (id) DO NOTHING;

-- 3. SUBJECTS
INSERT INTO public.subjects (id, name, description, status)
VALUES
  ('22222222-2222-2222-2222-222222222201', 'Matemáticas', 'Aritmética, Álgebra y Razonamiento Lógico', 'ACTIVE'),
  ('22222222-2222-2222-2222-222222222202', 'Español', 'Lengua Castellana y Literatura', 'ACTIVE'),
  ('22222222-2222-2222-2222-222222222203', 'Ciencias Naturales', 'Biología, Física y Química Elemental', 'ACTIVE'),
  ('22222222-2222-2222-2222-222222222204', 'Inglés', 'Inglés como segunda lengua', 'ACTIVE'),
  ('22222222-2222-2222-2222-222222222205', 'Ciencias Sociales', 'Historia, Geografía y Competencias Ciudadanas', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 4. STUDENTS
INSERT INTO public.students (id, first_name, last_name, birth_date, grade, section, document_id, status)
VALUES
  ('33333333-3333-3333-3333-333333333301', 'Juan', 'Pérez', '2014-04-12', '6A', 'A', 'TI-1092837411', 'ACTIVE'),
  ('33333333-3333-3333-3333-333333333302', 'María', 'Gómez', '2015-08-23', '5A', 'A', 'TI-1092837412', 'ACTIVE'),
  ('33333333-3333-3333-3333-333333333303', 'Carlos', 'Rodríguez', '2013-11-05', '7A', 'A', 'TI-1092837413', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 5. STUDENT_SUBJECTS
INSERT INTO public.student_subjects (student_id, subject_id)
SELECT s.id, subj.id
FROM public.students s
CROSS JOIN public.subjects subj
ON CONFLICT (student_id, subject_id) DO NOTHING;

-- 6. STUDENT_PERIODS & STUDENT_PERIOD_VERSIONS
INSERT INTO public.student_periods (student_id, period_id, current_version)
SELECT s.id, p.id, 1
FROM public.students s
CROSS JOIN public.academic_periods p
ON CONFLICT (student_id, period_id) DO NOTHING;

INSERT INTO public.student_period_versions (student_id, period_id, current_version)
SELECT s.id, p.id, 1
FROM public.students s
CROSS JOIN public.academic_periods p
ON CONFLICT (student_id, period_id) DO NOTHING;

-- 7. TEST PROFILES (PHASE 6 QA SPECIFICATIONS)
-- In Supabase production, these correspond to auth.users created via Supabase Auth Admin API
INSERT INTO public.profiles (id, full_name, email, phone, role)
VALUES
  ('00000000-0000-0000-0000-000000000010', 'Profesor Demo', 'teacher.demo@aula360.test', '+57 300 123 4567', 'TEACHER'),
  ('00000000-0000-0000-0000-000000000021', 'Padre 1 Demo', 'padre1.demo@aula360.test', '+57 310 987 6543', 'PARENT'),
  ('00000000-0000-0000-0000-000000000022', 'Padre 2 Demo', 'padre2.demo@aula360.test', '+57 315 456 7890', 'PARENT')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, role = EXCLUDED.role;

-- 8. STRICT 1:1 PARENT-STUDENT ASSOCIATIONS
-- Padre 1 -> Juan Pérez (33333333-3333-3333-3333-333333333301)
-- Padre 2 -> María Gómez (33333333-3333-3333-3333-333333333302)
INSERT INTO public.parent_students (id, parent_id, student_id, relationship_type)
VALUES
  ('44444444-4444-4444-4444-444444444401', '00000000-0000-0000-0000-000000000021', '33333333-3333-3333-3333-333333333301', 'Padre'),
  ('44444444-4444-4444-4444-444444444402', '00000000-0000-0000-0000-000000000022', '33333333-3333-3333-3333-333333333302', 'Madre')
ON CONFLICT (parent_id) DO NOTHING;
