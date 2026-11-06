'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TeacherLayout } from '@/components/layout/TeacherLayout';
import { DataProvider } from '@/lib/data-provider';
import {
  Student,
  Profile,
  Grade,
  Observation,
  Subject,
  AcademicPeriod,
  StudentEvaluation,
} from '@/types/database';
import { openAcademicReportPDF } from '@/lib/pdf-report-generator';
import {
  ArrowLeft,
  User,
  Users,
  GraduationCap,
  MessageSquare,
  Plus,
  Trash2,
  Calendar,
  ShieldCheck,
  Clock,
  BookOpen,
  Award,
  AlertTriangle,
  GitBranch,
  FileDown,
  Pencil,
  CheckCircle2,
  FolderOpen,
} from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';

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

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params?.id as string;

  const [student, setStudent] = useState<Student | null>(null);
  const [assignedParent, setAssignedParent] = useState<Profile | null>(null);
  const [allParents, setAllParents] = useState<Profile[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [evaluations, setEvaluations] = useState<StudentEvaluation[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [selectedPeriodTab, setSelectedPeriodTab] = useState<string>('');

  // Parent association modal
  const [isAssociateModalOpen, setIsAssociateModalOpen] = useState(false);
  const [selectedParentToAssociate, setSelectedParentToAssociate] = useState('');
  const [relationshipType, setRelationshipType] = useState('Padre');
  const [assocError, setAssocError] = useState<string | null>(null);

  // Evaluation modal (Create / Edit)
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  const [editingEvalId, setEditingEvalId] = useState<string | null>(null);
  const [evalForm, setEvalForm] = useState({
    subject_id: '',
    period_id: '',
    title: '',
    description: '',
    score: '',
    evaluation_date: new Date().toISOString().slice(0, 10),
    observation: '',
  });
  const [evalError, setEvalError] = useState<string | null>(null);

  const loadData = () => {
    if (!studentId) return;
    const s = DataProvider.getStudentById(studentId);
    if (!s) {
      router.push('/teacher/students');
      return;
    }
    setStudent(s);
    setAssignedParent(DataProvider.getParentForStudent(studentId));
    setAllParents(DataProvider.getParents());
    setGrades(DataProvider.getGrades({ student_id: studentId }));
    setEvaluations(DataProvider.getEvaluations({ student_id: studentId }));
    setObservations(DataProvider.getObservations({ student_id: studentId }));
    setSubjects(DataProvider.getSubjects());
    const pers = DataProvider.getPeriods();
    setPeriods(pers);
    if (pers.length > 0 && !selectedPeriodTab) {
      setSelectedPeriodTab(pers[0].id);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('aula360_data_updated', loadData);
    return () => window.removeEventListener('aula360_data_updated', loadData);
  }, [studentId]);

  if (!student) return null;

  const age = calculateAge(student.birth_date);

  const handleAssociateParent = (e: React.FormEvent) => {
    e.preventDefault();
    setAssocError(null);
    if (!selectedParentToAssociate) return;

    const res = DataProvider.associateParentStudent(selectedParentToAssociate, student.id, relationshipType);
    if (!res.success) {
      setAssocError(res.error || 'Error asociando el representante.');
      return;
    }

    setIsAssociateModalOpen(false);
    setSelectedParentToAssociate('');
    loadData();
  };

  const handleDissociateParent = () => {
    if (!assignedParent) return;
    if (confirm('¿Deseas desvincular a este representante del estudiante?')) {
      DataProvider.dissociateParentStudent(assignedParent.id, student.id);
      loadData();
    }
  };

  // Evaluation modal openers
  const openNewEvaluationModal = (subjectId?: string) => {
    setEditingEvalId(null);
    setEvalForm({
      subject_id: subjectId || (subjects[0]?.id || ''),
      period_id: selectedPeriodTab || (periods[0]?.id || ''),
      title: '',
      description: '',
      score: '',
      evaluation_date: new Date().toISOString().slice(0, 10),
      observation: '',
    });
    setEvalError(null);
    setIsEvalModalOpen(true);
  };

  const openEditEvaluationModal = (ev: StudentEvaluation) => {
    setEditingEvalId(ev.id);
    setEvalForm({
      subject_id: ev.subject_id,
      period_id: ev.period_id,
      title: ev.title,
      description: ev.description,
      score: ev.score.toString(),
      evaluation_date: ev.evaluation_date,
      observation: ev.observation || '',
    });
    setEvalError(null);
    setIsEvalModalOpen(true);
  };

  const handleSaveEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    setEvalError(null);

    const scoreNum = parseFloat(evalForm.score);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 5.0) {
      setEvalError('La calificación debe estar entre 0.00 y 5.00 con un máximo de 2 decimales.');
      return;
    }
    if (!evalForm.title.trim()) {
      setEvalError('Ingresa un título para la evaluación (ej: Evaluación 1, Taller práctico).');
      return;
    }
    if (!evalForm.description.trim()) {
      setEvalError('Ingresa la descripción o tema de la evaluación (De qué trató).');
      return;
    }

    const res = DataProvider.saveEvaluation({
      id: editingEvalId || undefined,
      student_id: student.id,
      subject_id: evalForm.subject_id,
      period_id: evalForm.period_id,
      title: evalForm.title.trim(),
      description: evalForm.description.trim(),
      score: Math.round(scoreNum * 100) / 100,
      evaluation_date: evalForm.evaluation_date,
      observation: evalForm.observation.trim() || undefined,
    });

    if (res.error) {
      setEvalError(res.error);
      return;
    }

    setIsEvalModalOpen(false);
    loadData();
  };

  const handleDeleteEvaluation = (evalId: string, evalTitle: string) => {
    if (confirm(`¿Estás seguro de eliminar la evaluación "${evalTitle}"? La nota final de la asignatura se recalculará automáticamente.`)) {
      const res = DataProvider.deleteEvaluation(evalId);
      if (res.error) {
        alert(res.error);
      } else {
        loadData();
      }
    }
  };

  // PDF Download Handlers
  const handleDownloadPDF = (periodId: string) => {
    openAcademicReportPDF({
      student,
      parent: assignedParent,
      periods,
      selectedPeriodId: periodId,
      subjects,
      grades,
      evaluations,
      observations,
      settings: DataProvider.getSchoolSettings(),
      validationStatus: DataProvider.computeValidationStatus(student.id, periodId === 'ALL' ? periods[0]?.id : periodId, assignedParent?.id),
    });
  };

  // Current period data & version status
  const currentPeriodGrades = grades.filter((g) => g.period_id === selectedPeriodTab);
  const currentPeriodEvaluations = evaluations.filter((ev) => ev.period_id === selectedPeriodTab);
  const currentPeriodObservations = observations.filter((o) => o.period_id === selectedPeriodTab);
  const activePeriodObj = periods.find((p) => p.id === selectedPeriodTab);

  const validationComputed = DataProvider.computeValidationStatus(
    student.id,
    selectedPeriodTab,
    assignedParent?.id
  );

  const avgResult = DataProvider.calculateStudentPeriodAverage(student.id, selectedPeriodTab);
  const periodAverageFormatted = avgResult.count > 0 ? avgResult.average.toFixed(2) : '0.00';

  // Parents who do not have any student yet (for strict 1:1)
  const availableParentsFor1to1 = allParents.filter((p) => {
    const existingKid = DataProvider.getStudentForParent(p.id);
    return !existingKid;
  });

  return (
    <TeacherLayout>
      <div className="space-y-6">
        {/* Breadcrumb & back button */}
        <div className="flex items-center justify-between">
          <Link
            href="/teacher/students"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Volver a Estudiantes
          </Link>

          {/* Action buttons: PDF Downloads */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDownloadPDF(selectedPeriodTab)}
              title="Descarga el boletín con membrete del período actual con detalle de evaluaciones"
              className="text-xs"
            >
              <FileDown className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
              PDF {activePeriodObj?.name || 'Período'} (Parcial)
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleDownloadPDF('ALL')}
              title="Descarga el consolidado con todos los períodos escolares"
              className="text-xs"
            >
              <FileDown className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
              PDF Completo (Todos los Períodos)
            </Button>
          </div>
        </div>

        {/* Student Profile Card Header */}
        <Card className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-2xl shadow-xs">
                {student.first_name[0]}{student.last_name[0]}
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl font-bold text-slate-900">
                    {student.first_name} {student.last_name}
                  </h1>
                  <Badge variant={student.status === 'ACTIVE' ? 'success' : 'danger'}>
                    {student.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span>
                    Grado: <strong className="text-slate-800 font-semibold">{student.grade}</strong> (Grupo {student.section})
                  </span>
                  <span>•</span>
                  <span>
                    Edad: <strong className="text-slate-800 font-semibold">{age} años</strong> ({student.birth_date})
                  </span>
                  <span>•</span>
                  <span>
                    Documento: <strong className="text-slate-800 font-semibold">{student.document_id || 'Sin registrar'}</strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-center">
              <Button
                size="sm"
                onClick={() => openNewEvaluationModal()}
                disabled={activePeriodObj?.status === 'CLOSED'}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Añadir Evaluación
              </Button>
            </div>
          </div>
        </Card>

        {/* Strict 1:1 Assigned Parent Section */}
        <Card className="p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Representante Asignado (Relación 1:1)</h2>
            </div>
            {!assignedParent && (
              <Button size="sm" variant="outline" onClick={() => setIsAssociateModalOpen(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Asignar Representante
              </Button>
            )}
          </div>

          {!assignedParent ? (
            <p className="text-xs text-amber-600 py-2">
              Este estudiante no tiene ningún representante vinculado. El acudiente no podrá consultar sus notas ni descargar sus boletines hasta ser vinculado.
            </p>
          ) : (
            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 flex items-center justify-between max-w-md">
              <div>
                <p className="text-xs font-bold text-slate-900">{assignedParent.full_name}</p>
                <p className="text-[11px] text-slate-500">{assignedParent.email}</p>
                <p className="text-[10px] text-slate-400">{assignedParent.phone || 'Sin teléfono'}</p>
              </div>
              <button
                onClick={handleDissociateParent}
                title="Desvincular representante"
                className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </Card>

        {/* RESUMEN DE CALIFICACIÓN POR CADA PERÍODO */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-600" /> Resumen de Calificación por Período
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              4 Períodos Académicos • Escala 0.00 a 5.00
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {periods.map((p) => {
              const pAvg = DataProvider.calculateStudentPeriodAverage(student.id, p.id);
              const pEvals = evaluations.filter((ev) => ev.period_id === p.id);
              const pVal = DataProvider.computeValidationStatus(student.id, p.id, assignedParent?.id);
              const isSelected = p.id === selectedPeriodTab;

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPeriodTab(p.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-400 shadow-xs ring-2 ring-blue-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-slate-900">{p.name}</span>
                    <Badge variant={p.status === 'OPEN' ? 'info' : 'neutral'}>
                      {p.status === 'OPEN' ? 'Abierto' : 'Cerrado'}
                    </Badge>
                  </div>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-2xl font-black text-blue-700">
                      {pAvg.count > 0 ? pAvg.average.toFixed(2) : '—'}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {pAvg.count} {pAvg.count === 1 ? 'materia' : 'materias'}
                    </span>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{pEvals.length} evaluaciones</span>
                    <span>
                      {pVal.status === 'VALIDATED' ? (
                        <span className="text-emerald-600 font-semibold">✓ Revisado</span>
                      ) : pVal.status === 'REVISION_REQUIRED' ? (
                        <span className="text-amber-600 font-semibold">⚠️ Requiere rev.</span>
                      ) : (
                        <span className="text-slate-400">Pendiente</span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Academic Period Selector Tabs & Details */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                Detalle y Evaluaciones: {activePeriodObj?.name}
              </h2>
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <GitBranch className="w-3.5 h-3.5 text-blue-600" /> v{validationComputed.currentVersion}
              </span>
            </div>

            {/* Validation badge */}
            <div className="flex items-center gap-2">
              {validationComputed.status === 'VALIDATED' && (
                <Badge variant="success">
                  ✓ Revisado por Acudiente (v{validationComputed.reviewedVersion})
                </Badge>
              )}
              {validationComputed.status === 'REVISION_REQUIRED' && (
                <Badge variant="warning">
                  ⚠️ Revisión Nuevamente Requerida (Revisó v{validationComputed.reviewedVersion}, actual v{validationComputed.currentVersion})
                </Badge>
              )}
              {validationComputed.status === 'PENDING' && (
                <Badge variant="neutral">
                  Pendiente de Revisión por Acudiente
                </Badge>
              )}
            </div>
          </div>

          {activePeriodObj?.status === 'CLOSED' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                Este período académico se encuentra <strong>CERRADO</strong>. No es posible añadir, editar ni eliminar evaluaciones para garantizar la inmutabilidad de las notas.
              </span>
            </div>
          )}

          {/* Subjects & Sub-Evaluations List */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {subjects.map((subject) => {
                const subjectGradeObj = currentPeriodGrades.find((g) => g.subject_id === subject.id);
                const subjectEvals = currentPeriodEvaluations.filter((ev) => ev.subject_id === subject.id);
                const finalGrade = subjectGradeObj?.grade ?? null;
                const isPassing = finalGrade !== null ? finalGrade >= 3.0 : null;

                return (
                  <div
                    key={subject.id}
                    className="bg-white rounded-saas border border-slate-200/90 shadow-xs overflow-hidden"
                  >
                    {/* Subject Header */}
                    <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <BookOpen className="w-4 h-4 text-blue-600" />
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">{subject.name}</h3>
                          <span className="text-[11px] text-slate-500">
                            {subjectEvals.length} {subjectEvals.length === 1 ? 'evaluación registrada' : 'evaluaciones registradas'}
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
                              finalGrade === null
                                ? 'text-slate-400'
                                : isPassing
                                ? 'text-slate-900'
                                : 'text-rose-600'
                            }`}
                          >
                            {finalGrade !== null ? finalGrade.toFixed(2) : '—'}
                          </span>
                        </div>

                        {finalGrade !== null && (
                          <Badge variant={isPassing ? 'success' : 'danger'}>
                            {isPassing ? 'Aprobado' : 'Reprobado'}
                          </Badge>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openNewEvaluationModal(subject.id)}
                          disabled={activePeriodObj?.status === 'CLOSED'}
                          className="text-xs h-8"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1 text-blue-600" />
                          Añadir Evaluación
                        </Button>
                      </div>
                    </div>

                    {/* Evaluaciones desglosadas */}
                    <div className="p-4">
                      {subjectEvals.length === 0 ? (
                        <div className="text-center py-6 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                          <p className="text-xs text-slate-500 mb-2">
                            Aún no se han registrado evaluaciones parciales para {subject.name} en este período.
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openNewEvaluationModal(subject.id)}
                            disabled={activePeriodObj?.status === 'CLOSED'}
                            className="text-xs"
                          >
                            <Plus className="w-3.5 h-3.5 mr-1" />
                            Registrar Primera Evaluación
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {subjectEvals.map((ev, idx) => {
                            const isEvalPass = ev.score >= 3.0;
                            return (
                              <div
                                key={ev.id}
                                className="p-3.5 rounded-lg border border-slate-200 bg-white hover:border-blue-200 transition-colors shadow-2xs"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                                  <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center">
                                      {idx + 1}
                                    </span>
                                    <h4 className="text-xs font-bold text-slate-900">{ev.title}</h4>
                                    <span className="text-[10px] text-slate-400">
                                      ({ev.evaluation_date})
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] text-slate-500 font-semibold">Nota:</span>
                                      <span
                                        className={`font-black text-sm px-2 py-0.5 rounded ${
                                          isEvalPass
                                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                                        }`}
                                      >
                                        {ev.score.toFixed(2)}
                                      </span>
                                    </div>

                                    {activePeriodObj?.status === 'OPEN' && (
                                      <div className="flex items-center gap-1">
                                        <button
                                          onClick={() => openEditEvaluationModal(ev)}
                                          title="Editar evaluación"
                                          className="p-1 text-slate-400 hover:text-blue-600 rounded"
                                        >
                                          <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteEvaluation(ev.id, ev.title)}
                                          title="Eliminar evaluación"
                                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="mt-2 text-xs text-slate-700">
                                  <p className="text-[11px] text-slate-500 font-medium">
                                    <strong className="text-slate-700">Tema evaluado:</strong> {ev.description}
                                  </p>
                                  {ev.observation && (
                                    <p className="mt-1 text-[11px] text-blue-900 bg-blue-50/50 p-2 rounded border border-blue-100">
                                      <strong>Observación:</strong> {ev.observation}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Observations Sidebar for this Period */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Observaciones del Período</h3>
                <Link
                  href={`/teacher/observations?student=${student.id}&period=${selectedPeriodTab}`}
                  className="text-xs text-blue-600 font-semibold hover:underline"
                >
                  + Agregar
                </Link>
              </div>

              <Card className="p-4 space-y-3">
                {currentPeriodObservations.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">
                    Sin observaciones pedagógicas registradas para este período.
                  </p>
                ) : (
                  currentPeriodObservations.map((obs) => {
                    const subject = subjects.find((s) => s.id === obs.subject_id);
                    return (
                      <div key={obs.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-[10px] text-blue-700 uppercase tracking-wide">
                            {obs.observation_type}
                          </span>
                          {subject && <span className="text-[10px] text-slate-500 font-medium">{subject.name}</span>}
                        </div>
                        <p className="text-slate-800 text-xs">{obs.content}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">{obs.created_at.slice(0, 10)}</span>
                      </div>
                    );
                  })
                )}
              </Card>

              {/* Informative card about PDF reports */}
              <Card className="p-4 bg-gradient-to-br from-blue-50/70 to-indigo-50/40 border-blue-100 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-blue-900">
                  <FileDown className="w-4 h-4 text-blue-600" />
                  <span>Reportes en PDF Listos</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Tanto tú como el representante pueden descargar el boletín oficial en cualquier momento:
                </p>
                <div className="space-y-1.5 pt-1 text-[11px]">
                  <div className="flex items-center gap-1.5 font-medium text-slate-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                    <span><strong>PDF Parcial:</strong> Desglose del período seleccionado con evaluaciones.</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium text-slate-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                    <span><strong>PDF Total:</strong> Consolidado anual completo de los 4 períodos escolares.</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Añadir / Editar Evaluación */}
      <Modal
        isOpen={isEvalModalOpen}
        onClose={() => setIsEvalModalOpen(false)}
        title={editingEvalId ? 'Editar Evaluación Parcial' : 'Añadir Nueva Evaluación Parcial'}
        description={`Registra una evaluación para ${student.first_name} ${student.last_name} con su nota y tema evaluado.`}
      >
        <form onSubmit={handleSaveEvaluation} className="space-y-4">
          {evalError && (
            <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-saas text-xs">
              {evalError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Asignatura *"
              required
              value={evalForm.subject_id}
              onChange={(e) => setEvalForm({ ...evalForm, subject_id: e.target.value })}
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>

            <Select
              label="Período Académico *"
              required
              value={evalForm.period_id}
              onChange={(e) => setEvalForm({ ...evalForm, period_id: e.target.value })}
            >
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.status === 'OPEN' ? 'Abierto' : 'Cerrado'})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Título de la Evaluación *"
              required
              placeholder="Ej: Evaluación 1, Taller de geometría, Quiz 2"
              value={evalForm.title}
              onChange={(e) => setEvalForm({ ...evalForm, title: e.target.value })}
            />

            <Input
              label="Fecha de Evaluación *"
              type="date"
              required
              value={evalForm.evaluation_date}
              onChange={(e) => setEvalForm({ ...evalForm, evaluation_date: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              De qué trató (Tema / Contenido Evaluado) *
            </label>
            <textarea
              required
              rows={2}
              placeholder="Ej: Fracciones equivalentes, operaciones básicas con números racionales y resolución de problemas aplicados."
              value={evalForm.description}
              onChange={(e) => setEvalForm({ ...evalForm, description: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Input
                label="Calificación (0.00 a 5.00) *"
                type="number"
                step="0.01"
                min="0"
                max="5"
                required
                placeholder="4.50"
                value={evalForm.score}
                onChange={(e) => setEvalForm({ ...evalForm, score: e.target.value })}
              />
              <p className="text-[10px] text-slate-500 mt-1">Escala de 0.00 a 5.00. Aprobatorio: ≥ 3.00</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Observación Opcional
              </label>
              <textarea
                rows={2}
                placeholder="Ej: Excelente comprensión lectora y dominio conceptual."
                value={evalForm.observation}
                onChange={(e) => setEvalForm({ ...evalForm, observation: e.target.value })}
                className="w-full text-xs rounded-lg border border-slate-300 p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsEvalModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingEvalId ? 'Guardar Cambios' : 'Añadir Evaluación'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Associate Parent Modal (1:1) */}
      <Modal
        isOpen={isAssociateModalOpen}
        onClose={() => setIsAssociateModalOpen(false)}
        title="Asignar Representante Único (1:1)"
        description="Selecciona un representante libre para asignarlo exclusivamente a este estudiante."
      >
        <form onSubmit={handleAssociateParent} className="space-y-4">
          {assocError && (
            <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-saas text-xs">
              {assocError}
            </div>
          )}

          <Select
            label="Representante Disponible *"
            required
            value={selectedParentToAssociate}
            onChange={(e) => setSelectedParentToAssociate(e.target.value)}
          >
            <option value="">-- Seleccionar Representante --</option>
            {availableParentsFor1to1.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name} ({p.email})
              </option>
            ))}
          </Select>

          <Select
            label="Tipo de Parentesco"
            value={relationshipType}
            onChange={(e) => setRelationshipType(e.target.value)}
          >
            <option value="Padre">Padre</option>
            <option value="Madre">Madre</option>
            <option value="Tutor Legal">Tutor Legal</option>
          </Select>

          {availableParentsFor1to1.length === 0 && (
            <p className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded border border-amber-200">
              No hay representantes sin estudiante asignado. Crea un nuevo representante en el módulo correspondiente.
            </p>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsAssociateModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={availableParentsFor1to1.length === 0}>
              Vincular Representante
            </Button>
          </div>
        </form>
      </Modal>
    </TeacherLayout>
  );
}
