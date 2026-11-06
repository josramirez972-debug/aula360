-- ==============================================================================
-- AULA360 — DEFINICIÓN ARQUITECTÓNICA DEFINITIVA (PostgreSQL + Supabase Schema)
-- Aplicación escolar mono-institución, mono-docente, relación estricta 1:1 representante-estudiante,
-- Escala NUMERIC(3,2) y Control de Versiones Académicas para Validaciones.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. INSTITUTIONAL SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.school_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_name TEXT NOT NULL DEFAULT 'Colegio AULA360',
  logo_url TEXT,
  teacher_name TEXT NOT NULL DEFAULT 'Profesor Demo',
  institutional_email TEXT NOT NULL DEFAULT 'profesor@aula360.edu',
  phone TEXT DEFAULT '+57 300 123 4567',
  active_year TEXT NOT NULL DEFAULT '2025',
  min_grade NUMERIC(3, 2) NOT NULL DEFAULT 0.00 CHECK (min_grade >= 0.00),
  max_grade NUMERIC(3, 2) NOT NULL DEFAULT 5.00 CHECK (max_grade > min_grade),
  passing_grade NUMERIC(3, 2) NOT NULL DEFAULT 3.00 CHECK (passing_grade >= min_grade AND passing_grade <= max_grade),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. USER PROFILES TABLE (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('TEACHER', 'PARENT')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. STUDENTS TABLE
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  grade TEXT NOT NULL,
  section TEXT DEFAULT 'A',
  document_id TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. PARENT_STUDENTS (STRICT 1:1 RELATIONSHIP)
-- Un representante está vinculado a un único estudiante.
-- Un estudiante tiene un único representante.
CREATE TABLE IF NOT EXISTS public.parent_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL UNIQUE REFERENCES public.students(id) ON DELETE CASCADE,
  relationship_type TEXT DEFAULT 'Representante Legal',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. SUBJECTS TABLE
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5.1 STUDENT_SUBJECTS TABLE (Enrolment / Matriculación Asignaturas)
CREATE TABLE IF NOT EXISTS public.student_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(student_id, subject_id)
);

-- 6. ACADEMIC PERIODS TABLE (Exactamente 4 períodos configurables)
CREATE TABLE IF NOT EXISTS public.academic_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  academic_year TEXT NOT NULL DEFAULT '2025',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT valid_period_dates CHECK (end_date >= start_date)
);

-- 7. STUDENT_PERIODS & STUDENT_PERIOD_VERSIONS (Control de Versiones Académicas)
-- Cada vez que el docente altere una calificación u observación, se incrementa la versión.
CREATE TABLE IF NOT EXISTS public.student_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  period_id UUID NOT NULL REFERENCES public.academic_periods(id) ON DELETE CASCADE,
  current_version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(student_id, period_id)
);

CREATE TABLE IF NOT EXISTS public.student_period_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  period_id UUID NOT NULL REFERENCES public.academic_periods(id) ON DELETE CASCADE,
  current_version INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(student_id, period_id)
);

-- 8. GRADES TABLE (NUMERIC 3,2: 0.00 a 5.00)
CREATE TABLE IF NOT EXISTS public.grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  period_id UUID NOT NULL REFERENCES public.academic_periods(id) ON DELETE CASCADE,
  grade NUMERIC(3, 2) NOT NULL CHECK (grade >= 0.00 AND grade <= 5.00),
  observation TEXT,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(student_id, subject_id, period_id)
);

