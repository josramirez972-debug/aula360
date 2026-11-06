import { 
  Profile, 
  Student, 
  ParentStudent, 
  Subject, 
  AcademicPeriod, 
  Grade, 
  Observation, 
  GradeValidation, 
  SchoolSettings,
  AuditLog,
  StudentPeriodVersion,
  StudentSubject,
  StudentEvaluation,
} from '@/types/database';

export const INITIAL_PROFILES: Profile[] = [
  {
    id: 'prof-teacher-01',
    full_name: 'Profesor Demo',
    email: 'teacher.demo@aula360.test',
    phone: '+57 300 123 4567',
    role: 'TEACHER',
    created_at: '2025-01-10T08:00:00Z',
  },
  {
    id: 'prof-parent-01',
    full_name: 'Padre 1 Demo (Carlos Pérez)',
    email: 'padre1.demo@aula360.test',
    phone: '+57 310 987 6543',
    role: 'PARENT',
    created_at: '2025-01-12T09:30:00Z',
  },
  {
    id: 'prof-parent-02',
    full_name: 'Padre 2 Demo (Ana Gómez)',
    email: 'padre2.demo@aula360.test',
    phone: '+57 315 456 7890',
    role: 'PARENT',
    created_at: '2025-01-12T10:15:00Z',
  },
  {
    id: 'prof-parent-03',
    full_name: 'Laura Rodríguez',
    email: 'laura.rodriguez@padres.com',
    phone: '+57 320 654 3210',
    role: 'PARENT',
    created_at: '2025-01-14T11:00:00Z',
  },
];

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'stud-001',
    first_name: 'Juan',
    last_name: 'Pérez',
    birth_date: '2014-04-12', // 11 años
    grade: '6A',
    section: 'A',
    document_id: 'TI-1092837411',
    status: 'ACTIVE',
    created_at: '2025-01-15T08:00:00Z',
  },
  {
    id: 'stud-002',
    first_name: 'María',
    last_name: 'Gómez',
    birth_date: '2015-08-23', // 10 años
    grade: '5A',
    section: 'A',
    document_id: 'TI-1092837412',
    status: 'ACTIVE',
    created_at: '2025-01-15T08:15:00Z',
  },
  {
    id: 'stud-003',
    first_name: 'Carlos',
    last_name: 'Rodríguez',
    birth_date: '2013-11-05', // 12 años
    grade: '7A',
    section: 'A',
    document_id: 'TI-1092837413',
    status: 'ACTIVE',
    created_at: '2025-01-15T08:30:00Z',
  },
];

// Strict 1:1 relationship between parent and student
export const INITIAL_PARENT_STUDENTS: ParentStudent[] = [
  {
    id: 'ps-001',
    parent_id: 'prof-parent-01',
    student_id: 'stud-001',
    relationship_type: 'Padre',
    created_at: '2025-01-15T08:45:00Z',
  },
  {
    id: 'ps-002',
    parent_id: 'prof-parent-02',
    student_id: 'stud-002',
    relationship_type: 'Madre',
    created_at: '2025-01-15T08:50:00Z',
  },
  {
    id: 'ps-003',
    parent_id: 'prof-parent-03',
    student_id: 'stud-003',
    relationship_type: 'Madre',
    created_at: '2025-01-15T08:55:00Z',
  },
];

export const INITIAL_SUBJECTS: Subject[] = [
  {
    id: 'subj-001',
    name: 'Matemáticas',
    description: 'Aritmética, Álgebra y Razonamiento Lógico',
    status: 'ACTIVE',
    created_at: '2025-01-10T09:00:00Z',
  },
  {
    id: 'subj-002',
    name: 'Español',
    description: 'Lengua Castellana, Comprensión Lectora y Literatura',
    status: 'ACTIVE',
    created_at: '2025-01-10T09:10:00Z',
  },
  {
    id: 'subj-003',
    name: 'Ciencias Naturales',
    description: 'Biología, Medio Ambiente y Ciencias Experimentales',
    status: 'ACTIVE',
    created_at: '2025-01-10T09:20:00Z',
  },
  {
    id: 'subj-004',
    name: 'Inglés',
    description: 'Habilidades de Comunicación Bilingüe A2-B1',
    status: 'ACTIVE',
    created_at: '2025-01-10T09:30:00Z',
  },
  {
    id: 'subj-005',
    name: 'Ciencias Sociales',
    description: 'Historia, Geografía y Convivencia Ciudadana',
    status: 'ACTIVE',
    created_at: '2025-01-10T09:40:00Z',
  },
];

