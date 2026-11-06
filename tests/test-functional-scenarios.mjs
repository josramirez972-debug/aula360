/**
 * AULA360: PRUEBAS FUNCIONALES, RLS, MOTOR ACADÉMICO Y VALIDACIÓN
 * Fase 6: QA Integral (Secciones 3, 4, 5, 6, 7)
 */

console.log('================================================================');
console.log('AULA360: ESCENARIOS FUNCIONALES, SEGURIDAD RLS Y MOTOR ACADÉMICO');
console.log('================================================================\n');

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

// ==============================================================================
// BASE DE DATOS EN MEMORIA AISLADA PARA QA
// ==============================================================================
const db = {
  profiles: [
    { id: 'usr-teacher-01', email: 'teacher.demo@aula360.test', full_name: 'Profesor Demo', role: 'TEACHER' },
    { id: 'usr-parent-01', email: 'padre1.demo@aula360.test', full_name: 'Padre 1 Demo', role: 'PARENT' },
    { id: 'usr-parent-02', email: 'padre2.demo@aula360.test', full_name: 'Padre 2 Demo', role: 'PARENT' },
  ],
  students: [],
  parent_students: [],
  subjects: [],
  academic_periods: [],
  grades: [],
  student_evaluations: [],
  observations: [],
  student_period_versions: [],
  grade_validations: [],
  audit_logs: [],
};

// Current authenticated context for RLS enforcement
let currentAuthUid = null;

function setAuthSession(userId) {
  currentAuthUid = userId;
}

function getAuthProfile() {
  return db.profiles.find((p) => p.id === currentAuthUid) || null;
}

function isTeacher() {
  const p = getAuthProfile();
  return p && p.role === 'TEACHER';
}

function isParentOf(studentId) {
  const p = getAuthProfile();
  if (!p || p.role !== 'PARENT') return false;
  return db.parent_students.some((rel) => rel.parent_id === p.id && rel.student_id === studentId);
}

// ==============================================================================
// PARTE 1: ESCENARIO DEL PROFESOR (SECCIÓN 3)
// ==============================================================================
console.log('--- 1. ESCENARIO DEL PROFESOR: CREACIÓN Y GESTIÓN ACADÉMICA ---');

// Iniciar sesión como profesor
setAuthSession('usr-teacher-01');
assert(isTeacher(), 'Profesor inicia sesión administrativamente');

// 1. Crear Juan Pérez y María Gómez
function createStudent(data) {
  if (!isTeacher()) return { error: 'RLS: Permiso denegado. Solo el docente puede crear estudiantes.' };
  const student = {
    id: `stud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    ...data,
    status: 'ACTIVE',
    created_at: new Date().toISOString(),
  };
  db.students.push(student);
  return { student };
}

const sJuan = createStudent({ first_name: 'Juan', last_name: 'Pérez', birth_date: '2014-04-12', grade: '6A', section: 'A' }).student;
const sMaria = createStudent({ first_name: 'María', last_name: 'Gómez', birth_date: '2015-08-23', grade: '5A', section: 'A' }).student;

assert(sJuan && sJuan.first_name === 'Juan', 'Estudiante Juan Pérez creado exitosamente');
assert(sMaria && sMaria.first_name === 'María', 'Estudiante María Gómez creado exitosamente');

// 2. Asociar Juan con Padre 1 y María con Padre 2 (Regla estricta 1:1)
function associateParentStudent(parentId, studentId, relationship = 'Padre') {
  if (!isTeacher()) return { error: 'RLS: Solo el docente puede asociar representantes.' };
  
  // Regla 1:1: un representante no puede tener otro estudiante
  const pExists = db.parent_students.find((r) => r.parent_id === parentId);
  if (pExists) return { error: 'Regla 1:1: Este representante ya tiene un estudiante asignado.' };

  // Regla 1:1: un estudiante no puede tener otro representante
  const sExists = db.parent_students.find((r) => r.student_id === studentId);
  if (sExists) return { error: 'Regla 1:1: Este estudiante ya tiene un representante asignado.' };

  const rel = { id: `ps-${Date.now()}`, parent_id: parentId, student_id: studentId, relationship };
  db.parent_students.push(rel);
  return { success: true, rel };
}

const assoc1 = associateParentStudent('usr-parent-01', sJuan.id, 'Padre');
assert(assoc1.success, 'Asociación 1:1 establecida: Padre 1 -> Juan Pérez');

const assoc2 = associateParentStudent('usr-parent-02', sMaria.id, 'Madre');
assert(assoc2.success, 'Asociación 1:1 establecida: Padre 2 -> María Gómez');

// Intento de violar la regla 1:1 (asignar un segundo estudiante a Padre 1)
const assocViolate = associateParentStudent('usr-parent-01', sMaria.id);
assert(!assocViolate.success, 'Regla 1:1 garantizada: Rechazo de vinculación múltiple para Padre 1');

// 3. Crear Asignaturas
function createSubject(name, description) {
  if (!isTeacher()) return { error: 'RLS: Solo el docente puede crear asignaturas.' };
  const sub = { id: `subj-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, name, description, status: 'ACTIVE' };
  db.subjects.push(sub);
  return sub;
}

