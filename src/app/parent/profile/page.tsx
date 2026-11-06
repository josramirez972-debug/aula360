'use client';

import React, { useState } from 'react';
import { ParentLayout } from '@/components/layout/ParentLayout';
import { useAuth } from '@/lib/auth-context';
import { DataProvider } from '@/lib/data-provider';
import { User, Mail, Phone, ShieldCheck, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function ParentProfilePage() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [msg, setMsg] = useState<string | null>(null);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    DataProvider.saveProfile({
      id: user.id,
      full_name: fullName,
      email: user.email,
      phone,
      role: 'PARENT',
    });
    setMsg('Datos de contacto actualizados correctamente.');
    setTimeout(() => setMsg(null), 3000);
  };

  return (
    <ParentLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mi Perfil de Representante</h1>
          <p className="text-xs text-slate-500 mt-1">
            Información personal y de contacto registrada en el colegio.
          </p>
        </div>

        {msg && (
          <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-saas text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{msg}</span>
          </div>
        )}

        <Card className="p-6">
          <form onSubmit={handleUpdate} className="space-y-4">
            <Input
              label="Nombre Completo *"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <Input
              label="Correo Electrónico (Solo Lectura)"
              value={user?.email || ''}
              disabled
              helperText="El correo institucional o personal es tu identificación única de acceso."
            />

            <Input
              label="Teléfono Móvil / Celular"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+57 300 000 0000"
            />

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <Button type="submit">Actualizar Datos</Button>
            </div>
          </form>
        </Card>

        <Card className="p-5 bg-slate-50 border border-slate-200">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 space-y-1">
              <p className="font-bold text-slate-900">Seguridad de la Cuenta</p>
              <p>
                Tu sesión está protegida bajo estándares de cifrado y aislamiento por acudiente. Cada acción de consulta y confirmación de calificaciones queda registrada en el sistema de auditoría escolar.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </ParentLayout>
  );
}