// Student Subjects (Matriculaciones de Asignaturas)
export const INITIAL_STUDENT_SUBJECTS: StudentSubject[] = [
  // Juan Pérez (stud-001)
  { id: 'ss-101', student_id: 'stud-001', subject_id: 'subj-001', enrolled_at: '2025-01-20T08:00:00Z' },
  { id: 'ss-102', student_id: 'stud-001', subject_id: 'subj-002', enrolled_at: '2025-01-20T08:00:00Z' },
  { id: 'ss-103', student_id: 'stud-001', subject_id: 'subj-003', enrolled_at: '2025-01-20T08:00:00Z' },
  { id: 'ss-104', student_id: 'stud-001', subject_id: 'subj-004', enrolled_at: '2025-01-20T08:00:00Z' },
  { id: 'ss-105', student_id: 'stud-001', subject_id: 'subj-005', enrolled_at: '2025-01-20T08:00:00Z' },
  // María Gómez (stud-002)
  { id: 'ss-201', student_id: 'stud-002', subject_id: 'subj-001', enrolled_at: '2025-01-20T08:00:00Z' },
  { id: 'ss-202', student_id: 'stud-002', subject_id: 'subj-002', enrolled_at: '2025-01-20T08:00:00Z' },
  { id: 'ss-203', student_id: 'stud-002', subject_id: 'subj-003', enrolled_at: '2025-01-20T08:00:00Z' },
  { id: 'ss-204', student_id: 'stud-002', subject_id: 'subj-004', enrolled_at: '2025-01-20T08:00:00Z' },
  { id: 'ss-205', student_id: 'stud-002', subject_id: 'subj-005', enrolled_at: '2025-01-20T08:00:00Z' },
  // Carlos Rodríguez (stud-003)
  { id: 'ss-301', student_id: 'stud-003', subject_id: 'subj-001', enrolled_at: '2025-01-20T08:00:00Z' },
  { id: 'ss-302', student_id: 'stud-003', subject_id: 'subj-002', enrolled_at: '2025-01-20T08:00:00Z' },
  { id: 'ss-303', student_id: 'stud-003', subject_id: 'subj-003', enrolled_at: '2025-01-20T08:00:00Z' },
  { id: 'ss-304', student_id: 'stud-003', subject_id: 'subj-004', enrolled_at: '2025-01-20T08:00:00Z' },
  { id: 'ss-305', student_id: 'stud-003', subject_id: 'subj-005', enrolled_at: '2025-01-20T08:00:00Z' },
];

// Exactly 4 academic periods
export const INITIAL_PERIODS: AcademicPeriod[] = [
  {
    id: 'per-001',
    name: 'Período 1',
    academic_year: '2025',
    start_date: '2025-02-01',
    end_date: '2025-04-15',
    status: 'CLOSED',
    created_at: '2025-01-10T08:00:00Z',
  },
  {
    id: 'per-002',
    name: 'Período 2',
    academic_year: '2025',
    start_date: '2025-04-16',
    end_date: '2025-06-30',
    status: 'OPEN',
    created_at: '2025-01-10T08:05:00Z',
  },
  {
    id: 'per-003',
    name: 'Período 3',
    academic_year: '2025',
    start_date: '2025-07-15',
    end_date: '2025-09-30',
    status: 'OPEN',
    created_at: '2025-01-10T08:10:00Z',
  },
  {
    id: 'per-004',
    name: 'Período 4',
    academic_year: '2025',
    start_date: '2025-10-01',
    end_date: '2025-11-30',
    status: 'OPEN',
    created_at: '2025-01-10T08:15:00Z',
  },
];

// Academic Versions per Student and Period
export const INITIAL_STUDENT_PERIOD_VERSIONS: StudentPeriodVersion[] = [
  {
    id: 'spv-001',
    student_id: 'stud-001',
    period_id: 'per-001',
    current_version: 1,
    updated_at: '2025-03-24T10:30:00Z',
  },
  {
    id: 'spv-002',
    student_id: 'stud-001',
    period_id: 'per-002',
    current_version: 2,
    updated_at: '2025-05-12T11:00:00Z',
  },
  {
    id: 'spv-003',
    student_id: 'stud-002',
    period_id: 'per-001',
    current_version: 1,
    updated_at: '2025-03-21T11:30:00Z',
  },
  {
    id: 'spv-004',
    student_id: 'stud-003',
    period_id: 'per-001',
    current_version: 2, // Incremented version after update
    updated_at: '2025-04-15T09:00:00Z',
  },
];