const subMath = createSubject('Matemáticas', 'Razonamiento lógico y aritmética');
const subEsp = createSubject('Español', 'Lengua castellana y comprensión');
const subCienc = createSubject('Ciencias', 'Ciencias naturales y biología');

assert(db.subjects.length === 3, '3 Asignaturas creadas: Matemáticas, Español, Ciencias');

// 4. Crear Período Académico (4 períodos configurados, uno cerrado para control)
function createPeriod(name, status = 'OPEN') {
  const p = { id: `per-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, name, status };
  db.academic_periods.push(p);
  return p;
}

const per1 = createPeriod('Período 1', 'OPEN');
const per2 = createPeriod('Período 2', 'OPEN');
const per3 = createPeriod('Período 3', 'OPEN');
const per4 = createPeriod('Período 4', 'CLOSED');

assert(db.academic_periods.length === 4, '4 Períodos académicos configurados (Período 4 en estado CLOSED)');

// 5. Registrar Calificaciones con validación NUMERIC(3, 2) y Versionado
function registerGrade(studentId, subjectId, periodId, gradeValue, observation = '') {
  if (!isTeacher()) return { error: 'RLS: Solo el docente puede registrar calificaciones.' };

  const period = db.academic_periods.find((p) => p.id === periodId);
  if (!period || period.status === 'CLOSED') {
    return { error: 'Operación bloqueada: El período académico se encuentra CERRADO.' };
  }

  // Validación numérica estricta 0.00 a 5.00 con 2 decimales
  if (typeof gradeValue !== 'number' || gradeValue < 0.00 || gradeValue > 5.00) {
    return { error: 'Calificación inválida: Debe ser un número entre 0.00 y 5.00.' };
  }

  // Restricción de duplicados (UNIQUE: student_id, subject_id, period_id)
  const existingIdx = db.grades.findIndex((g) => g.student_id === studentId && g.subject_id === subjectId && g.period_id === periodId);

  const rounded = Math.round(gradeValue * 100) / 100;
  let gradeObj;

  if (existingIdx >= 0) {
    db.grades[existingIdx].grade = rounded;
    db.grades[existingIdx].observation = observation;
    gradeObj = db.grades[existingIdx];
  } else {
    gradeObj = { id: `grd-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, student_id: studentId, subject_id: subjectId, period_id: periodId, grade: rounded, observation };
    db.grades.push(gradeObj);
  }

  // Incrementar versión académica del estudiante para ese período
  let verObj = db.student_period_versions.find((v) => v.student_id === studentId && v.period_id === periodId);
  if (!verObj) {
    verObj = { student_id: studentId, period_id: periodId, current_version: 1 };
    db.student_period_versions.push(verObj);
  } else {
    verObj.current_version++;
  }

  return { grade: gradeObj, currentVersion: verObj.current_version };
}

// Registrar notas para Juan Pérez (Período 1)
const g1 = registerGrade(sJuan.id, subMath.id, per1.id, 4.50, 'Excelente razonamiento lógico');
const g2 = registerGrade(sJuan.id, subEsp.id, per1.id, 4.00, 'Buena redacción y comprensión');
const g3 = registerGrade(sJuan.id, subCienc.id, per1.id, 4.80, 'Gran desempeño en laboratorios');

