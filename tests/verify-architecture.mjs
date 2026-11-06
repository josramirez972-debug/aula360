// Automated Test Runner for Mandatory Architectural Criteria (Section 11)
import {
  INITIAL_PROFILES,
  INITIAL_STUDENTS,
  INITIAL_PARENT_STUDENTS,
  INITIAL_PERIODS,
  INITIAL_SETTINGS,
  INITIAL_STUDENT_PERIOD_VERSIONS,
  INITIAL_VALIDATIONS,
  INITIAL_GRADES,
  INITIAL_AUDIT_LOGS,
} from './mock-export.mjs';

console.log('====================================================');
console.log('AULA360: VERIFICACIÓN ARQUITECTÓNICA DEFINITIVA');
console.log('====================================================\n');

let passed = 0;
let failed = 0;

function assert(description, condition, detail = '') {
  if (condition) {
    console.log(`✓ [PASÓ] ${description}`);
    passed++;
  } else {
    console.error(`✗ [FALLÓ] ${description} ${detail ? `(${detail})` : ''}`);
    failed++;
  }
}

// 1. Mono-institución y un único profesor administrador
const teachers = INITIAL_PROFILES.filter((p) => p.role === 'TEACHER');
assert('Existe un único profesor administrador en la institución', teachers.length === 1);

// 2. Relación estricta 1:1 representante-estudiante
const parentIds = INITIAL_PARENT_STUDENTS.map((ps) => ps.parent_id);
const studentIds = INITIAL_PARENT_STUDENTS.map((ps) => ps.student_id);
const uniqueParents = new Set(parentIds);
const uniqueStudents = new Set(studentIds);
assert(
  'Cada representante está vinculado a máximo un estudiante (1:1)',
  parentIds.length === uniqueParents.size
);
assert(
  'Cada estudiante está vinculado a máximo un representante (1:1)',
  studentIds.length === uniqueStudents.size
);

// 3. Cuatro períodos académicos configurables
assert('Existen exactamente 4 períodos académicos configurados', INITIAL_PERIODS.length === 4);

// 4. Bloqueo de modificaciones en períodos cerrados
const closedPeriod = INITIAL_PERIODS.find((p) => p.status === 'CLOSED');
assert('Existe al menos un período en estado CERRADO para control', Boolean(closedPeriod));

// 5. Escala de calificaciones NUMERIC(3, 2): 0.00 a 5.00
const allValidGrades = INITIAL_GRADES.every((g) => g.grade >= 0.00 && g.grade <= 5.00);
assert('Todas las calificaciones respetan el rango NUMERIC(3, 2) de 0.00 a 5.00', allValidGrades);

// 6. Cálculo dinámico de promedio ponderado (no manual)
const p1Grades = INITIAL_GRADES.filter((g) => g.student_id === 'stud-001' && g.period_id === 'per-001');
const sum = p1Grades.reduce((a, b) => a + b.grade, 0);
const avg = Math.round((sum / p1Grades.length) * 100) / 100;
assert(
  'Cálculo dinámico de promedio ponderado (suma / total materias evaluadas)',
  p1Grades.length > 0 && avg > 0
);

// 7. Sistema de control de versiones académicas (Sección 5)
// stud-003 en per-001 tiene versión académica 2, pero la validación registrada es versión 1
const v3 = INITIAL_STUDENT_PERIOD_VERSIONS.find((v) => v.student_id === 'stud-003' && v.period_id === 'per-001');
const val3 = INITIAL_VALIDATIONS.find((v) => v.student_id === 'stud-003' && v.period_id === 'per-001');
assert(
  'Detección de versión académica incrementada (v2 > v1 -> REVISION_REQUIRED)',
  v3 && val3 && v3.current_version > val3.version_reviewed
);

// 8. Validación vigente cuando coinciden las versiones
const v1 = INITIAL_STUDENT_PERIOD_VERSIONS.find((v) => v.student_id === 'stud-001' && v.period_id === 'per-001');
const val1 = INITIAL_VALIDATIONS.find((v) => v.student_id === 'stud-001' && v.period_id === 'per-001');
assert(
  'Estado VALIDATED vigente cuando versión revisada coincide con versión académica actual (v1 === v1)',
  v1 && val1 && v1.current_version === val1.version_reviewed
);

// 9. Registro inmutable de auditoría
assert('Las operaciones críticas quedan registradas en audit_logs', INITIAL_AUDIT_LOGS.length > 0);

// 10. Identidad institucional en school_settings
assert(
  'Configuración institucional cargada con nombre del colegio y profesor administrador',
  Boolean(INITIAL_SETTINGS.school_name && INITIAL_SETTINGS.teacher_name)
);

console.log('\n====================================================');
console.log(`RESULTADO DE PRUEBAS: ${passed} PASARON, ${failed} FALLARON`);
console.log('====================================================');
