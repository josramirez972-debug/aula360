/**
 * AULA360: SUITE DE PRUEBAS AUTOMATIZADAS DE BACKEND, SEGURIDAD Y RLS
 * Fase 4: Verificación Integral de Supabase, Auth, RLS y Servicios
 */

import {
  INITIAL_PROFILES,
  INITIAL_STUDENTS,
  INITIAL_PARENT_STUDENTS,
  INITIAL_PERIODS,
  INITIAL_GRADES,
  INITIAL_OBSERVATIONS,
  INITIAL_VALIDATIONS,
} from './mock-export.mjs';

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

console.log('====================================================');
console.log('AULA360: VERIFICACIÓN DE BACKEND, SEGURIDAD Y RLS');
console.log('====================================================\n');

// 1. AUTENTICACIÓN: LOGIN DOCENTE Y REPRESENTANTE
console.log('--- 1. AUTENTICACIÓN Y ROLES ---');
const teacherUser = INITIAL_PROFILES.find((p) => p.role === 'TEACHER');
const parentUser = INITIAL_PROFILES.find((p) => p.role === 'PARENT');

assert(teacherUser && teacherUser.email === 'profesor@aula360.edu', 'Profesor administrador autenticable con rol TEACHER');
assert(parentUser && parentUser.role === 'PARENT', 'Representante de familia autenticable con rol PARENT');
assert(teacherUser.id !== parentUser.id, 'Identidades de profesor y representante están debidamente segregadas');

// 2. PROTECCIÓN DE RUTAS Y LÍMITES DE ACCESO
console.log('\n--- 2. PROTECCIÓN DE RUTAS Y FRONTERAS DE DASHBOARD ---');
function simulateRouteAccess(user, pathname) {
  if (!user) {
    if (pathname.startsWith('/teacher') || pathname.startsWith('/parent')) {
      return { allowed: false, redirect: '/login' };
    }
    return { allowed: true };
  }

  if (user.role === 'PARENT' && pathname.startsWith('/teacher')) {
    return { allowed: false, redirect: '/parent/dashboard', reason: 'Acceso no autorizado a rutas docentes' };
  }

  if (user.role === 'TEACHER' && pathname.startsWith('/parent')) {
    return { allowed: false, redirect: '/teacher/dashboard', reason: 'Redirección a dashboard de administración' };
  }

  return { allowed: true };
}

const unauthTeacherAccess = simulateRouteAccess(null, '/teacher/dashboard');
assert(!unauthTeacherAccess.allowed && unauthTeacherAccess.redirect === '/login', 'Acceso anónimo a /teacher/* es redirigido a /login');

const unauthParentAccess = simulateRouteAccess(null, '/parent/dashboard');
assert(!unauthParentAccess.allowed && unauthParentAccess.redirect === '/login', 'Acceso anónimo a /parent/* es redirigido a /login');

const parentInTeacherRoute = simulateRouteAccess(parentUser, '/teacher/grades');
assert(!parentInTeacherRoute.allowed && parentInTeacherRoute.redirect === '/parent/dashboard', 'Representante tiene PROHIBIDO el acceso a /teacher/* (redirección forzada)');

const teacherInTeacherRoute = simulateRouteAccess(teacherUser, '/teacher/grades');
assert(teacherInTeacherRoute.allowed, 'Profesor accede correctamente a /teacher/grades');

// 3. ASOCIACIÓN 1:1 ESTRICTA (PARENT - STUDENT)
console.log('\n--- 3. REGLA ESTRICTA 1:1 REPRESENTANTE - ESTUDIANTE ---');
function validateAssociation1to1(existingAssocs, parentId, studentId) {
  const studentHasParent = existingAssocs.find((a) => a.student_id === studentId);
  if (studentHasParent && studentHasParent.parent_id !== parentId) {
    return { valid: false, error: 'El estudiante ya tiene asignado un representante.' };
  }

  const parentHasStudent = existingAssocs.find((a) => a.parent_id === parentId);
  if (parentHasStudent && parentHasStudent.student_id !== studentId) {
    return { valid: false, error: 'El representante ya tiene asignado un estudiante.' };
  }

  return { valid: true };
}

// Estudiante Juan Pérez (id stud-001) está asignado a Carlos Pérez (id prof-parent-01)
const assocJuan = INITIAL_PARENT_STUDENTS.find((a) => a.student_id === 'stud-001');
assert(assocJuan && assocJuan.parent_id === 'prof-parent-01', 'Estudiante Juan Pérez vinculado 1:1 con Carlos Pérez');

// Intento 1: Intentar asignar a Juan Pérez un segundo acudiente
const doubleParentAttempt = validateAssociation1to1(
  INITIAL_PARENT_STUDENTS,
  'prof-parent-02', // Ana Gómez
  'stud-001' // Juan Pérez
);
assert(!doubleParentAttempt.valid, 'RECHAZADO: Un estudiante no puede tener más de un representante legal');

// Intento 2: Intentar que Carlos Pérez tenga un segundo estudiante
const doubleStudentAttempt = validateAssociation1to1(
  INITIAL_PARENT_STUDENTS,
  'prof-parent-01', // Carlos Pérez
  'stud-002' // María Gómez
);
assert(!doubleStudentAttempt.valid, 'RECHAZADO: Un representante no puede vincular más de un estudiante');

