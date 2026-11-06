#!/usr/bin/env node
/**
 * AULA360 - Provisión Segura del Representante de Prueba (Padre Demo)
 * Utiliza el mismo flujo de invitación e inspección 1:1 que la plataforma.
 * Requiere AULA360_TEST_PARENT_EMAIL.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

// Cargar .env.local si existe
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
const testParentEmail = process.env.AULA360_TEST_PARENT_EMAIL?.trim().toLowerCase();

if (!supabaseUrl || !serviceRoleKey || supabaseUrl.includes('placeholder')) {
  console.log('[TEST-PARENT] Supabase no está configurado con credenciales remotas.');
  process.exit(0);
}

if (!testParentEmail) {
  console.log('------------------------------------------------------------');
  console.log('[AVISO] No se ha configurado la variable AULA360_TEST_PARENT_EMAIL.');
  console.log('El procedimiento está listo. Para generar la cuenta de prueba,');
  console.log('configure en .env.local: AULA360_TEST_PARENT_EMAIL=su-correo@ejemplo.com');
  console.log('------------------------------------------------------------');
  process.exit(0);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
  console.log('--- AULA360: Provisión de Representante de Prueba ---');
  console.log(`Correo configurado: ${testParentEmail}`);

  // 1. Buscar o crear estudiante de demostración 'Juan Pérez (DEMO)'
  let { data: student } = await supabaseAdmin
    .from('students')
    .select('id, first_name, last_name')
    .ilike('first_name', 'Juan')
    .ilike('last_name', '%Pérez%')
    .maybeSingle();

  if (!student) {
    console.log('Creando estudiante de demostración [DEMO] Juan Pérez...');
    const { data: newStudent, error: stErr } = await supabaseAdmin
      .from('students')
      .insert({
        first_name: 'Juan',
        last_name: 'Pérez (DEMO)',
        birth_date: '2012-05-14',
        grade: '5° Primaria',
        section: 'A',
        document_id: 'DEMO-ST-001',
        status: 'ACTIVE',
      })
      .select('id, first_name, last_name')
      .single();

    if (stErr) {
      console.error('Error creando estudiante demo:', stErr.message);
      process.exit(1);
    }
    student = newStudent;
  }
  console.log(`✓ Estudiante de prueba asignado: ${student.first_name} ${student.last_name} (${student.id})`);

  // 2. Verificar regla 1:1 en estudiante
  const { data: existingRel } = await supabaseAdmin
    .from('parent_students')
    .select('id, parent_id')
    .eq('student_id', student.id)
    .maybeSingle();

  // 3. Crear usuario en Auth con generateLink
  const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
    type: 'invite',
    email: testParentEmail,
    options: {
      data: {
        full_name: 'Padre Demo',
        role: 'PARENT',
      },
    },
  });

  let userId;
  if (!linkErr && linkData?.user) {
    userId = linkData.user.id;
    console.log(`✓ Enlace de activación generado para ${testParentEmail}.`);
  } else {
    // Si ya existía el usuario en Auth
    const { data: usersList } = await supabaseAdmin.auth.admin.listUsers();
    const u = usersList?.users.find((usr) => usr.email?.toLowerCase() === testParentEmail);
    if (u) {
      userId = u.id;
    } else {
      console.error('Error generando invitación:', linkErr?.message);
      process.exit(1);
    }
  }

  // 4. Perfil en profiles
  await supabaseAdmin.from('profiles').upsert({
    id: userId,
    email: testParentEmail,
    full_name: 'Padre Demo',
    role: 'PARENT',
    updated_at: new Date().toISOString(),
  });

  // 5. Vincular 1:1
  if (!existingRel || existingRel.parent_id === userId) {
    await supabaseAdmin.from('parent_students').upsert({
      parent_id: userId,
      student_id: student.id,
      relationship_type: 'Representante Legal (Demo)',
    });
    console.log('✓ Relación estricta 1:1 vinculada exitosamente.');
  }

  console.log('============================================================');
  console.log('¡REPRESENTANTE DE PRUEBA PREPARADO CON ÉXITO!');
  console.log(`Nombre:     Padre Demo`);
  console.log(`Email:      ${testParentEmail}`);
  console.log(`Estudiante: ${student.first_name} ${student.last_name}`);
  console.log('============================================================');
}

run().catch(console.error);