-- 8.1 STUDENT_EVALUATIONS TABLE (Evaluaciones Parciales por Período y Materia)
CREATE TABLE IF NOT EXISTS public.student_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  period_id UUID NOT NULL REFERENCES public.academic_periods(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  score NUMERIC(3, 2) NOT NULL CHECK (score >= 0.00 AND score <= 5.00),
  observation TEXT,
  evaluation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. OBSERVATIONS TABLE
CREATE TABLE IF NOT EXISTS public.observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  period_id UUID NOT NULL REFERENCES public.academic_periods(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  observation_type TEXT NOT NULL CHECK (observation_type IN ('GENERAL', 'SUBJECT', 'BEHAVIOR', 'ACADEMIC', 'PARTICIPATION')),
  content TEXT NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. GRADE_VALIDATIONS TABLE (Historical Validations with Version Review)
CREATE TABLE IF NOT EXISTS public.grade_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  period_id UUID NOT NULL REFERENCES public.academic_periods(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  version_reviewed INT NOT NULL,
  validated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(student_id, period_id, parent_id, version_reviewed)
);

-- 11. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- PERFORMANCE INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_parent_students_parent ON public.parent_students(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_students_student ON public.parent_students(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_lookup ON public.grades(student_id, period_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_student_evaluations_lookup ON public.student_evaluations(student_id, period_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_observations_lookup ON public.observations(student_id, period_id);
CREATE INDEX IF NOT EXISTS idx_validations_lookup ON public.grade_validations(student_id, period_id, parent_id);
CREATE INDEX IF NOT EXISTS idx_sp_versions_lookup ON public.student_period_versions(student_id, period_id);

-- ==============================================================================
-- SECURITY FUNCTIONS (SECURITY DEFINER WITH FIXED SEARCH_PATH)
-- ==============================================================================

-- Check if current authenticated user is Teacher
CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'TEACHER'
  );
$$;

-- Check if current authenticated user is the assigned parent of given student
CREATE OR REPLACE FUNCTION public.is_parent_of(target_student_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.parent_students
    WHERE parent_id = auth.uid()
      AND student_id = target_student_id
  );
$$;

-- ==============================================================================
-- TRIGGERS: ACADEMIC VERSION CONTROL & PERIOD CLOSURE PROTECTION
-- ==============================================================================

-- 1. Prevent modification in CLOSED periods
CREATE OR REPLACE FUNCTION public.check_period_open_for_grade()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_period_status TEXT;
BEGIN
  SELECT status INTO v_period_status FROM public.academic_periods WHERE id = NEW.period_id;
  IF v_period_status = 'CLOSED' THEN
    RAISE EXCEPTION 'Operación rechazada: El período académico se encuentra CERRADO.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_check_period_open ON public.grades;
CREATE TRIGGER trigger_check_period_open
BEFORE INSERT OR UPDATE ON public.grades
FOR EACH ROW EXECUTE FUNCTION public.check_period_open_for_grade();

DROP TRIGGER IF EXISTS trigger_check_period_open_obs ON public.observations;
CREATE TRIGGER trigger_check_period_open_obs
BEFORE INSERT OR UPDATE ON public.observations
FOR EACH ROW EXECUTE FUNCTION public.check_period_open_for_grade();

DROP TRIGGER IF EXISTS trigger_check_period_open_eval ON public.student_evaluations;
CREATE TRIGGER trigger_check_period_open_eval
BEFORE INSERT OR UPDATE ON public.student_evaluations
FOR EACH ROW EXECUTE FUNCTION public.check_period_open_for_grade();

-- 2. Increment academic version on grade modification
CREATE OR REPLACE FUNCTION public.increment_academic_version_on_grade_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert or increment student_period_version & student_periods
  INSERT INTO public.student_period_versions (student_id, period_id, current_version, updated_at)
  VALUES (NEW.student_id, NEW.period_id, 1, timezone('utc'::text, now()))
  ON CONFLICT (student_id, period_id)
  DO UPDATE SET
    current_version = public.student_period_versions.current_version + 1,
    updated_at = timezone('utc'::text, now());

  INSERT INTO public.student_periods (student_id, period_id, current_version, updated_at)
  VALUES (NEW.student_id, NEW.period_id, 1, timezone('utc'::text, now()))
  ON CONFLICT (student_id, period_id)
  DO UPDATE SET
    current_version = public.student_periods.current_version + 1,
    updated_at = timezone('utc'::text, now());

  -- Audit log entry
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, old_value, new_value)
  VALUES (
    auth.uid(),
    TG_OP,
    'GRADE',
    NEW.id::text,
    CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
    to_jsonb(NEW)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_grade_version_increment ON public.grades;
CREATE TRIGGER trigger_grade_version_increment
AFTER INSERT OR UPDATE ON public.grades
FOR EACH ROW EXECUTE FUNCTION public.increment_academic_version_on_grade_change();

DROP TRIGGER IF EXISTS trigger_evaluation_version_increment ON public.student_evaluations;
CREATE TRIGGER trigger_evaluation_version_increment
AFTER INSERT OR UPDATE ON public.student_evaluations
FOR EACH ROW EXECUTE FUNCTION public.increment_academic_version_on_grade_change();

-- 3. Increment academic version on observation change
CREATE OR REPLACE FUNCTION public.increment_academic_version_on_observation_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.student_period_versions (student_id, period_id, current_version, updated_at)
  VALUES (NEW.student_id, NEW.period_id, 1, timezone('utc'::text, now()))
  ON CONFLICT (student_id, period_id)
  DO UPDATE SET
    current_version = public.student_period_versions.current_version + 1,
    updated_at = timezone('utc'::text, now());

  INSERT INTO public.student_periods (student_id, period_id, current_version, updated_at)
  VALUES (NEW.student_id, NEW.period_id, 1, timezone('utc'::text, now()))
  ON CONFLICT (student_id, period_id)
  DO UPDATE SET
    current_version = public.student_periods.current_version + 1,
    updated_at = timezone('utc'::text, now());

  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, old_value, new_value)
  VALUES (
    auth.uid(),
    TG_OP,
    'OBSERVATION',
    NEW.id::text,
    CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
    to_jsonb(NEW)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_observation_version_increment ON public.observations;
CREATE TRIGGER trigger_observation_version_increment
AFTER INSERT OR UPDATE ON public.observations
FOR EACH ROW EXECUTE FUNCTION public.increment_academic_version_on_observation_change();

-- 4. Auth User Profile Synchronization Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'PARENT'),
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    phone = EXCLUDED.phone;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_period_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. SCHOOL SETTINGS
CREATE POLICY "Anyone authenticated can view school settings"
  ON public.school_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teacher can update school settings"
  ON public.school_settings FOR ALL
  TO authenticated
  USING (public.is_teacher());

-- 2. PROFILES
CREATE POLICY "Teacher can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_teacher());

CREATE POLICY "User can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Teacher can manage profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.is_teacher());

-- 3. STUDENTS
CREATE POLICY "Teacher has full access to students"
  ON public.students FOR ALL
  TO authenticated
  USING (public.is_teacher());

CREATE POLICY "Parent can view only their single assigned student"
  ON public.students FOR SELECT
  TO authenticated
  USING (public.is_parent_of(id));

-- 4. PARENT_STUDENTS
CREATE POLICY "Teacher can manage parent_students relationships"
  ON public.parent_students FOR ALL
  TO authenticated
  USING (public.is_teacher());

CREATE POLICY "Parent can view own child relationship"
  ON public.parent_students FOR SELECT
  TO authenticated
  USING (parent_id = auth.uid());

-- 5. SUBJECTS
CREATE POLICY "Anyone authenticated can view subjects"
  ON public.subjects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teacher can manage subjects"
  ON public.subjects FOR ALL
  TO authenticated
  USING (public.is_teacher());

-- 5.1 STUDENT_SUBJECTS
CREATE POLICY "Teacher can manage student subjects"
  ON public.student_subjects FOR ALL
  TO authenticated
  USING (public.is_teacher());

CREATE POLICY "Parent can view student subjects for their student"
  ON public.student_subjects FOR SELECT
  TO authenticated
  USING (public.is_parent_of(student_id));

-- 6. ACADEMIC PERIODS
CREATE POLICY "Anyone authenticated can view academic periods"
  ON public.academic_periods FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teacher can manage academic periods"
  ON public.academic_periods FOR ALL
  TO authenticated
  USING (public.is_teacher());

-- 7. STUDENT_PERIOD_VERSIONS
CREATE POLICY "Teacher can view and manage versions"
  ON public.student_period_versions FOR ALL
  TO authenticated
  USING (public.is_teacher());

CREATE POLICY "Parent can view version of their single student"
  ON public.student_period_versions FOR SELECT
  TO authenticated
  USING (public.is_parent_of(student_id));

-- 7.1 STUDENT_PERIODS
CREATE POLICY "Teacher can view and manage student periods"
  ON public.student_periods FOR ALL
  TO authenticated
  USING (public.is_teacher());

CREATE POLICY "Parent can view student periods for their single student"
  ON public.student_periods FOR SELECT
  TO authenticated
  USING (public.is_parent_of(student_id));

-- 8. GRADES
CREATE POLICY "Teacher can manage grades"
  ON public.grades FOR ALL
  TO authenticated
  USING (public.is_teacher());

CREATE POLICY "Parent can view grades only for their single student"
  ON public.grades FOR SELECT
  TO authenticated
  USING (public.is_parent_of(student_id));

-- 8.1 STUDENT_EVALUATIONS
CREATE POLICY "Teacher can manage student evaluations"
  ON public.student_evaluations FOR ALL
  TO authenticated
  USING (public.is_teacher());

CREATE POLICY "Parent can view evaluations for their single student"
  ON public.student_evaluations FOR SELECT
  TO authenticated
  USING (public.is_parent_of(student_id));

-- 9. OBSERVATIONS
CREATE POLICY "Teacher can manage observations"
  ON public.observations FOR ALL
  TO authenticated
  USING (public.is_teacher());

CREATE POLICY "Parent can view observations only for their single student"
  ON public.observations FOR SELECT
  TO authenticated
  USING (public.is_parent_of(student_id));

-- 10. GRADE_VALIDATIONS
CREATE POLICY "Teacher can view all validations"
  ON public.grade_validations FOR SELECT
  TO authenticated
  USING (public.is_teacher());

CREATE POLICY "Parent can view own validations"
  ON public.grade_validations FOR SELECT
  TO authenticated
  USING (parent_id = auth.uid());

CREATE POLICY "Parent can insert own validation for their single student"
  ON public.grade_validations FOR INSERT
  TO authenticated
  WITH CHECK (
    parent_id = auth.uid()
    AND public.is_parent_of(student_id)
  );

-- 11. AUDIT_LOGS
CREATE POLICY "Teacher can view audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.is_teacher());
