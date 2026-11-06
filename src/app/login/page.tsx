'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { School, Eye, EyeOff, Lock, Mail, AlertCircle, ArrowRight, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
  const { login, resetPassword, availableDemoUsers } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recoverySent, setRecoverySent] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');

  const isDemoEnabled = process.env.NEXT_PUBLIC_ALLOW_DEMO_MODE !== 'false';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email) {
      setError('Por favor ingresa tu correo electrónico.');
      return;
    }

    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);

    if (!result.success) {
      setError(result.error || 'Credenciales inválidas.');
    }
  };

  const handleQuickDemoLogin = async (demoEmail: string) => {
    setError(null);
    setIsLoading(true);
    await login(demoEmail);
    setIsLoading(false);
  };

  const handlePasswordRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail) return;
    await resetPassword(recoveryEmail);
    setRecoverySent(true);
    setTimeout(() => {
      setShowRecoveryModal(false);
      setRecoverySent(false);
      setRecoveryEmail('');
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/25 mb-3">
          <School className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Bienvenido a AULA360</h1>
        <p className="mt-1 text-xs text-slate-500">
          Plataforma de Gestión y Seguimiento Académico Escolar
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-sm border border-slate-200/80 rounded-2xl">
          {error && (
            <div className="mb-5 p-3.5 rounded-saas bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                label="Correo electrónico institucional o personal"
                type="email"
                placeholder="usuario@colegio.edu o padre@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">Contraseña</label>
                <button
                  type="button"
                  onClick={() => setShowRecoveryModal(true)}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2 pr-10 text-sm text-slate-900 bg-white border border-slate-300 rounded-saas focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
              Iniciar sesión <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          {/* Quick Demo Access Section (Only in Demo Mode) */}
          {isDemoEnabled && availableDemoUsers.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <UserCheck className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Acceso Rápido de Prueba (Demo)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-3">
                Selecciona un perfil para ingresar sin necesidad de recordar contraseñas:
              </p>

              <div className="space-y-2">
                {availableDemoUsers.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickDemoLogin(u.email)}
                    className="w-full text-left p-2.5 rounded-saas border border-slate-200/90 hover:border-blue-400 hover:bg-blue-50/50 transition-all text-xs flex items-center justify-between group"
                  >
                    <div>
                      <span className="font-semibold text-slate-800 group-hover:text-blue-700">
                        {u.full_name}
                      </span>
                      <span className="text-[10px] text-slate-400 block">{u.email}</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        u.role === 'TEACHER'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {u.role === 'TEACHER' ? 'Profesor' : 'Padre'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          AULA360 • Sistema Escolar con Supabase & Row Level Security
        </p>
      </div>

      {/* Password Recovery Modal */}
      {showRecoveryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-saas max-w-sm w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Recuperar Contraseña</h3>
            <p className="text-xs text-slate-500 mb-4">
              Ingresa tu correo registrado y te enviaremos un enlace de restablecimiento seguro.
            </p>

            {recoverySent ? (
              <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg border border-emerald-200">
                ✓ Se ha enviado el enlace de restablecimiento a tu correo electrónico.
              </div>
            ) : (
              <form onSubmit={handlePasswordRecovery} className="space-y-3">
                <Input
                  label="Correo electrónico"
                  type="email"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  placeholder="ejemplo@aula360.edu"
                  required
                />
                <div className="flex gap-2 justify-end pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRecoveryModal(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" size="sm">
                    Enviar Instrucciones
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
