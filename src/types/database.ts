export type UserRole = 'TEACHER' | 'PARENT';

export type StudentStatus = 'ACTIVE' | 'INACTIVE';
export type PeriodStatus = 'OPEN' | 'CLOSED';

// Dynamic Validation Status matching architectural section 5
export type ValidationComputedStatus = 'PENDING' | 'VALIDATED' | 'REVISION_REQUIRED';

export type ObservationType = 
  | 'GENERAL' 
  | 'SUBJECT' 
  | 'BEHAVIOR' 
  | 'ACADEMIC' 
  | 'PARTICIPATION';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: UserRole;
  created_at: string;
  updated_at?: string;
}

export interface Student {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  grade: string;
  section: string;
  document_id?: string;
  status: StudentStatus;
  created_at: string;
  updated_at?: string;
}

// 1:1 Strict relationship: one representative to one student
export interface ParentStudent {
  id: string;
  parent_id: string;
  student_id: string;
  relationship_type?: string;
  created_at: string;
}

export interface Subject {
  id: string;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
}

export interface StudentSubject {
  id: string;
  student_id: string;
  subject_id: string;
  enrolled_at: string;
}

export interface AcademicPeriod {
  id: string;
  name: string;
  academic_year: string;
  start_date: string;
  end_date: string;
  status: PeriodStatus;
  created_at: string;
}

// Academic Versioning tables (Section 5)
export interface StudentPeriod {
  id: string;
  student_id: string;
  period_id: string;
  current_version: number;
  created_at: string;
  updated_at: string;
}

export interface StudentPeriodVersion {
  id: string;
  student_id: string;
  period_id: string;
  current_version: number;
  updated_at: string;
}

export interface Grade {
  id: string;
  student_id: string;
  subject_id: string;
  period_id: string;
  grade: number; // PostgreSQL NUMERIC(3, 2)
  observation?: string;
  teacher_id?: string;
  created_at: string;
  updated_at: string;
}

// Evaluación parcial / sub-evaluación por período y materia
export interface StudentEvaluation {
  id: string;
  student_id: string;
  subject_id: string;
  period_id: string;
  title: string; // ej. "Evaluación 1"
  description: string; // "De qué trató": tema o actividad evaluada
  score: number; // NUMERIC(3, 2) [0.00 a 5.00]
  observation?: string; // Observación específica del docente
  evaluation_date: string; // YYYY-MM-DD
  created_at: string;
  updated_at: string;
}

export interface Observation {
  id: string;
  student_id: string;
  period_id: string;
  subject_id?: string;
  observation_type: ObservationType;
  content: string;
  teacher_id?: string;
  created_at: string;
}

// Historical Validation with Version Review (Section 5)
export interface GradeValidation {
  id: string;
  student_id: string;
  period_id: string;
  parent_id: string;
  version_reviewed: number;
  validated_at: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_value?: unknown;
  new_value?: unknown;
  created_at: string;
}

export interface SchoolSettings {
  id: string;
  school_name: string;
  logo_url?: string;
  teacher_name: string;
  institutional_email: string;
  phone?: string;
  active_year: string;
  min_grade: number;
  max_grade: number;
  passing_grade: number;
  updated_at: string;
}
