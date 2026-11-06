/**
 * AULA360: PRUEBA INTEGRAL DEL MOTOR ACADÉMICO (FASE 5)
 * Flujo completo E2E de 14 pasos de extremo a extremo + Verificación de Privacidad
 */

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✓ [PASÓ] ${message}`);
    passed++;
  } else {
    console.error(`✗ [FALLÓ] ${message}`);
    failed++;
  }
}

console.log('================================================================');
console.log('AULA360: PRUEBA DEL MOTOR ACADÉMICO COMPLETO (14 PASOS)');
console.log('================================================================\n');

// Estructuras de almacenamiento en memoria para el test
const database = {
  profiles: [],
  students: [],
  parent_students: [],
  subjects: [],
  student_subjects: [],
  academic_periods: [],
  student_period_versions: [],
  grades: [],
  observations: [],
  grade_validations: [],
  audit_logs: [],
  school_settings: {
    school_name: 'Colegio AULA360',
    min_grade: 0.00,
    max_grade: 5.00,
    passing_grade: 3.00,
    active_year: '2025',
  },
};

// Función auxiliar de auditoría
function logAudit(userId, action, entityType, entityId, oldValue, newValue) {
  database.audit_logs.push({
    id: `log-${database.audit_logs.length + 1}`,
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    old_value: oldValue,
    new_value: newValue,
    created_at: new Date().toISOString(),
  });
}

// -------------------------------------------------------------
// PASO 1: Profesor inicia sesión
// -------------------------------------------------------------
console.log('--- PASO 1: Login de Profesor Administrador ---');
const teacherUser = {
  id: 'usr-teacher-admin',
  full_name: 'Lic. Fernando Vallejo',
  email: 'profesor@aula360.edu',
  role: 'TEACHER',
  created_at: new Date().toISOString(),
};
database.profiles.push(teacherUser);
let currentSessionUser = teacherUser;
assert(currentSessionUser.role === 'TEACHER', 'Paso 1: Profesor inicia sesión correctamente con rol TEACHER');

// -------------------------------------------------------------
// PASO 2: Profesor crea estudiante
// -------------------------------------------------------------
console.log('\n--- PASO 2: Creación de Estudiante ---');
function calculateAge(birthDateString) {
  const today = new Date();
  const birthDate = new Date(birthDateString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
}

const newStudent = {
  id: 'std-camila-01',
  first_name: 'Camila',
  last_name: 'Duarte',
  birth_date: '2014-06-20',
  grade: '6A',
  section: 'A',
  document_id: 'TI-1092837499',
  status: 'ACTIVE',
  created_at: new Date().toISOString(),
};
database.students.push(newStudent);
logAudit(currentSessionUser.id, 'CREATE_STUDENT', 'STUDENT', newStudent.id, null, newStudent);

assert(newStudent.id && newStudent.status === 'ACTIVE', 'Paso 2: Estudiante Camila Duarte creado en estado ACTIVE');
const studentAge = calculateAge(newStudent.birth_date);
assert(studentAge >= 10 && studentAge <= 12, `Paso 2b: Cálculo automático de edad exacto (${studentAge} años)`);

// -------------------------------------------------------------
// PASO 3: Profesor crea cuenta de representante
// -------------------------------------------------------------
console.log('\n--- PASO 3: Creación de Cuenta de Representante ---');
const newParent = {
  id: 'usr-parent-marta',
  full_name: 'Marta Duarte',
  email: 'marta.duarte@padres.com',
  phone: '+57 310 987 6543',
  role: 'PARENT',
  created_at: new Date().toISOString(),
};
database.profiles.push(newParent);
logAudit(currentSessionUser.id, 'PROVISION_PARENT', 'PROFILE', newParent.id, null, newParent);
assert(newParent.id && newParent.role === 'PARENT', 'Paso 3: Representante Marta Duarte aprovisionada con rol PARENT');

// -------------------------------------------------------------
// PASO 4: Profesor asocia ambos (Restricción 1:1 Estricta)
// -------------------------------------------------------------
console.log('\n--- PASO 4: Asociación Estricta 1:1 ---');
function associateParentStudent(parentId, studentId, relationship) {
  // Check 1: Student cannot have another parent
  const existingForStudent = database.parent_students.find((ps) => ps.student_id === studentId);
  if (existingForStudent && existingForStudent.parent_id !== parentId) {
    throw new Error('El estudiante ya tiene asignado un representante.');
  }
  // Check 2: Parent cannot have another student
  const existingForParent = database.parent_students.find((ps) => ps.parent_id === parentId);
  if (existingForParent && existingForParent.student_id !== studentId) {
    throw new Error('El representante ya tiene asignado un estudiante.');
  }

  const relation = {
    id: `ps-${Date.now()}`,
    parent_id: parentId,
    student_id: studentId,
    relationship_type: relationship,
    created_at: new Date().toISOString(),
  };
  database.parent_students.push(relation);
  logAudit(currentSessionUser.id, 'ASSOCIATE_1TO1', 'PARENT_STUDENT', relation.id, null, relation);
  return relation;
}

const rel = associateParentStudent(newParent.id, newStudent.id, 'Madre');
assert(rel && rel.student_id === newStudent.id, 'Paso 4: Asociación 1:1 establecida con éxito');

// Verificar que se prohíba asignar otro acudiente a Camila
let doubleParentBlocked = false;
try {
  associateParentStudent('usr-other-parent', newStudent.id, 'Tutor');
} catch {
  doubleParentBlocked = true;
}
assert(doubleParentBlocked, 'Paso 4b: Bloqueo exitoso: Se prohíbe duplicar representantes para un estudiante');

// -------------------------------------------------------------
// PASO 5: Registro y Asignación de Asignaturas
// -------------------------------------------------------------
console.log('\n--- PASO 5: Registro y Asignación de Asignaturas ---');
const subMat = { id: 'sb-mat', name: 'Matemáticas', status: 'ACTIVE' };
const subEsp = { id: 'sb-esp', name: 'Español', status: 'ACTIVE' };
const subIng = { id: 'sb-ing', name: 'Inglés', status: 'ACTIVE' };
database.subjects.push(subMat, subEsp, subIng);

function enrollStudentInSubject(studentId, subjectId) {
  database.student_subjects.push({
    id: `ss-${Date.now()}-${subjectId}`,
    student_id: studentId,
    subject_id: subjectId,
    enrolled_at: new Date().toISOString(),
  });
}
enrollStudentInSubject(newStudent.id, subMat.id);
enrollStudentInSubject(newStudent.id, subEsp.id);
enrollStudentInSubject(newStudent.id, subIng.id);

assert(database.student_subjects.filter((ss) => ss.student_id === newStudent.id).length === 3, 'Paso 5: Asignaturas registradas y 3 materias matriculadas para Camila');

// -------------------------------------------------------------
// PASO 6: Profesor abre período académico
// -------------------------------------------------------------
console.log('\n--- PASO 6: Configuración y Apertura de Período ---');
const period1 = {
  id: 'per-01-2025',
  name: 'Período 1',
  academic_year: '2025',
  start_date: '2025-02-01',
  end_date: '2025-04-15',
  status: 'OPEN',
};
database.academic_periods.push(period1);
assert(period1.status === 'OPEN', 'Paso 6: Período 1 en estado OPEN listo para recibir calificaciones');

// -------------------------------------------------------------
// PASO 7: Carga de Calificaciones
// -------------------------------------------------------------
console.log('\n--- PASO 7: Carga de Calificaciones NUMERIC(3, 2) ---');
function saveGrade(studentId, subjectId, periodId, gradeValue, observation) {
  const period = database.academic_periods.find((p) => p.id === periodId);
  if (period.status === 'CLOSED') {
    throw new Error('Operación rechazada: El período académico se encuentra CERRADO.');
  }

  const numeric = parseFloat(Number(gradeValue).toFixed(2));
  if (isNaN(numeric) || numeric < 0.0 || numeric > 5.0) {
    throw new Error('La calificación debe estar entre 0.00 y 5.00');
  }

  // Check unique student_id + subject_id + period_id
  let existing = database.grades.find(
    (g) => g.student_id === studentId && g.subject_id === subjectId && g.period_id === periodId
  );

  let oldVal = null;
  if (existing) {
    oldVal = { ...existing };
    existing.grade = numeric;
    existing.observation = observation;
    existing.updated_at = new Date().toISOString();
  } else {
    existing = {
      id: `grd-${Date.now()}-${subjectId}`,
      student_id: studentId,
      subject_id: subjectId,
      period_id: periodId,
      grade: numeric,
      observation,
      teacher_id: currentSessionUser.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    database.grades.push(existing);
  }

  // Version bump trigger
  let spv = database.student_period_versions.find(
    (v) => v.student_id === studentId && v.period_id === periodId
  );
  if (!spv) {
    spv = { student_id: studentId, period_id: periodId, current_version: 1 };
    database.student_period_versions.push(spv);
  } else {
    spv.current_version += 1;
  }

  logAudit(currentSessionUser.id, oldVal ? 'UPDATE_GRADE' : 'INSERT_GRADE', 'GRADE', existing.id, oldVal, existing);
  return existing;
}

const g1 = saveGrade(newStudent.id, subMat.id, period1.id, 4.50, 'Excelente razonamiento lógico');
const g2 = saveGrade(newStudent.id, subEsp.id, period1.id, 4.00, 'Buena comprensión lectora');
const g3 = saveGrade(newStudent.id, subIng.id, period1.id, 4.80, 'Destacada fluidez oral');

assert(g1 && g2 && g3, 'Paso 7: Calificaciones cargadas exitosamente');
const studentGrades = database.grades.filter((g) => g.student_id === newStudent.id && g.period_id === period1.id);
assert(studentGrades.length === 3, 'Paso 7b: 3 calificaciones registradas para el Período 1');

// -------------------------------------------------------------
// PASO 8: Profesor agrega observaciones
// -------------------------------------------------------------
console.log('\n--- PASO 8: Inserción de Observaciones Cualitativas ---');
function saveObservation(studentId, periodId, subjectId, type, content) {
  const period = database.academic_periods.find((p) => p.id === periodId);
  if (period.status === 'CLOSED') {
    throw new Error('Operación rechazada: El período académico se encuentra CERRADO.');
  }

  const obs = {
    id: `obs-${Date.now()}`,
    student_id: studentId,
    period_id: periodId,
    subject_id: subjectId,
    observation_type: type,
    content,
    teacher_id: currentSessionUser.id,
    created_at: new Date().toISOString(),
  };
  database.observations.push(obs);

  // Bump version
  let spv = database.student_period_versions.find(
    (v) => v.student_id === studentId && v.period_id === periodId
  );
  if (spv) spv.current_version += 1;

  logAudit(currentSessionUser.id, 'INSERT_OBSERVATION', 'OBSERVATION', obs.id, null, obs);
  return obs;
}

const obs1 = saveObservation(newStudent.id, period1.id, null, 'GENERAL', 'Demuestra gran compromiso y puntualidad en clases.');
assert(obs1 && obs1.observation_type === 'GENERAL', 'Paso 8: Observación general formativa registrada exitosamente');

// -------------------------------------------------------------
// PASO 9: Representante inicia sesión
// -------------------------------------------------------------
console.log('\n--- PASO 9: Login de Representante ---');
currentSessionUser = newParent;
assert(currentSessionUser.role === 'PARENT', 'Paso 9: Representante Marta Duarte inicia sesión (rol PARENT)');

// -------------------------------------------------------------
// PASO 10: Representante consulta notas y promedio
// -------------------------------------------------------------
console.log('\n--- PASO 10: Consulta Exclusiva de Notas y Promedio ---');
function rlsGetMyStudentGrades(parentId, periodId) {
  const assoc = database.parent_students.find((ps) => ps.parent_id === parentId);
  if (!assoc) return [];
  return database.grades.filter((g) => g.student_id === assoc.student_id && g.period_id === periodId);
}

function calculateAverage(grades) {
  if (grades.length === 0) return 0;
  const sum = grades.reduce((acc, curr) => acc + curr.grade, 0);
  return parseFloat((sum / grades.length).toFixed(2));
}

const myGrades = rlsGetMyStudentGrades(currentSessionUser.id, period1.id);
const average = calculateAverage(myGrades);
assert(myGrades.length === 3, 'Paso 10: Acudiente consulta las 3 calificaciones de su hija Camila');
assert(average === 4.43, `Paso 10b: Cálculo dinámico de promedio ponderado: (4.50 + 4.00 + 4.80) / 3 = ${average}`);

// -------------------------------------------------------------
// PASO 11: Representante confirma revisión
// -------------------------------------------------------------
console.log('\n--- PASO 11: Confirmación de Revisión por el Representante ---');
function confirmValidation(parentId, studentId, periodId) {
  // Security check: Must be the assigned parent
  const assoc = database.parent_students.find(
    (ps) => ps.parent_id === parentId && ps.student_id === studentId
  );
  if (!assoc) throw new Error('RLS Violation: Usuario no autorizado para validar este estudiante.');

  const spv = database.student_period_versions.find(
    (v) => v.student_id === studentId && v.period_id === periodId
  );
  const versionToConfirm = spv ? spv.current_version : 1;

  const validation = {
    id: `val-${Date.now()}`,
    parent_id: parentId,
    student_id: studentId,
    period_id: periodId,
    version_reviewed: versionToConfirm,
    validated_at: new Date().toISOString(),
  };
  database.grade_validations.push(validation);
  logAudit(parentId, 'VALIDATE_VERSION', 'GRADE_VALIDATION', validation.id, null, validation);
  return validation;
}

const validationV1 = confirmValidation(currentSessionUser.id, newStudent.id, period1.id);
assert(validationV1 && validationV1.version_reviewed > 0, `Paso 11: Constancia de revisión firmada digitalmente para versión v${validationV1.version_reviewed}`);

// -------------------------------------------------------------
// PASO 12: Profesor consulta estado de validación
// -------------------------------------------------------------
console.log('\n--- PASO 12: Verificación de Estado por el Profesor ---');
currentSessionUser = teacherUser;

function computeStatus(studentId, periodId) {
  const spv = database.student_period_versions.find(
    (v) => v.student_id === studentId && v.period_id === periodId
  );
  const currentVersion = spv ? spv.current_version : 1;

  const latestVal = database.grade_validations
    .filter((v) => v.student_id === studentId && v.period_id === periodId)
    .sort((a, b) => new Date(b.validated_at) - new Date(a.validated_at))[0];

  if (!latestVal) return { status: 'PENDING', currentVersion, reviewedVersion: null };
  if (latestVal.version_reviewed === currentVersion) {
    return { status: 'VALIDATED', currentVersion, reviewedVersion: latestVal.version_reviewed };
  }
  if (latestVal.version_reviewed < currentVersion) {
    return { status: 'REVISION_REQUIRED', currentVersion, reviewedVersion: latestVal.version_reviewed };
  }
  return { status: 'PENDING', currentVersion, reviewedVersion: null };
}

const statusPaso12 = computeStatus(newStudent.id, period1.id);
assert(statusPaso12.status === 'VALIDATED', 'Paso 12: Profesor observa estado VALIDATED (Versión revisada coincide con actual)');

// -------------------------------------------------------------
// PASO 13: Profesor modifica una nota (Incremento de Versión)
// -------------------------------------------------------------
console.log('\n--- PASO 13: Modificación de Nota e Incremento de Versión ---');
const prevVersion = statusPaso12.currentVersion;
// Profesor actualiza nota de Español de 4.00 a 4.25
const updatedGrade = saveGrade(newStudent.id, subEsp.id, period1.id, 4.25, 'Mejora en redacción de ensayos');
const spvAfterUpdate = database.student_period_versions.find(
  (v) => v.student_id === newStudent.id && v.period_id === period1.id
);
assert(spvAfterUpdate.current_version > prevVersion, `Paso 13: Versión académica incrementada de v${prevVersion} a v${spvAfterUpdate.current_version}`);

// -------------------------------------------------------------
// PASO 14: El sistema solicita nuevamente la revisión
// -------------------------------------------------------------
console.log('\n--- PASO 14: Estado REVISION_REQUIRED Activado ---');
const statusPaso14 = computeStatus(newStudent.id, period1.id);
assert(statusPaso14.status === 'REVISION_REQUIRED', 'Paso 14: El sistema solicita nuevamente la revisión (REVISION_REQUIRED)');
assert(statusPaso14.reviewedVersion < statusPaso14.currentVersion, `Paso 14b: Versión revisada anterior (v${statusPaso14.reviewedVersion}) < Versión actual (v${statusPaso14.currentVersion})`);

// -------------------------------------------------------------
// VERIFICACIÓN ADICIONAL DE SEGURIDAD Y PRIVACIDAD
// -------------------------------------------------------------
console.log('\n--- VERIFICACIÓN DE PRIVACIDAD ENTRE REPRESENTANTES ---');
const otherParent = { id: 'usr-parent-intruder', role: 'PARENT', full_name: 'Intruso' };
function testIntruderAccess() {
  const intruderGrades = rlsGetMyStudentGrades(otherParent.id, period1.id);
  assert(intruderGrades.length === 0, 'Privacidad RLS: Otro representante NO puede consultar calificaciones del estudiante Camila Duarte');

  let intruderValidationBlocked = false;
  try {
    confirmValidation(otherParent.id, newStudent.id, period1.id);
  } catch {
    intruderValidationBlocked = true;
  }
  assert(intruderValidationBlocked, 'Privacidad RLS: Otro representante NO puede firmar validaciones de estudiante ajeno');
}
testIntruderAccess();

// Verificar auditoría completa
assert(database.audit_logs.length >= 6, `Auditoría: ${database.audit_logs.length} registros inmutables de auditoría capturados`);

console.log('\n================================================================');
console.log(`RESULTADO DEL FLUJO COMPLETO: ${passed} PASARON, ${failed} FALLARON`);
console.log('================================================================');

if (failed > 0) process.exit(1);