assert(g1.grade && g2.grade && g3.grade, 'Calificaciones registradas exitosamente para Juan Pérez');
assert(db.grades.filter((g) => g.student_id === sJuan.id).length === 3, '3 notas guardadas para Juan Pérez');

// Registrar notas para María Gómez (Período 1)
const gm1 = registerGrade(sMaria.id, subMath.id, per1.id, 3.80, 'Buen avance en cálculo');
const gm2 = registerGrade(sMaria.id, subEsp.id, per1.id, 4.20, 'Destacada lectura crítica');
assert(gm1.grade && gm2.grade, 'Calificaciones registradas para María Gómez');

// 6. Crear Observaciones Formativas
function createObservation(studentId, periodId, type, content, subjectId = null) {
  if (!isTeacher()) return { error: 'RLS: Solo el docente puede registrar observaciones.' };
  const obs = { id: `obs-${Date.now()}`, student_id: studentId, period_id: periodId, type, content, subjectId };
  db.observations.push(obs);
  return obs;
}

createObservation(sJuan.id, per1.id, 'ACADEMIC', 'Demuestra alto compromiso y liderazgo.');
createObservation(sMaria.id, per1.id, 'GENERAL', 'Excelente convivencia y compañerismo.');

assert(db.observations.length === 2, 'Observaciones cualitativas registradas');


// ==============================================================================
// PARTE 2: PRUEBAS DEL REPRESENTANTE 1 (SECCIÓN 4)
// ==============================================================================
console.log('\n--- 2. PRUEBAS DEL REPRESENTANTE 1 (PADRE 1 DEMO) ---');

setAuthSession('usr-parent-01'); // Inicia sesión Padre 1
assert(!isTeacher(), 'Padre 1 autenticado con rol PARENT');

// A. Consulta de Estudiante a cargo
function parentQueryMyStudent() {
  const p = getAuthProfile();
  const rel = db.parent_students.find((r) => r.parent_id === p.id);
  if (!rel) return null;
  return db.students.find((s) => s.id === rel.student_id) || null;
}

const p1Child = parentQueryMyStudent();
assert(p1Child && p1Child.id === sJuan.id, 'Padre 1 visualiza ÚNICAMENTE a su hijo Juan Pérez');
assert(p1Child.first_name === 'Juan' && p1Child.last_name === 'Pérez', 'Datos del estudiante coinciden exactamente');

// B. Consulta de Notas con política RLS
function parentQueryGrades(targetStudentId, periodId) {
  // RLS: USING (public.is_parent_of(student_id))
  if (!isParentOf(targetStudentId)) {
    return { error: 'RLS: Acceso denegado. No tienes autorización para consultar calificaciones de este estudiante.' };
  }
  const res = db.grades.filter((g) => g.student_id === targetStudentId && (!periodId || g.period_id === periodId));
  return { grades: res };
}

const p1MyGrades = parentQueryGrades(sJuan.id, per1.id);
assert(!p1MyGrades.error && p1MyGrades.grades.length === 3, 'Padre 1 consulta con éxito las 3 notas de Juan Pérez');

// C. Promedio Ponderado
const sumGrades = p1MyGrades.grades.reduce((acc, g) => acc + g.grade, 0);
const avgCalculated = (sumGrades / p1MyGrades.grades.length).toFixed(2);
// (4.50 + 4.00 + 4.80) / 3 = 13.30 / 3 = 4.4333 -> 4.43
assert(avgCalculated === '4.43', `Cálculo exacto de promedio ponderado: 4.43 (suma: ${sumGrades}, total materias: 3)`);

// D. RLS: Padre 1 intentando consultar notas de María Gómez (hijo ajeno)
const p1SpyGrades = parentQueryGrades(sMaria.id, per1.id);
assert(!!p1SpyGrades.error, 'RLS BLOQUEADO: Padre 1 no puede consultar las notas de María Gómez');

