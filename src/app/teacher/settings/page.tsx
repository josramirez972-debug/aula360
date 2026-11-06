'use client';

import React, { useState, useEffect } from 'react';
import { TeacherLayout } from '@/components/layout/TeacherLayout';
import { DataProvider } from '@/lib/data-provider';
import { SchoolSettings, AuditLog } from '@/types/database';
import { Settings, Save, ShieldAlert, History, CheckCircle, Database, Building2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function SettingsPage() {
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Institutional identity fields (Section 7)
  const [schoolName, setSchoolName] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [institutionalEmail, setInstitutionalEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [activeYear, setActiveYear] = useState('2025');
  const [minGrade, setMinGrade] = useState('0.00');
  const [maxGrade, setMaxGrade] = useState('5.00');
  const [passingGrade, setPassingGrade] = useState('3.00');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = () => {
    const s = DataProvider.getSchoolSettings();
    setSettings(s);
    setSchoolName(s.school_name);
    setTeacherName(s.teacher_name || 'Profesor Demo');
    setInstitutionalEmail(s.institutional_email || 'profesor@aula360.edu');
    setPhone(s.phone || '+57 300 123 4567');
    setActiveYear(s.active_year || '2025');
    setMinGrade(s.min_grade.toFixed(2));
    setMaxGrade(s.max_grade.toFixed(2));
    setPassingGrade(s.passing_grade.toFixed(2));
    setAuditLogs(DataProvider.getAuditLogs());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('aula360_data_updated', loadData);
    return () => window.removeEventListener('aula360_data_updated', loadData);
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    DataProvider.saveSchoolSettings({
      school_name: schoolName.trim(),
      teacher_name: teacherName.trim(),
      institutional_email: institutionalEmail.trim(),
      phone: phone.trim(),
      active_year: activeYear.trim(),
      min_grade: parseFloat(minGrade),
      max_grade: parseFloat(maxGrade),
      passing_grade: parseFloat(passingGrade),
    });
    setSuccessMsg('Configuración institucional actualizada exitosamente.');
    setTimeout(() => setSuccessMsg(null), 3000);
    loadData();
  };

  return (
    <TeacherLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Configuración Institucional</h1>
          <p className="text-xs text-slate-500 mt-1">
            Identidad del colegio, datos del docente administrador, escala de calificaciones y auditoría.
          </p>
        </div>

        {successMsg && (
          <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-saas text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                Datos de la Institución y Docente Administrador
              </h2>

              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Nombre de la Institución Educativa *"
                    required
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="Colegio AULA360"
                  />
                  <Input
                    label="Año Académico Activo *"
                    required
                    value={activeYear}
                    onChange={(e) => setActiveYear(e.target.value)}
                    placeholder="2025"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <Input
                    label="Nombre del Profesor Titular *"
                    required
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    placeholder="Profesor Demo"
                  />
                  <Input
                    label="Correo Institucional *"
                    type="email"
                    required
                    value={institutionalEmail}
                    onChange={(e) => setInstitutionalEmail(e.target.value)}
                    placeholder="docente@aula360.edu"
                  />
                  <Input
                    label="Teléfono Institucional"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+57 300 123 4567"
                  />
                </div>

                <div className="pt-2 border-t border-slate-100 mt-4">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                    Escala de Calificación (PostgreSQL NUMERIC 3,2)
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      label="Mínimo de Escala *"
                      type="number"
                      step="0.01"
                      required
                      value={minGrade}
                      onChange={(e) => setMinGrade(e.target.value)}
                    />
                    <Input
                      label="Máximo de Escala *"
                      type="number"
                      step="0.01"
                      required
                      value={maxGrade}
                      onChange={(e) => setMaxGrade(e.target.value)}
                    />
                    <Input
                      label="Nota Mínima Aprobatoria *"
                      type="number"
                      step="0.01"
                      required
                      value={passingGrade}
                      onChange={(e) => setPassingGrade(e.target.value)}
                      helperText="Umbral Aprobado vs Reprobado"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <Button type="submit">
                    <Save className="w-4 h-4 mr-1.5" /> Guardar Configuración
                  </Button>
                </div>
              </form>
            </Card>

            {/* Audit Logs */}
            <Card className="p-6">
              <h2 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
                <History className="w-4 h-4 text-blue-600" />
                Registro Inmutable de Auditoría (`audit_logs`)
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                Historial de eventos de inserción, modificación de notas y validaciones registradas.
              </p>

              <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 text-xs">
                {auditLogs.length === 0 ? (
                  <p className="p-4 text-center text-slate-400">Sin eventos de auditoría registrados.</p>
                ) : (
                  auditLogs.map((log) => (
                    <div key={log.id} className="p-3 hover:bg-slate-50 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                            {log.action}
                          </span>
                          <span className="font-semibold text-slate-800">{log.entity_type}</span>
                          <span className="text-[10px] text-slate-400 font-mono">#{log.entity_id.slice(-6)}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Usuario: {log.user_id || 'prof-teacher-01'}
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(log.created_at).toLocaleTimeString('es-CO', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Database / Architecture Info Sidebar */}
          <div>
            <Card className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">Definición Arquitectónica</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                AULA360 opera bajo una estricta relación 1:1 entre representantes y estudiantes con aislamiento criptográfico mediante Supabase RLS.
              </p>
              <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-2 border border-slate-200/80 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Modelo:</span>
                  <span className="text-slate-900 font-bold">Mono-colegio / 1 Docente</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Vínculo:</span>
                  <span className="text-emerald-700 font-bold">1 Representante ↔ 1 Alumno</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Escala:</span>
                  <span className="text-slate-900 font-bold">NUMERIC(3, 2)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Versiones:</span>
                  <span className="text-blue-700 font-bold">Auto-incremento y Re-validación</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </TeacherLayout>
  );
}
