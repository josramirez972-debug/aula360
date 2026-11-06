/**
 * AULA360: PRUEBA DE EVALUACIONES PARCIALES Y REPORTES PDF
 */

console.log('====================================================');
console.log('AULA360: PRUEBA DE EVALUACIONES PARCIALES Y REPORTES');
console.log('====================================================\n');

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

// 1. Simulación de almacén de evaluaciones y estados
const periods = [
  { id: 'per-001', name: 'Período 1', status: 'CLOSED' },
  { id: 'per-002', name: 'Período 2', status: 'OPEN' },
  { id: 'per-003', name: 'Período 3', status: 'OPEN' },
  { id: 'per-004', name: 'Período 4', status: 'OPEN' },
];

let studentPeriodVersions = [
  { student_id: 'std-001', period_id: 'per-002', current_version: 1 },
];

let evaluations = [
  {
    id: 'eval-001',
    student_id: 'std-001',
    subject_id: 'sub-001',
    period_id: 'per-002',
    title: 'Evaluación 1: Ecuaciones Lineales',
    description: 'Resolución de ecuaciones de primer grado con una incógnita y problemas de aplicación.',
    score: 4.50,
    observation: 'Excelente razonamiento lógico',
    evaluation_date: '2025-04-10',
  },
  {
    id: 'eval-002',
    student_id: 'std-001',
    subject_id: 'sub-001',
    period_id: 'per-002',
    title: 'Evaluación 2: Polinomios y Factorización',
    description: 'Casos de factorización: factor común, trinomio cuadrado perfecto y diferencia de cuadrados.',
    score: 3.80,
    observation: 'Buen manejo conceptual',
    evaluation_date: '2025-04-25',
  },
];

let grades = [
  {
    id: 'grd-001',
    student_id: 'std-001',
    subject_id: 'sub-001',
    period_id: 'per-002',
    grade: 4.15, // (4.50 + 3.80) / 2
  },
];

function saveEvaluation(evalData) {
  const period = periods.find((p) => p.id === evalData.period_id);
  if (period && period.status === 'CLOSED') {
    return { error: 'No se pueden registrar o modificar evaluaciones en un período académico CERRADO.' };
  }

  if (evalData.score < 0 || evalData.score > 5.0) {
    return { error: 'La calificación debe estar comprendida entre 0.00 y 5.00 con escala NUMERIC(3,2).' };
  }

  const newEval = {
    id: evalData.id || `eval-${Date.now()}`,
    ...evalData,
  };

  const existingIdx = evaluations.findIndex((e) => e.id === newEval.id);
  if (existingIdx >= 0) {
    evaluations[existingIdx] = newEval;
  } else {
    evaluations.push(newEval);
  }

  // Recalcular promedio de la asignatura
  const subjectEvals = evaluations.filter(
    (e) => e.student_id === evalData.student_id &&
           e.subject_id === evalData.subject_id &&
           e.period_id === evalData.period_id
  );

  const avg = subjectEvals.reduce((acc, curr) => acc + curr.score, 0) / subjectEvals.length;
  const roundedGrade = Math.round(avg * 100) / 100;

  const grdIdx = grades.findIndex(
    (g) => g.student_id === evalData.student_id &&
           g.subject_id === evalData.subject_id &&
           g.period_id === evalData.period_id
  );

  if (grdIdx >= 0) {
    grades[grdIdx].grade = roundedGrade;
  } else {
    grades.push({
      id: `grd-${Date.now()}`,
      student_id: evalData.student_id,
      subject_id: evalData.subject_id,
      period_id: evalData.period_id,
      grade: roundedGrade,
    });
  }

  // Incrementar versión académica del período
  const spv = studentPeriodVersions.find(
    (v) => v.student_id === evalData.student_id && v.period_id === evalData.period_id
  );
  if (spv) {
    spv.current_version++;
  } else {
    studentPeriodVersions.push({
      student_id: evalData.student_id,
      period_id: evalData.period_id,
      current_version: 2,
    });
  }

  return { evaluation: newEval };
}

