/**
 * AULA360 - Servicio de Correo Electrónico y Plantillas Transaccionales
 * Diseñado para entornos Serverless y Edge (Cloudflare Workers / Next.js 15)
 * Soporta Resend API (HTTP nativo) y configuración SMTP para Supabase Auth.
 */

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export interface ParentInviteData {
  parentName: string;
  studentName: string;
  teacherName?: string;
  schoolName?: string;
  activationUrl: string;
  expiresInHours?: number;
}

export interface ParentCredentialsData {
  parentName: string;
  studentName: string;
  email: string;
  password: string;
  loginUrl: string;
  teacherName?: string;
  schoolName?: string;
}

export interface PasswordResetData {
  userName: string;
  resetUrl: string;
  expiresInMinutes?: number;
}

export interface EmailConfirmData {
  userName: string;
  confirmUrl: string;
}

// 1. PLANTILLA: INVITACIÓN DE REPRESENTANTE
export function renderParentInvitationEmail(data: ParentInviteData): string {
  const teacher = data.teacherName || 'El Administrador Académico';
  const school = data.schoolName || 'AULA360 Institución Educativa';
  const expires = data.expiresInHours || 48;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitación a AULA360</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; margin: 0; padding: 24px; color: #1E293B; }
    .container { max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: #2563EB; padding: 32px 24px; text-align: center; color: #FFFFFF; }
    .header h1 { margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0; font-size: 14px; opacity: 0.9; }
    .content { padding: 32px 28px; line-height: 1.6; }
    .salutation { font-size: 18px; font-weight: 600; color: #0F172A; margin-bottom: 16px; }
    .highlight-card { background: #EFF6FF; border-left: 4px solid #2563EB; padding: 16px; border-radius: 6px; margin: 20px 0; }
    .highlight-card p { margin: 4px 0; font-size: 14px; color: #1E40AF; }
    .btn-container { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; background-color: #2563EB; color: #FFFFFF !important; font-weight: 600; font-size: 16px; text-decoration: none; padding: 14px 32px; border-radius: 8px; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2); }
    .btn:hover { background-color: #1D4ED8; }
    .security-notice { background: #F1F5F9; border-radius: 6px; padding: 14px 16px; font-size: 13px; color: #64748B; margin-top: 24px; }
    .footer { padding: 20px 24px; text-align: center; font-size: 12px; color: #94A3B8; border-top: 1px solid #F1F5F9; background: #FAFBFD; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>AULA360</h1>
      <p>Plataforma de Seguimiento y Evaluación Académica</p>
    </div>
    <div class="content">
      <div class="salutation">Estimado(a) ${data.parentName},</div>
      <p>
        El profesor <strong>${teacher}</strong> del colegio <strong>${school}</strong> ha registrado su cuenta individual de representante legal en la plataforma AULA360.
      </p>
      
      <div class="highlight-card">
        <p><strong>Estudiante Vinculado:</strong> ${data.studentName}</p>
        <p><strong>Acceso Permitido:</strong> Visualización de calificaciones, evaluaciones parciales, observaciones y boletines oficiales.</p>
        <p><strong>Regla de Acceso:</strong> Acceso exclusivo e individual a los registros de su representado(a).</p>
      </div>

      <p>
        Para activar su cuenta y definir su contraseña de acceso personal, por favor pulse el siguiente botón:
      </p>

      <div class="btn-container">
        <a href="${data.activationUrl}" class="btn" target="_blank">Activar mi cuenta y definir contraseña</a>
      </div>

      <div class="security-notice">
        <strong>Aviso de Seguridad:</strong>
        <ul style="margin: 6px 0 0; padding-left: 20px;">
          <li>Este enlace es personal e intransferible y expira en <strong>${expires} horas</strong>.</li>
          <li>AULA360 nunca le solicitará su contraseña por correo electrónico.</li>
          <li>Las cuentas de representantes solo pueden ser autorizadas y gestionadas por el profesor titular.</li>
        </ul>
      </div>

      <p style="font-size: 13px; color: #64748B; margin-top: 20px;">
        Si el botón no funciona, copie y pegue la siguiente dirección en su navegador web:<br>
        <a href="${data.activationUrl}" style="color: #2563EB; word-break: break-all;">${data.activationUrl}</a>
      </p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} AULA360 &bull; Institución Educativa &bull; Todos los derechos reservados.
    </div>
  </div>
</body>
</html>
  `.trim();
}

// 1.1 PLANTILLA: CONFIRMACIÓN Y ENTREGA DE CREDENCIALES AL REPRESENTANTE
export function renderParentCredentialsEmail(data: ParentCredentialsData): string {
  const teacher = data.teacherName || 'El Profesor Titular';
  const school = data.schoolName || 'Colegio AULA360';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tus Credenciales de Acceso a AULA360</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; margin: 0; padding: 24px; color: #1E293B; }
    .container { max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: #2563EB; padding: 32px 24px; text-align: center; color: #FFFFFF; }
    .header h1 { margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0; font-size: 14px; opacity: 0.9; }
    .content { padding: 32px 28px; line-height: 1.6; }
    .salutation { font-size: 18px; font-weight: 600; color: #0F172A; margin-bottom: 16px; }
    .info-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin: 20px 0; }
    .credentials-card { background: #EFF6FF; border: 2px solid #BFDBFE; border-radius: 10px; padding: 20px; margin: 24px 0; }
    .credentials-title { font-size: 15px; font-weight: 700; color: #1E40AF; margin-bottom: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
    .cred-row { margin: 10px 0; font-size: 14px; color: #334155; }
    .cred-label { font-weight: 600; color: #1E293B; display: inline-block; width: 120px; }
    .cred-value { font-family: 'Courier New', Courier, monospace; font-size: 16px; font-weight: 700; color: #1E40AF; background: #FFFFFF; padding: 4px 10px; border-radius: 6px; border: 1px solid #DBEAFE; display: inline-block; }
    .btn-container { text-align: center; margin: 32px 0 20px; }
    .btn { display: inline-block; background-color: #2563EB; color: #FFFFFF !important; font-weight: 600; font-size: 16px; text-decoration: none; padding: 14px 36px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.25); }
    .btn:hover { background-color: #1D4ED8; }
    .security-notice { background: #F8FAFC; border-left: 4px solid #64748B; border-radius: 4px; padding: 12px 16px; font-size: 13px; color: #64748B; margin-top: 24px; }
    .footer { padding: 20px 24px; text-align: center; font-size: 12px; color: #94A3B8; border-top: 1px solid #F1F5F9; background: #FAFBFD; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>AULA360</h1>
      <p>Plataforma de Gestión y Seguimiento Académico</p>
    </div>
    <div class="content">
      <div class="salutation">Estimado(a) ${data.parentName},</div>
      <p>
        El profesor <strong>${teacher}</strong> de la institución <strong>${school}</strong> ha registrado su cuenta individual de representante legal en la plataforma escolar AULA360.
      </p>
      
      <div class="info-box">
        <p style="margin: 0; font-size: 14px; color: #1E293B;">
          <strong>Estudiante Vinculado (Regla 1:1):</strong> ${data.studentName}
        </p>
        <p style="margin: 6px 0 0; font-size: 13px; color: #64748B;">
          A través de este acceso podrá consultar las calificaciones oficiales, evaluaciones parciales por materia, observaciones y boletines escolares de su representado(a).
        </p>
      </div>

      <div class="credentials-card">
        <div class="credentials-title">🔑 Sus Credenciales de Acceso</div>
        <div class="cred-row">
          <span class="cred-label">Usuario / Email:</span>
          <span class="cred-value">${data.email}</span>
        </div>
        <div class="cred-row">
          <span class="cred-label">Contraseña:</span>
          <span class="cred-value">${data.password}</span>
        </div>
      </div>

      <div class="btn-container">
        <a href="${data.loginUrl}" class="btn" target="_blank">Iniciar Sesión en AULA360</a>
      </div>

      <div class="security-notice">
        <strong>Aviso de Privacidad y Seguridad:</strong>
        <p style="margin: 4px 0 0;">
          Su cuenta tiene acceso exclusivo a los datos de <strong>${data.studentName}</strong>. Le recomendamos no compartir sus credenciales. Podrá cambiar su contraseña en cualquier momento ingresando a su perfil en la plataforma.
        </p>
      </div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} ${school} &bull; AULA360 &bull; Todos los derechos reservados.
    </div>
  </div>
</body>
</html>
  `.trim();
}

// 2. PLANTILLA: CONFIRMACIÓN DE CORREO
export function renderEmailConfirmationEmail(data: EmailConfirmData): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Confirme su correo electrónico - AULA360</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #F8FAFC; margin: 0; padding: 24px; color: #1E293B; }
    .container { max-width: 580px; margin: 0 auto; background: #FFF; border-radius: 12px; border: 1px solid #E2E8F0; overflow: hidden; }
    .header { background: #2563EB; padding: 28px; text-align: center; color: #FFF; }
    .content { padding: 32px 28px; }
    .btn { display: inline-block; background-color: #2563EB; color: #FFF !important; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">AULA360</h2>
    </div>
    <div class="content">
      <h3>Hola, ${data.userName}</h3>
      <p>Por favor confirme su dirección de correo electrónico para verificar su cuenta en la plataforma escolar AULA360.</p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${data.confirmUrl}" class="btn">Confirmar mi correo</a>
      </div>
      <p style="font-size: 13px; color: #64748B;">Si usted no solicitó este correo, puede ignorarlo con total tranquilidad.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// 3. PLANTILLA: RECUPERACIÓN DE CONTRASEÑA
export function renderPasswordResetEmail(data: PasswordResetData): string {
  const expires = data.expiresInMinutes || 30;
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Restablecer Contraseña - AULA360</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #F8FAFC; margin: 0; padding: 24px; color: #1E293B; }
    .container { max-width: 580px; margin: 0 auto; background: #FFF; border-radius: 12px; border: 1px solid #E2E8F0; overflow: hidden; }
    .header { background: #2563EB; padding: 28px; text-align: center; color: #FFF; }
    .content { padding: 32px 28px; }
    .btn { display: inline-block; background-color: #2563EB; color: #FFF !important; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">AULA360</h2>
      <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Recuperación de Contraseña</p>
    </div>
    <div class="content">
      <h3>Hola, ${data.userName}</h3>
      <p>Hemos recibido una solicitud para restablecer la contraseña de su cuenta en AULA360.</p>
      <p>Haga clic en el botón a continuación para definir su nueva clave de acceso:</p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${data.resetUrl}" class="btn">Restablecer mi contraseña</a>
      </div>
      <p style="font-size: 13px; color: #64748B;">
        Por seguridad, este enlace es de uso único y expirará en <strong>${expires} minutos</strong>. Si usted no realizó esta solicitud, no tome ninguna acción y su cuenta permanecerá protegida.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// 4. MOTOR DE ENVÍO TRANSACCIONAL (Resend HTTP REST API Nativo para Edge/Cloudflare Workers)
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const senderEmail = process.env.SMTP_SENDER_EMAIL || process.env.RESEND_FROM_EMAIL || 'notificaciones@aula360.app';
  const senderName = process.env.SMTP_SENDER_NAME || 'AULA360 Notificaciones';

  if (!resendApiKey) {
    // Si no hay API key configurada, reportamos el estado técnico real sin simular éxito ficticio
    return {
      success: false,
      error: 'RESEND_API_KEY o credenciales SMTP no configuradas en el entorno.',
    };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${senderName} <${senderEmail}>`,
        to: [options.to],
        subject: options.subject,
        html: options.html,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return {
        success: false,
        error: (errorData as { message?: string }).message || `Error HTTP ${res.status} al enviar correo con Resend.`,
      };
    }

    const data = await res.json();
    return { success: true, id: (data as { id?: string }).id };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error).message || 'Fallo de red al conectar con el servidor de correo.',
    };
  }
}
