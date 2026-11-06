'use client';

import React, { useState, useEffect } from 'react';
import { TeacherLayout } from '@/components/layout/TeacherLayout';
import { DataProvider } from '@/lib/data-provider';
import { Student } from '@/types/database';
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit2,
  UserX,
  UserCheck,
  Calendar,
  ExternalLink,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';

// Age calculator helper
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

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('2014-01-01');
  const [grade, setGrade] = useState('6A');
  const [section, setSection] = useState('A');
  const [documentId, setDocumentId] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const loadData = () => {
    setStudents(DataProvider.getStudents());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('aula360_data_updated', loadData);
    return () => window.removeEventListener('aula360_data_updated', loadData);
  }, []);

  const openCreateModal = () => {
    setEditingStudent(null);
    setFirstName('');
    setLastName('');
    setBirthDate('2014-05-15');
    setGrade('6A');
    setSection('A');
    setDocumentId('');
    setStatus('ACTIVE');
    setIsModalOpen(true);
  };

  const openEditModal = (s: Student) => {
    setEditingStudent(s);
    setFirstName(s.first_name);
    setLastName(s.last_name);
    setBirthDate(s.birth_date);
    setGrade(s.grade);
    setSection(s.section || 'A');
    setDocumentId(s.document_id || '');
    setStatus(s.status);
    setIsModalOpen(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !birthDate) return;

    DataProvider.saveStudent({
      id: editingStudent ? editingStudent.id : undefined,
      first_name: firstName,
      last_name: lastName,
      birth_date: birthDate,
      grade,
      section,
      document_id: documentId || undefined,
      status,
    });

    setIsModalOpen(false);
    setFeedbackMsg(editingStudent ? 'Estudiante actualizado exitosamente' : 'Nuevo estudiante registrado');
    setTimeout(() => setFeedbackMsg(null), 3000);
    loadData();
  };

  const toggleStudentStatus = (s: Student) => {
    const nextStatus = s.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    DataProvider.saveStudent({
      ...s,
      status: nextStatus,
    });
    loadData();
  };

  // Filtered Students
  const filteredStudents = students.filter((s) => {
    const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
    if (search && !fullName.includes(search.toLowerCase()) && !s.document_id?.includes(search)) {
      return false;
    }
    if (gradeFilter !== 'ALL' && s.grade !== gradeFilter) return false;
    if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
    return true;
  });

  const calculatedAge = calculateAge(birthDate);

  return (
    <TeacherLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gestión de Estudiantes</h1>
            <p className="text-xs text-slate-500 mt-1">
              Registro, edición, cálculo de edad y vinculación académica.
            </p>
          </div>
          <Button onClick={openCreateModal} size="md">
            <Plus className="w-4 h-4 mr-1.5" /> Registrar Nuevo Estudiante
          </Button>
        </div>

        {feedbackMsg && (
          <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-saas text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Filters and search bar */}
        <Card className="p-4 bg-slate-50/70">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre o documento..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full sm:w-auto"
              >
                <option value="ALL">Todos los grados</option>
                <option value="5A">Grado 5A</option>
                <option value="6A">Grado 6A</option>
                <option value="7A">Grado 7A</option>
                <option value="8A">Grado 8A</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full sm:w-auto"
              >
                <option value="ALL">Todos los estados</option>
                <option value="ACTIVE">Activos</option>
                <option value="INACTIVE">Inactivos</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Table of students */}
        <div className="bg-white rounded-saas border border-slate-200/80 shadow-xs overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[720px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <th className="px-4 py-3.5">Estudiante</th>
                <th className="px-4 py-3.5">Documento</th>
                <th className="px-4 py-3.5">Edad / F. Nacimiento</th>
                <th className="px-4 py-3.5">Grado & Grupo</th>
                <th className="px-4 py-3.5">Representantes</th>
                <th className="px-4 py-3.5">Estado</th>
                <th className="px-4 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6">
                    <EmptyState
                      title="No se encontraron estudiantes"
                      description="Ajusta los filtros de búsqueda o registra un nuevo estudiante para este ciclo escolar."
                      actionLabel="Registrar Estudiante"
                      onAction={openCreateModal}
                    />
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => {
                  const age = calculateAge(s.birth_date);
                  const parent = DataProvider.getParentForStudent(s.id);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-900">
                        {s.first_name} {s.last_name}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{s.document_id || 'Sin registrar'}</td>
                      <td className="px-4 py-3 text-slate-700">
                        <span className="font-semibold">{age} años</span>
                        <span className="text-[10px] text-slate-400 block">{s.birth_date}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[11px]">
                          {s.grade}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {parent ? (
                          <div className="text-[11px] font-semibold text-slate-800">
                            {parent.full_name}
                          </div>
                        ) : (
                          <span className="text-amber-600 font-semibold text-[11px]">Sin representante</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={s.status === 'ACTIVE' ? 'success' : 'danger'}>
                          {s.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                        <Link
                          href={`/teacher/students/${s.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          Ficha <ExternalLink className="w-3 h-3" />
                        </Link>
                        <button
                          onClick={() => openEditModal(s)}
                          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                          title="Editar información"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => toggleStudentStatus(s)}
                          className={`p-1 rounded ${
                            s.status === 'ACTIVE'
                              ? 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={s.status === 'ACTIVE' ? 'Desactivar estudiante' : 'Activar estudiante'}
                        >
                          {s.status === 'ACTIVE' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Student Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStudent ? 'Editar Ficha de Estudiante' : 'Registrar Nuevo Estudiante'}
        description="Ingresa los datos escolares del estudiante. La edad se calcula de forma automática."
        maxWidth="md"
      >
        <form onSubmit={handleSaveStudent} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Nombres *"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Ej. Juan"
            />
            <Input
              label="Apellidos *"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Ej. Pérez"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Input
                label="Fecha de Nacimiento *"
                type="date"
                required
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
              <p className="mt-1 text-[11px] font-medium text-blue-600">
                Edad calculada: {calculatedAge} años
              </p>
            </div>
            <Input
              label="Documento de Identidad (Opcional)"
              value={documentId}
              onChange={(e) => setDocumentId(e.target.value)}
              placeholder="Ej. TI-1092837411"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Select
              label="Grado *"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
            >
              <option value="5A">5° Primaria (5A)</option>
              <option value="6A">6° Secundaria (6A)</option>
              <option value="7A">7° Secundaria (7A)</option>
              <option value="8A">8° Secundaria (8A)</option>
            </Select>

            <Input
              label="Sección / Grupo"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              placeholder="A"
            />

            <Select
              label="Estado"
              value={status}
              onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
            >
              <option value="ACTIVE">Activo</option>
              <option value="INACTIVE">Inactivo</option>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingStudent ? 'Guardar Cambios' : 'Registrar Estudiante'}
            </Button>
          </div>
        </form>
      </Modal>
    </TeacherLayout>
  );
}
