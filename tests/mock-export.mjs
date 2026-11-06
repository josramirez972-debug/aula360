export const INITIAL_PROFILES = [
  { id: 'prof-teacher-01', full_name: 'Profesor Demo', email: 'profesor@aula360.edu', role: 'TEACHER' },
  { id: 'prof-parent-01', full_name: 'Carlos Pérez', email: 'carlos.perez@padres.com', role: 'PARENT' },
  { id: 'prof-parent-02', full_name: 'Ana Gómez', email: 'ana.gomez@padres.com', role: 'PARENT' },
  { id: 'prof-parent-03', full_name: 'Laura Rodríguez', email: 'laura.rodriguez@padres.com', role: 'PARENT' },
];

export const INITIAL_STUDENTS = [
  { id: 'stud-001', first_name: 'Juan', last_name: 'Pérez', grade: '6A' },
  { id: 'stud-002', first_name: 'María', last_name: 'Gómez', grade: '5A' },
  { id: 'stud-003', first_name: 'Carlos', last_name: 'Rodríguez', grade: '7A' },
];

export const INITIAL_PARENT_STUDENTS = [
  { parent_id: 'prof-parent-01', student_id: 'stud-001' },
  { parent_id: 'prof-parent-02', student_id: 'stud-002' },
  { parent_id: 'prof-parent-03', student_id: 'stud-003' },
];

export const INITIAL_PERIODS = [
  { id: 'per-001', name: 'Período 1', status: 'CLOSED' },
  { id: 'per-002', name: 'Período 2', status: 'OPEN' },
  { id: 'per-003', name: 'Período 3', status: 'OPEN' },
  { id: 'per-004', name: 'Período 4', status: 'OPEN' },
];

export const INITIAL_STUDENT_PERIOD_VERSIONS = [
  { student_id: 'stud-001', period_id: 'per-001', current_version: 1 },
  { student_id: 'stud-003', period_id: 'per-001', current_version: 2 },
];

export const INITIAL_VALIDATIONS = [
  { student_id: 'stud-001', period_id: 'per-001', parent_id: 'prof-parent-01', version_reviewed: 1 },
  { student_id: 'stud-003', period_id: 'per-001', parent_id: 'prof-parent-03', version_reviewed: 1 },
];

export const INITIAL_GRADES = [
  { id: 'grd-001', student_id: 'stud-001', subject_id: 'subj-001', period_id: 'per-001', grade: 4.50 },
  { id: 'grd-002', student_id: 'stud-001', subject_id: 'subj-002', period_id: 'per-001', grade: 4.00 },
  { id: 'grd-003', student_id: 'stud-001', subject_id: 'subj-003', period_id: 'per-001', grade: 3.80 },
  { id: 'grd-004', student_id: 'stud-001', subject_id: 'subj-004', period_id: 'per-001', grade: 4.60 },
  { id: 'grd-005', student_id: 'stud-001', subject_id: 'subj-005', period_id: 'per-001', grade: 4.20 },
  { id: 'grd-006', student_id: 'stud-002', subject_id: 'subj-001', period_id: 'per-001', grade: 4.80 },
];

export const INITIAL_OBSERVATIONS = [
  { id: 'obs-001', student_id: 'stud-001', period_id: 'per-001', observation_type: 'ACADEMIC', content: 'Excelente rendimiento' },
  { id: 'obs-002', student_id: 'stud-002', period_id: 'per-001', observation_type: 'GENERAL', content: 'Participación activa' },
];

export const INITIAL_AUDIT_LOGS = [
  { action: 'INSERT', entity_type: 'GRADE' },
  { action: 'VALIDATE_VERSION', entity_type: 'GRADE_VALIDATION' },
];

export const INITIAL_SETTINGS = {
  school_name: 'Colegio AULA360',
  teacher_name: 'Profesor Demo',
  active_year: '2025',
};
