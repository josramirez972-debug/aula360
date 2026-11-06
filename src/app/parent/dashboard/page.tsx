'use client';

import React, { useState, useEffect } from 'react';
import { ParentLayout } from '@/components/layout/ParentLayout';
import { useAuth } from '@/lib/auth-context';
import { DataProvider } from '@/lib/data-provider';
import { Student, AcademicPeriod, Grade, Observation, Subject, StudentEvaluation } from '@/types/database';
import { openAcademicReportPDF } from '@/lib/pdf-report-generator';
import {
  GraduationCap,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  BookOpen,
  Award,
  AlertTriangle,
  GitBranch,
  Check,
  ShieldCheck,
  Clock,
  MessageSquareQuote,
  FileDown,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Alert } from '@/components/ui/Alert';

function calculateAge(birthDateString: string): number {
  if (!birthDateString) return 0;
  const today = new Date();
  const birthDate = new Date(birthDateString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age : 0;
}

export default function ParentDashboard() {
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [evaluations, setEvaluations] = useState<StudentEvaluation[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);

  // Validation modal state
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationSuccessToast, setValidationSuccessToast] = useState(false);

  const loadData = () => {
    if (!user) return;
    const child = DataProvider.getStudentForParent(user.id);
    setStudent(child);
    const pers = DataProvider.getPeriods();
    setPeriods(pers);
    if (pers.length > 0 && !selectedPeriodId) {
      setSelectedPeriodId(pers[0].id);
    }
    setSubjects(DataProvider.getSubjects());
    if (child) {
      setGrades(DataProvider.getGrades({ student_id: child.id }));
      setEvaluations(DataProvider.getEvaluations({ student_id: child.id }));
      setObservations(DataProvider.getObservations({ student_id: child.id }));
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('aula360_data_updated', loadData);
    return () => window.removeEventListener('aula360_data_updated', loadData);
  }, [user, selectedPeriodId]);

  const schoolSettings = DataProvider.getSchoolSettings();
  const schoolName = schoolSettings.school_name || 'Colegio AULA360';
  const activeYear = schoolSettings.active_year || '2025';
  const age = student ? calculateAge(student.birth_date) : 0;
  const activePeriod = periods.find((p) => p.id === selectedPeriodId);

  // Filtered grades, evaluations & observations for selected period
  const periodGrades = grades.filter((g) => g.period_id === selectedPeriodId);
  const periodEvaluations = evaluations.filter((ev) => ev.period_id === selectedPeriodId);
  const periodObservations = observations.filter((o) => o.period_id === selectedPeriodId);

  // Dynamic Average Calculation
  const avgResult = student
    ? DataProvider.calculateStudentPeriodAverage(student.id, selectedPeriodId)
    : { average: 0, count: 0 };
  const periodAverageFormatted = avgResult.count > 0 ? avgResult.average.toFixed(2) : '0.00';

  // Versioning and Validation Status
  const validationInfo = student
    ? DataProvider.computeValidationStatus(student.id, selectedPeriodId, user?.id)
    : { status: 'PENDING', currentVersion: 1, reviewedVersion: null, validatedAt: null };

  const handleConfirmValidation = async () => {
    if (!user || !student || !selectedPeriodId) return;
    setIsSubmitting(true);

    DataProvider.confirmValidation(student.id, selectedPeriodId, user.id);
    setIsSubmitting(false);
    setIsConfirmModalOpen(false);
    setValidationSuccessToast(true);
    setTimeout(() => setValidationSuccessToast(false), 4000);
    loadData();
  };

  // PDF download handler
  const handleDownloadPDF = (periodId: string) => {
    if (!student) return;
    openAcademicReportPDF({
      student,
      parent: user,
      periods,
      selectedPeriodId: periodId,
      subjects,
      grades,
      evaluations,
      observations,
      settings: schoolSettings,
      validationStatus: validationInfo,
    });
  };

  return (
    <ParentLayout>
      <div className="space-y-6">
        {/* 1. BIENVENIDA PERSONALIZADA */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 rounded-2xl p-6 sm:p-8 text-white shadow-sm relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-xs font-semibold text-blue-100 mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Portal de Representantes • {schoolName}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Bienvenido a AULA360
            </h1>
            <p className="mt-2 text-sm text-blue-100 leading-relaxed">
              Hola, <strong className="text-white font-semibold">{user?.full_name}</strong>. Consulta el rendimiento escolar oficial, el desglose de cada evaluación realizada y descarga los boletines académicos en formato PDF.
            </p>
          </div>
        </div>

        {!student ? (
          <EmptyState
            title="Sin estudiante asignado"
            description="Actualmente no tienes ningún estudiante vinculado a tu cuenta. Pide a la institución educativa que asocie a tu acudido."
          />
        ) : (
          <>
            {/* 2. TARJETA CON INFORMACIÓN DEL ESTUDIANTE Y ACCIONES DE DESCARGA */}
            <Card className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-700 font-extrabold text-2xl flex items-center justify-center shadow-xs">
                    {student.first_name[0]}{student.last_name[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-extrabold text-slate-900">
                        {student.first_name} {student.last_name}
                      </h2>
                      <Badge variant="info">Grado {student.grade}</Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-slate-500">
                      <span>Edad: <strong className="text-slate-800 font-semibold">{age} años</strong></span>
                      <span>•</span>
                      <span>Grupo: <strong className="text-slate-800 font-semibold">{student.section}</strong></span>
                      <span>•</span>
                      <span>Año Escolar: <strong className="text-slate-800 font-semibold">{activeYear}</strong></span>
                      <span>•</span>
                      <span>Documento: <strong className="text-slate-800 font-semibold">{student.document_id || 'Sin documento'}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Resumen Académico del Período & Botones de Descarga */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-center min-w-[140px]">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      Promedio {activePeriod?.name}
                    </span>
                    <div className="text-2xl font-black text-blue-700 mt-0.5">
                      {periodAverageFormatted}
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {avgResult.count} asignaturas
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadPDF(selectedPeriodId)}
                      title="Descargar boletín oficial de este período en PDF con notas y evaluaciones"
                      className="text-xs justify-start"
                    >
                      <FileDown className="w-4 h-4 mr-1.5 text-blue-600" />
                      Descargar PDF ({activePeriod?.name || 'Período'})
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleDownloadPDF('ALL')}
                      title="Descargar consolidado completo de todos los períodos en PDF"
                      className="text-xs justify-start"
                    >
                      <FileDown className="w-4 h-4 mr-1.5 text-indigo-600" />
                      Descargar PDF Completo (Anual)
                    </Button>
                  </div>
                </div>
              </div>

              {/* Selector de Períodos Rápidos */}
              <div className="mt-5">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Período Académico Seleccionado:
                  </span>
                  <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
                    <GitBranch className="w-3.5 h-3.5 text-blue-600" /> Versión Académica: v{validationInfo.currentVersion}
                  </span>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1">
                  {periods.map((p) => {
                    const isSelected = p.id === selectedPeriodId;
                    const hasGrades = grades.some((g) => g.period_id === p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPeriodId(p.id)}
                        className={`px-4 py-2 rounded-saas text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{p.name}</span>
                        {hasGrades && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </Card>

            {/* Success toast if validated */}
            {validationSuccessToast && (
              <Alert variant="success" title="¡Revisión confirmada exitosamente!">
                Has certificado formalmente la revisión del boletín académico en su versión v{validationInfo.currentVersion}.
              </Alert>
            )}

            {/* Notice if Revision is Required */}
            {validationInfo.status === 'REVISION_REQUIRED' && (
              <Alert variant="warning" title={`Revisión Nuevamente Requerida (Versión Académica v${validationInfo.currentVersion})`}>
                El docente ha registrado o actualizado notas después de tu última confirmación (que correspondía a la versión v{validationInfo.reviewedVersion}). Por favor revisa las calificaciones actuales y pulsa el botón inferior para confirmar la versión vigente.
              </Alert>
            )}

            {/* 3. SECCIÓN DE CALIFICACIONES CON DESGLOSE DE EVALUACIONES */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Calificaciones y Evaluaciones • {activePeriod?.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Desglose detallado de cada evaluación parcial realizada por asignatura (Escala 0.00 a 5.00).
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {periodGrades.length === 0 ? (
                  <Card className="p-8 text-center text-xs text-slate-400">
                    No hay calificaciones registradas para {activePeriod?.name} aún.
                  </Card>
                ) : (
                  periodGrades.map((g) => {
                    const subject = subjects.find((s) => s.id === g.subject_id);
                    const isPassing = g.grade >= 3.00;
                    const subjectEvals = periodEvaluations.filter((ev) => ev.subject_id === g.subject_id);

                    return (
                      <div
                        key={g.id}
                        className="bg-white rounded-saas border border-slate-200/90 shadow-2xs overflow-hidden"
                      >
                        {/* Asignatura Header */}
                        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <BookOpen className="w-4 h-4 text-blue-600" />
                            <div>
                              <h4 className="text-sm font-bold text-slate-900">{subject?.name}</h4>
                              <span className="text-[11px] text-slate-500">
                                {subjectEvals.length} {subjectEvals.length === 1 ? 'evaluación parcial' : 'evaluaciones parciales'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                                Nota Definitiva
                              </span>
                              <span
                                className={`text-base font-black ${
                                  isPassing ? 'text-slate-900' : 'text-rose-600'
                                }`}
                              >
                                {g.grade.toFixed(2)}
                              </span>
                            </div>

                            <Badge variant={isPassing ? 'success' : 'danger'}>
                              {isPassing ? 'Aprobado' : 'Reprobado'}
                            </Badge>
                          </div>
                        </div>

                        {/* Desglose de Evaluaciones Parciales */}
                        <div className="p-4">
                          {subjectEvals.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">
                              Nota global registrada por el docente. Sin desglose de evaluaciones parciales.
                            </p>
                          ) : (
                            <div className="space-y-2.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                Detalle de Evaluaciones Parciales:
                              </span>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                {subjectEvals.map((ev, idx) => {
                                  const isEvalPass = ev.score >= 3.0;
                                  return (
                                    <div
                                      key={ev.id}
                                      className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 text-xs"
                                    >
                                      <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-200/60">
                                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                                          <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[10px] flex items-center justify-center">
                                            {idx + 1}
                                          </span>
                                          <span>{ev.title}</span>
                                        </div>
                                        <span
                                          className={`font-black text-xs px-2 py-0.5 rounded ${
                                            isEvalPass
                                              ? 'bg-emerald-100 text-emerald-800'
                                              : 'bg-rose-100 text-rose-800'
                                          }`}
                                        >
                                          {ev.score.toFixed(2)}
                                        </span>
                                      </div>

                                      <p className="text-[11px] text-slate-600 mt-1">
                                        <strong className="text-slate-700">Tema evaluado:</strong> {ev.description}
                                      </p>
                                      {ev.observation && (
                                        <p className="text-[11px] text-blue-900 bg-blue-50 p-1.5 rounded mt-1.5 italic">
                                          "{ev.observation}"
                                        </p>
                                      )}
                                      <span className="text-[10px] text-slate-400 block mt-1.5 text-right">
                                        Fecha: {ev.evaluation_date}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {g.observation && (
                            <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-600">
                              <strong className="text-slate-800 font-semibold">Observación de la materia:</strong>{' '}
                              <span>{g.observation}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 4. SECCIÓN DE OBSERVACIONES PEDAGÓGICAS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">
                  Observaciones Pedagógicas ({periodObservations.length})
                </h3>
                <Link
                  href="/parent/observations"
                  className="text-xs text-blue-600 font-semibold hover:underline"
                >
                  Ver todas →
                </Link>
              </div>

              {periodObservations.length === 0 ? (
                <Card className="p-5 text-center text-xs text-slate-400">
                  No hay observaciones registradas para este período académico.
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {periodObservations.map((obs) => {
                    const subject = subjects.find((s) => s.id === obs.subject_id);
                    return (
                      <Card key={obs.id} className="p-4 bg-white border border-slate-200/80">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                            {obs.observation_type}
                          </span>
                          {subject && (
                            <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                              {subject.name}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-800 leading-relaxed italic bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                          "{obs.content}"
                        </p>
                        <span className="text-[10px] text-slate-400 mt-2 block">
                          Registrada el {obs.created_at.slice(0, 10)}
                        </span>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 5. SECCIÓN DE VALIDACIÓN */}
            <Card className="p-6 border-2 border-blue-100 bg-blue-50/30">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                    <h3 className="font-extrabold text-base text-slate-900">
                      Confirmación Formal de Revisión de Calificaciones
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 max-w-xl">
                    Deja constancia digital de haber consultado las notas y observaciones de tu acudido para {activePeriod?.name} (Versión académica v{validationInfo.currentVersion}).
                  </p>
                </div>

                <div>
                  {validationInfo.status === 'VALIDATED' ? (
                    <div className="text-right">
                      <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
                        <Check className="w-4 h-4 text-emerald-600" />
                        Has confirmado la revisión de las calificaciones (v{validationInfo.reviewedVersion})
                      </div>
                      {validationInfo.validatedAt && (
                        <p className="text-[10px] text-slate-500 mt-1 font-medium">
                          Confirmado el:{' '}
                          {new Date(validationInfo.validatedAt).toLocaleString('es-CO', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </p>
                      )}
                    </div>
                  ) : validationInfo.status === 'REVISION_REQUIRED' ? (
                    <Button
                      onClick={() => setIsConfirmModalOpen(true)}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md"
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" /> Confirmar Nueva Versión (v{validationInfo.currentVersion})
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setIsConfirmModalOpen(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Confirmar revisión de calificaciones
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Validation Confirmation Modal */}
      {student && (
        <Modal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          title={`Confirmar Revisión de Calificaciones (v${validationInfo.currentVersion})`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-saas text-xs text-blue-900 space-y-1">
              <p className="font-bold">Constancia Digital Familiar:</p>
              <p>
                Vas a confirmar formalmente la revisión del informe escolar de{' '}
                <strong className="font-semibold">{student.first_name} {student.last_name}</strong> para el{' '}
                <strong className="font-semibold">{activePeriod?.name}</strong> en su{' '}
                <strong className="font-semibold">Versión Académica v{validationInfo.currentVersion}</strong>.
              </p>
            </div>

            <div className="text-xs text-slate-600 space-y-2">
              <p>
                • Esta validación certifica que como representante has consultado el reporte académico oficial.
              </p>
              <p>
                • Se guardará el registro inmutable con tu usuario, fecha, hora y el número de versión (v{validationInfo.currentVersion}).
              </p>
              <p>
                • Si el docente actualiza calificaciones posteriormente, se te solicitará una nueva confirmación.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleConfirmValidation}
                isLoading={isSubmitting}
              >
                Sí, Confirmar Versión v{validationInfo.currentVersion}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </ParentLayout>
  );
}