// E. RLS: Padre 1 intentando crear estudiante
const p1CreateStudent = createStudent({ first_name: 'Falso', last_name: 'Intruso', birth_date: '2015-01-01', grade: '1A' });
assert(!!p1CreateStudent.error, 'RLS BLOQUEADO: Padre 1 no puede crear estudiantes');

// F. RLS: Padre 1 intentando modificar notas
const p1EditGrade = registerGrade(sJuan.id, subMath.id, per1.id, 5.00);
assert(!!p1EditGrade.error, 'RLS BLOQUEADO: Padre 1 no puede modificar calificaciones');

// G. Confirmar Revisión Formal por Padre 1
function confirmValidation(studentId, periodId) {
  if (!isParentOf(studentId)) {
    return { error: 'RLS: No puedes firmar boletines de estudiantes que no son tu hijo a cargo.' };
  }
  const verObj = db.student_period_versions.find((v) => v.student_id === studentId && v.period_id === periodId);
  const currentVer = verObj ? verObj.current_version : 1;

  const valRecord = {
    id: `val-${Date.now()}`,
    student_id: studentId,
    period_id: periodId,
    parent_id: currentAuthUid,
    version_reviewed: currentVer,
    validated_at: new Date().toISOString(),
  };

  db.grade_validations.push(valRecord);
  return { success: true, validation: valRecord };
}

const p1ConfirmV1 = confirmValidation(sJuan.id, per1.id);
assert(p1ConfirmV1.success, `Padre 1 confirma formalmente la revisión del Período 1 (Versión v${p1ConfirmV1.validation.version_reviewed})`);


// ==============================================================================
// PARTE 3: PRUEBAS DEL REPRESENTANTE 2 (SECCIÓN 4)
// ==============================================================================
console.log('\n--- 3. PRUEBAS DEL REPRESENTANTE 2 (PADRE 2 DEMO) ---');

setAuthSession('usr-parent-02'); // Inicia sesión Padre 2
assert(!isTeacher(), 'Padre 2 autenticado con rol PARENT');

const p2Child = parentQueryMyStudent();
assert(p2Child && p2Child.id === sMaria.id, 'Padre 2 visualiza ÚNICAMENTE a su hija María Gómez');

const p2MyGrades = parentQueryGrades(sMaria.id, per1.id);
assert(!p2MyGrades.error && p2MyGrades.grades.length === 2, 'Padre 2 consulta con éxito las notas de María Gómez');

// RLS: Padre 2 intentando consultar notas de Juan Pérez
const p2SpyGrades = parentQueryGrades(sJuan.id, per1.id);
assert(!!p2SpyGrades.error, 'RLS BLOQUEADO: Padre 2 no puede consultar las notas de Juan Pérez');

// RLS: Padre 2 intentando firmar boletín de Juan Pérez
const p2SpyConfirm = confirmValidation(sJuan.id, per1.id);
assert(!!p2SpyConfirm.error, 'RLS BLOQUEADO: Padre 2 no puede firmar validaciones de Juan Pérez');


// ==============================================================================
// PARTE 4: PRUEBAS DE VALIDACIÓN Y CONTROL DE VERSIONES (SECCIÓN 7)
// ==============================================================================
console.log('\n--- 4. PRUEBAS DE VERSIONADO ACADÉMICO E HISTORIAL ---');

// Estado de validación según el motor
function computeValidationStatus(studentId, periodId) {
  const verObj = db.student_period_versions.find((v) => v.student_id === studentId && v.period_id === periodId);
  const currentVersion = verObj ? verObj.current_version : 1;

  const validations = db.grade_validations
    .filter((v) => v.student_id === studentId && v.period_id === periodId)
    .sort((a, b) => b.version_reviewed - a.version_reviewed);

  if (validations.length === 0) {
    return { status: 'PENDING', currentVersion, reviewedVersion: null };
  }

  const latestVal = validations[0];
  if (latestVal.version_reviewed === currentVersion) {
    return { status: 'VALIDATED', currentVersion, reviewedVersion: latestVal.version_reviewed, validatedAt: latestVal.validated_at };
  } else {
    return { status: 'REVISION_REQUIRED', currentVersion, reviewedVersion: latestVal.version_reviewed, validatedAt: latestVal.validated_at };
  }
}