// Grades with PostgreSQL NUMERIC(3, 2)
export const INITIAL_GRADES: Grade[] = [
  // Juan Pérez - Período 1
  {
    id: 'grd-001',
    student_id: 'stud-001',
    subject_id: 'subj-001',
    period_id: 'per-001',
    grade: 4.50,
    observation: 'Excelente razonamiento lógico en operaciones fraccionarias.',
    teacher_id: 'prof-teacher-01',
    created_at: '2025-03-20T10:00:00Z',
    updated_at: '2025-03-20T10:00:00Z',
  },
  {
    id: 'grd-002',
    student_id: 'stud-001',
    subject_id: 'subj-002',
    period_id: 'per-001',
    grade: 4.00,
    observation: 'Buen desempeño en redacción de textos narrativos.',
    teacher_id: 'prof-teacher-01',
    created_at: '2025-03-21T11:00:00Z',
    updated_at: '2025-03-21T11:00:00Z',
  },
  {
    id: 'grd-003',
    student_id: 'stud-001',
    subject_id: 'subj-003',
    period_id: 'per-001',
    grade: 3.80,
    observation: 'Participa activamente en experimentos de laboratorio.',
    teacher_id: 'prof-teacher-01',
    created_at: '2025-03-22T09:30:00Z',
    updated_at: '2025-03-22T09:30:00Z',
  },
  {
    id: 'grd-004',
    student_id: 'stud-001',
    subject_id: 'subj-004',
    period_id: 'per-001',
    grade: 4.60,
    observation: 'Gran fluidez verbal y vocabulario amplio.',
    teacher_id: 'prof-teacher-01',
    created_at: '2025-03-23T14:00:00Z',
    updated_at: '2025-03-23T14:00:00Z',
  },
  {
    id: 'grd-005',
    student_id: 'stud-001',
    subject_id: 'subj-005',
    period_id: 'per-001',
    grade: 4.20,
    observation: 'Comprende adecuadamente los procesos históricos evaluados.',
    teacher_id: 'prof-teacher-01',
    created_at: '2025-03-24T10:30:00Z',
    updated_at: '2025-03-24T10:30:00Z',
  },

  // Juan Pérez - Período 2
  {
    id: 'grd-006',
    student_id: 'stud-001',
    subject_id: 'subj-001',
    period_id: 'per-002',
    grade: 4.80,
    observation: 'Destacada participación en geometría.',
    teacher_id: 'prof-teacher-01',
    created_at: '2025-05-10T10:00:00Z',
    updated_at: '2025-05-10T10:00:00Z',
  },
  {
    id: 'grd-007',
    student_id: 'stud-001',
    subject_id: 'subj-002',
    period_id: 'per-002',
    grade: 4.30,
    observation: 'Comprensión lectora muy sólida.',
    teacher_id: 'prof-teacher-01',
    created_at: '2025-05-12T11:00:00Z',
    updated_at: '2025-05-12T11:00:00Z',
  },

  // María Gómez - Período 1
  {
    id: 'grd-008',
    student_id: 'stud-002',
    subject_id: 'subj-001',
    period_id: 'per-001',
    grade: 4.25,
    observation: 'Muy dedicada y ordenada en la resolución de problemas.',
    teacher_id: 'prof-teacher-01',
    created_at: '2025-03-20T10:30:00Z',
    updated_at: '2025-03-20T10:30:00Z',
  },
  {
    id: 'grd-009',
    student_id: 'stud-002',
    subject_id: 'subj-002',
    period_id: 'per-001',
    grade: 4.70,
    observation: 'Excelente ortografía y creatividad expresiva.',
    teacher_id: 'prof-teacher-01',
    created_at: '2025-03-21T11:30:00Z',
    updated_at: '2025-03-21T11:30:00Z',
  },

  // Carlos Rodríguez - Período 1
  {
    id: 'grd-010',
    student_id: 'stud-003',
    subject_id: 'subj-001',
    period_id: 'per-001',
    grade: 3.50,
    observation: 'Buen esfuerzo, se recomienda reforzar operaciones algebraicas.',
    teacher_id: 'prof-teacher-01',
    created_at: '2025-03-20T12:00:00Z',
    updated_at: '2025-03-20T12:00:00Z',
  },
  {
    id: 'grd-011',
    student_id: 'stud-003',
    subject_id: 'subj-004',
    period_id: 'per-001',
    grade: 4.10,
    observation: 'Buena pronunciación y comprensión auditiva.',
    teacher_id: 'prof-teacher-01',
    created_at: '2025-03-22T14:30:00Z',
    updated_at: '2025-03-22T14:30:00Z',
  },
];