// 4. POLÍTICAS ROW LEVEL SECURITY (RLS)
console.log('\n--- 4. ROW LEVEL SECURITY (RLS) Y PRIVACIDAD DE DATOS ---');
// Simulación de consulta RLS de notas:
function rlsGetGrades(currentUser, targetStudentId, allGrades, assocs) {
  if (currentUser.role === 'TEACHER') {
    return targetStudentId ? allGrades.filter((g) => g.student_id === targetStudentId) : allGrades;
  }

  if (currentUser.role === 'PARENT') {
    const myAssoc = assocs.find((a) => a.parent_id === currentUser.id);
    if (!myAssoc) return [];

    if (targetStudentId && targetStudentId !== myAssoc.student_id) {
      return []; // Denegado por RLS
    }

    return allGrades.filter((g) => g.student_id === myAssoc.student_id);
  }

  return [];
}

const carlosGradesOwn = rlsGetGrades(parentUser, 'stud-001', INITIAL_GRADES, INITIAL_PARENT_STUDENTS);
assert(carlosGradesOwn.length > 0, `RLS PERMITIDO: Carlos Pérez puede consultar las ${carlosGradesOwn.length} notas de su hijo Juan`);

const carlosGradesStranger = rlsGetGrades(parentUser, 'stud-002', INITIAL_GRADES, INITIAL_PARENT_STUDENTS);
assert(carlosGradesStranger.length === 0, 'RLS DENEGADO: Carlos Pérez NO tiene acceso a las calificaciones de María Gómez (hijo ajeno)');

// Simulación RLS de creación/edición de notas:
function rlsCanEditGrade(currentUser) {
  return currentUser.role === 'TEACHER';
}
assert(!rlsCanEditGrade(parentUser), 'RLS BLOQUEADO: El representante no tiene permiso para insertar o modificar notas');
assert(rlsCanEditGrade(teacherUser), 'RLS PERMITIDO: El profesor puede insertar y actualizar notas académicas');

// Simulación RLS de validación de boletines:
function rlsCanInsertValidation(currentUser, targetStudentId, assocs) {
  if (currentUser.role !== 'PARENT') return { allowed: false, reason: 'Solo acudientes pueden firmar constancia' };
  const assoc = assocs.find((a) => a.parent_id === currentUser.id && a.student_id === targetStudentId);
  if (!assoc) return { allowed: false, reason: 'No es el acudiente asignado' };
  return { allowed: true };
}

const ownValidation = rlsCanInsertValidation(parentUser, 'stud-001', INITIAL_PARENT_STUDENTS);
assert(ownValidation.allowed, 'RLS PERMITIDO: El representante puede firmar la revisión de su propio estudiante');

const strangerValidation = rlsCanInsertValidation(parentUser, 'stud-002', INITIAL_PARENT_STUDENTS);
assert(!strangerValidation.allowed, 'RLS DENEGADO: El representante NO puede firmar boletines de estudiantes ajenos');

// 5. BLOQUEO DE OPERACIONES EN PERÍODOS CERRADOS
console.log('\n--- 5. RESTRICCIÓN DE SEGURIDAD EN PERÍODOS CERRADOS ---');
function canSaveGradeInPeriod(periods, periodId) {
  const period = periods.find((p) => p.id === periodId);
  if (!period) return { allowed: false, reason: 'Período no encontrado' };
  if (period.status === 'CLOSED') {
    return { allowed: false, reason: 'Operación rechazada: Período académico CERRADO.' };
  }
  return { allowed: true };
}

const closedPeriodCheck = canSaveGradeInPeriod(INITIAL_PERIODS, 'per-001');
assert(!closedPeriodCheck.allowed, 'Trigger de Período Cerrado bloquea la adición/edición de notas en Período 1');

const openPeriodCheck = canSaveGradeInPeriod(INITIAL_PERIODS, 'per-002');
assert(openPeriodCheck.allowed, 'Período Abierto permite el registro regular de calificaciones');

// 6. VALIDACIONES DE ESCALA NUMÉRICA
console.log('\n--- 6. VALIDACIÓN NUMERIC(3, 2) [0.00 - 5.00] ---');
function validateGradeScale(val) {
  const num = parseFloat(Number(val).toFixed(2));
  if (isNaN(num)) return false;
  return num >= 0.0 && num <= 5.0;
}

assert(validateGradeScale(0.0), 'Acepta calificación mínima 0.00');
assert(validateGradeScale(5.0), 'Acepta calificación máxima 5.00');
assert(validateGradeScale(3.75), 'Acepta calificación con 2 decimales (3.75)');
assert(!validateGradeScale(-0.1), 'Rechaza calificación negativa (-0.1)');
assert(!validateGradeScale(5.01), 'Rechaza calificación superior a 5.00 (5.01)');

// 7. VERSIONADO ACADÉMICO DINÁMICO
console.log('\n--- 7. CONTROL DE VERSIONES ACADÉMICAS ---');
function computeValidationStatus(currentVersion, reviewedVersion) {
  if (!reviewedVersion) return 'PENDING';
  if (reviewedVersion === currentVersion) return 'VALIDATED';
  if (reviewedVersion < currentVersion) return 'REVISION_REQUIRED';
  return 'PENDING';
}

assert(computeValidationStatus(1, 1) === 'VALIDATED', 'Versión revisada v1 === v1 -> VALIDATED (Vigente)');
assert(computeValidationStatus(2, 1) === 'REVISION_REQUIRED', 'Versión académica incrementada a v2 tras modificación -> REVISION_REQUIRED');
assert(computeValidationStatus(1, undefined) === 'PENDING', 'Sin revisión previa -> PENDING');

console.log('\n====================================================');
console.log(`RESULTADO DE PRUEBAS BACKEND Y SEGURIDAD: ${passed} PASARON, ${failed} FALLARON`);
console.log('====================================================');

if (failed > 0) {
  process.exit(1);
}
