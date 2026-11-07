'use client';

import React, { useState, useEffect } from 'react';
import { TeacherLayout } from '@/components/layout/TeacherLayout';
import { DataProvider } from '@/lib/data-provider';
import {
  Users,
  UserCheck,
  BookOpen,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  ArrowRight,
  Filter,
} from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Student, Subject, Grade, GradeValidation, Observation } from '@/types/database';

export default function TeacherDashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [validations, setValidations] = useState<GradeValidation[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);
  
  // Filters
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('ALL');

  const loadData = () => {
    setStudents(DataProvider.getStudents());
    setSubjects(DataProvider.getSubjects());
    setGrades(DataProvider.getGrades());
    setValidations(DataProvider.getValidations());
    setObservations(DataProvider.getObservations());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('aula360_data_updated', loadData);
    return () => window.removeEventListener('aula360_data_updated', loadData);
  }, []);

  const periods = DataProvider.getPeriods();
  const parents = DataProvider.getParents();

  // Exact Metrics required by Phase 3, Section 3
  const activeStudents = students.filter((s) => s.status === 'ACTIVE');
  const gradesRegisteredCount = grades.length;
  
  // Validation status across all students and periods
  let pendingCount = 0;
  let completedCount = 0;
  students.forEach((st) => {
    periods.forEach((p) => {
      const v = DataProvider.computeValidationStatus(st.id, p.id);
      if (v.status === 'VALIDATED') {
        completedCount++;
      } else {
        pendingCount++;
      }
    });
  });

  const averageGrade =
    grades.length > 0 ? (grades.reduce((acc, g) => acc + g.grade, 0) / grades.length).toFixed(2) : '0.00';

  // Filtered students for quick table
  const filteredStudents = activeStudents.filter((s) => {
    if (selectedGrade !== 'ALL' && s.grade !== selectedGrade) return false;
    return true;
  });

  return (
    <TeacherLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Panel Académico General</h1>
            <p className="text-xs text-slate-500 mt-1">
              Supervisión de calificaciones, estudiantes y confirmaciones de representantes.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/teacher/grades"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-blue-600 text-white rounded-saas hover:bg-blue-700 shadow-sm transition-all"
            >
              <GraduationCap className="w-4 h-4" /> Registrar Calificación
            </Link>
          </div>
        </div>

        {/* KPI Cards (Exact 4 Metrics from Phase 3 Section 3) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total de Estudiantes</p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">{activeStudents.length}</h3>
              <p className="text-[11px] text-emerald-600 font-medium">100% Matriculados</p>
            </div>
          </Card>

          <Card className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Calificaciones Registradas</p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">{gradesRegisteredCount}</h3>
              <p className="text-[11px] text-slate-400">Promedio: {averageGrade} / 5.00</p>
            </div>
          </Card>

          <Card className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Representantes (1:1)</p>
              <h3 className="text-2xl font-extrabold text-amber-600 mt-0.5">{parents.length}</h3>
              <Link href="/teacher/parents" className="text-[11px] text-blue-600 font-medium hover:underline">
                Gestionar acudientes →
              </Link>
            </div>
          </Card>

          <Card className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Asignaturas Activas</p>
              <h3 className="text-2xl font-extrabold text-emerald-600 mt-0.5">{subjects.length}</h3>
              <Link href="/teacher/subjects" className="text-[11px] text-blue-600 font-medium hover:underline">
                Plan de estudios →
              </Link>
            </div>
          </Card>
        </div>

        {/* Filter Toolbar */}
        <Card className="p-4 bg-slate-50/70">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Filter className="w-4 h-4 text-slate-400" />
              <span>Filtros Rápidos:</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">Todos los Grados</option>
                <option value="5A">Grado 5A</option>
                <option value="6A">Grado 6A</option>
                <option value="7A">Grado 7A</option>
              </select>

              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">Todos los Períodos</option>
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.status === 'OPEN' ? 'Abierto' : 'Cerrado'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Two Column Layout: Students Overview & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Estudiantes y Estado Académico</h2>
              <Link href="/teacher/students" className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1">
                Ver todos ({students.length}) <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="bg-white rounded-saas border border-slate-200/80 shadow-xs overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs min-w-[520px]">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="px-4 py-3">Estudiante</th>
                    <th className="px-4 py-3">Grado</th>
                    <th className="px-4 py-3">Representante</th>
                    <th className="px-4 py-3">Calificaciones</th>
                    <th className="px-4 py-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((student) => {
                    const studentGrades = grades.filter((g) => g.student_id === student.id);
                    const parentAssigned = DataProvider.getParentForStudent(student.id);
                    const avg =
                      studentGrades.length > 0
                        ? (studentGrades.reduce((a, b) => a + b.grade, 0) / studentGrades.length).toFixed(2)
                        : 'Sin notas';

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {student.first_name} {student.last_name}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            {student.grade}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {parentAssigned ? (
                            <span className="font-medium text-slate-800">{parentAssigned.full_name}</span>
                          ) : (
                            <span className="text-amber-600 font-medium">Sin acudiente (1:1)</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`font-bold ${
                              avg !== 'Sin notas' && Number(avg) >= 3.0 ? 'text-emerald-600' : 'text-slate-500'
                            }`}
                          >
                            {avg !== 'Sin notas' ? `${avg} / 5.0` : avg}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {studentGrades.length} materias registradas
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/teacher/students/${student.id}`}
                            className="text-blue-600 font-semibold hover:underline"
                          >
                            Ver Ficha
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900">Actividad Reciente</h2>
            <Card className="p-4 space-y-4">
              {/* Latest Grades */}
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Últimas Calificaciones
                </p>
                <div className="space-y-2.5">
                  {grades.slice(-3).reverse().map((g) => {
                    const student = students.find((s) => s.id === g.student_id);
                    const subject = subjects.find((s) => s.id === g.subject_id);
                    return (
                      <div key={g.id} className="flex items-start justify-between text-xs border-b border-slate-100 pb-2">
                        <div>
                          <p className="font-semibold text-slate-800">
                            {student?.first_name} {student?.last_name}
                          </p>
                          <p className="text-[10px] text-slate-500">{subject?.name}</p>
                        </div>
                        <Badge variant={g.grade >= 3.0 ? 'success' : 'danger'}>{g.grade.toFixed(2)}</Badge>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Latest Observations */}
              <div className="pt-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Últimas Observaciones
                </p>
                <div className="space-y-2">
                  {observations.slice(0, 2).map((o) => {
                    const student = students.find((s) => s.id === o.student_id);
                    return (
                      <div key={o.id} className="p-2.5 rounded-lg bg-slate-50 text-xs">
                        <p className="font-semibold text-slate-800">
                          {student?.first_name} {student?.last_name}
                        </p>
                        <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">"{o.content}"</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </TeacherLayout>
  );
}