// Evaluaciones Parciales por Período y Materia
export const INITIAL_EVALUATIONS: StudentEvaluation[] = [
  // Juan Pérez (stud-001) - Matemáticas (subj-001) - Período 1
  {
    id: 'eval-001',
    student_id: 'stud-001',
    subject_id: 'subj-001',
    period_id: 'per-001',
    title: 'Evaluación 1: Fracciones y Decimales',
    description: 'Resolución de problemas con operaciones combinadas de fracciones y conversión a decimales.',
    score: 4.60,
    observation: 'Procedimiento ordenado y correcto uso del mínimo común múltiplo.',
    evaluation_date: '2025-02-20',
    created_at: '2025-02-20T10:00:00Z',
    updated_at: '2025-02-20T10:00:00Z',
  },
  {
    id: 'eval-002',
    student_id: 'stud-001',
    subject_id: 'subj-001',
    period_id: 'per-001',
    title: 'Evaluación 2: Ecuaciones Lineales',
    description: 'Ecuaciones de primer grado con una incógnita y problemas de modelado de situaciones reales.',
    score: 4.40,
    observation: 'Buen despeje de variables y comprobación de resultados.',
    evaluation_date: '2025-03-15',
    created_at: '2025-03-15T11:00:00Z',
    updated_at: '2025-03-15T11:00:00Z',
  },

  // Juan Pérez - Español (subj-002) - Período 1
  {
    id: 'eval-003',
    student_id: 'stud-001',
    subject_id: 'subj-002',
    period_id: 'per-001',
    title: 'Evaluación 1: Comprensión Lectora y Ensayo',
    description: 'Análisis textual de fragmentos de literatura latinoamericana y redacción de ensayo breve.',
    score: 4.00,
    observation: 'Adecuada coherencia textual, buena ortografía y uso de conectores.',
    evaluation_date: '2025-03-10',
    created_at: '2025-03-10T09:00:00Z',
    updated_at: '2025-03-10T09:00:00Z',
  },

  // Juan Pérez - Ciencias Naturales (subj-003) - Período 1
  {
    id: 'eval-004',
    student_id: 'stud-001',
    subject_id: 'subj-003',
    period_id: 'per-001',
    title: 'Evaluación 1: Práctica de Laboratorio Celular',
    description: 'Observación de células vegetales en microscopio e informe de partes celulares.',
    score: 3.80,
    observation: 'Manejo cuidadoso de instrumentos y dibujo detallado de la muestra.',
    evaluation_date: '2025-03-05',
    created_at: '2025-03-05T14:00:00Z',
    updated_at: '2025-03-05T14:00:00Z',
  },

  // Juan Pérez - Inglés (subj-004) - Período 1
  {
    id: 'eval-005',
    student_id: 'stud-001',
    subject_id: 'subj-004',
    period_id: 'per-001',
    title: 'Evaluación 1: Speaking Presentation',
    description: 'Exposición oral de 5 minutos sobre rutinas diarias y vocabulario de pasatiempos.',
    score: 4.60,
    observation: 'Excelente entonación, fluidez natural y muy buen control de tiempo verbal.',
    evaluation_date: '2025-03-18',
    created_at: '2025-03-18T10:30:00Z',
    updated_at: '2025-03-18T10:30:00Z',
  },

  // Juan Pérez - Ciencias Sociales (subj-005) - Período 1
  {
    id: 'eval-006',
    student_id: 'stud-001',
    subject_id: 'subj-005',
    period_id: 'per-001',
    title: 'Evaluación 1: Geografía y Regiones de Colombia',
    description: 'Mapa hidrográfico y características biogeográficas de las regiones naturales.',
    score: 4.20,
    observation: 'Dominio de la cartografía y ubicación precisa de cuencas hidrográficas.',
    evaluation_date: '2025-03-12',
    created_at: '2025-03-12T08:30:00Z',
    updated_at: '2025-03-12T08:30:00Z',
  },

  // María Gómez (stud-002) - Matemáticas (subj-001) - Período 1
  {
    id: 'eval-007',
    student_id: 'stud-002',
    subject_id: 'subj-001',
    period_id: 'per-001',
    title: 'Evaluación 1: Geometría y Perímetros',
    description: 'Cálculo de áreas y perímetros de polígonos regulares e irregulares.',
    score: 4.80,
    observation: 'Habilidad sobresaliente para trazar figuras y aplicar fórmulas.',
    evaluation_date: '2025-02-25',
    created_at: '2025-02-25T11:00:00Z',
    updated_at: '2025-02-25T11:00:00Z',
  },
];

