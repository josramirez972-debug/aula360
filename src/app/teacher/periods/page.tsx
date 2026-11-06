'use client';

import React, { useState, useEffect } from 'react';
import { TeacherLayout } from '@/components/layout/TeacherLayout';
import { DataProvider } from '@/lib/data-provider';
import { AcademicPeriod } from '@/types/database';
import { Calendar, Plus, Lock, Unlock, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';

export default function PeriodsPage() {
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [year, setYear] = useState('2025');
  const [startDate, setStartDate] = useState('2025-02-01');
  const [endDate, setEndDate] = useState('2025-04-15');
  const [status, setStatus] = useState<'OPEN' | 'CLOSED'>('OPEN');
  const [msg, setMsg] = useState<string | null>(null);

  const loadData = () => {
    setPeriods(DataProvider.getPeriods());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('aula360_data_updated', loadData);
    return () => window.removeEventListener('aula360_data_updated', loadData);
  }, []);

  const openCreateModal = () => {
    setName(`Período ${periods.length + 1}`);
    setYear('2025');
    setStartDate('2025-08-01');
    setEndDate('2025-10-31');
    setStatus('OPEN');
    setIsModalOpen(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !startDate || !endDate) return;

    DataProvider.savePeriod({
      name,
      academic_year: year,
      start_date: startDate,
      end_date: endDate,
      status,
    });

    setIsModalOpen(false);
    setMsg('Período académico configurado');
    setTimeout(() => setMsg(null), 3000);
    loadData();
  };

  const togglePeriodStatus = (period: AcademicPeriod) => {
    const nextStatus = period.status === 'OPEN' ? 'CLOSED' : 'OPEN';
    const actionText = nextStatus === 'CLOSED' ? 'cerrar' : 'abrir';
    if (confirm(`¿Estás seguro de que deseas ${actionText} el ${period.name}? ${nextStatus === 'CLOSED' ? 'No se podrán cargar notas en un período cerrado sin reabrirlo.' : ''}`)) {
      DataProvider.savePeriod({
        ...period,
        status: nextStatus,
      });
      loadData();
    }
  };

  return (
    <TeacherLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Períodos Académicos</h1>
            <p className="text-xs text-slate-500 mt-1">
              Control de calendarios escolares, apertura y cierre de fechas para registro de notas.
            </p>
          </div>
          <Button onClick={openCreateModal}>
            <Plus className="w-4 h-4 mr-1.5" /> Nuevo Período
          </Button>
        </div>

        {msg && (
          <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-saas text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{msg}</span>
          </div>
        )}

        {/* Notice on closed periods */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-saas text-xs text-amber-800 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Control de Seguridad Académica:</span>
            <p className="mt-0.5">
              Los períodos marcados como <strong className="font-semibold">Cerrados</strong> bloquean automáticamente cualquier adición o edición de notas por parte de los profesores, a menos que el período sea explícitamente reabierto desde este módulo administrativo.
            </p>
          </div>
        </div>

        {/* Period Cards */}
        {periods.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No hay períodos académicos configurados"
            description="Configura el calendario escolar y los cuatro períodos académicos para iniciar el registro de notas."
            actionLabel="Nuevo Período"
            onAction={openCreateModal}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {periods.map((p) => {
            const isOpen = p.status === 'OPEN';
            return (
              <Card key={p.id} className="p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase">{p.academic_year}</span>
                    <Badge variant={isOpen ? 'success' : 'neutral'}>
                      {isOpen ? 'Abierto' : 'Cerrado'}
                    </Badge>
                  </div>

                  <h3 className="mt-3 font-extrabold text-lg text-slate-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    {p.name}
                  </h3>

                  <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Inicio:</span>
                      <span className="font-semibold text-slate-700">{p.start_date}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Cierre:</span>
                      <span className="font-semibold text-slate-700">{p.end_date}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {isOpen ? 'Recibiendo notas' : 'Cierre definitivo'}
                  </span>
                  <button
                    onClick={() => togglePeriodStatus(p)}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors ${
                      isOpen
                        ? 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                        : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                    }`}
                  >
                    {isOpen ? (
                      <>
                        <Lock className="w-3.5 h-3.5" /> Cerrar Período
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3.5 h-3.5" /> Reabrir Período
                      </>
                    )}
                  </button>
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
        title="Crear Período Escolar"
        description="Define las fechas de apertura y cierre para la carga de calificaciones."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Nombre del Período *"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Período 1"
          />

          <Input
            label="Año Académico *"
            required
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="2025"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Fecha de Inicio *"
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              label="Fecha de Finalización *"
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Guardar Período</Button>
          </div>
        </form>
      </Modal>
    </TeacherLayout>
  );
}
