'use client';

import React, { useState, useEffect } from 'react';
import { ParentLayout } from '@/components/layout/ParentLayout';
import { useAuth } from '@/lib/auth-context';
import { DataProvider } from '@/lib/data-provider';
import { Student, Subject, AcademicPeriod, Grade, StudentEvaluation } from '@/types/database';
import { openAcademicReportPDF } from '@/lib/pdf-report-generator';
import {
  GraduationCap,
  Filter,
  BookOpen,
  Search,
  ArrowRight,
  FileDown,
  Calendar,
  Award,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function ParentGradesPage() {
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [evaluations, setEvaluations] = useState<StudentEvaluation[]>([]);

  // Search & Filters
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('ALL');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadData = () => {
    if (!user) return;
    const myKid = DataProvider.getStudentForParent(user.id);
    setStudent(myKid);
    setPeriods(DataProvider.getPeriods());
    setSubjects(DataProvider.getSubjects());
    if (myKid) {
      setGrades(DataProvider.getGrades({ student_id: myKid.id }));
      setEvaluations(DataProvider.getEvaluations({ student_id: myKid.id }));
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('aula360_data_updated', loadData);
    return () => window.removeEventListener('aula360_data_updated', loadData);
  }, [user]);

  // Filter evaluations based on user selection: period, subject, search query
  const filteredEvaluations = evaluations.filter((ev) => {
    if (selectedPeriodId !== 'ALL' && ev.period_id !== selectedPeriodId) return false;
    if (selectedSubjectId !== 'ALL' && ev.subject_id !== selectedSubjectId) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const subject = subjects.find((s) => s.id === ev.subject_id);
      const subjectName = subject?.name.toLowerCase() || '';
      const title = ev.title.toLowerCase();
      const desc = ev.description.toLowerCase();
      const obs = (ev.observation || '').toLowerCase();

      if (!subjectName.includes(q) && !title.includes(q) && !desc.includes(q) && !obs.includes(q)) {
        return false;
      }
    }

    return true;
  });

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
      observations: DataProvider.getObservations({ student_id: student.id }),
      settings: DataProvider.getSchoolSettings(),
      validationStatus: DataProvider.computeValidationStatus(
        student.id,
        periodId === 'ALL' ? periods[0]?.id : periodId,
        user?.id
      ),
    });
  };

  return (
    <ParentLayout>
      <div className="space-y-6">
        {/* Header with Title and PDF Downloads */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Búsqueda y Detalle de Evaluaciones
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Consulta por período y por materia qué evaluaciones tuvo {student ? `${student.first_name} ${student.last_name}` : 'tu estudiante'} durante el año escolar.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDownloadPDF(selectedPeriodId === 'ALL' ? (periods[0]?.id || 'ALL') : selectedPeriodId)}
              className="text-xs"
            >
              <FileDown className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
              {selectedPeriodId === 'ALL' ? 'PDF Período 1 (Parcial)' : 'PDF Período Seleccionado'}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleDownloadPDF('ALL')}
              className="text-xs"
            >
              <FileDown className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
              PDF Completo (Todos los Períodos)
            </Button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <Card className="p-4 bg-slate-50/80 border-slate-200">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full lg:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar tema (ej: fracciones, taller...)"
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Selects */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Filtro por Período */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-600">Período:</span>
                <select
                  value={selectedPeriodId}
                  onChange={(e) => setSelectedPeriodId(e.target.value)}
                  className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="ALL">Todos los Períodos</option>
                  {periods.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por Materia */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-600">Materia:</span>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="ALL">Todas las Materias</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-xs text-slate-500 font-medium ml-2">
                <strong>{filteredEvaluations.length}</strong> evaluaciones encontradas
              </span>
            </div>
          </div>
        </Card>

        {/* Evaluaciones Encontradas */}
        <div className="bg-white rounded-saas border border-slate-200/80 shadow-xs overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[700px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <th className="px-4 py-3">Materia</th>
                <th className="px-4 py-3">Período</th>
                <th className="px-4 py-3">Evaluación</th>
                <th className="px-4 py-3">De qué trató (Tema)</th>
                <th className="px-4 py-3 text-center">Nota</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEvaluations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                    <p className="font-semibold text-slate-600 text-xs">No se encontraron evaluaciones</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Prueba cambiando el período, la materia seleccionada o el texto de búsqueda.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredEvaluations.map((ev) => {
                  const subject = subjects.find((s) => s.id === ev.subject_id);
                  const period = periods.find((p) => p.id === ev.period_id);
                  const isPassing = ev.score >= 3.0;

                  return (
                    <tr key={ev.id} className="hover:bg-slate-50/50 transition-colors align-top">
                      <td className="px-4 py-3 font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                          <span>{subject?.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-medium">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {period?.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-blue-900">
                        {ev.title}
                      </td>
                      <td className="px-4 py-3 text-slate-700 max-w-sm">
                        <p className="font-medium text-slate-800">{ev.description}</p>
                        {ev.observation && (
                          <p className="text-[11px] text-blue-800 italic mt-1 bg-blue-50/60 p-1.5 rounded border border-blue-100">
                            <strong>Observación del docente:</strong> "{ev.observation}"
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
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
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge variant={isPassing ? 'success' : 'danger'}>
                          {isPassing ? 'Aprobado' : 'Reprobado'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-[11px] whitespace-nowrap">
                        {ev.evaluation_date}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* RESUMEN DE TODAS LAS EVALUACIONES DE CADA PERÍODO */}
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-600" /> Resumen de Todas las Evaluaciones por Período
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Consolidado de calificaciones, total de evaluaciones realizadas y promedio de cada período.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDownloadPDF('ALL')}
              className="text-xs self-start sm:self-auto"
            >
              <FileDown className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
              Descargar Informe Completo en PDF
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {periods.map((p) => {
              const pEvals = evaluations.filter((ev) => ev.period_id === p.id);
              const pGrades = grades.filter((g) => g.period_id === p.id);
              const avgResult = student
                ? DataProvider.calculateStudentPeriodAverage(student.id, p.id)
                : { average: 0, count: 0 };
              const valStatus = student
                ? DataProvider.computeValidationStatus(student.id, p.id, user?.id)
                : { status: 'PENDING', currentVersion: 1 };

              return (
                <Card key={p.id} className="p-4 bg-white border border-slate-200/90 shadow-2xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-bold text-xs text-slate-900">{p.name}</span>
                    <Badge variant={p.status === 'OPEN' ? 'info' : 'neutral'}>
                      {p.status === 'OPEN' ? 'Abierto' : 'Cerrado'}
                    </Badge>
                  </div>

                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Evaluaciones Realizadas:</span>
                      <strong className="text-slate-900 font-bold text-sm">{pEvals.length}</strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Materias Calificadas:</span>
                      <strong className="text-slate-900 font-bold text-sm">{avgResult.count}</strong>
                    </div>

                    <div className="flex items-baseline justify-between pt-2 border-t border-slate-100">
                      <span className="text-xs font-semibold text-slate-700">Promedio del Período:</span>
                      <strong className="text-lg font-black text-blue-700">
                        {avgResult.count > 0 ? avgResult.average.toFixed(2) : '—'}
                      </strong>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span>
                        {valStatus.status === 'VALIDATED' ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Revisado
                          </span>
                        ) : valStatus.status === 'REVISION_REQUIRED' ? (
                          <span className="text-amber-700 font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> Nueva revisión req.
                          </span>
                        ) : (
                          <span className="text-slate-400">Pendiente revisión</span>
                        )}
                      </span>

                      <button
                        onClick={() => handleDownloadPDF(p.id)}
                        className="text-blue-600 hover:text-blue-800 font-bold inline-flex items-center gap-1"
                        title="Descargar PDF de este período"
                      >
                        <FileDown className="w-3 h-3" /> PDF
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </ParentLayout>
  );
}