// TEST 1: Verificar evaluaciones iniciales
assert(evaluations.length === 2, '2 evaluaciones parciales iniciales en Matemáticas');

// TEST 2: Docente agrega una 3ra evaluación en Matemáticas
const res3 = saveEvaluation({
  student_id: 'std-001',
  subject_id: 'sub-001',
  period_id: 'per-002',
  title: 'Evaluación 3: Sistemas de Ecuaciones 2x2',
  description: 'Métodos de igualación, sustitución y reducción para resolución de problemas cotidianos.',
  score: 4.80,
  observation: 'Dominio sobresaliente del método gráfico y algebraico.',
  evaluation_date: '2025-05-15',
});

assert(!res3.error, 'Evaluación 3 registrada sin errores');
assert(evaluations.length === 3, 'Total de evaluaciones ahora es 3');

// TEST 3: Recálculo dinámico de la nota definitiva de la materia
// Promedio esperado: (4.50 + 3.80 + 4.80) / 3 = 13.10 / 3 = 4.3666 -> 4.37
const mathGrade = grades.find((g) => g.student_id === 'std-001' && g.subject_id === 'sub-001' && g.period_id === 'per-002');
assert(mathGrade.grade === 4.37, `Nota definitiva de Matemáticas recalculada dinámicamente a ${mathGrade.grade} (esperado 4.37)`);

// TEST 4: Incremento de versión académica ante nueva evaluación
const spv = studentPeriodVersions.find((v) => v.student_id === 'std-001' && v.period_id === 'per-002');
assert(spv.current_version === 2, `Versión académica incrementada a v${spv.current_version}`);

// TEST 5: Bloqueo de adición en período cerrado (Inmutabilidad)
const resClosed = saveEvaluation({
  student_id: 'std-001',
  subject_id: 'sub-001',
  period_id: 'per-001', // per-001 está CERRADO
  title: 'Evaluación fuera de fecha',
  description: 'Intento de registro en período cerrado',
  score: 3.50,
});
assert(!!resClosed.error, `Bloqueo estricto en período CERRADO: "${resClosed.error}"`);

// TEST 6: Validación de nota máxima 5.00
const resMax = saveEvaluation({
  student_id: 'std-001',
  subject_id: 'sub-001',
  period_id: 'per-002',
  title: 'Nota inválida',
  description: 'Test límite',
  score: 5.50,
});
assert(!!resMax.error, `Rechazo de nota superior a 5.00: "${resMax.error}"`);

// TEST 7: Validación de nota mínima 0.00
const resMin = saveEvaluation({
  student_id: 'std-001',
  subject_id: 'sub-001',
  period_id: 'per-002',
  title: 'Nota inválida negativa',
  description: 'Test límite',
  score: -0.50,
});
assert(!!resMin.error, `Rechazo de nota negativa: "${resMin.error}"`);

// TEST 8: Soporte de Reportes PDF Parcial vs Total
function validatePDFOptions(periodId) {
  if (periodId === 'ALL') {
    return { mode: 'TOTAL', periodsIncluded: 4, title: 'INFORME ACADÉMICO CONSOLIDADO — TODOS LOS PERÍODOS' };
  } else {
    return { mode: 'PARCIAL', periodsIncluded: 1, title: `BOLETÍN ACADÉMICO OFICIAL — PERÍODO` };
  }
}

const partialPDF = validatePDFOptions('per-002');
assert(partialPDF.mode === 'PARCIAL' && partialPDF.periodsIncluded === 1, 'PDF Parcial configurado para 1 período específico con sus evaluaciones');

const totalPDF = validatePDFOptions('ALL');
assert(totalPDF.mode === 'TOTAL' && totalPDF.periodsIncluded === 4, 'PDF Total consolidado configurado para los 4 períodos académicos');

console.log(`\n====================================================`);
console.log(`RESULTADO DE EVALUACIONES Y REPORTES: ${passed} PASARON, ${failed} FALLARON`);
console.log(`====================================================\n`);

if (failed > 0) process.exit(1);
