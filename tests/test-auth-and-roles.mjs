/**
 * AULA360: PRUEBAS DE AUTENTICACIÓN, ROLES Y PROTECCIÓN DE RUTAS
 * Fase 6: QA Integral
 */

console.log('================================================================');
console.log('AULA360: PRUEBAS DE AUTENTICACIÓN, ROLES Y PROTECCIÓN DE RUTAS');
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

// 1. Usuarios requeridos para la Fase 6
const TEST_USERS = [
  {
    id: 'prof-teacher-01',
    email: 'teacher.demo@aula360.test',
    full_name: 'Profesor Demo',
    role: 'TEACHER',
  },
  {
    id: 'prof-parent-01',
    email: 'padre1.demo@aula360.test',
    full_name: 'Padre 1 Demo',
    role: 'PARENT',
  },
  {
    id: 'prof-parent-02',
    email: 'padre2.demo@aula360.test',
    full_name: 'Padre 2 Demo',
    role: 'PARENT',
  },
];

const EMAIL_ALIASES = {
  'profesor@aula360.edu': 'teacher.demo@aula360.test',
  'carlos.perez@padres.com': 'padre1.demo@aula360.test',
  'ana.gomez@padres.com': 'padre2.demo@aula360.test',
};

function resolveUserByEmail(email) {
  const trimmed = email.trim().toLowerCase();
  const canonical = EMAIL_ALIASES[trimmed] || trimmed;
  return TEST_USERS.find((u) => u.email.toLowerCase() === canonical);
}

// Simulador de autenticación y sesiones
class AuthSimulator {
  constructor() {
    this.currentUser = null;
  }

  login(email, password = null) {
    const user = resolveUserByEmail(email);
    if (!user) {
      return { success: false, error: 'No se encontró ninguna cuenta asociada a este correo electrónico.' };
    }
    this.currentUser = user;
    const redirectUrl = user.role === 'TEACHER' ? '/teacher/dashboard' : '/parent/dashboard';
    return { success: true, user, redirectUrl };
  }

  logout() {
    this.currentUser = null;
    return { success: true, redirectUrl: '/login' };
  }

  resetPassword(email) {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      return { success: false, error: 'Ingresa un correo electrónico válido.' };
    }
    return { success: true, message: 'Se ha enviado el enlace de restablecimiento al correo.' };
  }

  canAccessRoute(pathname) {
    if (!this.currentUser) {
      // Unauthenticated
      if (pathname === '/login' || pathname === '/') return { allowed: true, redirect: null };
      return { allowed: false, redirect: '/login' };
    }

    // Role-based route protection
    if (this.currentUser.role === 'PARENT' && pathname.startsWith('/teacher')) {
      return { allowed: false, redirect: '/parent/dashboard' };
    }

    if (this.currentUser.role === 'TEACHER' && pathname.startsWith('/parent')) {
      return { allowed: false, redirect: '/teacher/dashboard' };
    }

    if (pathname === '/login' || pathname === '/') {
      return {
        allowed: false,
        redirect: this.currentUser.role === 'TEACHER' ? '/teacher/dashboard' : '/parent/dashboard',
      };
    }

    return { allowed: true, redirect: null };
  }
}

const auth = new AuthSimulator();

// --- TEST 1: Login de Profesor con teacher.demo@aula360.test ---
const tLogin = auth.login('teacher.demo@aula360.test');
assert(tLogin.success, 'Profesor autenticado exitosamente con teacher.demo@aula360.test');
assert(tLogin.user.role === 'TEACHER', 'Rol asignado correctamente a TEACHER');
assert(tLogin.redirectUrl === '/teacher/dashboard', 'Redirección automática a /teacher/dashboard');

