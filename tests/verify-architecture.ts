import { DataProvider, resetDataStore } from '../src/lib/data-provider';

// Automated Test Runner for Mandatory Architectural Criteria (Section 11)
function runArchitecturalVerification() {
  console.log('====================================================');
  console.log('AULA360: VERIFICACIÓN ARQUITECTÓNICA DEFINITIVA');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(description: string, condition: boolean, detail = '') {
    if (condition) {
      console.log(`✓ [PASÓ] ${description}`);
      passed++;
    } else {
      console.error(`✗ [FALLÓ] ${description} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  // 1. Mono-institución y un único profesor administrador
  const profiles = DataProvider.getProfiles();
  const teachers = profiles.filter((p) => p.role === 'TEACHER');
  assert('Existe un único profesor administrador en la institución', teachers.length === 1);

  // 2. Relación estricta 1:1 representante-estudiante
  const parentStudents = DataProvider.getParentStudents();
  const parentIds = parentStudents.map((ps) => ps.parent_id);
  const studentIds = parentStudents.map((ps) => ps.student_id);
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

  // Intentar vincular un representante ya ocupado a otro estudiante debe ser rechazado
  const dummyParentId = parentIds[0];
  const dummyStudentId = 'stud-999';
  const invalidAssoc = DataProvider.associateParentStudent(dummyParentId, dummyStudentId);
  assert(
    'Rechazo de asociación si el representante ya tiene un estudiante (Restricción 1:1)',
    !invalidAssoc.success
  );

  // 3. Cuatro períodos académicos configurables
  const periods = DataProvider.getPeriods();
  assert('Existen exactamente 4 períodos académicos configurados', periods.length === 4);

  // 4. Bloqueo de modificaciones en períodos cerrados
  const closedPeriod = periods.find((p) => p.status === 'CLOSED');
  assert('Existe al menos un período en estado CERRADO para control', Boolean(closedPeriod));

  if (closedPeriod) {
    const closedGradeAttempt = DataProvider.saveGrade({
      student_id: 'stud-001',
      subject_id: 'subj-001',
      period_id: closedPeriod.id,
      grade: 4.50,
      observation: 'Intento en período cerrado',
    });
    assert(
      'Las modificaciones ordinarias de notas en períodos CERRADOS son bloqueadas',
      Boolean(closedGradeAttempt.error)
    );
  }

  // 5. Escala de calificaciones NUMERIC(3, 2): 0.00 a 5.00
  const invalidHighGrade = DataProvider.saveGrade({
    student_id: 'stud-001',
    subject_id: 'subj-001',
    period_id: 'per-002', // Open period
    grade: 5.50,
  });
  assert('Rechazo de notas superiores a 5.00', Boolean(invalidHighGrade.error));

  const invalidLowGrade = DataProvider.saveGrade({
    student_id: 'stud-001',
    subject_id: 'subj-001',
    period_id: 'per-002',
    grade: -1.00,
  });
  assert('Rechazo de notas inferiores a 0.00', Boolean(invalidLowGrade.error));

  // 6. Cálculo dinámico de promedio ponderado (no manual)
  const p1Avg = DataProvider.calculateStudentPeriodAverage('stud-001', 'per-001');
  assert(
    'Cálculo dinámico de promedio ponderado (suma / total materias evaluadas)',
    p1Avg.count > 0 && p1Avg.average > 0
  );

  // 7. Sistema de control de versiones académicas e invalidación de revisión
  // Carlos Rodríguez (stud-003) en per-001 tiene versión 2, pero Laura Rodríguez validó versión 1
  const vStatus = DataProvider.computeValidationStatus('stud-003', 'per-001', 'prof-parent-03');
  assert(
    'Estado REVISION_REQUIRED cuando la versión actual supera la versión revisada',
    vStatus.status === 'REVISION_REQUIRED' && vStatus.currentVersion > (vStatus.reviewedVersion || 0)
  );

  // 8. Confirmación de revisión de la nueva versión académica
  const confirmResult = DataProvider.confirmValidation('stud-003', 'per-001', 'prof-parent-03');
  assert('Confirmación de revisión registra versión actual', confirmResult.version_reviewed === vStatus.currentVersion);

  const updatedVStatus = DataProvider.computeValidationStatus('stud-003', 'per-001', 'prof-parent-03');
  assert('Estado cambia a VALIDATED tras confirmar la versión vigente', updatedVStatus.status === 'VALIDATED');

  // 9. Modificación de nota incrementa versión e invalida confirmación
  const openPeriod = periods.find((p) => p.status === 'OPEN');
  if (openPeriod) {
    // Parent confirms
    DataProvider.confirmValidation('stud-001', openPeriod.id, 'prof-parent-01');
    const statusBefore = DataProvider.computeValidationStatus('stud-001', openPeriod.id, 'prof-parent-01');
    assert('Confirmación previa en estado VALIDATED', statusBefore.status === 'VALIDATED');

    // Teacher modifies grade in open period
    DataProvider.saveGrade({
      student_id: 'stud-001',
      subject_id: 'subj-001',
      period_id: openPeriod.id,
      grade: 4.95,
      observation: 'Actualización docente que dispara incremento de versión',
    });

    const statusAfter = DataProvider.computeValidationStatus('stud-001', openPeriod.id, 'prof-parent-01');
    assert(
      'La modificación docente incrementa la versión académica e invalida la revisión anterior (Pasa a REVISION_REQUIRED)',
      statusAfter.status === 'REVISION_REQUIRED' && statusAfter.currentVersion > statusBefore.currentVersion
    );
  }

  // 10. Auditoría inmutable de eventos
  const auditLogs = DataProvider.getAuditLogs();
  assert('Las operaciones críticas quedan registradas en audit_logs', auditLogs.length > 0);

  // 11. Identidad institucional en school_settings
  const settings = DataProvider.getSchoolSettings();
  assert('Configuración institucional cargada con nombre y docente administrador', Boolean(settings.school_name && settings.teacher_name));

  console.log('\n====================================================');
  console.log(`RESULTADO DE PRUEBAS: ${passed} PASARON, ${failed} FALLARON`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runArchitecturalVerification();
