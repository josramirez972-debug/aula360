'use client';

import React, { useState, useEffect } from 'react';
import { ParentLayout } from '@/components/layout/ParentLayout';
import { useAuth } from '@/lib/auth-context';
import { DataProvider } from '@/lib/data-provider';
import { Student, AcademicPeriod, GradeValidation } from '@/types/database';
import { Clock, CheckCircle2, AlertTriangle, Calendar, GitBranch } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';

export default function ParentHistoryPage() {
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [validations, setValidations] = useState<GradeValidation[]>([]);

  const loadData = () => {
    if (!user) return;
    const myStudent = DataProvider.getStudentForParent(user.id);
    setStudent(myStudent);
    setPeriods(DataProvider.getPeriods());
    if (myStudent) {
      setValidations(DataProvider.getValidations({ student_id: myStudent.id, parent_id: user.id }));
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('aula360_data_updated', loadData);
    return () => window.removeEventListener('aula360_data_updated', loadData);
  }, [user]);

  return (
    <ParentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Historial de Revisiones</h1>
          <p className="text-xs text-slate-500 mt-1">
            Registro inmutable de constancias académicas firmadas digitalmente por ti.
          </p>
        </div>

        <div className="bg-white rounded-saas border border-slate-200/80 shadow-xs overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[650px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <th className="px-4 py-3.5">Estudiante</th>
                <th className="px-4 py-3.5">Grado</th>
                <th className="px-4 py-3.5">Período Académico</th>
                <th className="px-4 py-3.5 text-center">Versión Confirmada</th>
                <th className="px-4 py-3.5">Estado de Vigencia</th>
                <th className="px-4 py-3.5">Fecha y Hora de Confirmación</th>
                <th className="px-4 py-3.5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {validations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Aún no has registrado ninguna validación de boletines.
                  </td>
                </tr>
              ) : (
                validations.map((v) => {
                  const period = periods.find((p) => p.id === v.period_id);
                  const currentVer = student ? DataProvider.getCurrentAcademicVersion(student.id, v.period_id) : 1;
                  const isCurrent = v.version_reviewed === currentVer;

                  return (
                    <tr key={v.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-bold text-slate-900">
                        {student ? `${student.first_name} ${student.last_name}` : 'Estudiante'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {student?.grade}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">{period?.name}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                          v{v.version_reviewed}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {isCurrent ? (
                          <Badge variant="success">Vigente (v{v.version_reviewed})</Badge>
                        ) : (
                          <Badge variant="warning">
                            Superada (Actual: v{currentVer})
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-[11px]">
                        {new Date(v.validated_at).toLocaleString('es-CO', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/parent/children/${v.student_id}?period=${v.period_id}`}
                          className="text-blue-600 font-semibold hover:underline text-[11px]"
                        >
                          Ver Boletín
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ParentLayout>
  );
}
