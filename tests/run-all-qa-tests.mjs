/**
 * AULA360: RUNNER GLOBAL DE PRUEBAS DE CALIDAD (QA INTEGRAL)
 * Fase 6: QA, Auditoría y Pruebas Integrales
 */

import { execSync } from 'child_process';

console.log('================================================================');
console.log('   AULA360 — SUITE MAESTRA DE QA, AUDITORÍA Y VERIFICACIÓN');
console.log('================================================================\n');

const testSuites = [
  { name: '1. Verificación Arquitectónica Definitiva', file: 'tests/verify-architecture.mjs' },
  { name: '2. Backend, Seguridad y Políticas RLS', file: 'tests/test-backend-security.mjs' },
  { name: '3. Autenticación, Roles y Protección de Rutas', file: 'tests/test-auth-and-roles.mjs' },
  { name: '4. Escenarios Funcionales y Flujo Completo', file: 'tests/test-functional-scenarios.mjs' },
  { name: '5. Flujo del Motor Académico (14 Pasos)', file: 'tests/test-academic-engine-flow.mjs' },
  { name: '6. Evaluaciones Parciales y Reportes PDF', file: 'tests/test-evaluations-and-reports.mjs' },
  { name: '7. Configuración de Despliegue en Cloudflare', file: 'tests/test-production-deployment.mjs' },
];

let totalPassedSuites = 0;
let totalFailedSuites = 0;
const results = [];

const startTime = Date.now();

for (const suite of testSuites) {
  process.stdout.write(`Ejecutando ${suite.name}... `);
  try {
    const output = execSync(`node ${suite.file}`, { encoding: 'utf-8', stdio: 'pipe' });
    console.log('✓ APROBADO');
    totalPassedSuites++;
    results.push({ name: suite.name, status: 'APROBADO', error: null });
  } catch (err) {
    console.log('✗ FALLIDO');
    totalFailedSuites++;
    results.push({ name: suite.name, status: 'FALLIDO', error: err.stdout || err.message });
  }
}

const duration = ((Date.now() - startTime) / 1000).toFixed(2);

console.log('\n================================================================');
console.log('   RESUMEN EJECUTIVO DE QA Y AUDITORÍA');
console.log('================================================================\n');

console.table(results.map(r => ({ 'Suite de Pruebas': r.name, 'Estado QA': r.status })));

console.log(`Suites Aprobadas: ${totalPassedSuites}/${testSuites.length}`);
console.log(`Suites Fallidas:  ${totalFailedSuites}/${testSuites.length}`);
console.log(`Tiempo Total:     ${duration}s\n`);

if (totalFailedSuites > 0) {
  console.error('ERROR: Existen suites con fallos. Revisar registros antes de pase a producción.');
  process.exit(1);
} else {
  console.log('¡TODAS LAS SUITES DE PRUEBAS DE CALIDAD HAN SIDO APROBADAS SATISFACTORIAMENTE!');
}
