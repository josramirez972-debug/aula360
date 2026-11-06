'use client';

import React, { useState, useEffect } from 'react';
import { TeacherLayout } from '@/components/layout/TeacherLayout';
import { DataProvider } from '@/lib/data-provider';
import { Profile, Student } from '@/types/database';
import { UserCheck, Plus, Search, Mail, Phone, User, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import Link from 'next/link';

export default function ParentsPage() {
  const [parents, setParents] = useState<Profile[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');

  // Modal create parent
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [relationshipType, setRelationshipType] = useState('Padre');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = () => {
    setParents(DataProvider.getParents());
    setStudents(DataProvider.getStudents());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('aula360_data_updated', loadData);
    return () => window.removeEventListener('aula360_data_updated', loadData);
  }, []);

  const openCreateModal = () => {
    setFullName('');
    setEmail('');
    setPhone('');
    setSelectedStudentId('');
    setRelationshipType('Padre');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleCreateParent = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName || !email) {
      setErrorMsg('Por favor completa todos los campos requeridos.');
      return;
    }

    setIsSubmitting(true);

    // Call server-side provision API (Section 6: Privileged actions executed on server)
    try {
      const response = await fetch('/api/parents/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || undefined,
          student_id: selectedStudentId || undefined,
        }),
      });

      const resData = await response.json();
      if (!response.ok && resData.error) {
        setErrorMsg(resData.error);
        setIsSubmitting(false);
        return;
      }
    } catch {
      // Continue with local provider
    }

    // Persist in DataProvider with strict 1:1 check
    const newParent = DataProvider.saveProfile({
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() || undefined,
      role: 'PARENT',
    });

    if (selectedStudentId) {
      const assocResult = DataProvider.associateParentStudent(newParent.id, selectedStudentId, relationshipType);
      if (!assocResult.success) {
        setErrorMsg(assocResult.error || 'Error asociando el estudiante.');
        setIsSubmitting(false);
        return;
      }
    }

    setIsSubmitting(false);
    setIsModalOpen(false);
    setSuccessMsg(`Representante ${newParent.full_name} creado y vinculado exitosamente.`);
    setTimeout(() => setSuccessMsg(null), 3500);
    loadData();
  };

  const filteredParents = parents.filter((p) => {
    const q = search.toLowerCase();
    return p.full_name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q);
  });

  // Students who do NOT have a parent yet
  const availableStudentsFor1to1 = students.filter((st) => {
    const existingParent = DataProvider.getParentForStudent(st.id);
    return !existingParent;
  });

  return (
    <TeacherLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gestión de Representantes (1:1)</h1>
            <p className="text-xs text-slate-500 mt-1">
              Cada acudiente cuenta con una cuenta única vinculada a un único estudiante.
            </p>
          </div>
          <Button onClick={openCreateModal}>
            <Plus className="w-4 h-4 mr-1.5" /> Registrar Representante
          </Button>
        </div>

        {successMsg && (
          <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-saas text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Notice 1:1 Rule */}
        <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-saas text-xs text-blue-900 flex items-center gap-2.5">
          <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            <strong>Regla Arquitectónica 1:1:</strong> Un representante solo puede tener un estudiante a su cargo, y cada estudiante cuenta con un único acudiente en el sistema.
          </span>
        </div>

        {/* Search */}
        <Card className="p-4 bg-slate-50/70">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o correo del representante..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </Card>

        {/* Parents list */}
        {filteredParents.length === 0 ? (
          <EmptyState
            icon={UserCheck}
            title={search ? "No se encontraron representantes" : "No hay representantes registrados"}
            description={
              search
                ? `No existen acudientes que coincidan con "${search}". Intenta con otro término de búsqueda.`
                : "Aprovisiona el acceso de los acudientes para vincularlos 1:1 a sus respectivos estudiantes."
            }
            actionLabel={search ? "Limpiar Búsqueda" : "Registrar Representante"}
            onAction={search ? () => setSearch('') : openCreateModal}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredParents.map((parent) => {
              const child = DataProvider.getStudentForParent(parent.id);
              return (
                <Card key={parent.id} className="p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                        {parent.full_name.charAt(0)}
                      </div>
                      <Badge variant="info">Representante 1:1</Badge>
                    </div>

                    <div className="mt-3">
                      <h3 className="font-bold text-sm text-slate-900">{parent.full_name}</h3>
                      <div className="mt-1 space-y-1 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate">{parent.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{parent.phone || 'Sin teléfono'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Single child tag */}
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Estudiante Vinculado
                      </p>
                      {child ? (
                        <Link
                          href={`/teacher/students/${child.id}`}
                          className="flex items-center justify-between text-xs text-slate-800 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 p-2.5 rounded-lg border border-slate-200/80 transition-colors"
                        >
                          <div>
                            <span className="font-bold block">{child.first_name} {child.last_name}</span>
                            <span className="text-[10px] text-slate-500">Grado {child.grade} • Grupo {child.section}</span>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                        </Link>
                      ) : (
                        <span className="text-xs text-amber-600 font-semibold block py-1">
                          Sin estudiante asignado
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Registrado: {parent.created_at.slice(0, 10)}</span>
                    <span className="text-emerald-600 font-semibold">Acceso Activo</span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Parent Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrar Representante (Relación 1:1)"
        description="Aprovisiona la cuenta del acudiente y vincúlala a un único estudiante."
        maxWidth="md"
      >
        <form onSubmit={handleCreateParent} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-saas text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <Input
            label="Nombre Completo del Acudiente *"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ej. Roberto Sánchez"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Correo Electrónico *"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="padre@correo.com"
            />
            <Input
              label="Teléfono / Celular"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+57 300 000 0000"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Estudiante Asignado (1:1) *"
              required
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
            >
              <option value="">-- Seleccionar Estudiante --</option>
              {availableStudentsFor1to1.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.first_name} {st.last_name} ({st.grade})
                </option>
              ))}
            </Select>

            <Select
              label="Parentesco *"
              value={relationshipType}
              onChange={(e) => setRelationshipType(e.target.value)}
            >
              <option value="Padre">Padre</option>
              <option value="Madre">Madre</option>
              <option value="Tutor Legal">Tutor Legal</option>
            </Select>
          </div>

          {availableStudentsFor1to1.length === 0 && (
            <p className="text-[11px] text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
              Todos los estudiantes registrados ya tienen un representante vinculado.
            </p>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Crear Representante
            </Button>
          </div>
        </form>
      </Modal>
    </TeacherLayout>
  );
}
