'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { TeacherLayout } from '@/components/layout/TeacherLayout';
import { DataProvider } from '@/lib/data-provider';
import { Student, Subject, AcademicPeriod, Observation, ObservationType } from '@/types/database';
import { MessageSquare, Plus, Filter, Search, CheckCircle, Tag, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';

const OBSERVATION_TYPES: { value: ObservationType; label: string; badge: 'info' | 'warning' | 'success' | 'neutral' }[] = [
  { value: 'GENERAL', label: 'General del Período', badge: 'neutral' },
  { value: 'SUBJECT', label: 'Específica de Asignatura', badge: 'info' },
  { value: 'BEHAVIOR', label: 'Comportamiento y Convivencia', badge: 'warning' },
  { value: 'ACADEMIC', label: 'Rendimiento y Esfuerzo', badge: 'success' },
  { value: 'PARTICIPATION', label: 'Participación y Liderazgo', badge: 'info' },
];

function ObservationsContent() {
  const searchParams = useSearchParams();
  const preselectedStudent = searchParams.get('student') || '';
  const preselectedPeriod = searchParams.get('period') || '';

  const [observations, setObservations] = useState<Observation[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);

  // Filters
  const [filterStudent, setFilterStudent] = useState(preselectedStudent || 'ALL');
  const [filterPeriod, setFilterPeriod] = useState(preselectedPeriod || 'ALL');
  const [filterType, setFilterType] = useState('ALL');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [studentId, setStudentId] = useState(preselectedStudent);
  const [periodId, setPeriodId] = useState(preselectedPeriod);
  const [subjectId, setSubjectId] = useState<string>('');
  const [type, setType] = useState<ObservationType>('GENERAL');
  const [content, setContent] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = () => {
    setObservations(DataProvider.getObservations());
    const st = DataProvider.getStudents();
    const sub = DataProvider.getSubjects();
    const per = DataProvider.getPeriods();

    setStudents(st);
    setSubjects(sub);
    setPeriods(per);

    if (st.length > 0 && !studentId) setStudentId(st[0].id);
    if (per.length > 0 && !periodId) setPeriodId(per[0].id);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('aula360_data_updated', loadData);
    return () => window.removeEventListener('aula360_data_updated', loadData);
  }, []);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const openCreateModal = () => {
    setContent('');
    setSubjectId('');
    setType('GENERAL');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSaveObservation = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!content.trim() || !studentId || !periodId) return;

    const res = DataProvider.saveObservation({
      student_id: studentId,
      period_id: periodId,
      subject_id: subjectId || undefined,
      observation_type: type,
      content: content.trim(),
    });

    if (res.error) {
      setErrorMsg(res.error);
      return;
    }

    setIsModalOpen(false);
    setSuccessMsg('Observación pedagógica guardada. Se ha incrementado la versión académica para nueva revisión.');
    setTimeout(() => setSuccessMsg(null), 3500);
    loadData();
  };

  const filteredObservations = observations.filter((obs) => {
    if (filterStudent !== 'ALL' && obs.student_id !== filterStudent) return false;
    if (filterPeriod !== 'ALL' && obs.period_id !== filterPeriod) return false;
    if (filterType !== 'ALL' && obs.observation_type !== filterType) return false;
    return true;
  });

  return (
    <TeacherLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Observaciones Académicas</h1>
            <p className="text-xs text-slate-500 mt-1">
              Registro de notas cualitativas, seguimiento formativo y retroalimentación para familias.
            </p>
          </div>
          <Button onClick={openCreateModal}>
            <Plus className="w-4 h-4 mr-1.5" /> Nueva Observación
          </Button>
        </div>

        {successMsg && (
          <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-saas text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Filters */}
        <Card className="p-4 bg-slate-50/70">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Filter className="w-4 h-4 text-slate-400" />
              <span>Filtrar por:</span>
            </div>

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

            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">Todos los Períodos</option>
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">Todos los Tipos</option>
              {OBSERVATION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </Card>

        {/* Observation Cards */}
        {filteredObservations.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              icon={MessageSquare}
              title="No se encontraron observaciones"
              description="No hay notas u observaciones cualitativas registradas que coincidan con los filtros actuales."
              actionLabel="Nueva Observación"
              onAction={openCreateModal}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredObservations.map((obs) => {
              const student = students.find((s) => s.id === obs.student_id);
              const period = periods.find((p) => p.id === obs.period_id);
              const subject = subjects.find((s) => s.id === obs.subject_id);
              const typeConfig = OBSERVATION_TYPES.find((t) => t.value === obs.observation_type);

              return (
                <Card key={obs.id} className="p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          {student?.first_name} {student?.last_name}
                        </span>
                        <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {student?.grade}
                        </span>
                      </div>
                      <Badge variant={typeConfig?.badge || 'neutral'} size="sm">
                        {typeConfig?.label || obs.observation_type}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed mt-2 bg-slate-50/60 p-3 rounded-lg border border-slate-100 italic">
                      "{obs.content}"
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-2">
                      <span>{period?.name}</span>
                      {subject && <span>• {subject.name}</span>}
                    </div>
                    <span>{obs.created_at.slice(0, 10)}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrar Observación Pedagógica"
        description="Esta observación será visible en el informe académico del estudiante y en el portal de los acudientes."
      >
        <form onSubmit={handleSaveObservation} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-saas text-xs">
              {errorMsg}
            </div>
          )}

          <Select
            label="Estudiante *"
            required
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.first_name} {s.last_name} ({s.grade})
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Período Académico *"
              required
              value={periodId}
              onChange={(e) => setPeriodId(e.target.value)}
            >
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>

            <Select
              label="Tipo de Observación *"
              required
              value={type}
              onChange={(e) => setType(e.target.value as ObservationType)}
            >
              {OBSERVATION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </div>

          {type === 'SUBJECT' && (
            <Select
              label="Asignatura Específica *"
              required
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
            >
              <option value="">-- Seleccionar Asignatura --</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </Select>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Contenido de la Observación *
            </label>
            <textarea
              required
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escribe la observación sobre el rendimiento, participación, tareas o convivencia del estudiante..."
              className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-300 rounded-saas focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Guardar Observación</Button>
          </div>
        </form>
      </Modal>
    </TeacherLayout>
  );
}

export default function ObservationsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <p className="text-xs text-slate-500">Cargando observaciones...</p>
        </div>
      }
    >
      <ObservationsContent />
    </Suspense>
  );
}