// 1. Verificar estado actual para Juan Pérez (debe ser VALIDATED con v3)
const valStatusBefore = computeValidationStatus(sJuan.id, per1.id);
assert(valStatusBefore.status === 'VALIDATED', 'Estado previo de validación: VALIDATED (Versión revisada coincide con actual)');

// 2. Profesor modifica una calificación de Juan Pérez
setAuthSession('usr-teacher-01');
const gradeMod = registerGrade(sJuan.id, subMath.id, per1.id, 4.75, 'Nota corregida tras sustentación adicional');
assert(gradeMod.currentVersion > valStatusBefore.currentVersion, `Versión académica incrementada de v${valStatusBefore.currentVersion} a v${gradeMod.currentVersion}`);

// 3. Verificar que la validación anterior deja de estar vigente (REVISION_REQUIRED)
const valStatusAfterMod = computeValidationStatus(sJuan.id, per1.id);
assert(valStatusAfterMod.status === 'REVISION_REQUIRED', 'Estado automáticamente cambia a REVISION_REQUIRED tras cambio del docente');
assert(valStatusAfterMod.reviewedVersion < valStatusAfterMod.currentVersion, `Versión revisada anterior (v${valStatusAfterMod.reviewedVersion}) < Versión actual (v${valStatusAfterMod.currentVersion})`);

// 4. Padre 1 consulta nuevamente y confirma la nueva versión vigente
setAuthSession('usr-parent-01');
const p1ConfirmV2 = confirmValidation(sJuan.id, per1.id);
assert(p1ConfirmV2.success, `Padre 1 confirma formalmente la nueva versión académica (v${p1ConfirmV2.validation.version_reviewed})`);

// 5. Verificar que el estado vuelve a ser VALIDATED
const valStatusFinal = computeValidationStatus(sJuan.id, per1.id);
assert(valStatusFinal.status === 'VALIDATED', 'Estado actualizado nuevamente a VALIDATED');

// 6. Comprobar que ambas validaciones permanecen en el historial
const historyJuan = db.grade_validations.filter((v) => v.student_id === sJuan.id && v.period_id === per1.id);
assert(historyJuan.length === 2, `Historial inmutable conserva ambas constancias: v${historyJuan[0].version_reviewed} y v${historyJuan[1].version_reviewed}`);


// ==============================================================================
// PARTE 5: PRUEBAS ACADÉMICAS NUMERIC(3, 2) Y LÍMITES (SECCIÓN 6)
// ==============================================================================
console.log('\n--- 5. PRUEBAS DE LÍMITES NUMÉRICOS Y RESTRICCIONES ACADÉMICAS ---');
setAuthSession('usr-teacher-01');

// Nota mínima 0.00
const testMin = registerGrade(sJuan.id, subMath.id, per2.id, 0.00);
assert(!testMin.error && testMin.grade.grade === 0.00, 'Acepta calificación mínima exacta 0.00');

// Nota máxima 5.00
const testMax = registerGrade(sJuan.id, subMath.id, per2.id, 5.00);
assert(!testMax.error && testMax.grade.grade === 5.00, 'Acepta calificación máxima exacta 5.00');

// Rechazo nota superior a 5.00
const testOver = registerGrade(sJuan.id, subMath.id, per2.id, 5.01);
assert(!!testOver.error, 'Rechazo exitoso de calificación superior a 5.00 (5.01)');

// Rechazo nota negativa
const testNegative = registerGrade(sJuan.id, subMath.id, per2.id, -0.01);
assert(!!testNegative.error, 'Rechazo exitoso de calificación negativa (-0.01)');

// Bloqueo en período cerrado (Período 4 está CLOSED)
const testClosed = registerGrade(sJuan.id, subMath.id, per4.id, 4.00);
assert(!!testClosed.error, `Bloqueo exitoso en período cerrado: "${testClosed.error}"`);


console.log(`\n================================================================`);
console.log(`RESULTADO FINAL DE PRUEBAS FUNCIONALES Y RLS: ${passed} PASARON, ${failed} FALLARON`);
console.log(`================================================================\n`);

if (failed > 0) process.exit(1);
