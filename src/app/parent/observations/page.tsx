'use client';

import React, { useState, useEffect } from 'react';
import { ParentLayout } from '@/components/layout/ParentLayout';
import { useAuth } from '@/lib/auth-context';
import { DataProvider } from '@/lib/data-provider';
import { Student, Subject, AcademicPeriod, Observation } from '@/types/database';
import { MessageSquareQuote, Filter, Calendar, BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default function ParentObservationsPage() {
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('ALL');

  const loadData = () => {
    if (!user) return;
    const myKid = DataProvider.getStudentForParent(user.id);
    setStudent(myKid);
    setPeriods(DataProvider.getPeriods());
    setSubjects(DataProvider.getSubjects());
    if (myKid) {
      setObservations(DataProvider.getObservations({ student_id: myKid.id }));
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('aula360_data_updated', loadData);
    return () => window.removeEventListener('aula360_data_updated', loadData);
  }, [user]);

  const filteredObservations = observations.filter((o) => {
    if (selectedPeriod !== 'ALL' && o.period_id !== selectedPeriod) return false;
    return true;
  });

  return (
    <ParentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Observaciones Formativas</h1>
          <p className="text-xs text-slate-500 mt-1">
            Comentarios pedagógicos y de convivencia emitidos para {student ? `${student.first_name} ${student.last_name}` : 'tu estudiante'}.
          </p>
        </div>

        {/* Filters */}
        <Card className="p-4 bg-slate-50/70">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Filter className="w-4 h-4 text-slate-400" />
              <span>Filtrar Período:</span>
            </div>

            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">Todos los Períodos</option>
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </Card>

        {/* List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredObservations.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-saas border border-slate-200">
              No hay observaciones registradas para este período.
            </div>
          ) : (
            filteredObservations.map((obs) => {
              const period = periods.find((p) => p.id === obs.period_id);
              const subject = subjects.find((s) => s.id === obs.subject_id);

              return (
                <Card key={obs.id} className="p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-slate-900">
                        {student?.first_name} {student?.last_name}
                      </span>
                      <Badge variant="info" size="sm">
                        {obs.observation_type}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                      "{obs.content}"
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>
                      {period?.name} {subject ? `• ${subject.name}` : ''}
                    </span>
                    <span>{obs.created_at.slice(0, 10)}</span>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </ParentLayout>
  );
}
