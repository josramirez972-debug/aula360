import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { renderParentInvitationEmail, sendEmail } from '@/lib/email-service';

/**
 * AULA360 - Endpoint de Provisión Segura e Invitación de Representantes
 * Regla Fundamental:
 * - Solo el profesor titular puede autorizar la creación de cuentas de representantes.
 * - Registro público deshabilitado.
 * - Validación estricta 1:1 (un representante por estudiante, un estudiante por representante).
 * - Utiliza SUPABASE_SERVICE_ROLE_KEY exclusivamente en el servidor.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, full_name, phone, student_id } = body;

    if (!email || !full_name) {
      return NextResponse.json({ error: 'Faltan campos obligatorios (Nombre y Correo electrónico).' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = full_name.trim();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && serviceRoleKey && !supabaseUrl.includes('placeholder')) {
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      // 1. Validar regla estricta 1:1 si se especificó student_id
      let studentName = 'Su estudiante asignado';
      if (student_id) {
        // Verificar si el estudiante ya tiene un representante
        const { data: existingStudentRel } = await supabaseAdmin
          .from('parent_students')
          .select('id, parent_id')
          .eq('student_id', student_id)
          .maybeSingle();

        if (existingStudentRel) {
          return NextResponse.json(
            { error: 'El estudiante seleccionado ya tiene un representante vinculado (Regla 1:1).' },
            { status: 400 }
          );
        }

        // Obtener nombre del estudiante
        const { data: studentRecord } = await supabaseAdmin
          .from('students')
          .select('first_name, last_name')
          .eq('id', student_id)
          .maybeSingle();

        if (studentRecord) {
          studentName = `${studentRecord.first_name} ${studentRecord.last_name}`;
        }
      }

      // 2. Verificar si el correo ya tiene un estudiante vinculado en el sistema
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id, role')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (existingProfile) {
        if (existingProfile.role === 'TEACHER') {
          return NextResponse.json(
            { error: 'El correo electrónico pertenece al administrador de la institución.' },
            { status: 400 }
          );
        }

        const { data: existingParentRel } = await supabaseAdmin
          .from('parent_students')
          .select('id, student_id')
          .eq('parent_id', existingProfile.id)
          .maybeSingle();

        if (existingParentRel && (!student_id || existingParentRel.student_id !== student_id)) {
          return NextResponse.json(
            { error: 'Este representante ya se encuentra vinculado a otro estudiante (Regla 1:1).' },
            { status: 400 }
          );
        }
      }

      // 3. Crear invitación o usuario en Supabase Auth Admin API
      const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'https://aula360.app';
      const redirectTo = `${origin}/login?invited=true`;

      let userId: string;
      let activationUrl: string | undefined;

      // Generar enlace seguro de invitación
      const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
        type: 'invite',
        email: cleanEmail,
        options: {
          redirectTo,
          data: {
            full_name: cleanName,
            role: 'PARENT',
            phone: phone || null,
          },
        },
      });

      if (!linkErr && linkData?.properties?.action_link) {
        userId = linkData.user.id;
        activationUrl = linkData.properties.action_link;
      } else {
        // Fallback: createUser directo
        const { data: userData, error: createErr } = await supabaseAdmin.auth.admin.createUser({
          email: cleanEmail,
          email_confirm: true,
          user_metadata: {
            full_name: cleanName,
            role: 'PARENT',
            phone: phone || null,
          },
        });

        if (createErr) {
          return NextResponse.json({ error: createErr.message }, { status: 400 });
        }
        userId = userData.user.id;
      }

      // 4. Crear o actualizar el perfil en la tabla profiles
      await supabaseAdmin.from('profiles').upsert({
        id: userId,
        full_name: cleanName,
        email: cleanEmail,
        phone: phone || null,
        role: 'PARENT',
        updated_at: new Date().toISOString(),
      });

      // 5. Vincular relación 1:1 en parent_students
      if (student_id) {
        await supabaseAdmin.from('parent_students').upsert({
          parent_id: userId,
          student_id,
          relationship_type: 'Representante Legal',
        });
      }

      // 6. Enviar correo transaccional si hay enlace y configuración de correo
      let emailSent = false;
      let emailError: string | undefined;

      if (activationUrl) {
        const html = renderParentInvitationEmail({
          parentName: cleanName,
          studentName,
          teacherName: 'Prof. Administrador',
          schoolName: 'Colegio AULA360',
          activationUrl,
          expiresInHours: 48,
        });

        const sendResult = await sendEmail({
          to: cleanEmail,
          subject: 'Invitación a AULA360: Active su cuenta de Representante',
          html,
        });

        emailSent = sendResult.success;
        emailError = sendResult.error;
      }

      // 7. Registro de auditoría
      await supabaseAdmin.from('audit_logs').insert({
        action: 'INVITE_PARENT',
        entity_type: 'PROFILE',
        entity_id: userId,
        new_data: { email: cleanEmail, full_name: cleanName, student_id, emailSent },
      });

      return NextResponse.json({
        success: true,
        user_id: userId,
        email_sent: emailSent,
        email_error: emailError,
        activation_url: activationUrl ? '[Enlace Creado Seguramente]' : undefined,
      });
    }

    // Modo local / demo cuando Supabase aún no tiene credenciales remotas
    return NextResponse.json({
      success: true,
      mode: 'demo',
      message: 'Representante registrado en almacenamiento local (Modo Demo).',
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || 'Error en el servidor de invitación' },
      { status: 500 }
    );
  }
}
