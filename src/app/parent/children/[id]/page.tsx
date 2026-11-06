'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ParentLayout } from '@/components/layout/ParentLayout';
import { useAuth } from '@/lib/auth-context';
import { DataProvider } from '@/lib/data-provider';
import {
  Student,
  Subject,
  AcademicPeriod,
  Grade,
  Observation,
  StudentEvaluation,
} from '@/types/database';
import { openAcademicReportPDF } from '@/lib/pdf-report-generator';
import {
  ArrowLeft,
  GraduationCap,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Award,
  BookOpen,
  MessageSquareQuote,
  ShieldCheck,
  Check,
  GitBranch,
  FileDown,
} from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

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

function ChildPerformanceContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const studentId = params?.id as string;
  const queryPeriod = searchParams.get('period');

  const [student, setStudent] = useState<Student | null>(null);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(queryPeriod || '');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [evaluations, setEvaluations] = useState<StudentEvaluation[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);

  // Confirmation modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSubmittingValidation, setIsSubmittingValidation] = useState(false);
  const [validationSuccessNotice, setValidationSuccessNotice] = useState(false);

  const loadData = () => {
    if (!studentId || !user) return;

    // Strict 1:1 Security Check: Verify this student is indeed the parent's single assigned child
    const myStudent = DataProvider.getStudentForParent(user.id);
    if (!myStudent || myStudent.id !== studentId) {
      router.push('/parent/dashboard');
      return;
    }

    setStudent(myStudent);
    const pers = DataProvider.getPeriods();
    setPeriods(pers);
    if (pers.length > 0 && !selectedPeriodId) {
      setSelectedPeriodId(queryPeriod || pers[0].id);
    }
    setSubjects(DataProvider.getSubjects());
    setGrades(DataProvider.getGrades({ student_id: studentId }));
    setEvaluations(DataProvider.getEvaluations({ student_id: studentId }));
    setObservations(DataProvider.getObservations({ student_id: studentId }));
  };

  useEffect(() => {
    loadData();
    window.addEventListener('aula360_data_updated', loadData);
    return () => window.removeEventListener('aula360_data_updated', loadData);
  }, [studentId, user, selectedPeriodId]);

  if (!student) return null;

  const age = calculateAge(student.birth_date);
  const activePeriod = periods.find((p) => p.id === selectedPeriodId);

  // Period grades & observations
  const periodGrades = grades.filter((g) => g.period_id === selectedPeriodId);
  const periodEvaluations = evaluations.filter((ev) => ev.period_id === selectedPeriodId);
  const periodObservations = observations.filter((o) => o.period_id === selectedPeriodId);

  const avgResult = DataProvider.calculateStudentPeriodAverage(student.id, selectedPeriodId);
  const averageFormatted = avgResult.count > 0 ? avgResult.average.toFixed(2) : '0.00';

  // Version & Validation Status
  const validationInfo = DataProvider.computeValidationStatus(student.id, selectedPeriodId, user?.id);

  const handleConfirmValidation = async () => {
    if (!user || !student || !selectedPeriodId) return;
    setIsSubmittingValidation(true);

    DataProvider.confirmValidation(student.id, selectedPeriodId, user.id);
    setIsSubmittingValidation(false);
    setIsConfirmModalOpen(false);
    setValidationSuccessNotice(true);
    setTimeout(() => setValidationSuccessNotice(false), 4500);
    loadData();
  };

  const handleDownloadPDF = (periodId: string) => {
    openAcademicReportPDF({
      student,
      parent: user,
      periods,
      selectedPeriodId: periodId,
      subjects,
      grades,
      evaluations,
      observations,
      settings: DataProvider.getSchoolSettings(),
      validationStatus: validationInfo,
    });
  };

  return (
    <ParentLayout>
      <div className="space-y-6">
        {/* Back Link & PDF Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Link
            href="/parent/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" /> Volver al Inicio
          </Link>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDownloadPDF(selectedPeriodId)}
              className="text-xs"
            >
              <FileDown className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
              Descargar PDF ({activePeriod?.name || 'Período'})
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleDownloadPDF('ALL')}
              className="text-xs"
            >
              <FileDown className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
              Descargar PDF Completo (Todos los Períodos)
            </Button>
          </div>
        </div>

        {/* Student Profile Header */}
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-extrabold text-2xl shadow-xs">
                {student.first_name[0]}{student.last_name[0]}
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  {student.first_name} {student.last_name}
                </h1>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span>
                    Grado: <strong className="text-slate-800 font-semibold">{student.grade}</strong> (Grupo {student.section})
                  </span>
                  <span>•</span>
                  <span>
                    Edad: <strong className="text-slate-800 font-semibold">{age} años</strong>
                  </span>
                  <span>•</span>
                  <span>Año Escolar: <strong className="text-slate-800 font-semibold">2025</strong></span>
                </div>
              </div>
            </div>

            {/* Performance Overview Pill */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center min-w-[140px]">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Promedio {activePeriod?.name}
              </span>
              <div className="text-2xl font-black text-blue-700 mt-0.5">{averageFormatted}</div>
              <span className="text-[10px] text-slate-500 font-medium">
                {avgResult.count} materias calificadas
              </span>
            </div>
          </div>
        </Card>

        {/* Academic Period Selector */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Selecciona el Período Académico:
            </label>
            <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
              <GitBranch className="w-3.5 h-3.5 text-blue-600" /> Versión Académica: v{validationInfo.currentVersion}
            </span>
          </div>

          <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
            {periods.map((p) => {
              const isSelected = p.id === selectedPeriodId;
              const hasGradesInPeriod = grades.some((g) => g.period_id === p.id);
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
                  {hasGradesInPeriod && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Success toast */}
        {validationSuccessNotice && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-saas text-xs flex items-center gap-2.5 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold">¡Revisión confirmada exitosamente (Versión v{validationInfo.currentVersion})!</p>
              <p className="text-[11px] text-emerald-700">
                El docente ha recibido la constancia formal de que has tomado conocimiento de las notas.
              </p>
            </div>
          </div>
        )}

        {/* Notice if Revision is Required */}
        {validationInfo.status === 'REVISION_REQUIRED' && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-saas text-xs text-amber-900 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Revisión Nuevamente Requerida (Versión Académica v{validationInfo.currentVersion})</p>
              <p className="mt-0.5 text-amber-800 leading-relaxed">
                El docente ha registrado o modificado calificaciones después de tu última confirmación (que correspondía a la versión v{validationInfo.reviewedVersion}). Por favor examina las notas actualizadas y pulsa el botón inferior para confirmar la versión vigente.
              </p>
            </div>
          </div>
        )}

        {/* Grades with Sub-Evaluations Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Boletín de Calificaciones y Evaluaciones • {activePeriod?.name}
              </h2>
              <p className="text-xs text-slate-500">
                Escala oficial de 0.00 a 5.00 con precisión de dos decimales (PostgreSQL NUMERIC 3,2).
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {periodGrades.length === 0 ? (
              <Card className="p-8 text-center text-xs text-slate-400">
                No se han registrado calificaciones para {activePeriod?.name} todavía.
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

                    <div className="p-4">
                      {subjectEvals.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">
                          Nota global registrada por el docente. Sin desglose de evaluaciones parciales.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Evaluaciones parciales de este período:
                          </span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {subjectEvals.map((ev, idx) => (
                              <div
                                key={ev.id}
                                className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 text-xs"
                              >
                                <div className="flex items-center justify-between font-bold text-slate-900 pb-1 border-b border-slate-200/60">
                                  <span>{idx + 1}. {ev.title}</span>
                                  <span className={ev.score >= 3.0 ? 'text-emerald-700 font-black' : 'text-rose-700 font-black'}>
                                    {ev.score.toFixed(2)}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-600 mt-1">
                                  <strong>Tema:</strong> {ev.description}
                                </p>
                                {ev.observation && (
                                  <p className="text-[10px] text-blue-900 italic mt-1 bg-blue-50/50 p-1 rounded">
                                    "{ev.observation}"
                                  </p>
                                )}
                                <span className="text-[10px] text-slate-400 block mt-1 text-right">
                                  {ev.evaluation_date}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {g.observation && (
                        <div className="mt-3 pt-2 border-t border-slate-100 text-xs text-slate-600">
                          <strong>Observación:</strong> {g.observation}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Observations Section */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-slate-900">
            Observaciones Pedagógicas ({periodObservations.length})
          </h2>

          {periodObservations.length === 0 ? (
            <Card className="p-5 text-center text-xs text-slate-400">
              No hay observaciones registradas para {student.first_name} en este período escolar.
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

        {/* Validation Certificate Action */}
        <Card className="p-6 border-2 border-blue-100 bg-blue-50/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-base text-slate-900">
                  Confirmación Digital de Revisión de Calificaciones
                </h3>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-xl">
                Al confirmar, certificas ante la institución haber revisado las calificaciones y observaciones de {student.first_name} para {activePeriod?.name} (v{validationInfo.currentVersion}).
              </p>
            </div>

            <div>
              {validationInfo.status === 'VALIDATED' ? (
                <div className="text-right">
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
                    <Check className="w-4 h-4 text-emerald-600" />
                    Has confirmado la revisión (v{validationInfo.reviewedVersion})
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
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Confirmar revisión de notas
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title={`Confirmar Revisión de Notas (v${validationInfo.currentVersion})`}
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-saas text-xs text-blue-900 space-y-1">
            <p className="font-bold">Constancia Digital Oficial:</p>
            <p>
              Vas a dejar constancia formal de que has consultado las calificaciones y observaciones de{' '}
              <strong className="font-semibold">{student.first_name} {student.last_name}</strong> para el{' '}
              <strong className="font-semibold">{activePeriod?.name}</strong> en su{' '}
              <strong className="font-semibold">Versión Académica v{validationInfo.currentVersion}</strong>.
            </p>
          </div>

          <div className="text-xs text-slate-600 space-y-2">
            <p>• Esta acción registra tu firma digital con tu usuario, fecha y hora exacta.</p>
            <p>• Si el profesor actualiza notas posteriormente, se te solicitará una nueva validación.</p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsConfirmModalOpen(false)}
              disabled={isSubmittingValidation}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmValidation}
              isLoading={isSubmittingValidation}
            >
              Sí, Confirmar Versión v{validationInfo.currentVersion}
            </Button>
          </div>
        </div>
      </Modal>
    </ParentLayout>
  );
}

export default function ChildPerformancePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Cargando información...</div>}>
      <ChildPerformanceContent />
    </Suspense>
  );
}
