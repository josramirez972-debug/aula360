'use client';

import React, { useState, useEffect } from 'react';
import { TeacherLayout } from '@/components/layout/TeacherLayout';
import { DataProvider } from '@/lib/data-provider';
import { Student, AcademicPeriod, Profile, ValidationComputedStatus } from '@/types/database';
import { CheckCircle2, Clock, AlertCircle, Filter, ShieldCheck, GitBranch, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface ValidationRow {
  student: Student;
  period: AcademicPeriod;
  parent: Profile | null;
  status: ValidationComputedStatus;
  currentVersion: number;
  reviewedVersion: number | null;
  validatedAt: string | null;
}

export default function TeacherValidationsPage() {
  const [rows, setRows] = useState<ValidationRow[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);

  // Filters
  const [studentFilter, setStudentFilter] = useState('ALL');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [periodFilter, setPeriodFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadData = () => {
    const st = DataProvider.getStudents();
    const pers = DataProvider.getPeriods();
    setStudents(st);
    setPeriods(pers);

    // Compute status matrix for every student and period
    const computedRows: ValidationRow[] = [];
    st.forEach((s) => {
      const parent = DataProvider.getParentForStudent(s.id);
      pers.forEach((p) => {
        const valInfo = DataProvider.computeValidationStatus(s.id, p.id, parent?.id);
        computedRows.push({
          student: s,
          period: p,
          parent,
          status: valInfo.status,
          currentVersion: valInfo.currentVersion,
          reviewedVersion: valInfo.reviewedVersion,
          validatedAt: valInfo.validatedAt,
        });
      });
    });

    setRows(computedRows);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('aula360_data_updated', loadData);
    return () => window.removeEventListener('aula360_data_updated', loadData);
  }, []);

  const totalValidated = rows.filter((r) => r.status === 'VALIDATED').length;
  const totalRevisionRequired = rows.filter((r) => r.status === 'REVISION_REQUIRED').length;
  const totalPending = rows.filter((r) => r.status === 'PENDING').length;

  const filteredRows = rows.filter((r) => {
    if (studentFilter !== 'ALL' && r.student.id !== studentFilter) return false;
    if (gradeFilter !== 'ALL' && r.student.grade !== gradeFilter) return false;
    if (periodFilter !== 'ALL' && r.period.id !== periodFilter) return false;
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    return true;
  });

  return (
    <TeacherLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Control de Validaciones con Versiones</h1>
          <p className="text-xs text-slate-500 mt-1">
            Auditoría de constancias familiares y verificación de vigencia frente a la versión académica actual.
          </p>
        </div>

        {/* Status Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Revisados (Vigentes)</p>
              <h3 className="text-xl font-extrabold text-emerald-600">{totalValidated}</h3>
              <p className="text-[10px] text-slate-400">Versión revisada coincide con la actual</p>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Revisión Nuevamente Requerida</p>
              <h3 className="text-xl font-extrabold text-amber-600">{totalRevisionRequired}</h3>
              <p className="text-[10px] text-slate-400">Notas modificadas tras revisión previa</p>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Pendientes de Revisión</p>
              <h3 className="text-xl font-extrabold text-slate-700">{totalPending}</h3>
              <p className="text-[10px] text-slate-400">Sin revisión previa registrada</p>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 bg-slate-50/70">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Filter className="w-4 h-4 text-slate-400" />
              <span>Filtros:</span>
            </div>

            <select
              value={studentFilter}
              onChange={(e) => setStudentFilter(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">Todos los Estudiantes</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.first_name} {s.last_name}
                </option>
              ))}
            </select>

            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">Todos los Grados</option>
              <option value="5A">Grado 5A</option>
              <option value="6A">Grado 6A</option>
              <option value="7A">Grado 7A</option>
            </select>

            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="VALIDATED">Revisado (Vigente)</option>
              <option value="REVISION_REQUIRED">Revisión Nuevamente Requerida</option>
              <option value="PENDING">Pendiente de Revisión</option>
            </select>
          </div>
        </Card>

        {/* Validations Matrix Table */}
        <div className="bg-white rounded-saas border border-slate-200/80 shadow-xs overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[780px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <th className="px-4 py-3.5">Estudiante</th>
                <th className="px-4 py-3.5">Grado</th>
                <th className="px-4 py-3.5">Período</th>
                <th className="px-4 py-3.5">Representante (1:1)</th>
                <th className="px-4 py-3.5 text-center">Versión Actual</th>
                <th className="px-4 py-3.5 text-center">Versión Revisada</th>
                <th className="px-4 py-3.5">Estado de Validación</th>
                <th className="px-4 py-3.5">Fecha y Hora de Confirmación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    No hay registros de validación para los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                filteredRows.map((r, idx) => (
                  <tr key={`${r.student.id}-${r.period.id}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {r.student.first_name} {r.student.last_name}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {r.student.grade}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">{r.period.name}</td>
                    <td className="px-4 py-3 text-slate-800 font-medium">
                      {r.parent ? r.parent.full_name : <span className="text-amber-600 italic">Sin acudiente</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                        v{r.currentVersion}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {r.reviewedVersion ? (
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                          v{r.reviewedVersion}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {r.status === 'VALIDATED' && (
                        <Badge variant="success">Revisado</Badge>
                      )}
                      {r.status === 'REVISION_REQUIRED' && (
                        <Badge variant="warning">Revisión Requerida</Badge>
                      )}
                      {r.status === 'PENDING' && (
                        <Badge variant="neutral">Pendiente</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-[11px]">
                      {r.validatedAt ? (
                        new Date(r.validatedAt).toLocaleString('es-CO', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      ) : (
                        <span className="text-slate-400 italic">Sin confirmación</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </TeacherLayout>
  );
}
