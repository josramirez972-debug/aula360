'use client';

import React, { useState, useEffect } from 'react';
import { ParentLayout } from '@/components/layout/ParentLayout';
import { useAuth } from '@/lib/auth-context';
import { DataProvider } from '@/lib/data-provider';
import { Student, Grade } from '@/types/database';
import { Users2, ArrowRight, BookOpen, Award } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

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

export default function ParentChildrenPage() {
  const { user } = useAuth();
  const [child, setChild] = useState<Student | null>(null);

  const loadData = () => {
    if (!user) return;
    setChild(DataProvider.getStudentForParent(user.id));
  };

  useEffect(() => {
    loadData();
    window.addEventListener('aula360_data_updated', loadData);
    return () => window.removeEventListener('aula360_data_updated', loadData);
  }, [user]);

  const age = child ? calculateAge(child.birth_date) : 0;

  return (
    <ParentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mi Estudiante</h1>
          <p className="text-xs text-slate-500 mt-1">
            Estudiante asignado legalmente a tu cuenta de representante (Vínculo 1:1).
          </p>
        </div>

        {!child ? (
          <Card className="p-8 text-center text-slate-500">
            <p className="font-semibold text-sm">No tienes ningún estudiante asignado a tu cuenta.</p>
            <p className="text-xs text-slate-400 mt-1">
              Comunícate con la institución educativa para asociar a tu acudido.
            </p>
          </Card>
        ) : (
          <div className="max-w-md">
            <Card hoverable className="p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-700 font-extrabold text-xl flex items-center justify-center shadow-xs">
                    {child.first_name[0]}{child.last_name[0]}
                  </div>
                  <Badge variant="info">Grado {child.grade}</Badge>
                </div>

                <h3 className="mt-4 font-bold text-lg text-slate-900">
                  {child.first_name} {child.last_name}
                </h3>
                <div className="mt-1 text-xs text-slate-500 space-y-1">
                  <p>Edad: <strong className="text-slate-800 font-semibold">{age} años</strong> ({child.birth_date})</p>
                  <p>Grupo: <strong className="text-slate-800 font-semibold">{child.section}</strong></p>
                  <p>Documento: <strong className="text-slate-800 font-semibold">{child.document_id || 'Sin documento'}</strong></p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <Link
                  href={`/parent/children/${child.id}`}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-saas shadow-xs transition-all"
                >
                  Ver Boletín de Calificaciones <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </Card>
          </div>
        )}
      </div>
    </ParentLayout>
  );
}
