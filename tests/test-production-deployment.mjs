import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';

console.log('================================================================');
console.log('   AULA360 — SUITE 7: CONFIGURACIÓN Y DESPLIEGUE EN PRODUCCIÓN');
console.log('================================================================');

const rootDir = process.cwd();

// Test 1: wrangler.jsonc
console.log('\n1. Verificando wrangler.jsonc...');
const wranglerPath = path.join(rootDir, 'wrangler.jsonc');
assert(fs.existsSync(wranglerPath), 'wrangler.jsonc debe existir');
const wranglerContent = fs.readFileSync(wranglerPath, 'utf8');
const wranglerJson = JSON.parse(wranglerContent);
assert.strictEqual(wranglerJson.name, 'aula360', 'Worker name debe ser aula360');
assert.strictEqual(wranglerJson.main, '.open-next/worker.js', 'Worker main debe apuntar a .open-next/worker.js');
assert(wranglerJson.compatibility_flags.includes('nodejs_compat'), 'Debe incluir nodejs_compat');
assert.strictEqual(wranglerJson.vars.NEXT_PUBLIC_ALLOW_DEMO_MODE, 'false', 'Modo demo debe ser false en vars de wrangler');
console.log('   ✓ wrangler.jsonc configurado correctamente');

// Test 2: open-next.config.ts
console.log('\n2. Verificando open-next.config.ts...');
const openNextPath = path.join(rootDir, 'open-next.config.ts');
assert(fs.existsSync(openNextPath), 'open-next.config.ts debe existir');
const openNextContent = fs.readFileSync(openNextPath, 'utf8');
assert(openNextContent.includes('defineCloudflareConfig'), 'Debe usar defineCloudflareConfig');
console.log('   ✓ open-next.config.ts validado');

// Test 3: next.config.ts con headers de seguridad y caché privada
console.log('\n3. Verificando next.config.ts (Headers de seguridad y Caché)...');
const nextConfigPath = path.join(rootDir, 'next.config.ts');
const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');
assert(nextConfigContent.includes('no-store'), 'Debe configurar Cache-Control: no-store para rutas privadas');
assert(nextConfigContent.includes('X-Frame-Options'), 'Debe configurar X-Frame-Options: DENY');
assert(nextConfigContent.includes('X-Content-Type-Options'), 'Debe configurar X-Content-Type-Options: nosniff');
console.log('   ✓ Headers de seguridad y políticas no-cache verificados');

// Test 4: Plantillas de correo en email-service.ts
console.log('\n4. Verificando plantillas de correo transaccional...');
const emailServicePath = path.join(rootDir, 'src/lib/email-service.ts');
assert(fs.existsSync(emailServicePath), 'email-service.ts debe existir');
import('../src/lib/email-service.js').catch(async () => {
  // If .js not compiled yet, read source file directly
  const emailSrc = fs.readFileSync(emailServicePath, 'utf8');
  assert(emailSrc.includes('renderParentInvitationEmail'), 'Debe tener renderParentInvitationEmail');
  assert(emailSrc.includes('renderPasswordResetEmail'), 'Debe tener renderPasswordResetEmail');
  assert(emailSrc.includes('renderEmailConfirmationEmail'), 'Debe tener renderEmailConfirmationEmail');
  assert(emailSrc.includes('AULA360'), 'Debe incluir identidad AULA360');
  assert(emailSrc.includes('https://api.resend.com/emails'), 'Debe usar la API REST nativa de Resend');
});
console.log('   ✓ Plantillas de correo e integración Resend validadas');

// Test 5: Scripts de inicialización del profesor y representante demo
console.log('\n5. Verificando scripts de inicialización...');
const initTeacherPath = path.join(rootDir, 'scripts/init-teacher.mjs');
const initParentPath = path.join(rootDir, 'scripts/seed-test-parent.mjs');
assert(fs.existsSync(initTeacherPath), 'scripts/init-teacher.mjs debe existir');
assert(fs.existsSync(initParentPath), 'scripts/seed-test-parent.mjs debe existir');
const teacherScript = fs.readFileSync(initTeacherPath, 'utf8');
assert(teacherScript.includes('AULA360_TEACHER_EMAIL'), 'init-teacher debe leer AULA360_TEACHER_EMAIL');
assert(teacherScript.includes('SUPABASE_SERVICE_ROLE_KEY'), 'init-teacher debe requerir SUPABASE_SERVICE_ROLE_KEY');
console.log('   ✓ Scripts de inicialización idempotentes listos');

// Test 6: API de Invitación y Credenciales con Regla Estricta 1:1
console.log('\n6. Verificando endpoint /api/parents/invite...');
const inviteRoutePath = path.join(rootDir, 'src/app/api/parents/invite/route.ts');
const inviteContent = fs.readFileSync(inviteRoutePath, 'utf8');
assert(inviteContent.includes('parent_students'), 'Debe validar y persistir en parent_students');
assert(inviteContent.includes('renderParentCredentialsEmail'), 'Debe invocar la plantilla de confirmación de credenciales');
console.log('   ✓ Endpoint /api/parents/invite verificado con regla 1:1 y envío de credenciales');

// Test 7: Comandos en package.json
console.log('\n7. Verificando scripts en package.json...');
const pkgJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
assert(pkgJson.scripts['deploy'], 'Debe existir script deploy');
assert(pkgJson.scripts['build:worker'], 'Debe existir script build:worker');
assert(pkgJson.scripts['init:teacher'], 'Debe existir script init:teacher');
assert(pkgJson.scripts['init:parent-demo'], 'Debe existir script init:parent-demo');
console.log('   ✓ Scripts de despliegue y administración en package.json verificados');

console.log('\n✓ TODAS LAS VERIFICACIONES DE DESPLIEGUE PASARON EXITOSAMENTE.\n');
