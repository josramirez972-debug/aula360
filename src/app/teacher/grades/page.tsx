'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { TeacherLayout } from '@/components/layout/TeacherLayout';
import { DataProvider } from '@/lib/data-provider';
import { Student, Subject, AcademicPeriod, Grade, StudentEvaluation } from '@/types/database';
import {
  GraduationCap,
  Plus,
  Edit2,
  Trash2,
  Filter,
  CheckCircle,
  AlertCircle,
  Lock,
  Search,
  Sparkles,
  BookOpen,
  Calendar,
  Award,
  Layers,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

function GradesContent() {
  const searchParams = useSearchParams();
  const preselectedStudentId = searchParams.get('student') || '';

  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [evaluations, setEvaluations] = useState<StudentEvaluation[]>([]);

  // Active view tab: 'EVALUATIONS' vs 'SUMMARY'
  const [activeTab, setActiveTab] = useState<'EVALUATIONS' | 'SUMMARY'>('EVALUATIONS');

  // Filters
  const [filterStudent, setFilterStudent] = useState(preselectedStudentId || 'ALL');
  const [filterPeriod, setFilterPeriod] = useState('ALL');
  const [filterSubject, setFilterSubject] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Evaluation Modal (Añadir / Editar Evaluación Parcial)
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  const [editingEval, setEditingEval] = useState<StudentEvaluation | null>(null);
  const [evalForm, setEvalForm] = useState({
    student_id: '',
    subject_id: '',
    period_id: '',
    title: '',
    description: '',
    score: '4.50',
    evaluation_date: new Date().toISOString().slice(0, 10),
    observation: '',
  });

  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const loadData = () => {
    const st = DataProvider.getStudents();
    const sub = DataProvider.getSubjects();
    const per = DataProvider.getPeriods();
    const grd = DataProvider.getGrades();
    const ev = DataProvider.getEvaluations();

    setStudents(st);
    setSubjects(sub);
    setPeriods(per);
    setGrades(grd);
    setEvaluations(ev);

    if (st.length > 0 && !evalForm.student_id) {
      setEvalForm((prev) => ({
        ...prev,
        student_id: preselectedStudentId || st[0].id,
        subject_id: sub[0]?.id || '',
        period_id: per.find((p) => p.status === 'OPEN')?.id || per[0]?.id || '',
      }));
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('aula360_data_updated', loadData);
    return () => window.removeEventListener('aula360_data_updated', loadData);
  }, []);

  const openCreateEvalModal = (subjectId?: string, periodId?: string, studentId?: string) => {
    setEditingEval(null);
    setEvalForm({
      student_id: studentId || (filterStudent !== 'ALL' ? filterStudent : (students[0]?.id || '')),
      subject_id: subjectId || (filterSubject !== 'ALL' ? filterSubject : (subjects[0]?.id || '')),
      period_id: periodId || (filterPeriod !== 'ALL' ? filterPeriod : (periods.find((p) => p.status === 'OPEN')?.id || periods[0]?.id || '')),
      title: 'Evaluación 1',
      description: '',
      score: '4.50',
      evaluation_date: new Date().toISOString().slice(0, 10),
      observation: '',
    });
    setErrorNotice(null);
    setIsEvalModalOpen(true);
  };

  const openEditEvalModal = (ev: StudentEvaluation) => {
    setEditingEval(ev);
    setEvalForm({
      student_id: ev.student_id,
      subject_id: ev.subject_id,
      period_id: ev.period_id,
      title: ev.title,
      description: ev.description,
      score: ev.score.toFixed(2),
      evaluation_date: ev.evaluation_date,
      observation: ev.observation || '',
    });
    setErrorNotice(null);
    setIsEvalModalOpen(true);
  };

  const handleSaveEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice(null);

    const numericScore = parseFloat(evalForm.score);
    if (isNaN(numericScore) || numericScore < 0.00 || numericScore > 5.00) {
      setErrorNotice('La calificación debe ser un valor numérico entre 0.00 y 5.00 con máximo dos decimales (PostgreSQL NUMERIC 3,2).');
      return;
    }

    if (!evalForm.title.trim()) {
      setErrorNotice('Ingresa el título o número de evaluación (ej: Evaluación 1, Taller 2, Parcial).');
      return;
    }

    if (!evalForm.description.trim()) {
      setErrorNotice('Ingresa de qué trató la evaluación (ej: Fracciones equivalentes, operaciones con números decimales).');
      return;
    }

    const targetPeriod = periods.find((p) => p.id === evalForm.period_id);
    if (targetPeriod && targetPeriod.status === 'CLOSED') {
      setErrorNotice(`El ${targetPeriod.name} está CERRADO. No es posible modificar ni añadir evaluaciones en períodos cerrados.`);
      return;
    }

    const saveRes = DataProvider.saveEvaluation({
      id: editingEval?.id,
      student_id: evalForm.student_id,
      subject_id: evalForm.subject_id,
      period_id: evalForm.period_id,
      title: evalForm.title.trim(),
      description: evalForm.description.trim(),
      score: Math.round(numericScore * 100) / 100,
      evaluation_date: evalForm.evaluation_date,
      observation: evalForm.observation.trim() || undefined,
    });

    if (saveRes.error) {
      setErrorNotice(saveRes.error);
      return;
    }

    setIsEvalModalOpen(false);
    setSuccessNotice(
      `Evaluación "${evalForm.title}" guardada exitosamente. Se recalculó la nota definitiva de la materia y se actualizó la versión académica para revisión del representante.`
    );
    setTimeout(() => setSuccessNotice(null), 4000);
    loadData();
  };

  const handleDeleteEvaluation = (evalId: string, title: string) => {
    if (confirm(`¿Deseas eliminar la evaluación "${title}"? La nota final de la materia se actualizará automáticamente.`)) {
      const res = DataProvider.deleteEvaluation(evalId);
      if (res.error) {
        alert(res.error);
      } else {
        setSuccessNotice('Evaluación eliminada correctamente.');
        setTimeout(() => setSuccessNotice(null), 3000);
        loadData();
      }
    }
  };

  // Filtered evaluations list
  const filteredEvaluations = evaluations.filter((ev) => {
    const student = students.find((s) => s.id === ev.student_id);
    if (!student) return false;

    if (filterStudent !== 'ALL' && ev.student_id !== filterStudent) return false;
    if (filterPeriod !== 'ALL' && ev.period_id !== filterPeriod) return false;
    if (filterSubject !== 'ALL' && ev.subject_id !== filterSubject) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const studentName = `${student.first_name} ${student.last_name}`.toLowerCase();
      const evalTitle = ev.title.toLowerCase();
      const evalDesc = ev.description.toLowerCase();
      if (!studentName.includes(q) && !evalTitle.includes(q) && !evalDesc.includes(q)) {
        return false;
      }
    }

    return true;
  });

  // Filtered grades list (summary)
  const filteredGrades = grades.filter((g) => {
    const student = students.find((s) => s.id === g.student_id);
    if (!student) return false;

    if (filterStudent !== 'ALL' && g.student_id !== filterStudent) return false;
    if (filterPeriod !== 'ALL' && g.period_id !== filterPeriod) return false;
    if (filterSubject !== 'ALL' && g.subject_id !== filterSubject) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const studentName = `${student.first_name} ${student.last_name}`.toLowerCase();
      if (!studentName.includes(q)) return false;
    }

    return true;
  });

  return (
    <TeacherLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Centro de Calificaciones y Evaluaciones</h1>
            <p className="text-xs text-slate-500 mt-1">
              Añade evaluaciones parciales por período y materia (ej: Matemáticas • Evaluación 1 • Fracciones • Nota).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => openCreateEvalModal()} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs">
              <Plus className="w-4 h-4 mr-1.5" /> Añadir Evaluación
            </Button>
          </div>
        </div>

        {successNotice && (
          <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-saas text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* View mode tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('EVALUATIONS')}
            className={`px-4 py-2 rounded-saas text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'EVALUATIONS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Evaluaciones Parciales ({filteredEvaluations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('SUMMARY')}
            className={`px-4 py-2 rounded-saas text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'SUMMARY'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Resumen de Notas por Materia ({filteredGrades.length})</span>
          </button>
        </div>

        {/* Filter bar */}
        <Card className="p-4 bg-slate-50/70">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar tema, evaluación o estudiante..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Estudiante */}
              <select
                value={filterStudent}
                onChange={(e) => setFilterStudent(e.target.value)}
                className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">Todos los Estudiantes</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.first_name} {s.last_name} ({s.grade})
                  </option>
                ))}
              </select>

              {/* Período */}
              <select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
                className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">Todos los Períodos</option>
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.status === 'CLOSED' ? '(Cerrado)' : ''}
                  </option>
                ))}
              </select>

              {/* Materia */}
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">Todas las Materias</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* TAB 1: EVALUACIONES PARCIALES */}
        {activeTab === 'EVALUATIONS' && (
          <div className="bg-white rounded-saas border border-slate-200/80 shadow-xs overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[760px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="px-4 py-3">Estudiante</th>
                  <th className="px-4 py-3">Materia</th>
                  <th className="px-4 py-3">Período</th>
                  <th className="px-4 py-3">Evaluación</th>
                  <th className="px-4 py-3">De qué trató (Tema)</th>
                  <th className="px-4 py-3 text-center">Nota (0.00-5.00)</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEvaluations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center">
                        <GraduationCap className="w-8 h-8 text-slate-300 mb-2" />
                        <p className="font-bold text-slate-800 text-sm">No hay evaluaciones registradas</p>
                        <p className="text-xs text-slate-500 mt-1">
                          No se encontraron evaluaciones con los filtros aplicados.
                        </p>
                        <Button size="sm" onClick={() => openCreateEvalModal()} className="mt-3 text-xs">
                          <Plus className="w-3.5 h-3.5 mr-1" /> Añadir Primera Evaluación
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredEvaluations.map((ev) => {
                    const student = students.find((s) => s.id === ev.student_id);
                    const subject = subjects.find((s) => s.id === ev.subject_id);
                    const period = periods.find((p) => p.id === ev.period_id);
                    const isPassing = ev.score >= 3.0;

                    return (
                      <tr key={ev.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-900">
                          {student ? `${student.first_name} ${student.last_name}` : '—'}
                          <span className="block text-[10px] text-slate-400 font-normal">{student?.grade}</span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          <div className="flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                            <span>{subject?.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            {period?.name}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-blue-900">
                          {ev.title}
                        </td>
                        <td className="px-4 py-3 text-slate-600 max-w-xs">
                          <p className="line-clamp-2">{ev.description}</p>
                          {ev.observation && (
                            <span className="text-[10px] text-blue-700 italic block mt-0.5">
                              Obs: {ev.observation}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`font-black text-sm px-2.5 py-0.5 rounded ${
                              isPassing
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {ev.score.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-[11px] whitespace-nowrap">
                          {ev.evaluation_date}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {period?.status === 'OPEN' ? (
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => openEditEvalModal(ev)}
                                className="p-1 text-slate-500 hover:text-blue-600 rounded transition-colors"
                                title="Editar evaluación"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteEvaluation(ev.id, ev.title)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                                title="Eliminar evaluación"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-amber-600 font-medium flex items-center justify-end gap-1">
                              <Lock className="w-3 h-3" /> Cerrado
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: RESUMEN DE NOTAS POR MATERIA */}
        {activeTab === 'SUMMARY' && (
          <div className="bg-white rounded-saas border border-slate-200/80 shadow-xs overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[700px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="px-4 py-3">Estudiante</th>
                  <th className="px-4 py-3">Materia</th>
                  <th className="px-4 py-3">Período</th>
                  <th className="px-4 py-3 text-center">Nota Definitiva</th>
                  <th className="px-4 py-3 text-center">Evaluaciones</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredGrades.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      No hay calificaciones registradas.
                    </td>
                  </tr>
                ) : (
                  filteredGrades.map((g) => {
                    const student = students.find((s) => s.id === g.student_id);
                    const subject = subjects.find((s) => s.id === g.subject_id);
                    const period = periods.find((p) => p.id === g.period_id);
                    const isPassing = g.grade >= 3.0;
                    const subEvals = evaluations.filter(
                      (ev) => ev.student_id === g.student_id && ev.subject_id === g.subject_id && ev.period_id === g.period_id
                    );

                    return (
                      <tr key={g.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-900">
                          {student ? `${student.first_name} ${student.last_name}` : '—'}
                          <span className="block text-[10px] text-slate-400 font-normal">{student?.grade}</span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{subject?.name}</td>
                        <td className="px-4 py-3 text-slate-600">{period?.name}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm font-extrabold text-slate-900">{g.grade.toFixed(2)}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[11px]">
                            {subEvals.length} {subEvals.length === 1 ? 'eval.' : 'evals.'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={isPassing ? 'success' : 'danger'}>
                            {isPassing ? 'Aprobado' : 'Reprobado'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openCreateEvalModal(g.subject_id, g.period_id, g.student_id)}
                            disabled={period?.status === 'CLOSED'}
                            className="text-xs h-7"
                          >
                            <Plus className="w-3 h-3 mr-1 text-blue-600" />
                            Añadir Eval.
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* RESUMEN DE TODAS LAS EVALUACIONES DE CADA PERÍODO */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-600" /> Resumen de Todas las Evaluaciones por Período
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              Consolidado Institucional (4 Períodos)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {periods.map((p) => {
              const pEvals = evaluations.filter((ev) => ev.period_id === p.id);
              const pGrades = grades.filter((g) => g.period_id === p.id);
              const avg =
                pGrades.length > 0
                  ? (pGrades.reduce((sum, g) => sum + g.grade, 0) / pGrades.length).toFixed(2)
                  : '0.00';

              return (
                <Card key={p.id} className="p-4 bg-white border border-slate-200">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-bold text-xs text-slate-900">{p.name}</span>
                    <Badge variant={p.status === 'OPEN' ? 'info' : 'neutral'}>
                      {p.status === 'OPEN' ? 'Abierto' : 'Cerrado'}
                    </Badge>
                  </div>

                  <div className="mt-3 space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[11px] text-slate-500">Evaluaciones Totales:</span>
                      <strong className="text-sm font-bold text-slate-900">{pEvals.length}</strong>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <span className="text-[11px] text-slate-500">Materias Calificadas:</span>
                      <strong className="text-sm font-bold text-slate-900">{pGrades.length}</strong>
                    </div>

                    <div className="flex items-baseline justify-between pt-1 border-t border-slate-100">
                      <span className="text-xs font-semibold text-slate-700">Promedio General:</span>
                      <strong className="text-base font-black text-blue-700">{avg}</strong>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* MODAL: Añadir / Editar Evaluación Parcial */}
      <Modal
        isOpen={isEvalModalOpen}
        onClose={() => setIsEvalModalOpen(false)}
        title={editingEval ? 'Modificar Evaluación Parcial' : 'Añadir Evaluación por Período y Materia'}
        description="Registra la evaluación de la materia (ej: Materia Matemáticas, Evaluación 1: Fracciones, Nota 4.50)."
      >
        <form onSubmit={handleSaveEvaluation} className="space-y-4">
          {errorNotice && (
            <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-saas text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorNotice}</span>
            </div>
          )}

          <Select
            label="Estudiante *"
            required
            value={evalForm.student_id}
            onChange={(e) => setEvalForm({ ...evalForm, student_id: e.target.value })}
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.first_name} {s.last_name} ({s.grade})
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Materia / Asignatura *"
              required
              value={evalForm.subject_id}
              onChange={(e) => setEvalForm({ ...evalForm, subject_id: e.target.value })}
            >
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
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
                  {p.name} {p.status === 'CLOSED' ? '(Cerrado)' : '(Abierto)'}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Título de la Evaluación *"
              required
              placeholder="Ej: Evaluación 1, Taller 2, Parcial Escrito"
              value={evalForm.title}
              onChange={(e) => setEvalForm({ ...evalForm, title: e.target.value })}
            />

            <Input
              label="Fecha de la Evaluación *"
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
              placeholder="Ej: Fracciones y números mixtos: suma, resta y multiplicación aplicada a problemas."
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
              <p className="text-[10px] text-slate-500 mt-1">Escala de 0.00 a 5.00. Aprobatoria: ≥ 3.00</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Observación Opcional
              </label>
              <textarea
                rows={2}
                placeholder="Ej: Excelente trabajo en equipo y precisión en el procedimiento."
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
              {editingEval ? 'Guardar Cambios' : 'Registrar Evaluación'}
            </Button>
          </div>
        </form>
      </Modal>
    </TeacherLayout>
  );
}

export default function TeacherGradesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Cargando centro de calificaciones...</div>}>
      <GradesContent />
    </Suspense>
  );
}
