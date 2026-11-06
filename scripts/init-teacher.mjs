#!/usr/bin/env node
/**
 * AULA360 - Inicialización Segura e Idempotente del Profesor Administrador
 * Ejecuta exclusivamente desde el entorno del servidor utilizando SUPABASE_SERVICE_ROLE_KEY.
 * No expone contraseñas en logs públicos ni crea registros duplicados.
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

// Cargar variables de .env.local si existe
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...vals] = trimmed.split('=');
    if (key && !process.env[key.trim()]) {
      process.env[key.trim()] = vals.join('=').trim();
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey || supabaseUrl.includes('placeholder')) {
  console.log('[INIT-TEACHER] Supabase no está configurado con credenciales reales todavía.');
  console.log('Por favor configure NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(0);
}

const teacherEmail = (process.env.AULA360_TEACHER_EMAIL || 'profesor.titular@aula360.edu').trim().toLowerCase();
const teacherName = (process.env.AULA360_TEACHER_NAME || 'Prof. Administrador AULA360').trim();

// Si no se proporcionó contraseña, generar una segura de 16 caracteres
let teacherPassword = process.env.AULA360_TEACHER_INITIAL_PASSWORD;
let wasPasswordGenerated = false;

if (!teacherPassword) {
  teacherPassword = crypto.randomBytes(12).toString('base64').replace(/[^a-zA-Z0-9]/g, 'X') + 'A1!';
  wasPasswordGenerated = true;
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
  console.log('--- AULA360: Inicialización del Profesor Administrador ---');

  // 1. Verificar si ya existe algún perfil con rol TEACHER
  const { data: existingTeachers, error: teacherCheckErr } = await supabaseAdmin
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('role', 'TEACHER');

  if (teacherCheckErr) {
    console.error('Error al consultar profiles:', teacherCheckErr.message);
    process.exit(1);
  }

  if (existingTeachers && existingTeachers.length > 0) {
    console.log(`✓ Ya existe un profesor administrador en la institución: ${existingTeachers[0].email} (${existingTeachers[0].full_name})`);
    console.log('✓ Idempotencia garantizada: No se crearon cuentas duplicadas.');
    return;
  }

  // 2. Verificar si el usuario ya existe en Supabase Auth
  const { data: usersList, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
  if (listErr) {
    console.error('Error al consultar auth.users:', listErr.message);
    process.exit(1);
  }

  let existingUser = usersList.users.find((u) => u.email?.toLowerCase() === teacherEmail);
  let userId;

  if (!existingUser) {
    console.log(`Creando cuenta en Supabase Auth para: ${teacherEmail}...`);
    const { data: createData, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: teacherEmail,
      password: teacherPassword,
      email_confirm: true,
      user_metadata: {
        full_name: teacherName,
        role: 'TEACHER',
      },
    });

    if (createErr) {
      console.error('Error al crear usuario en Supabase Auth:', createErr.message);
      process.exit(1);
    }

    userId = createData.user.id;
    console.log('✓ Usuario creado exitosamente en Supabase Auth.');
  } else {
    userId = existingUser.id;
    console.log(`✓ El usuario ya existía en Auth (ID: ${userId}).`);
  }

  // 3. Crear o actualizar el perfil en la tabla profiles
  const { error: profileErr } = await supabaseAdmin.from('profiles').upsert({
    id: userId,
    email: teacherEmail,
    full_name: teacherName,
    role: 'TEACHER',
    updated_at: new Date().toISOString(),
  });

  if (profileErr) {
    console.error('Error al insertar perfil en profiles:', profileErr.message);
    process.exit(1);
  }

  console.log('✓ Perfil asignado correctamente con rol TEACHER.');

  // 4. Asegurar que existe la configuración inicial de la institución
  const { data: existingSettings } = await supabaseAdmin.from('school_settings').select('id').limit(1);
  if (!existingSettings || existingSettings.length === 0) {
    await supabaseAdmin.from('school_settings').insert({
      school_name: 'Colegio AULA360',
      academic_year: '2025',
      scale_min: 0.00,
      scale_max: 5.00,
      approval_min: 3.00,
    });
    console.log('✓ Configuración escolar inicializada.');
  }

  console.log('====================================================');
  console.log('¡INICIALIZACIÓN DEL PROFESOR COMPLETADA EXITOSAMENTE!');
  console.log(`Email:    ${teacherEmail}`);
  console.log(`Nombre:   ${teacherName}`);
  console.log(`Rol:      TEACHER`);
  if (wasPasswordGenerated) {
    console.log(`Contraseña temporal generada: [Generada de forma segura]`);
  }
  console.log('Destino:  /teacher/dashboard');
  console.log('====================================================');
}

run().catch((err) => {
  console.error('Error fatal durante la inicialización:', err);
  process.exit(1);
});