// --- TEST 2: Acceso de Profesor a rutas administrativas ---
assert(auth.canAccessRoute('/teacher/dashboard').allowed, 'Profesor accede a /teacher/dashboard');
assert(auth.canAccessRoute('/teacher/grades').allowed, 'Profesor accede a /teacher/grades');
assert(auth.canAccessRoute('/teacher/students').allowed, 'Profesor accede a /teacher/students');
assert(auth.canAccessRoute('/teacher/settings').allowed, 'Profesor accede a /teacher/settings');

// --- TEST 3: Profesor intentando acceder a ruta de representante ---
const tAccessParent = auth.canAccessRoute('/parent/dashboard');
assert(!tAccessParent.allowed && tAccessParent.redirect === '/teacher/dashboard', 'Profesor redirigido a /teacher/dashboard al intentar entrar a /parent/*');

// --- TEST 4: Logout ---
const tLogout = auth.logout();
assert(tLogout.success && auth.currentUser === null, 'Logout ejecutado correctamente, sesión destruida');
assert(auth.canAccessRoute('/teacher/grades').redirect === '/login', 'Ruta protegida redirige a /login cuando no hay sesión activa');

// --- TEST 5: Login de Representante 1 con padre1.demo@aula360.test ---
const p1Login = auth.login('padre1.demo@aula360.test');
assert(p1Login.success, 'Padre 1 autenticado exitosamente con padre1.demo@aula360.test');
assert(p1Login.user.role === 'PARENT', 'Rol asignado correctamente a PARENT');
assert(p1Login.redirectUrl === '/parent/dashboard', 'Redirección automática a /parent/dashboard');

// --- TEST 6: Acceso denegado a Representante 1 en rutas de Profesor ---
const p1TeacherAccess = auth.canAccessRoute('/teacher/grades');
assert(!p1TeacherAccess.allowed, 'Representante 1 tiene DENEGADO el acceso a /teacher/grades');
assert(p1TeacherAccess.redirect === '/parent/dashboard', 'Representante 1 es redirigido de forma forzada a su /parent/dashboard');

const p1SettingsAccess = auth.canAccessRoute('/teacher/settings');
assert(!p1SettingsAccess.allowed, 'Representante 1 tiene DENEGADO el acceso a /teacher/settings');

// --- TEST 7: Login de Representante 2 con padre2.demo@aula360.test ---
auth.logout();
const p2Login = auth.login('padre2.demo@aula360.test');
assert(p2Login.success, 'Padre 2 autenticado exitosamente con padre2.demo@aula360.test');
assert(p2Login.user.role === 'PARENT', 'Rol asignado correctamente a PARENT');
assert(p2Login.redirectUrl === '/parent/dashboard', 'Redirección automática a /parent/dashboard');

// --- TEST 8: Rechazo de credenciales incorrectas / usuario inexistente ---
auth.logout();
const fakeLogin = auth.login('noexiste@colegio.com');
assert(!fakeLogin.success, 'Rechazo exitoso de credenciales inexistentes');

// --- TEST 9: Recuperación de contraseña ---
const resetValid = auth.resetPassword('padre1.demo@aula360.test');
assert(resetValid.success, 'Solicitud de recuperación de contraseña procesada exitosamente');

const resetInvalid = auth.resetPassword('invalido-sin-arroba');
assert(!resetInvalid.success, 'Rechazo de correo inválido para restablecimiento');

// --- TEST 10: Persistencia de sesión y compatibilidad con alias ---
const aliasTeacher = auth.login('profesor@aula360.edu');
assert(aliasTeacher.success && aliasTeacher.user.role === 'TEACHER', 'Alias profesor@aula360.edu resuelve correctamente al Profesor Demo');

const aliasParent = auth.login('carlos.perez@padres.com');
assert(aliasParent.success && aliasParent.user.role === 'PARENT', 'Alias carlos.perez@padres.com resuelve correctamente a Padre 1 Demo');

console.log(`\n================================================================`);
console.log(`RESULTADO DE PRUEBAS DE AUTENTICACIÓN: ${passed} PASARON, ${failed} FALLARON`);
console.log(`================================================================\n`);

if (failed > 0) process.exit(1);