export const INITIAL_OBSERVATIONS: Observation[] = [
  {
    id: 'obs-001',
    student_id: 'stud-001',
    period_id: 'per-001',
    subject_id: 'subj-001',
    observation_type: 'ACADEMIC',
    content: 'Muestra gran interés y destreza en los retos matemáticos semanales.',
    teacher_id: 'prof-teacher-01',
    created_at: '2025-03-25T15:00:00Z',
  },
  {
    id: 'obs-002',
    student_id: 'stud-001',
    period_id: 'per-001',
    observation_type: 'BEHAVIOR',
    content: 'Demuestra compañerismo, respeto hacia sus docentes y liderazgo positivo en clase.',
    teacher_id: 'prof-teacher-01',
    created_at: '2025-03-26T09:00:00Z',
  },
  {
    id: 'obs-003',
    student_id: 'stud-002',
    period_id: 'per-001',
    observation_type: 'PARTICIPATION',
    content: 'Participación muy constante en discusiones de literatura infantil.',
    teacher_id: 'prof-teacher-01',
    created_at: '2025-03-25T11:00:00Z',
  },
  {
    id: 'obs-004',
    student_id: 'stud-003',
    period_id: 'per-001',
    observation_type: 'GENERAL',
    content: 'Estudiante puntual, responsable con sus tareas y con gran potencial.',
    teacher_id: 'prof-teacher-01',
    created_at: '2025-03-27T08:30:00Z',
  },
];

// Validations referencing exact version_reviewed
export const INITIAL_VALIDATIONS: GradeValidation[] = [
  // Carlos Pérez validated Juan Pérez P1 at version 1 (matches current_version 1 -> VALIDATED)
  {
    id: 'val-001',
    student_id: 'stud-001',
    period_id: 'per-001',
    parent_id: 'prof-parent-01',
    version_reviewed: 1,
    validated_at: '2025-04-10T16:45:00Z',
    created_at: '2025-04-10T16:45:00Z',
  },
  // Laura Rodríguez validated Carlos Rodríguez P1 at version 1, but teacher updated it to version 2 -> REVISION_REQUIRED!
  {
    id: 'val-002',
    student_id: 'stud-003',
    period_id: 'per-001',
    parent_id: 'prof-parent-03',
    version_reviewed: 1,
    validated_at: '2025-04-11T10:15:00Z',
    created_at: '2025-04-11T10:15:00Z',
  },
];

export const INITIAL_SETTINGS: SchoolSettings = {
  id: 'set-001',
  school_name: 'Colegio AULA360',
  logo_url: undefined,
  teacher_name: 'Profesor Demo',
  institutional_email: 'profesor@aula360.edu',
  phone: '+57 300 123 4567',
  active_year: '2025',
  min_grade: 0.00,
  max_grade: 5.00,
  passing_grade: 3.00,
  updated_at: '2025-01-01T00:00:00Z',
};

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-001',
    user_id: 'prof-parent-01',
    action: 'VALIDATE',
    entity_type: 'GRADE_VALIDATION',
    entity_id: 'val-001',
    old_value: null,
    new_value: { version_reviewed: 1, validated_at: '2025-04-10T16:45:00Z' },
    created_at: '2025-04-10T16:45:00Z',
  },
  {
    id: 'aud-002',
    user_id: 'prof-teacher-01',
    action: 'UPDATE',
    entity_type: 'GRADE',
    entity_id: 'grd-010',
    old_value: { grade: 3.20 },
    new_value: { grade: 3.50, new_version: 2 },
    created_at: '2025-04-15T09:00:00Z',
  },
];
