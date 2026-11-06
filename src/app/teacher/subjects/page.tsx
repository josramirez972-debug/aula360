'use client';

import React, { useState, useEffect } from 'react';
import { TeacherLayout } from '@/components/layout/TeacherLayout';
import { DataProvider } from '@/lib/data-provider';
import { Subject, Student } from '@/types/database';
import { BookOpen, Plus, Edit2, CheckCircle, Search, ToggleLeft, ToggleRight, Users, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  const [students, setStudents] = useState<Student[]>([]);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [subjectForEnrollment, setSubjectForEnrollment] = useState<Subject | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [msg, setMsg] = useState<string | null>(null);

  const loadData = () => {
    setSubjects(DataProvider.getSubjects());
    setStudents(DataProvider.getStudents());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('aula360_data_updated', loadData);
    return () => window.removeEventListener('aula360_data_updated', loadData);
  }, []);

  const openCreateModal = () => {
    setEditingSubject(null);
    setName('');
    setDescription('');
    setStatus('ACTIVE');
    setIsModalOpen(true);
  };

  const openEditModal = (sub: Subject) => {
    setEditingSubject(sub);
    setName(sub.name);
    setDescription(sub.description || '');
    setStatus(sub.status);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    DataProvider.saveSubject({
      id: editingSubject ? editingSubject.id : undefined,
      name,
      description: description || undefined,
      status,
    });

    setIsModalOpen(false);
    setMsg(editingSubject ? 'Asignatura actualizada' : 'Asignatura creada exitosamente');
    setTimeout(() => setMsg(null), 3000);
    loadData();
  };

  const toggleStatus = (sub: Subject) => {
    DataProvider.saveSubject({
      ...sub,
      status: sub.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
    });
    loadData();
  };

  const openEnrollModal = (sub: Subject) => {
    setSubjectForEnrollment(sub);
    setIsEnrollModalOpen(true);
  };

  const toggleStudentEnrollment = (studentId: string) => {
    if (!subjectForEnrollment) return;
    const enrolledStudents = DataProvider.getEnrolledStudentsForSubject(subjectForEnrollment.id);
    const isEnrolled = enrolledStudents.some((st) => st.id === studentId);

    if (isEnrolled) {
      DataProvider.unenrollStudentFromSubject(studentId, subjectForEnrollment.id);
    } else {
      DataProvider.enrollStudentInSubject(studentId, subjectForEnrollment.id);
    }
    loadData();
  };

  const filtered = subjects.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <TeacherLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Plan de Asignaturas</h1>
            <p className="text-xs text-slate-500 mt-1">
              Catálogo de materias académicas, descripción y estado curricular.
            </p>
          </div>
          <Button onClick={openCreateModal}>
            <Plus className="w-4 h-4 mr-1.5" /> Nueva Asignatura
          </Button>
        </div>

        {msg && (
          <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-saas text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{msg}</span>
          </div>
        )}

        {/* Search */}
        <Card className="p-4 bg-slate-50/70">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar materia por nombre o descripción..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </Card>

        {/* Subject Cards */}
        {filtered.length === 0 ? (
          <EmptyState
            title="No hay asignaturas encontradas"
            description="No se encontraron materias curriculares con el criterio de búsqueda."
            actionLabel="Crear Asignatura"
            onAction={openCreateModal}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((sub) => (
              <Card key={sub.id} className="p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <Badge variant={sub.status === 'ACTIVE' ? 'success' : 'neutral'}>
                      {sub.status === 'ACTIVE' ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </div>
                  <h3 className="mt-3 font-bold text-base text-slate-900">{sub.name}</h3>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed min-h-[36px]">
                    {sub.description || 'Sin descripción curricular registrada.'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleStatus(sub)}
                      className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-[11px] font-medium"
                    >
                      {sub.status === 'ACTIVE' ? (
                        <>
                          <ToggleRight className="w-4 h-4 text-emerald-600" /> Desactivar
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4 text-slate-400" /> Activar
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => openEnrollModal(sub)}
                      className="text-slate-600 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors"
                      title="Asignar y matricular estudiantes"
                    >
                      <Users className="w-3 h-3 text-slate-500" />
                      <span>{DataProvider.getEnrolledStudentsForSubject(sub.id).length} inscritos</span>
                    </button>
                  </div>
                  <button
                    onClick={() => openEditModal(sub)}
                    className="text-blue-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Editar
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal Crear/Editar Asignatura */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSubject ? 'Editar Asignatura' : 'Nueva Asignatura'}
        description="Ingresa el nombre curricular y los detalles pedagógicos de la materia."
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Nombre de la Asignatura *"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Matemáticas, Tecnología, Educación Física"
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Descripción Curricular (Opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Contenido pedagógico y objetivos de la materia..."
              className="w-full px-3.5 py-2 text-xs text-slate-900 bg-white border border-slate-300 rounded-saas focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Guardar Asignatura</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Asignar Estudiantes */}
      <Modal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        title={`Matricular Estudiantes — ${subjectForEnrollment?.name}`}
        description="Marca o desmarca los estudiantes asignados a esta asignatura curricular."
      >
        <div className="space-y-3">
          <p className="text-xs text-slate-600">
            Haz clic sobre un estudiante para agregarlo o retirarlo de esta materia:
          </p>
          <div className="max-h-64 overflow-y-auto space-y-1.5 border border-slate-200 rounded-lg p-2">
            {students.map((st) => {
              const enrolled = subjectForEnrollment
                ? DataProvider.getEnrolledStudentsForSubject(subjectForEnrollment.id).some((s) => s.id === st.id)
                : false;
              return (
                <div
                  key={st.id}
                  onClick={() => toggleStudentEnrollment(st.id)}
                  className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                    enrolled
                      ? 'bg-blue-50/60 border-blue-200 text-blue-900'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div>
                    <span className="font-bold text-xs block">{st.first_name} {st.last_name}</span>
                    <span className="text-[10px] text-slate-500">Grado {st.grade} • Grupo {st.section}</span>
                  </div>
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center ${enrolled ? 'bg-blue-600 text-white' : 'border border-slate-300'}`}>
                    {enrolled && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-end pt-3 border-t border-slate-100">
            <Button onClick={() => setIsEnrollModalOpen(false)}>
              Listo
            </Button>
          </div>
        </div>
      </Modal>
    </TeacherLayout>
  );
}
