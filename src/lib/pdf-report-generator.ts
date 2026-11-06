import {
  Student,
  AcademicPeriod,
  Subject,
  Grade,
  StudentEvaluation,
  Observation,
  SchoolSettings,
  Profile,
} from '@/types/database';

interface GenerateReportOptions {
  student: Student;
  parent?: Profile | null;
  periods: AcademicPeriod[];
  selectedPeriodId?: string; // If provided, generates partial report for this period. If 'ALL', generates total report.
  subjects: Subject[];
  grades: Grade[];
  evaluations: StudentEvaluation[];
  observations: Observation[];
  settings: SchoolSettings;
  validationStatus?: {
    status: string;
    reviewedVersion?: number | null;
    validatedAt?: string | null;
  };
}

export function openAcademicReportPDF(options: GenerateReportOptions): void {
  const {
    student,
    parent,
    periods,
    selectedPeriodId,
    subjects,
    grades,
    evaluations,
    observations,
    settings,
    validationStatus,
  } = options;

  const isTotalReport = !selectedPeriodId || selectedPeriodId === 'ALL';
  const targetPeriods = isTotalReport
    ? periods
    : periods.filter((p) => p.id === selectedPeriodId);

  const activePeriod = !isTotalReport ? periods.find((p) => p.id === selectedPeriodId) : null;
  const reportTitle = isTotalReport
    ? `INFORME ACADÉMICO CONSOLIDADO — TODOS LOS PERÍODOS`
    : `BOLETÍN ACADÉMICO OFICIAL — ${activePeriod?.name?.toUpperCase() || 'PERÍODO'}`;

  // Age calculation
  const birthDate = new Date(student.birth_date);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;

  // Cumulative or period average
  let totalGradeSum = 0;
  let totalGradeCount = 0;

  targetPeriods.forEach((period) => {
    const pGrades = grades.filter((g) => g.period_id === period.id);
    pGrades.forEach((g) => {
      totalGradeSum += g.grade;
      totalGradeCount++;
    });
  });

  const overallAverage = totalGradeCount > 0 ? (totalGradeSum / totalGradeCount).toFixed(2) : '0.00';

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${reportTitle} - ${student.first_name} ${student.last_name}</title>
  <style>
    @page {
      size: A4;
      margin: 12mm 15mm 15mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 20px;
      font-size: 11px;
      line-height: 1.4;
    }
    .no-print-bar {
      background: #1e293b;
      color: #ffffff;
      padding: 12px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-radius: 8px;
      margin-bottom: 20px;
      font-size: 13px;
    }
    .btn-print {
      background: #2563eb;
      color: white;
      border: none;
      padding: 8px 16px;
      font-size: 12px;
      font-weight: bold;
      border-radius: 6px;
      cursor: pointer;
    }
    .btn-print:hover { background: #1d4ed8; }
    @media print {
      body { padding: 0; }
      .no-print-bar { display: none !important; }
      .page-break { page-break-before: always; }
    }
    .header-box {
      border-bottom: 2px solid #2563eb;
      padding-bottom: 12px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .institution-name {
      font-size: 18px;
      font-weight: 800;
      color: #1e3a8a;
      letter-spacing: -0.5px;
      margin: 0 0 2px 0;
    }
    .institution-sub {
      font-size: 10px;
      color: #64748b;
      margin: 0;
    }
    .report-badge {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1d4ed8;
      padding: 6px 12px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 10px;
      text-align: right;
    }
    .student-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 16px;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
    }
    .student-field {
      display: flex;
      flex-direction: column;
    }
    .student-field-label {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
    }
    .student-field-val {
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
    }
    .period-section {
      margin-bottom: 20px;
    }
    .period-title {
      font-size: 13px;
      font-weight: 800;
      color: #1e293b;
      background: #f1f5f9;
      padding: 6px 10px;
      border-left: 4px solid #2563eb;
      border-radius: 0 4px 4px 0;
      margin: 14px 0 8px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    table.grades-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }
    table.grades-table th {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      padding: 6px 8px;
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      color: #475569;
      text-align: left;
    }
    table.grades-table td {
      border: 1px solid #e2e8f0;
      padding: 6px 8px;
      font-size: 10px;
      vertical-align: top;
    }
    .subject-name {
      font-weight: 700;
      color: #0f172a;
      font-size: 11px;
    }
    .evaluations-container {
      margin-top: 4px;
      padding-top: 4px;
      border-top: 1px dashed #e2e8f0;
    }
    .eval-row {
      margin-bottom: 4px;
      padding: 4px 6px;
      background: #f8fafc;
      border-radius: 4px;
      border-left: 2px solid #3b82f6;
    }
    .eval-title {
      font-weight: 700;
      color: #1e40af;
      font-size: 9.5px;
    }
    .eval-desc {
      color: #475569;
      font-size: 9px;
      margin: 1px 0;
    }
    .eval-meta {
      font-size: 8.5px;
      color: #64748b;
      display: flex;
      justify-content: space-between;
    }
    .badge-pass {
      background: #dcfce7;
      color: #15803d;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 9px;
      display: inline-block;
    }
    .badge-fail {
      background: #fee2e2;
      color: #b91c1c;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 9px;
      display: inline-block;
    }
    .summary-card {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 6px;
      padding: 8px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 10px;
    }
    .obs-card {
      background: #fefce8;
      border: 1px solid #fef08a;
      border-radius: 6px;
      padding: 8px 10px;
      margin-top: 10px;
    }
    .obs-title {
      font-size: 10px;
      font-weight: 700;
      color: #854d0e;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .signatures-box {
      margin-top: 35px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      text-align: center;
      page-break-inside: avoid;
    }
    .signature-line {
      border-top: 1px solid #475569;
      padding-top: 6px;
      font-size: 10px;
      font-weight: 700;
      color: #334155;
    }
    .signature-sub {
      font-size: 9px;
      color: #64748b;
    }
    .seal-box {
      font-size: 8.5px;
      color: #64748b;
      margin-top: 20px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <div>
      <strong>Vista Preliminar Oficial para Impresión / Descarga PDF</strong>
      <span style="opacity: 0.8; font-size: 11px; margin-left: 8px;">Presiona el botón para guardar como PDF o imprimir</span>
    </div>
    <div style="display: flex; gap: 8px;">
      <button class="btn-print" onclick="window.print()">🖨️ Guardar como PDF / Imprimir</button>
      <button class="btn-print" style="background: #475569;" onclick="window.close()">Cerrar</button>
    </div>
  </div>

  <!-- Header -->
  <div class="header-box">
    <div>
      <h1 class="institution-name">${settings.school_name || 'Colegio AULA360'}</h1>
      <p class="institution-sub">Sistema Institucional de Gestión y Seguimiento Académico Escolar</p>
      <p class="institution-sub">Año Escolar: <strong>${settings.active_year}</strong> • Rector/Docente: <strong>${settings.teacher_name}</strong></p>
    </div>
    <div class="report-badge">
      <div>${reportTitle}</div>
      <div style="font-weight: 400; font-size: 9px; margin-top: 2px;">Expedido el ${new Date().toLocaleDateString('es-CO', { dateStyle: 'long' })}</div>
    </div>
  </div>

  <!-- Student Card -->
  <div class="student-card">
    <div class="student-field">
      <span class="student-field-label">Estudiante</span>
      <span class="student-field-val">${student.first_name} ${student.last_name}</span>
    </div>
    <div class="student-field">
      <span class="student-field-label">Documento</span>
      <span class="student-field-val">${student.document_id || 'Sin registrar'}</span>
    </div>
    <div class="student-field">
      <span class="student-field-label">Grado & Grupo</span>
      <span class="student-field-val">Grado ${student.grade} • Grupo ${student.section || 'A'}</span>
    </div>
    <div class="student-field">
      <span class="student-field-label">Edad / F. Nacimiento</span>
      <span class="student-field-val">${age} años (${student.birth_date})</span>
    </div>
    <div class="student-field" style="grid-column: span 2;">
      <span class="student-field-label">Representante Legal (1:1)</span>
      <span class="student-field-val">${parent ? parent.full_name : 'Sin acudiente registrado'}</span>
    </div>
    <div class="student-field" style="grid-column: span 2;">
      <span class="student-field-label">Contacto Representante</span>
      <span class="student-field-val">${parent ? `${parent.email} ${parent.phone ? '• ' + parent.phone : ''}` : '—'}</span>
    </div>
  </div>

  <!-- Period Content -->
  ${targetPeriods.map((period) => {
    const periodGrades = grades.filter((g) => g.period_id === period.id);
    const periodObservations = observations.filter((o) => o.period_id === period.id);
    const periodEvals = evaluations.filter((e) => e.period_id === period.id);

    // Period Average
    const pSum = periodGrades.reduce((acc, g) => acc + g.grade, 0);
    const pAvg = periodGrades.length > 0 ? (pSum / periodGrades.length).toFixed(2) : '0.00';

    return `
      <div class="period-section">
        <div class="period-title">
          <span>${period.name} — Año Lectivo ${period.academic_year} (${period.start_date} al ${period.end_date})</span>
          <span style="font-size: 11px;">Promedio del Período: <strong>${pAvg} / 5.00</strong></span>
        </div>

        <table class="grades-table">
          <thead>
            <tr>
              <th style="width: 28%;">Asignatura Curricular</th>
              <th style="width: 48%;">Detalle de Evaluaciones Parciales (Tema y Nota)</th>
              <th style="width: 12%; text-align: center;">Nota Final</th>
              <th style="width: 12%; text-align: center;">Estado</th>
            </tr>
          </thead>
          <tbody>
            ${subjects.map((subj) => {
              const gradeItem = periodGrades.find((g) => g.subject_id === subj.id);
              const subjectEvals = periodEvals.filter((e) => e.subject_id === subj.id);
              const score = gradeItem ? gradeItem.grade : null;
              const isPassing = score !== null && score >= 3.00;

              return `
                <tr>
                  <td>
                    <div class="subject-name">${subj.name}</div>
                    <div style="font-size: 8.5px; color: #64748b;">${subj.description || ''}</div>
                  </td>
                  <td>
                    ${subjectEvals.length === 0 ? `
                      <span style="color: #94a3b8; font-style: italic; font-size: 9px;">Sin evaluaciones individuales registradas</span>
                    ` : `
                      <div class="evaluations-container">
                        ${subjectEvals.map((ev, evIdx) => `
                          <div class="eval-row">
                            <div style="display: flex; justify-content: space-between; align-items: baseline;">
                              <span class="eval-title">${ev.title || `Evaluación ${evIdx + 1}`}</span>
                              <strong style="color: #0f172a; font-size: 10px;">${ev.score.toFixed(2)}</strong>
                            </div>
                            <div class="eval-desc"><strong>Tema evaluado:</strong> ${ev.description}</div>
                            ${ev.observation ? `<div style="font-size: 8.5px; color: #0369a1; font-style: italic;">Observación: "${ev.observation}"</div>` : ''}
                            <div class="eval-meta">
                              <span>Fecha: ${ev.evaluation_date}</span>
                            </div>
                          </div>
                        `).join('')}
                      </div>
                    `}
                    ${gradeItem?.observation ? `
                      <div style="margin-top: 4px; font-size: 9px; color: #475569; font-style: italic; background: #fff; padding: 2px 4px; border: 1px solid #e2e8f0; border-radius: 4px;">
                        <strong>Nota docente:</strong> ${gradeItem.observation}
                      </div>
                    ` : ''}
                  </td>
                  <td style="text-align: center; vertical-align: middle;">
                    ${score !== null ? `
                      <div style="font-size: 13px; font-weight: 900; color: ${isPassing ? '#0f172a' : '#dc2626'};">
                        ${score.toFixed(2)}
                      </div>
                    ` : `<span style="color: #94a3b8;">—</span>`}
                  </td>
                  <td style="text-align: center; vertical-align: middle;">
                    ${score !== null ? `
                      <span class="${isPassing ? 'badge-pass' : 'badge-fail'}">
                        ${isPassing ? 'APROBADO' : 'REPROBADO'}
                      </span>
                    ` : `<span style="color: #94a3b8; font-size: 9px;">Pendiente</span>`}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <!-- Period Observations -->
        ${periodObservations.length > 0 ? `
          <div class="obs-card">
            <div class="obs-title">Observaciones Formativas y Convivenciales del ${period.name}</div>
            ${periodObservations.map((obs) => `
              <div style="margin-bottom: 4px; font-size: 9.5px; color: #1e293b;">
                <strong>[${obs.observation_type}]:</strong> "${obs.content}"
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }).join('')}

  <!-- Overall Summary Box -->
  <div class="summary-card">
    <div>
      <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #1e40af;">
        ${isTotalReport ? 'Rendimiento Académico General Acumulado' : 'Resumen Académico del Período'}
      </span>
      <div style="font-size: 9.5px; color: #64748b;">
        Escala Oficial: 0.00 a 5.00 • Nota Mínima de Aprobación: 3.00
      </div>
    </div>
    <div style="text-align: right;">
      <span style="font-size: 10px; color: #475569;">Promedio Global:</span>
      <span style="font-size: 16px; font-weight: 900; color: #1d4ed8; margin-left: 6px;">
        ${overallAverage} / 5.00
      </span>
    </div>
  </div>

  <!-- Signatures and Digital Validation Section -->
  <div class="signatures-box">
    <div>
      <div class="signature-line">${settings.teacher_name}</div>
      <div class="signature-sub">Docente Titular / Administrador Académico</div>
      <div class="signature-sub">${settings.school_name}</div>
    </div>
    <div>
      <div class="signature-line">${parent ? parent.full_name : 'Firma del Representante Legal'}</div>
      <div class="signature-sub">Representante Legal (Relación 1:1)</div>
      <div class="signature-sub">
        ${validationStatus?.validatedAt ? `Validado digitalmente: ${new Date(validationStatus.validatedAt).toLocaleString('es-CO')}` : 'Constancia de revisión académica'}
      </div>
    </div>
  </div>

  <div class="seal-box">
    Documento oficial generado por AULA360 • Plataforma Integral de Gestión y Seguimiento Escolar • Este informe cuenta con registro inmutable en el sistema de auditoría institucional.
  </div>

  <script>
    // Trigger print dialog automatically after styles render
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.print();
      }, 400);
    });
  </script>
</body>
</html>`;

  const reportWindow = window.open('', '_blank');
  if (reportWindow) {
    reportWindow.document.open();
    reportWindow.document.write(html);
    reportWindow.document.close();
  } else {
    alert('Por favor permite las ventanas emergentes en tu navegador para ver y descargar el boletín en PDF.');
  }
}
