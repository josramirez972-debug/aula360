'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ShieldCheck, UserCheck, ChevronDown, Check, RefreshCw } from 'lucide-react';
import { resetDataStore } from '@/lib/data-provider';

export function DemoUserSwitcher() {
  const { user, switchUser, availableDemoUsers } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const isDemoEnabled = process.env.NEXT_PUBLIC_ALLOW_DEMO_MODE !== 'false';

  if (!user || !isDemoEnabled) return null;

  const handleResetData = () => {
    if (confirm('¿Deseas reiniciar los datos de prueba a su estado original?')) {
      resetDataStore();
      window.location.reload();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 bg-slate-900 text-white text-xs font-semibold px-3.5 py-2 rounded-full shadow-lg hover:bg-slate-800 transition-all border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          {user.role === 'TEACHER' ? (
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          ) : (
            <UserCheck className="w-4 h-4 text-emerald-400" />
          )}
          <span>
            {user.full_name} ({user.role === 'TEACHER' ? 'Profesor' : 'Padre'})
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {isOpen && (
          <div className="absolute bottom-12 right-0 w-72 bg-white rounded-saas shadow-2xl border border-slate-200 p-2 text-slate-800">
            <div className="px-3 py-2 border-b border-slate-100 mb-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Cambiar Rol de Demostración
              </p>
              <p className="text-xs text-slate-500">
                Alterna entre perfiles para verificar permisos y vistas independientes.
              </p>
            </div>

            <div className="space-y-1">
              {availableDemoUsers.map((u) => {
                const isActive = u.id === user.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => {
                      switchUser(u.id);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <p className="font-medium">{u.full_name}</p>
                      <p className="text-[10px] text-slate-400">
                        {u.role === 'TEACHER' ? 'Profesor / Admin' : 'Padre de Familia'} • {u.email}
                      </p>
                    </div>
                    {isActive && <Check className="w-4 h-4 text-blue-600" />}
                  </button>
                );
              })}
            </div>

            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between px-2">
              <button
                onClick={handleResetData}
                className="text-[11px] text-slate-500 hover:text-red-600 flex items-center gap-1 transition-colors"
                title="Restaura estudiantes, notas y estados originales"
              >
                <RefreshCw className="w-3 h-3" /> Reiniciar Datos Demo
              </button>
              <span className="text-[10px] text-emerald-600 font-medium">AULA360 Demo</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
